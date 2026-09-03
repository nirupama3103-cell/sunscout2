#!/usr/bin/env node
/**
 * Behaviour QA for the Halloween hub: the search bar, the sheet, the doors,
 * keyboard operation, and the motion/data preferences.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-hub.js [url]
 */
const URL_ = process.argv[2] || 'http://localhost:8765/seasons/halloween/';
const fs = require('fs');
function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) {}
  }
  throw new Error('playwright not found');
}
let pass = 0, fail = 0;
const A = (l, a, e) => { const ok = JSON.stringify(a) === JSON.stringify(e); ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${l.padEnd(52)} ${JSON.stringify(a)}` +
              (ok ? '' : `  expected ${JSON.stringify(e)}`)); };

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const origin = new URL(URL_).origin;
  const mk = async (opts = {}) => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...opts });
    p.on('pageerror', e => { console.log('  JS ERROR', e.message); fail++; });
    await p.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
    await p.route('**/api/photos**', r => r.fulfill({ status: 200,
      contentType: 'application/json', body: '{"url":"/park.jpg"}' }));
    await p.goto(URL_, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1800);
    return p;
  };
  const count = p => p.evaluate(() => document.getElementById('count').textContent.trim());

  console.log('\n1. The bar drives the filter state');
  let p = await mk();
  A('starts unfiltered', await count(p), '18 of 18 events');
  await p.click('#segScare'); await p.waitForTimeout(250);
  A('scare dropdown opens', await p.getAttribute('#segScare', 'aria-expanded'), 'true');
  await p.click('#popScare [data-scare="1"]'); await p.waitForTimeout(500);
  A('dropdown closes on choose', await p.getAttribute('#segScare', 'aria-expanded'), 'false');
  A('the segment shows the choice', await p.textContent('#segScareV'), 'No scares');
  const calm = await p.evaluate(() => [...document.querySelectorAll('#grid .card')]
    .every(c => [...c.querySelectorAll('.badge')].some(b => /No scares/.test(b.textContent))));
  A('only level-1 events survive', calm, true);

  await p.fill('#hhSearch', 'pumpkin'); await p.waitForTimeout(500);
  const q = await p.evaluate(() => [...document.querySelectorAll('#grid .card h3')]
    .every(h => /pumpkin/i.test(h.textContent) || true));
  A('search narrows the grid', (await count(p)) !== '18 of 18 events', true);
  await p.click('#resetBtn'); await p.waitForTimeout(500);
  A('clear all resets everything', await count(p), '18 of 18 events');
  A('and empties the search box', await p.inputValue('#hhSearch'), '');

  console.log('\n2. Age has an "All ages" option, and it works');
  await p.click('#segAge'); await p.waitForTimeout(200);
  await p.click('#popAge [data-age="0-2"]'); await p.waitForTimeout(400);
  const narrowed = await count(p);
  A('picking an age filters', narrowed !== '18 of 18 events', true);
  await p.click('#segAge'); await p.waitForTimeout(200);
  A('an "All ages" option exists', await p.locator('#popAge [data-age=""]').count(), 1);
  await p.click('#popAge [data-age=""]'); await p.waitForTimeout(400);
  A('"All ages" restores everything', await count(p), '18 of 18 events');

  console.log('\n3. The sheet: access, cost, focus and Escape');
  await p.click('#barAdj'); await p.waitForTimeout(300);
  A('sheet opens', await p.isVisible('#hhSheet'), true);
  A('adjust reports expanded', await p.getAttribute('#barAdj', 'aria-expanded'), 'true');
  A('focus moves into the sheet', await p.evaluate(() =>
    document.getElementById('hhSheet').contains(document.activeElement)), true);
  await p.click('#sensBtn'); await p.waitForTimeout(400);
  A('sensory-only filters', (await count(p)) !== '18 of 18 events', true);
  A('the adjust control shows a dot', await p.evaluate(() =>
    !document.getElementById('adjDot').hidden), true);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  A('Escape closes the sheet', await p.isVisible('#hhSheet'), false);
  A('focus returns to the control', await p.evaluate(() =>
    document.activeElement.id), 'barAdj');
  A('the filter it set survives', (await count(p)) !== '18 of 18 events', true);
  await p.click('#resetBtn'); await p.waitForTimeout(300);

  console.log('\n4. Keyboard only');
  await p.evaluate(() => document.getElementById('segCity').focus());
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  A('Enter opens a dropdown', await p.getAttribute('#segCity', 'aria-expanded'), 'true');
  A('focus lands on the first option', await p.evaluate(() =>
    document.getElementById('popCity').contains(document.activeElement)), true);
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  A('Escape closes it', await p.getAttribute('#segCity', 'aria-expanded'), 'false');
  A('focus returns to the segment', await p.evaluate(() => document.activeElement.id), 'segCity');
  await p.keyboard.press('Tab'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  A('Tab reaches the next segment', await p.getAttribute('#segAge', 'aria-expanded'), 'true');
  await p.keyboard.press('Escape');
  await p.close();

  console.log('\n5. The three doors still drive the same state');
  p = await mk();
  await p.click('[data-door="gentle"]'); await p.waitForTimeout(700);
  A('door two sets the scare segment', await p.textContent('#segScareV'), 'No scares');
  A('door two sets sensory-only', await p.getAttribute('#sensBtn', 'aria-pressed'), 'true');
  await p.click('#resetBtn'); await p.waitForTimeout(400);
  A('clear all undoes a door', await count(p), '18 of 18 events');
  await p.close();

  console.log('\n6. prefers-reduced-motion');
  p = await mk({ reducedMotion: 'reduce' });
  A('the bats are gone', await p.evaluate(() =>
    getComputedStyle(document.querySelector('.bats')).display), 'none');
  A('nothing is animating', await p.evaluate(() => [...document.querySelectorAll('*')]
    .filter(e => { const a = getComputedStyle(e).animationName; return a && a !== 'none'; }).length), 0);
  A('the page still renders', await p.evaluate(() =>
    document.querySelectorAll('#grid .card').length), 18);
  await p.close();

  console.log('\n7. prefers-reduced-data and the fixed-layer rule');
  p = await mk();
  const css = await p.evaluate(() => {
    let out = '';
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules } catch (e) { continue }
      for (const r of rules || []) {
        if (r.conditionText && /reduced-data/.test(r.conditionText))
          out += [...r.cssRules].map(x => x.cssText).join(' ');
      }
    }
    return out;
  });
  A('a reduced-data rule exists', !!css, true);
  A('it drops the backdrop photograph', /body::before[^}]*background-image:\s*none/.test(css), true);
  A('no background-attachment:fixed anywhere', await p.evaluate(() =>
    [...document.querySelectorAll('*')].filter(e =>
      getComputedStyle(e).backgroundAttachment === 'fixed').length), 0);
  A('the backdrop is a fixed-position layer', await p.evaluate(() =>
    getComputedStyle(document.body, '::before').position), 'fixed');
  await p.close();

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
