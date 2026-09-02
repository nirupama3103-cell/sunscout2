#!/usr/bin/env node
/**
 * Render the four seasonal OG cards into public/og/.
 *
 *   node scripts/build-og-seasons.js
 *
 * Copy is read from public/config/seasons.js, so a share card can never
 * contradict what the site says. Art direction lives in
 * scripts/og-season.template.html; each season only supplies a palette.
 *
 * No new dependencies — Chromium renders and encodes, as with the hero
 * optimiser. Re-run after changing any season's chip, hero lines or sub.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'og');
const TEMPLATE = path.join(__dirname, 'og-season.template.html');
const SEASONS_JS = path.join(ROOT, 'public', 'config', 'seasons.js');

/* Open Sky, shifted per season. Navy and marigold stay the anchors so the
   four cards read as one set beside og-halloween.jpg. */
const PALETTE = {
  spring: { grad: 'linear-gradient(135deg,#17324D 0%,#2C6B6B 58%,#69B79A 100%)',
            accent: '#FFD9E4', glow1: 'rgba(255,217,228,.30)', glow2: 'rgba(105,183,154,.30)',
            chipbg: 'rgba(255,217,228,.18)', chipbd: 'rgba(255,217,228,.55)', chipfg: '#FFE7EF' },
  summer: { grad: 'linear-gradient(135deg,#17324D 0%,#24557d 55%,#4FA8DA 100%)',
            accent: '#F2A93B', glow1: 'rgba(242,169,59,.32)', glow2: 'rgba(79,168,218,.30)',
            chipbg: 'rgba(242,169,59,.20)', chipbd: 'rgba(242,169,59,.60)', chipfg: '#FFE0AE' },
  fall:   { grad: 'linear-gradient(135deg,#17324D 0%,#5A3B2E 58%,#C4692B 100%)',
            accent: '#F2A93B', glow1: 'rgba(242,169,59,.34)', glow2: 'rgba(196,105,43,.30)',
            chipbg: 'rgba(242,169,59,.20)', chipbd: 'rgba(242,169,59,.60)', chipfg: '#FFE0AE' },
  winter: { grad: 'linear-gradient(135deg,#0E2135 0%,#17324D 52%,#4FA8DA 100%)',
            accent: '#BFE3F7', glow1: 'rgba(191,227,247,.30)', glow2: 'rgba(79,168,218,.28)',
            chipbg: 'rgba(191,227,247,.16)', chipbd: 'rgba(191,227,247,.55)', chipfg: '#DFF1FB' },
};

/* seasons.js is a browser script, not a module — read the fields out of the
   source rather than trying to require() it. JSON.parse handles the \\uXXXX
   surrogate pairs the emoji are written as. */
function readSeasons() {
  const src = fs.readFileSync(SEASONS_JS, 'utf8');
  const out = {};
  for (const key of Object.keys(PALETTE)) {
    const block = new RegExp('\\n  ' + key + ': \\{([\\s\\S]*?)\\n  \\}').exec(src);
    if (!block) throw new Error('could not find season "' + key + '" in seasons.js');
    const field = (name) => {
      const m = new RegExp(name + ':"((?:[^"\\\\]|\\\\.)*)"').exec(block[1]);
      if (!m) throw new Error('missing field ' + name + ' for ' + key);
      return JSON.parse('"' + m[1] + '"');
    };
    out[key] = { chip: field('chip'), l1: field('heroLine1'), l2: field('heroLine2'), sub: field('sub'), emoji: field('emoji') };
  }
  return out;
}

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}

(async () => {
  const seasons = readSeasons();
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

  for (const [key, copy] of Object.entries(seasons)) {
    const pal = PALETTE[key];
    await page.goto('file://' + TEMPLATE, { waitUntil: 'load' });
    await page.evaluate(({ copy, pal }) => {
      const r = document.documentElement.style;
      Object.entries(pal).forEach(([k, v]) => r.setProperty('--' + k, v));
      document.body.style.background = pal.grad;
      document.getElementById('badge').textContent = copy.emoji + '  ' + copy.chip;
      document.getElementById('l1').textContent = copy.l1;
      document.getElementById('l2').textContent = copy.l2;
      /* The hero sub is a long sentence; the card wants its opening clause. */
      document.getElementById('sub').textContent =
        copy.sub.split('—')[0].trim().replace(/\s+/g, ' ');
    }, { copy, pal });
    await page.waitForTimeout(350);
    const file = path.join(OUT, 'og-' + key + '.jpg');
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    const kb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`  og-${key}.jpg`.padEnd(22) + `${kb} KB` + (fs.statSync(file).size > 300 * 1024 ? '  (large — consider lowering quality)' : ''));
  }
  await browser.close();
  console.log('Done — 4 seasonal OG cards written to public/og/');
})().catch(e => { console.error(e); process.exit(1); });
