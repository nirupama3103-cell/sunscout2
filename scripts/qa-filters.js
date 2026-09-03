#!/usr/bin/env node
/**
 * Every filter combination on the Halloween hub.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-filters.js [url]
 *
 * 9 cities x 5 ages x 5 scare levels x 2 access x 3 cost = 1350. For each,
 * the grid must agree with the count, the empty state must be shown when and
 * only when there are no cards, and no card may violate the active filter.
 * Driving state directly is deliberate: this tests the FILTER LOGIC, which
 * is what must not change when the controls around it are redesigned.
 */
const URL_ = process.argv[2] || 'http://localhost:8765/seasons/halloween/';
const fs = require('fs');
function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('playwright not found');
}
(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const origin = new URL(URL_).origin;
  await page.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  const res = await page.evaluate(() => {
    const val = (sel, key) => [...document.querySelectorAll(sel)]
      .map(b => b.dataset[key]).map(v => v === '' ? null : v);
    const cities = val('#popCity [data-city]', 'city');
    const ages   = val('#popAge [data-age]', 'age');
    const scares = [null, 1, 2, 3, 4], sens = [false, true], costs = [null, 'free', 'paid'];
    let n = 0; const bad = [];
    for (const c of cities) for (const a of ages) for (const s of scares)
      for (const se of sens) for (const co of costs) {
        state = { scare: s, sensory: se, city: c, age: a, cost: co, q: '' };
        render(); n++;
        const cards = [...document.querySelectorAll('#grid .card')];
        const shown = parseInt(document.getElementById('count').textContent, 10);
        const empty = document.getElementById('empty');
        const emptyShown = getComputedStyle(empty).display !== 'none';
        if (shown !== cards.length) bad.push(`count ${shown} vs ${cards.length} @ ${JSON.stringify(state)}`);
        if (!cards.length && !emptyShown) bad.push(`no cards, no empty state @ ${JSON.stringify(state)}`);
        if (cards.length && emptyShown) bad.push(`cards AND empty state @ ${JSON.stringify(state)}`);
        /* The filters must actually filter, not just count. */
        const wrong = EVENTS.filter(e => cards.some(c => c.dataset.id === e.id))
          .filter(e => (s !== null && e.scare > s) || (se && !e.sensoryFriendly) ||
                       (c && e.city !== c) || (a && (e.ages || []).indexOf(a) === -1) ||
                       (co && e.cost !== co));
        if (wrong.length) bad.push(`${wrong.length} card(s) survive a filter they fail @ ${JSON.stringify(state)}`);
        if (bad.length > 4) return { n, bad, cities: cities.length, ages: ages.length };
      }
    return { n, bad, cities: cities.length, ages: ages.length };
  });
  await browser.close();
  console.log(`\ncities ${res.cities} x ages ${res.ages} x scare 5 x access 2 x cost 3`);
  console.log(`filter sweep: ${res.n} combinations, ${res.bad.length} failures`);
  res.bad.slice(0, 5).forEach(b => console.log('  ' + b));
  console.log('JS errors:', errs.length ? errs : 'none');
  process.exit(res.bad.length || errs.length || res.n !== 1350 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
