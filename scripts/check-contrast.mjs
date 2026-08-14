// Fails if any text token drops below 4.5:1 on a surface it actually renders on.
//
// Two things this deliberately does NOT do:
//
//  1. It does not check every token against every surface. --text-strikethrough
//     never appears over the hero background, and asserting it there produces a
//     false failure that gets the gate dismissed. Each token lists its real
//     surfaces, derived by grepping var(--token) usages back to their container.
//
//  2. It does not treat the hero as flat cream. .stat-l renders over
//     assets/page-background.webp under a .78 cream scrim, not over #FFF9F0.
//     Measuring the flat token reports ~5:1 while the real worst case is ~3.4:1 -
//     a green check on a page that still fails. HERO_BG below is the darkest
//     composited pixel of that surface, which is the case that has to pass.
//
// Regenerate HERO_BG if page-background.webp or --bg-scrim ever changes:
//   python3 - <<'PY'
//   from PIL import Image; import numpy as np
//   bg=np.asarray(Image.open('public/assets/page-background.webp').convert('RGB')).astype(float)
//   comp=bg*(1-0.78)+np.array([255,249,240.])*0.78
//   c=comp/255.0; c=np.where(c<=0.03928,c/12.92,((c+0.055)/1.055)**2.4)
//   L=0.2126*c[...,0]+0.7152*c[...,1]+0.0722*c[...,2]
//   i=np.unravel_index(L.argmin(),L.shape); px=comp[i].round().astype(int)
//   print('#%02x%02x%02x'%tuple(px))
//   PY
//
// Run: node scripts/check-contrast.mjs

const MIN = 4.5;

const SURFACES = {
  'hero background (darkest px, .78 scrim)': '#e9c6c9',
  'white card':                              '#ffffff',
  'modal fact panel':                        '#f7f3ee',
  'cream page':                              '#FFF9F0',
  'carousel band':                           '#241a13',
  'carousel chip':                           '#1d1510',
};

// token -> { value, surfaces it actually renders on }
const TEXT = {
  '--faint': {
    value: '#625245',            // was #8a7361: 2.84:1 on the real hero surface
    surfaces: ['hero background (darkest px, .78 scrim)', 'white card'],
    // .stat-l (hero, over the background image), .tier-price span (white card)
  },
  '--faint2': {
    value: '#75695d',            // was #a0907f: 3.09:1 on white, 2.86:1 on the panel
    surfaces: ['white card', 'modal fact panel'],
    // .was (white card), .fact-v s (modal fact panel)
  },
  '--chip-text': {
    value: '#f3ece2',
    surfaces: ['carousel chip'],
    // .tile-label. Checkable only because the chip is opaque - while it was
    // rgba(0,0,0,.55) over a video frame the effective background was whatever
    // was playing behind it, which no gate can assert.
  },
};

// Surface tokens carry no text themselves, but the gate still asserts the
// stylesheets declare them, so a change here cannot drift from what was checked.
//
// Per-file, because the two pages genuinely differ right now: the carousel-band
// rework landed on diy.html only, so Local Table still declares the original
// near-black --band #141110. Asserting a single global value would fail on a
// file that was never in scope. If Local Table's band is reworked too, move
// --band back into a shared block.
const SURFACE_TOKENS = {
  'public/diy.html': {
    '--band':         '#241a13',
    '--surface-chip': '#1d1510',
  },
  'public/local-table/index.html': {
    '--band':         '#141110',   // unchanged; carousel rework was diy-only
  },
};

const lum = h => {
  const c = [1, 3, 5]
    .map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

let failed = false;

for (const [name, { value, surfaces }] of Object.entries(TEXT)) {
  for (const sname of surfaces) {
    const bg = SURFACES[sname];
    if (!bg) {
      console.log(`FAIL  ${name}: unknown surface "${sname}"`);
      failed = true;
      continue;
    }
    const r = ratio(value, bg);
    const ok = r >= MIN;
    if (!ok) failed = true;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${name} ${value} on ${sname}  ${r.toFixed(2)}:1`
    );
  }
}

// The token values above must match what the stylesheets actually declare -
// otherwise this gate passes while the pages ship something else.
import { readFileSync } from 'node:fs';
for (const file of ['public/local-table/index.html', 'public/diy.html']) {
  const css = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const declared = Object.entries(TEXT).map(([n, { value }]) => [n, value])
    .concat(Object.entries(SURFACE_TOKENS[file] ?? {}));
  for (const [name, value] of declared) {
    const m = css.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
    if (!m) continue;
    const ok = m[1].toLowerCase() === value.toLowerCase();
    if (!ok) failed = true;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${file} declares ${name}: ${m[1]}` +
        (ok ? '' : ` (expected ${value})`)
    );
  }
}

process.exit(failed ? 1 : 0);
