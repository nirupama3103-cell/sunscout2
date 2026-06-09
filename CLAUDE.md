# CLAUDE.md — SunScout Kids

Context for working on this repo. Read before editing.

## What this is
- **SunScout Kids** — a Bay Area family activity discovery web app. Live: **https://www.sunscoutkids.com**
- Repo: `nirupama3103-cell/sunscout2` (lowercase + `2`; the old `SunScout` link 404s).
- **Vanilla HTML/CSS/JS single-page app — no framework, no build step.** Do not add React, bundlers, or heavy libraries.
- Dev in **GitHub Codespaces**. Deployed on **Vercel**, auto-deploys on push to `main` (~30s).
- Audience: parents on phones. **Fast load and accessibility beat visual flash.** No video backgrounds, WebGL/Three.js, or 3D scroll effects.

## Layout
- `public/index.html` — the whole app, ~2,400+ lines (inline `<style>`/`<script>` blocks).
- `public/diy.html` — standalone DIY crafts page; images in `public/images/`.
- `/api/` — Vercel serverless functions (mainly `api/activities.js`).
- No `package.json`; `npm run dev` is broken. Local preview: `python3 -m http.server 8000 --directory public`.

## Gotchas (these have cost hours)
- **~5 parallel filter UIs** (desktop tab bar, two dropdowns `ssSelExplore`/`dtE`, floating pills, mobile bottom nav `bnavTab`) all proxy into ONE hidden canonical `.tab-btn[data-tab="..."]` set via `setTab()`. Change a filter in every UI; grep first.
- **Never blind find-and-replace common words.** "Free"/"Paid" appear in price badges, the About modal, meta tags, and `SRC_LABELS` — not just tabs. Anchor tightly and grep before committing.
- **Footer and bottom nav are high-risk** — small edits have repeatedly broken layout.
- **Weekend tab is locked Mon–Thu** (`floatWeekend()` bails). It looks "missing" on weekdays — it isn't.
- **Line numbers drift** — locate code by function/class name.

## Data & APIs
- Base data: hardcoded activity arrays (~320 activities, 7 cities). City list is the `CITIES` array — grep it.
- Working: **Pexels** (photos), **Ticketmaster** (events).
- Dead, do not re-add: Eventbrite, Google Places, Yelp, Peachjar.
- Footer/privacy should credit only Ticketmaster (+ Pexels for photos); keep consistent across footer, privacy modal, README.

## Conventions
- Small batches. Show a diff before committing. Grep to verify after each change.
- Commit → push → Vercel redeploys ~30s → verify live.
- Brand: Nunito, sunny orange (`#FF9900`) + blue (`#1565c0`), rounded, warm tone, sentence case.
- Respect `prefers-reduced-motion`; keep images lazy-loaded and compressed.

## Child-safety
Children's product. Keep content age-appropriate; flag adult-supervision steps (e.g. ironing) clearly.
