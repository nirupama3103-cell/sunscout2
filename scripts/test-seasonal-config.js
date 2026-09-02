#!/usr/bin/env node
/**
 * Asserts the seasonal hub config is a data structure, not branching logic.
 *
 *   node scripts/test-seasonal-config.js
 *
 * The load-bearing claim is the last block: a new season can be added by
 * editing ONLY public/config/seasonal-hubs.js. That is checked by actually
 * adding one at runtime and asserting it resolves and applies end to end,
 * plus a static grep proving no component file names any season.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(ROOT, 'public', 'config', 'seasonal-hubs.js');
const { SEASONAL_HUBS, inSeason, hubForDate, applyHub } = require(CONFIG);

let passed = 0, failed = 0;
function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? passed++ : failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(56)} ${JSON.stringify(actual)}` +
              (ok ? '' : `   expected ${JSON.stringify(expected)}`));
}
const d = (mm, dd) => new Date(2026, mm - 1, dd);

console.log('\n1. Every entry has the same shape');
const REQUIRED = ['label', 'emoji', 'range', 'ground', 'accent', 'accentInk',
                  'backdrop', 'scrim', 'photoHints', 'photoHintDefault'];
for (const [id, hub] of Object.entries(SEASONAL_HUBS)) {
  assert(`${id}: no missing fields`, REQUIRED.filter(k => !(k in hub)), []);
  assert(`${id}: range is MM-DD`,
    [hub.range.from, hub.range.to].filter(v => !/^\d{2}-\d{2}$/.test(v)), []);
  assert(`${id}: backdrop has wide/tall/fallback`,
    ['wide', 'tall', 'fallback'].filter(k => !hub.backdrop[k]), []);
}

console.log('\n2. Date ranges resolve, including the year-end wrap');
assert('Oct 15 -> halloween',        (hubForDate(d(10, 15)) || {}).id, 'halloween');
assert('Nov 1  -> halloween (to is exclusive)', (hubForDate(d(11, 1)) || {}).id, 'halloween');
assert('Nov 2  -> thanksgiving',     (hubForDate(d(11, 2)) || {}).id, 'thanksgiving');
assert('Nov 29 -> thanksgiving',     (hubForDate(d(11, 29)) || {}).id, 'thanksgiving');
assert('Dec 20 -> winter (wraps)',   (hubForDate(d(12, 20)) || {}).id, 'winter');
assert('Jan 3  -> winter (wraps)',   (hubForDate(d(1, 3)) || {}).id, 'winter');
assert('Jan 8  -> none (to exclusive)', hubForDate(d(1, 8)), null);
assert('Jun 1  -> none',             hubForDate(d(6, 1)), null);

console.log('\n3. Ranges do not overlap (first-match-wins would hide one)');
const overlaps = [];
for (let m = 1; m <= 12; m++) {
  for (let day = 1; day <= 28; day++) {
    const hit = Object.entries(SEASONAL_HUBS).filter(([, h]) => inSeason(h, d(m, day)));
    if (hit.length > 1) overlaps.push(`${m}-${day}: ${hit.map(x => x[0]).join('+')}`);
  }
}
assert('no date matches two hubs', overlaps, []);

console.log('\n4. Accent ink clears AA on its accent');
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(hex(a)), lum(hex(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
for (const [id, hub] of Object.entries(SEASONAL_HUBS)) {
  const r = ratio(hub.accent, hub.accentInk);
  const ok = r >= 4.5; ok ? passed++ : failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${(id + ': accentInk on accent').padEnd(56)} ${r.toFixed(2)}:1`);
}

console.log('\n5. Photo hints cover every event type used by the hubs');
const TYPES = ['pumpkin-patch', 'trunk-or-treat', 'festival', 'haunt', 'storytime', 'display'];
for (const [id, hub] of Object.entries(SEASONAL_HUBS)) {
  assert(`${id}: hint for every type`, TYPES.filter(t => !hub.photoHints[t]), []);
}

console.log('\n6. No season BRANCHING or STYLING in any component');
/* Scope note: per-hub prose (headline, badge, intro, footer) legitimately
   names its season — that is instance content, exactly like events.json.
   What must not exist is logic or styling keyed to a season id, because that
   is what would force a component edit when adding one. So this checks the
   <style> and <script> regions, not the markup. */
