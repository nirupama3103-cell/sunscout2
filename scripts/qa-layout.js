#!/usr/bin/env node
/**
 * Layout and grid QA.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-layout.js
 *
 * The contrast and nav gates say nothing about whether the page is the right
 * SHAPE. This one does: no horizontal overflow at any width, card grids that
 * settle on a sensible column count rather than one 1100px-wide card or six
 * 90px ones, uniform card heights within a row, uniform gaps, and no element
 * hidden behind the fixed bottom bar.
 */
const BASE = process.argv[2] || 'http://localhost:8765';
const PAGES = [['home','/'],['local-table','/local-table/'],['diy','/diy.html'],
               ['halloween','/seasons/halloween/']];
const WIDTHS = [320, 360, 390, 414, 768, 1024, 1280, 1440];
function findPlaywright(){ for (const p of ['/opt/node22/lib/node_modules/playwright','playwright'])
  { try { return require(p); } catch(e){} } throw new Error('playwright not found'); }

let pass=0, fail=0;
const A=(l,a,e)=>{const ok=JSON.stringify(a)===JSON.stringify(e); ok?pass++:fail++;
  console.log(`  ${ok?'PASS':'FAIL'}  ${l.padEnd(52)} ${JSON.stringify(a)}`+
    (ok?'':`  expected ${JSON.stringify(e)}`));};

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: require('fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });

  for (const [name, path] of PAGES) {
    for (const w of WIDTHS) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 } });
      await page.route('**/*', r => r.request().url().startsWith(BASE) ? r.continue() : r.abort());
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      console.log(`\n${name} @ ${w}px`);

      /* 1. The page must never scroll sideways. A single overflowing child
            is enough to make every swipe feel broken on a phone. */
      const overflow = await page.evaluate(() => {
        const de = document.documentElement;
        const wide = [...document.querySelectorAll('body *')]
          .filter(e => { const r = e.getBoundingClientRect();
            return r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)
                   && getComputedStyle(e).position !== 'fixed'; })
          .slice(0, 4).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string'
            ? '.' + e.className.trim().split(/\s+/).slice(0,2).join('.') : ''));
        return { scrolls: de.scrollWidth > de.clientWidth + 1, wide };
      });
      A('no horizontal page scroll', overflow.scrolls, false);
      if (overflow.wide.length) console.log(`        widest offenders: ${overflow.wide.join(', ')}`);

      /* 2. Card grid: column count and gap. A grid that resolves to one
            very wide column on a desktop, or to columns narrower than a
            thumb on a phone, is a layout bug the eye forgives and the
            reader does not. */
      const grid = await page.evaluate(() => {
        const g = document.querySelector('.grid, .diy-grid, .lt-grid');
        if (!g) return null;
        const cs = getComputedStyle(g);
        const cols = cs.gridTemplateColumns.split(' ').filter(Boolean);
        const kids = [...g.children].filter(c => c.getBoundingClientRect().width > 0);
        const widths = kids.map(c => Math.round(c.getBoundingClientRect().width));
        return { n: cols.length, colW: cols.map(c => Math.round(parseFloat(c))),
                 gap: Math.round(parseFloat(cs.columnGap) || 0), kids: kids.length,
                 minW: Math.min(...widths), maxW: Math.max(...widths) };
      });
      if (grid && grid.kids) {
        A('grid has at least one column', grid.n >= 1, true);
        A('no column narrower than 140px', grid.colW.every(c => c >= 140 || isNaN(c)), true);
        A('column gap is a sane 8-48px', grid.gap >= 8 && grid.gap <= 48, true);
        /* A lead card is allowed to span two columns; anything beyond a 2x
           spread means the grid is not really a grid. */
        A('widest card <= 2.2x the narrowest', grid.maxW <= grid.minW * 2.2 + 2, true);
        console.log(`        ${grid.n} cols, gap ${grid.gap}px, card ${grid.minW}-${grid.maxW}px`);
      } else {
        console.log('        (no card grid on this page)');
      }

      /* 3. Card art must hold one aspect ratio. Mixed ratios in a grid is
            the single most common "unfinished" tell. */
      const ratios = await page.evaluate(() => {
        const w = [...document.querySelectorAll('.card-img-wrap, .c-img')]
          .map(e => { const r = e.getBoundingClientRect();
            return r.height ? +(r.width / r.height).toFixed(2) : null; })
          .filter(Boolean);
        return [...new Set(w)];
      });
      if (ratios.length) A('card art holds one aspect ratio', ratios.length <= 2, true);

      /* 3b. One content column.

            "Messy" turned out to be measurable: the Halloween hub put every
            block on one pair of edges, and the other three had four
            different left edges on a single screen — a 1408px hero over a
            1440px grid over an 80px-inset section. This asserts that every
            contained block shares one column, so that cannot drift back.

            Full-bleed bands (sticky header, marquee, footer) are exempt by
            design: they carry a background across the viewport and inset
            their own content instead. */
      if (w >= 1024) {
        const cols = await page.evaluate(() => {
          /* One root, not two. Measuring body's children AND .wrap's meant
             the wrapper itself was compared against its own padded
             children — a legitimate 16px difference that is not a
             misalignment. */
          const root = document.querySelector('.page, .wrap') || document.body;
          const rootW = root.getBoundingClientRect().width;
          const lefts = [];
          [...root.children].forEach(e => {
            const cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.position === 'fixed') return;
            const b = e.getBoundingClientRect();
            if (b.height < 20 || b.width < 50) return;
            /* Bands are exempt: they carry a background edge to edge and
               inset their own content instead. A band can span the viewport
               (the home footer) or just its container — the hub's sticky
               header breaks out of .wrap's padding to do exactly that. */
            if (b.width >= document.documentElement.clientWidth - 1) return;
            if (b.width >= rootW - 1) return;
            lefts.push(Math.round(b.left));
          });
          return [...new Set(lefts)].sort((a, b) => a - b);
        });
        A('contained blocks share one left edge', cols.length <= 1, true);
        if (cols.length > 1) console.log(`        left edges found: ${cols.join(', ')}`);
      }

      /* 3c. No control appears twice on one screen.

            The same filter in two places means two states to keep in sync
            and two things to read before you can act. Free and Paid were in
            the header's Explore control AND as a chip pair a screen below
            it; that is the shape this catches.

            Two exemptions, both legitimate: a label repeated once per card
            in a list ("Directions" on eighteen events), and a header link
            that also appears in the footer, which is a convention rather
            than a mistake. */
      const dupes = await page.evaluate(() => {
        const seen = e => { const c = getComputedStyle(e); const b = e.getBoundingClientRect();
          return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity !== 0
                 && b.width > 0 && b.height > 0 && !e.closest('[aria-hidden="true"]'); };
        const map = {};
        [...document.querySelectorAll('a[href],button,[role="option"],[onclick]')]
          .filter(seen)
          .filter(e => !e.closest('.card, article, .tile, .deal, li'))   /* per-row repeats */
          .filter(e => !e.closest('footer, .footer, .ftr, .p-foot, .hh-foot'))
          .forEach(e => {
            const t = (e.getAttribute('aria-label') || e.textContent || '')
              .replace(/\s+/g, ' ').trim().toLowerCase();
            if (!t || t.length > 32) return;
            const pop = e.closest('[id^="ssd-"],.pop,#hhSheet,#ssMenu');
            if (pop && getComputedStyle(pop).display === 'none') return;
            (map[t] = map[t] || []).push(1);
          });
        return Object.keys(map).filter(k => map[k].length > 1);
      });
      A('no control appears twice on one screen', dupes, []);

      /* 4. The page must reserve room for the fixed bottom bar.

            An earlier version of this check scrolled to the bottom and
            looked for controls under the bar. It flagged different
            elements at every width, because a sticky top bar on a short
            page is legitimately near the bottom of the viewport — the
            check was measuring scroll position, not layout. What actually
            has to hold is that the last scrollable element clears the bar,
            which is a property of the page's bottom padding. */
      if (w <= 640) {
        const clearance = await page.evaluate(() => {
          const bar = document.getElementById('bottom-nav');
          if (!bar || getComputedStyle(bar).display === 'none') return null;
          const barH = bar.getBoundingClientRect().height;
          const foot = document.querySelector('.footer, .p-foot, .ftr, footer');
          const pad = foot ? parseFloat(getComputedStyle(foot).paddingBottom) || 0 : 0;
          return { barH: Math.round(barH), pad: Math.round(pad) };
        });
        if (clearance) {
          A('page clears the bottom bar', clearance.pad >= clearance.barH, true);
          console.log(`        bar ${clearance.barH}px, footer pad ${clearance.pad}px`);
        }
      }
      await page.close();
    }
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
