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
/* Main-page activities for scenario 4. `image` is a remote URL on purpose:
   it is what api/activities.js hands back for a Pexels hit, and it is the
   tier above the fallback under test. No `city` field, so these survive the
   page's city filter whichever city is selected. */
const SAMPLE = [
  { id: 's1', name: 'Las Palmas Park playground', desc: 'Shaded play structures',
    address: 'Sunnyvale, CA', image: 'https://images.unsplash.com/photo-0000000000000?w=600',
    isFree: true, price: 'Free', stars: 5, ages: ['0','1','2'], a11y: [],
    mapsUrl: 'https://maps.google.com/?q=Las+Palmas+Park' },
  { id: 's2', name: "Children's Discovery Museum", desc: 'Hands-on exhibits',
    address: 'San Jose, CA', image: 'https://images.unsplash.com/photo-0000000000001?w=600',
    isFree: false, price: '$15', stars: 5, ages: ['1','2','3'], a11y: [],
    mapsUrl: 'https://maps.google.com/?q=Discovery+Museum' },
  { id: 's3', name: 'Sunnyvale Farmers Market', desc: 'Saturday produce market',
    address: 'Sunnyvale, CA', image: 'https://images.unsplash.com/photo-0000000000002?w=600',
    isFree: true, price: 'Free', stars: 4, ages: ['0','1','2','3'], a11y: [],
    mapsUrl: 'https://maps.google.com/?q=Sunnyvale+Farmers+Market' },
  { id: 's4', name: 'Rancho San Antonio trail walk', desc: 'Easy nature trail',
    address: 'Cupertino, CA', image: 'https://images.unsplash.com/photo-0000000000003?w=600',
    isFree: true, price: 'Free', stars: 5, ages: ['2','3'], a11y: [],
    mapsUrl: 'https://maps.google.com/?q=Rancho+San+Antonio' },
];

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

  /* 4 — THE LAST-RESORT TIER ITSELF FAILING (main page).
         Card art there is three tiers deep: a Pexels URL from /api/photos,
         then whatever a.image holds, then the onerror fallback. That last
         tier used to be a single images.unsplash.com photo id — a host we do
         not control. If it 404s there is nothing left and the card shows a
         broken-image icon. Every remote image host is blocked here, so the
         only way to pass is a fallback that ships with the site. */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));

    /* Order matters: the most recently registered route wins, so the
       catch-all goes first. */
    await page.route('**/*', r => {
      const u = r.request().url();
      return u.startsWith(BASE) ? r.continue() : r.abort();   // no third party resolves
    });
    await page.route('**/api/photos**', r =>
      r.fulfill({ status: 502, contentType: 'application/json',
                  body: '{"url":null,"reason":"provider-error"}' }));
    await page.route('**/api/activities**', r =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        fetchedAt: new Date().toISOString(),
        activities: SAMPLE,
      }) }));

    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);

    const art = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('#grid .card-img-wrap img')];
      return {
        cards: document.querySelectorAll('#grid .card').length,
        imgs: imgs.length,
        /* naturalWidth is the only honest test: a broken image still has a
           src, still has an <img>, and still reports complete. */
        drawn: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
        remote: imgs.filter(i => !i.currentSrc.startsWith(location.origin)).length,
        visible: imgs.filter(i => getComputedStyle(i).opacity === '1').length,
      };
    });
    await page.close();
    console.log('\n4. LAST-RESORT TIER (main page, every remote host blocked)');
    assert('cards render', art.cards, SAMPLE.length);
    assert('every card has an image element', art.imgs, SAMPLE.length);
    assert('every image actually decoded', art.drawn, SAMPLE.length);
    assert('no image depends on a third-party host', art.remote, 0);
    assert('no image left faded out', art.visible, SAMPLE.length);
    assert('no JS errors', jsErrors, []);
  }

  await browser.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