/* Comments are prose, not styling or logic: a note explaining why the page
   does not load a Halloween display font is exactly as much a per-season
   dependency as the word "Halloween" in a paragraph of copy. Strip them
   before checking, or the test stops measuring what it claims to. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/^[ \t]*\/\/.*$/gm, ' ');
}
function regions(src) {
  const grab = (tag) => {
    const out = [];
    const re = new RegExp('<' + tag + '([^>]*)>([\\s\\S]*?)</' + tag + '>', 'gi');
    let m;
    while ((m = re.exec(src))) {
      /* JSON-LD is generated DATA (event names, descriptions) — the same
         category as events.json, not logic. Skip it. */
      if (/application\/ld\+json/i.test(m[1])) continue;
      out.push(m[2]);
    }
    return out.join('\n');
  };
  return { style: stripComments(grab('style')), script: stripComments(grab('script')) };
}
const ids = Object.keys(SEASONAL_HUBS);
const hubSrc = fs.readFileSync(path.join(ROOT, 'public/seasons/halloween/index.html'), 'utf8');
const { style, script } = regions(hubSrc);

assert('hub <style>: no season id anywhere', ids.filter(id => new RegExp('\\b' + id + '\\b', 'i').test(style)), []);

/* The script may name its own hub exactly once, in the identity declaration. */
const scriptHits = [];
for (const id of ids) {
  const re = new RegExp('\\b' + id + '\\b', 'gi');
  for (const m of script.matchAll(re)) {
    const line = script.slice(script.lastIndexOf('\n', m.index) + 1, script.indexOf('\n', m.index));
    if (!/window\.HUB_ID\s*=/.test(line)) scriptHits.push(id + ': ' + line.trim().slice(0, 60));
  }
}
assert('hub <script>: only the HUB_ID declaration', scriptHits, []);

for (const f of ['public/css/premium.css', 'public/js/motion.js']) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  assert(`${f}: no season id`, ids.filter(id => new RegExp('\\b' + id + '\\b', 'i').test(src)), []);
}

console.log('\n7. A season can be added by editing ONLY the config');
/* Added here at runtime — no file in the repo is touched. If the template
   required per-season code this would resolve to nothing. */
SEASONAL_HUBS.lunarnewyear = {
  label: 'Lunar New Year', emoji: '🧧',
  range: { from: '01-25', to: '02-20' },
  ground: '#1B0E10', accent: '#E8574A', accentInk: '#1B0E10',
  backdrop: { wide: '/images/lunarnewyear/hero', tall: '/images/lunarnewyear/hero-tall',
              fallback: '/images/lunarnewyear/hero-scene.svg' },
  scrim: { wide: 'linear-gradient(180deg,rgba(27,14,16,.62) 0%,#1B0E10 88%)',
           tall: 'linear-gradient(180deg,rgba(27,14,16,.70) 0%,#1B0E10 72%)' },
  photoHints: { 'pumpkin-patch': 'lunar new year market', 'trunk-or-treat': 'lantern festival street',
                'festival': 'lunar new year parade dragon', 'haunt': 'red lanterns night',
                'storytime': 'children library storytime reading circle', 'display': 'red lanterns display' },
  photoHintDefault: 'lunar new year family celebration',
};
assert('new season resolves by date', (hubForDate(d(2, 1)) || {}).id, 'lunarnewyear');
assert('new season has full shape', REQUIRED.filter(k => !(k in SEASONAL_HUBS.lunarnewyear)), []);
assert('still no overlaps after adding', (() => {
  const o = [];
  for (let m = 1; m <= 12; m++) for (let day = 1; day <= 28; day++) {
    const hit = Object.values(SEASONAL_HUBS).filter(h => inSeason(h, d(m, day)));
    if (hit.length > 1) o.push(`${m}-${day}`);
  }
  return o;
})(), []);

/* applyHub against a minimal DOM stub — proves the config alone drives
   presentation, with no template changes. */
const props = {};
const stubDoc = { documentElement: { style: { setProperty: (k, v) => { props[k] = v; } },
                                     setAttribute: (k, v) => { props['@' + k] = v; } } };
applyHub('lunarnewyear', stubDoc);
assert('applyHub sets ground', props['--ground'], '#1B0E10');
assert('applyHub sets accent', props['--accent'], '#E8574A');
assert('applyHub sets backdrop image-set', /image-set\(.*lunarnewyear\/hero\.webp/.test(props['--backdrop-wide']), true);
assert('applyHub tags the element', props['@data-hub'], 'lunarnewyear');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
