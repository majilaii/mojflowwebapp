const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Offline checks for this site's static HTML routes. No Google, analytics or email calls.
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const origin = 'https://www.mojflow.com';
const attr = (tag, name) => tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => m[0]);
const visible = html => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
const text = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const pages = fs.readdirSync(path.join(root, 'public/mojflow')).filter(f => f.endsWith('.html')).map(file => {
  const html = read(`public/mojflow/${file}`);
  const links = tags(html, 'link');
  const canonical = links.filter(tag => attr(tag, 'rel') === 'canonical');
  const url = attr(canonical[0] || '', 'href');
  const metas = tags(html, 'meta');
  return { file, html, clean: visible(html), links, canonical, url, metas,
    noindex: metas.some(tag => /^(robots|googlebot)$/i.test(attr(tag, 'name') || '') && /\bnoindex\b/i.test(attr(tag, 'content') || '')) };
});
const byUrl = new Map(pages.map(p => [p.url, p]));
const sitemap = read('public/sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

test('all public pages have unique metadata, descriptive headings and real route handlers', () => {
  const titles = new Set();
  const descriptions = new Set();
  assert.equal(byUrl.size, pages.length, 'Canonical URLs must be unique');
  for (const p of pages) {
    assert.equal(p.canonical.length, 1, `${p.file}: one canonical`);
    const url = new URL(p.url);
    assert.equal(url.origin, origin, p.file);
    assert.equal(url.search + url.hash, '', p.file);
    const route = `src/app${url.pathname === '/' ? '' : url.pathname}/route.ts`;
    assert.ok(read(route).includes(p.file), `${p.file}: canonical route must serve this HTML`);
    assert.match(p.html, /<html\b[^>]*\blang="(?:sr|en)"/i, p.file);
    const title = p.html.match(/<title>([^<]+)<\/title>/i)?.[1];
    assert.ok(title && !titles.has(title), `${p.file}: missing or duplicate title`);
    titles.add(title);
    const description = attr(p.metas.find(tag => attr(tag, 'name') === 'description') || '', 'content');
    if (!p.noindex) {
      assert.ok(description && !descriptions.has(description), `${p.file}: missing or duplicate description`);
      descriptions.add(description);
    }
    const headings = [...p.clean.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    if (!p.noindex) assert.equal(headings.length, 1, `${p.file}: one main heading`);
    assert.ok(text(headings[0][1]).split(' ').length > 1, `${p.file}: heading must describe the page`);
    for (const img of tags(p.clean, 'img')) assert.notEqual(attr(img, 'alt'), undefined, `${p.file}: image needs alt attribute`);
    for (const block of p.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(block[1]), `${p.file}: invalid structured data`);
    }
  }
});

test('sitemap contains exactly the indexable canonical pages', () => {
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Duplicate sitemap URLs');
  assert.deepEqual([...sitemapUrls].sort(), pages.filter(p => !p.noindex).map(p => p.url).sort());
  assert.match(read('public/robots.txt'), /Sitemap: https:\/\/www\.mojflow\.com\/sitemap\.xml/);
  for (const entry of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    assert.match(entry[1], /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Date.parse(entry[1]) <= Date.now(), 'Last-modified dates must not be in the future');
  }
});

test('internal links, fragment targets and local images exist', () => {
  for (const p of pages) {
    for (const tag of [...tags(p.clean, 'a'), ...tags(p.clean, 'img')]) {
      const href = attr(tag, 'href') ?? attr(tag, 'src');
      if (!href || /^(mailto:|tel:|data:)/i.test(href)) continue;
      const url = new URL(href.replace(/&amp;/g, '&'), p.url);
      if (url.origin !== origin) continue;
      const target = byUrl.get(origin + url.pathname);
      if (target) {
        if (url.hash) assert.ok(tags(target.clean, '[a-z][a-z0-9]*').some(t => attr(t, 'id') === decodeURIComponent(url.hash.slice(1))), `${p.file}: broken fragment ${href}`);
      } else {
        assert.ok(fs.existsSync(path.join(root, 'public', decodeURIComponent(url.pathname))), `${p.file}: broken local link/image ${href}`);
      }
    }
  }
});

test('every indexable page is reachable from the homepage using HTML links', () => {
  const found = new Set();
  const queue = [origin + '/'];
  while (queue.length) {
    const current = queue.shift();
    if (found.has(current)) continue;
    found.add(current);
    for (const tag of tags(byUrl.get(current).clean, 'a')) {
      const href = attr(tag, 'href');
      if (!href) continue;
      const url = new URL(href, current);
      const key = url.origin + url.pathname;
      if (byUrl.has(key) && !byUrl.get(key).noindex && !found.has(key)) queue.push(key);
    }
  }
  for (const url of sitemapUrls) assert.ok(found.has(url), `Orphan page: ${url}`);
});

test('language alternatives are reciprocal and point to indexable pages', () => {
  for (const p of pages) {
    for (const tag of p.links.filter(t => attr(t, 'hreflang'))) {
      const target = byUrl.get(attr(tag, 'href'));
      assert.ok(target && !target.noindex, `${p.file}: missing/index-blocked translation`);
      assert.ok(target.links.some(t => attr(t, 'hreflang') && attr(t, 'href') === p.url), `${p.file}: translation needs a return link`);
    }
  }
});

test('raw HTML duplicates permanently redirect to their clean canonical URLs', async () => {
  const { default: config } = await import(pathToFileURL(path.join(root, 'next.config.mjs')));
  const redirects = await config.redirects();
  for (const p of pages) {
    const redirect = redirects.find(r => r.source === `/mojflow/${p.file}`);
    assert.ok(redirect?.permanent, `${p.file}: missing permanent redirect`);
    assert.equal(new URL(redirect.destination, origin).href, p.url, `${p.file}: wrong redirect target`);
  }
});
