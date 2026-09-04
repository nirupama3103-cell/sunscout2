#!/usr/bin/env node
/**
 * Accessibility floors, enforced rather than asserted.
 *
 *   python3 -m http.server 8765 --directory public &
 *   node scripts/qa-a11y.js
 *
 * Four rules, on four pages, at a phone and a desktop width:
 *   1. every interactive element is at least 44px on its short side
 *   2. no visible text under 12px, except nav labels, which floor at 11.5px
 *   3. no emoji inside an interactive control (emoji stay in body copy)
 *   4. every control has an accessible name
 *
 * Hidden elements are skipped: a rule about what a person can see and tap
 * should not fail over something neither visible nor reachable.
 */
const BASE = process.argv[2] || 'http://localhost:8765';
const PAGES = [['home','/'],['local-table','/local-table/'],['diy','/diy.html'],
               ['halloween','/seasons/halloween/']];
const WIDTHS = [390, 1440];
function findPlaywright(){ for (const p of ['/opt/node22/lib/node_modules/playwright','playwright'])
  { try { return require(p); } catch(e){} } throw new Error('playwright not found'); }

let pass=0, fail=0;
const A=(l,a,e)=>{const ok=JSON.stringify(a)===JSON.stringify(e); ok?pass++:fail++;
  console.log(`  ${ok?'PASS':'FAIL'}  ${l.padEnd(46)} ${JSON.stringify(a).slice(0,4000)}`+
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
      await page.waitForTimeout(1700);
      console.log(`\n${name} @ ${w}px`);

      const r = await page.evaluate(() => {
        const EMOJI = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{FE0F}\u{2B00}-\u{2BFF}]/u;
        const seen = el => {
          /* A honeypot field is deliberately present and deliberately out
             of the accessibility tree. aria-hidden means it is not a
             control a person can reach, so it is not one to measure. */
          if (el.closest('[aria-hidden="true"]')) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
          const b = el.getBoundingClientRect();
          return b.width > 0 && b.height > 0;
        };
        const label = el => (el.getAttribute('aria-label') || el.getAttribute('title') ||
                             el.textContent || '').trim();

        const CTRL = 'a[href],button,input,select,[role="button"],[role="option"],[onclick]';
        const ctrls = [...document.querySelectorAll(CTRL)].filter(seen)
          /* An inline link inside a paragraph is text, not a target. */
          .filter(e => !(e.tagName === 'A' && e.closest('p,li')));

        /* A text input is rarely the tap target itself — it sits inside a
           padded pill that is. Measure the pill when the input is smaller
           than it, which is what a thumb actually lands on. */
        const target = e => {
          if (e.tagName !== 'INPUT') return e.getBoundingClientRect();
          const own = e.getBoundingClientRect();
          const par = e.closest('label,.hsearch-bar,.search-wrap,.fbar,.fbar-seg,.hh-bar,.seg');
          if (!par) return e.parentElement ? e.parentElement.getBoundingClientRect() : own;
          const pr = par.getBoundingClientRect();
          return pr.height > own.height ? pr : own;
        };
        const small = ctrls.filter(e => {
          const b = target(e);
          return Math.round(Math.min(b.width, b.height)) < 44;
        }).map(e => `${e.tagName.toLowerCase()}:${label(e).slice(0,18)}:${Math.round(Math.min(target(e).width, target(e).height))}px`);

        const tiny = [...document.querySelectorAll('body *')].filter(el => {
          if (!seen(el)) return false;
          if (!el.childNodes.length) return false;
          const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          if (!own) return false;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          const floor = el.classList.contains('bnav-label') ? 11.5 : 12;
          return fs < floor - 0.01;
        }).map(el => {
          let path = [], n = el;
          for (let i = 0; n && i < 3; n = n.parentElement, i++)
            path.push(n.tagName.toLowerCase() +
              (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\s+/)[0] : '') +
              (n.id ? '#' + n.id : ''));
          return `${path.join('<')} ${getComputedStyle(el).fontSize} "${(el.textContent||'').trim().slice(0,18)}"`;
        });

        const emo = ctrls.filter(e => {
          const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('');
          return EMOJI.test(t);
        }).map(e => label(e).slice(0, 22));

        /* A <label for> is an accessible name too — the first version of
           this check only looked at aria-label, title and text, and called
           a properly labelled search field unnamed. */
        const named = e => label(e) || (e.labels && e.labels.length) ||
                           e.querySelector('img[alt]:not([alt=""])');
        const unnamed = ctrls.filter(e => !named(e))
          .map(e => e.tagName.toLowerCase() + '.' + (typeof e.className === 'string' ? e.className.split(/\s+/)[0] : ''));

        return { small: [...new Set(small)].slice(0,60), tiny: [...new Set(tiny)].slice(0,60),
                 emo: [...new Set(emo)].slice(0,60), unnamed: [...new Set(unnamed)].slice(0,60) };
      });

      A('every control is at least 44px', r.small, []);
      A('no text under its size floor', r.tiny, []);
      A('no emoji inside a control', r.emo, []);
      A('every control has an accessible name', r.unnamed, []);
      await page.close();
    }
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
