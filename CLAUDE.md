# MojFlow website — Claude project notes

Brief context so any Claude session in this repo can pick up work without spelunking.

## Project structure

- **Stack:** Next.js 14 shell that serves a static HTML at `/`. The actual site lives in `public/mojflow/index.html` (forked from a Japanese template — Holon).
- **Single entry:** `src/app/route.ts` reads `public/mojflow/index.html` and returns it as the response. There are no React components for the marketing site itself. Same pattern: `src/app/privacy/route.ts` serves `public/mojflow/privacy.html` at `/privacy` (bilingual, noindex).
- **Analytics:** GA4 is consent-gated — it loads only via `window.mfLoadGA()` after the cookie banner is accepted (`mf-consent` in localStorage). Don't re-add a direct gtag `<script src>` to the head.
- **Styles:** `public/assets/styles/holon.css` is the main stylesheet (Japanese template's CSS). Inline `<style>` in `index.html` carries scoped overrides for the MojFlow rebrand.
- **Repo:** [majilaii/mojflowwebapp](https://github.com/majilaii/mojflowwebapp). Push to `main` → Vercel auto-deploys to mojflow.com.

## Running locally

Always use the dev server, never open the HTML file directly (absolute asset paths break):

```bash
npm run dev   # → http://localhost:3000
```

`.claude/launch.json` is wired for Claude Preview's "Next.js dev" config (port 3000). When previewing/verifying via Claude tools, use `preview_start` with that name.

## CSS rules

- **`holon.css` is editable** — be surgical, only touch the rule you're fixing. Don't refactor unrelated CSS in the same edit (one Codex change once broke the splash loader by removing a referenced `#splashLogoSvg` clipPath).
- **New UI** (modals, language switcher, etc.) → scoped inline `<style>` in `index.html` with `mf-*` class names. Keeps additions namespaced.
- **`!important` carefully** — many holon.css rules cascade through inherited font-family. Aggressive `body *` overrides will clobber `Chillax` (brand display font) on hero / KONCEPT / section labels. Override at the body level or on specific selectors instead.

## Fonts

Two webfonts only: **Inter** (body, Google Fonts) and **Chillax** (display/headings, Fontshare). The old Japanese-template stack (Adobe Typekit `dnp-shuei-gothic-gin-std`, YakuHanJP, and the `MFLatinExt` unicode-range diacritics fix) was fully removed after the Inter switch — Inter has correct Latin Extended glyphs, so Serbian diacritics (ć/č/š/ž/đ) need no workaround. Don't re-add Typekit/YakuHanJP.

## Services section duplicate HTML

The `Usluge` section has **two HTML blocks per service item**:
- `.c-topServiceBox_image_sp` — mobile (full-bleed, inline)
- `.c-topServiceBox_image` — desktop (sticky-scroll positioned)

`holon.css` toggles `display:none` between them by viewport. Both blocks must exist; they should reference the same image file(s) so updates only need to happen in one place. If you delete one, the layout breaks on that viewport.

`img_service_01.png` (desktop) and `img_service_01_sp.png` (mobile) currently differ — by design. `img_service_02.png` is shared by both.

## Splash intro

The `js-pageSplashLogo` element has a GSAP intro that wipes in from the right and exits with a translate-left. The mobile splash logo's exit translate has been an ongoing pain — current state intentionally leaves the GSAP exit alone after a few failed override attempts. Don't re-litigate without a clear new approach.

Inline `<style>` has a `Mobile splash logo crop fix` block at `@media (max-width:767px)` — that's the mobile crop fix, NOT the exit-animation fix. Leave it alone.

## i18n

Bilingual EN/SR. Translation strings in `<script>` block in `index.html` (search `MF_I18N`). Every `data-i18n` node needs a key in BOTH dicts. `applyLang` also rewrites careers mailto subjects (`data-mf-apply` + `careers.jX.subject` keys). Hero copy bug pattern: when SR text overflows a fixed-size hero area, **shorten the content**, don't retune CSS (that's how "Bezbednost" became "Cyber" briefly, then "Profit" stuck).

## Deploy

```bash
git add -A
git commit -m "..."
git push origin main
# Vercel deploys automatically
```

Don't commit `.claude/` (local-only Claude harness config).
