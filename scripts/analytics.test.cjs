const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/assets/js/mojflow-shared.js', 'utf8');

// A local DOM stub: no browser, network, Analytics service, or email provider is used.
function page({ consent = null, hostname = 'www.mojflow.com', referrer = '', storageThrows = false } = {}) {
  const scripts = [], nodes = [], documentEvents = {}, windowEvents = {};
  const storage = new Map(consent ? [['mf-consent', consent]] : []);
  function element(tag) {
    const events = {};
    return {
      tag, events, dataset: {}, classList: { add() {}, remove() {} },
      setAttribute() {}, addEventListener(name, fn) { events[name] = fn; },
      querySelector() { return element('child'); },
    };
  }
  const document = {
    referrer, title: 'MojFlow test page', cookie: '',
    documentElement: { lang: 'sr' },
    head: { append(node) { scripts.push(node); } },
    body: { append(node) { nodes.push(node); }, classList: { add() {}, remove() {} } },
    createElement: element,
    addEventListener(name, fn) { (documentEvents[name] ||= []).push(fn); },
  };
  const window = { addEventListener(name, fn) { windowEvents[name] = fn; } };
  vm.runInNewContext(source, {
    document, window, URL, URLSearchParams,
    location: { hostname, origin: 'https://' + hostname, pathname: '/blog/ai-izrada-ponuda', search: '?body=private-message&email=private@example.com', hash: '#private' },
    localStorage: {
      getItem(key) { if (storageThrows) throw Error('Storage unavailable'); return storage.get(key) || null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); },
    },
    MutationObserver: class { observe() {} },
  });
  return {
    window, scripts,
    calls: () => JSON.parse(JSON.stringify((window.dataLayer || []).map(args => Array.from(args)))),
    choose(choice) { nodes[0].events.click({ target: { closest: () => ({ dataset: { choice } }) } }); },
    revoke() {
      for (const fn of documentEvents.click) fn({ target: { closest: selector => selector === '[data-reset-consent]' ? {} : null } });
    },
    changeConsent(value) { windowEvents.storage({ key: 'mf-consent', newValue: value }); },
  };
}

test('unknown, rejected, and unavailable consent never load Analytics or send inquiries', () => {
  for (const options of [{}, { consent: 'denied' }, { storageThrows: true }]) {
    const p = page(options);
    p.window.mfTrack('generate_lead');
    assert.equal(p.scripts.length, 0);
    assert.deepEqual(p.calls(), []);
  }
});

test('acceptance loads one tag and emits one page view without ad personalization', () => {
  const p = page();
  p.choose('granted');
  p.choose('granted');
  assert.equal(p.scripts.length, 1);
  const config = p.calls().find(call => call[0] === 'config');
  assert.match(p.scripts[0].src, new RegExp('id=' + config[1] + '$'));
  assert.equal(config[2].send_page_view, false);
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
  assert.equal(p.calls().filter(call => call[1] === 'page_view').length, 1);
});

test('traffic source is preserved while private URL contents are excluded from every event', () => {
  const p = page({ consent: 'granted', referrer: 'https://search.example.com/private-path?q=private-search#private-fragment' });
  p.window.mfTrack('generate_lead');
  for (const call of p.calls().filter(call => call[0] === 'config' || call[0] === 'event')) {
    assert.equal(call[2].page_referrer, 'https://search.example.com/');
    assert.equal(call[2].page_location, 'https://www.mojflow.com/blog/ai-izrada-ponuda');
  }
  assert(!JSON.stringify(p.calls()).includes('private'));
  assert.equal(p.calls().find(call => call[1] === 'generate_lead')[2].form_id, 'contact');
});

test('direct visits and non-web referrers do not invent a referral source', () => {
  for (const referrer of ['', 'invalid', 'file:///private/file', 'javascript:alert(1)']) {
    const p = page({ consent: 'granted', referrer });
    assert.equal(p.calls().find(call => call[1] === 'page_view')[2].page_referrer, '');
  }
});

test('local, preview, and lookalike domains never pollute production reports', () => {
  for (const hostname of ['localhost', '127.0.0.1', 'preview.vercel.app', 'mojflow.com.example.com']) {
    const p = page({ consent: 'granted', hostname });
    p.window.mfTrack('generate_lead');
    assert.equal(p.scripts.length, 0);
    assert.deepEqual(p.calls(), []);
  }
  assert.equal(page({ consent: 'granted', hostname: 'mojflow.com' }).scripts.length, 1);
});

test('revocation stops tracking and consent updates do not duplicate the tag', () => {
  const p = page({ consent: 'granted' });
  const id = p.calls().find(call => call[0] === 'config')[1];
  p.revoke();
  const count = p.calls().length;
  p.window.mfTrack('generate_lead');
  assert.equal(p.window['ga-disable-' + id], true);
  assert.equal(p.calls().length, count);
  p.changeConsent('granted');
  p.window.mfTrack('generate_lead');
  assert.equal(p.window['ga-disable-' + id], false);
  assert.equal(p.scripts.length, 1);
  assert.equal(p.calls().length, count + 1);
  p.changeConsent('denied');
  p.window.mfTrack('generate_lead');
  assert.equal(p.calls().length, count + 1);
});

test('only approved business events are measured', () => {
  const p = page({ consent: 'granted' });
  p.window.mfTrack('private-message');
  p.window.mfTrack('job_application_submit');
  p.window.mfTrack('demo_complete');
  assert(!p.calls().some(call => call[1] === 'private-message'));
  assert.equal(p.calls().find(call => call[1] === 'job_application_submit')[2].form_id, 'careers');
  assert.equal(p.calls().find(call => call[1] === 'demo_complete')[2].form_id, 'workflow_demo');
});
