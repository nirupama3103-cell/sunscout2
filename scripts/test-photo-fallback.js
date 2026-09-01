#!/usr/bin/env node
/**
 * Regression test for the Halloween hub's event-photo enhancement.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/test-photo-fallback.js [baseUrl]
 *
 * The hub is required to render from events.json alone — photos are decorative
 * enhancement over the top. This asserts that contract holds in every failure
 * mode, because the failure that matters is a card that renders WORSE than it
 * would have with no photo feature at all.
 *
 * Exits non-zero on the first failed assertion.
 */
const BASE = process.argv[2] || 'http://localhost:8765';
const HUB = BASE + '/seasons/halloween/';
const EXPECTED_CARDS = 18;

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}
const fs = require('fs');

let passed = 0, failed = 0;
function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? passed++ : failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(52)} ${JSON.stringify(actual)}` +
              (ok ? '' : `   expected ${JSON.stringify(expected)}`));
}

/* A 2x2 PNG. Real bytes, so onload genuinely fires — a stub that never decodes
   would make the reveal path look broken when it is not. */
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mNk+M9Qz0BFwDiqkL4KAWmZBAFHiKgOAAAAAElFTkSuQmCC';

async function scenario(browser, label, routeHandler) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) jsErrors.push(m.text());
  });
  await page.route('**/api/**', r => r.abort());          // catch-all first
  await page.route('**/api/activities**', r => r.abort());
  if (routeHandler) await page.route('**/api/photos**', routeHandler);

  await page.goto(HUB, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2200);

  const state = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#grid .card')];
    const slots = [...document.querySelectorAll('.c-img')];
    const inView = el => { const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0; };
    return {
      cards: cards.length,
      // every card must still carry its real content
      titled: cards.filter(c => (c.querySelector('h3')?.textContent || '').trim().length > 0).length,
      linked: cards.filter(c => c.querySelector('a.l-site') && c.querySelector('a.l-map')).length,
      readable: cards.filter(c => inView(c) ? getComputedStyle(c).opacity === '1' : true).length,
      // a slot must be collapsed unless it holds a loaded image
      revealed: slots.filter(s => s.classList.contains('has-img')).length,
      openButEmpty: slots.filter(s =>
        getComputedStyle(s).display !== 'none' && !s.querySelector('img')).length,
      countText: (document.getElementById('count') || {}).textContent?.trim() || '',
    };
  });
  await page.close();
  console.log(`\n${label}`);
  return { state, jsErrors };
}

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });

  /* 1 — API DOWN. The baseline the hub promises: renders from events.json. */
  let r = await scenario(browser, '1. API DOWN (request aborted)', r => r.abort());
  assert('cards render', r.state.cards, EXPECTED_CARDS);
  assert('every card has a title', r.state.titled, EXPECTED_CARDS);
  assert('every card has both links', r.state.linked, EXPECTED_CARDS);
  assert('no card is left invisible', r.state.readable, EXPECTED_CARDS);
  assert('no photo slots revealed', r.state.revealed, 0);
  assert('no empty band above any title', r.state.openButEmpty, 0);
  assert('count is accurate', r.state.countText, '18 of 18 events');
  assert('no JS errors', r.jsErrors, []);

  /* 2 — API UP. Photos should appear, and only as an addition. */
  r = await scenario(browser, '2. API UP (valid image returned)', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ url: PIXEL, category: 'farm' }) }));
  assert('cards render', r.state.cards, EXPECTED_CARDS);
  assert('every card has a title', r.state.titled, EXPECTED_CARDS);
  assert('every card has both links', r.state.linked, EXPECTED_CARDS);
  assert('all photo slots revealed', r.state.revealed, EXPECTED_CARDS);
  assert('no empty band above any title', r.state.openButEmpty, 0);
  assert('count unchanged by photos', r.state.countText, '18 of 18 events');
  assert('no JS errors', r.jsErrors, []);

  /* 3 — MALFORMED. Each of these used to be able to strand an open, empty
         slot or throw; none may now do either. */
  const malformed = [
    ['3a. body is not JSON',        { status: 200, contentType: 'text/html', body: '<html>nope' }],
    ['3b. JSON but no url field',   { status: 200, contentType: 'application/json', body: '{"category":"farm"}' }],
    ['3c. url is null',             { status: 200, contentType: 'application/json', body: '{"url":null,"reason":"no-match"}' }],
    ['3d. url is a number',         { status: 200, contentType: 'application/json', body: '{"url":12345}' }],
    ['3e. url 404s',                { status: 200, contentType: 'application/json', body: JSON.stringify({ url: BASE + '/nope.jpg' }) }],
    ['3f. 503 no-api-key',          { status: 503, contentType: 'application/json', body: '{"url":null,"reason":"no-api-key"}' }],
    ['3g. 502 provider-error',      { status: 502, contentType: 'application/json', body: '{"url":null,"reason":"provider-error","providerStatus":401}' }],
    ['3h. 500 empty body',          { status: 500, contentType: 'application/json', body: '' }],
  ];
  for (const [label, resp] of malformed) {
    r = await scenario(browser, label, route => route.fulfill(resp));
    assert('cards render', r.state.cards, EXPECTED_CARDS);
    assert('every card has a title', r.state.titled, EXPECTED_CARDS);
    assert('every card has both links', r.state.linked, EXPECTED_CARDS);
    assert('no empty band above any title', r.state.openButEmpty, 0);
    assert('no JS errors', r.jsErrors, []);
  }

  await browser.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
