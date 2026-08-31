/* ══════════════════════════════════════════════════════════════════════════
   SunScout — motion layer (vanilla, no dependencies)
   --------------------------------------------------------------------------
   Progressive enhancement only. Every element it touches is fully readable
   if this file never loads: .geo-reveal starts visible in CSS terms only
   once .is-in is added, so the script also adds a `geo-ready` flag to <html>
   and the CSS hiding is gated on it. No layout is produced here.

   Deliberately does NOT touch: loadActivities(), any fetch, setTab/setCity
   or any of the five filter UIs. The only hook into rendered cards is a
   read-only MutationObserver.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* older browsers: treat as no preference */ }

  /* ── 1. Scroll progress ────────────────────────────────────────────── */
  function scrollProgress() {
    var bar = document.getElementById('geoProgress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight);
      var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.setProperty('--geo-progress', pct.toFixed(2) + '%');
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function(){ update(); sweepReveal(); }); }
    }, { passive: true });
    window.addEventListener('resize', function(){ update(); sweepReveal(); }, { passive: true });
    update();
  }

  /* Safety net. The IntersectionObserver is the efficient path, but the one
     failure mode that actually matters on a content site is text that stays
     invisible, so correctness does not rest on it: on every scroll frame,
     anything still unrevealed that has reached the fold is revealed outright.
     Cheap — the selector only ever matches elements that have not resolved. */
  function sweepReveal() {
    if (reduced) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var pending = document.querySelectorAll('.geo-reveal:not(.is-in),.geo-sec:not(.is-in)');
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].getBoundingClientRect().top < vh) pending[i].classList.add('is-in');
    }
  }

  /* ── 2. Reveal on scroll ───────────────────────────────────────────────
     One shared observer. Elements reveal once and are then unobserved, so
     scrolling back up costs nothing. */
  var revealObserver = null;
  function initReveal() {
    if (reduced || !('IntersectionObserver' in window)) {
      // Make sure nothing is left hidden.
      document.querySelectorAll('.geo-reveal').forEach(function (el) { el.classList.add('is-in'); });
      document.querySelectorAll('.geo-sec').forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
      /* A small pixel inset, not a percentage: a percentage of a tall
         viewport creates a dead band at the bottom where an element can sit
         without ever triggering. */
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

    observeAll(document);
  }

  /* Anything already on screen when it is added has not been "scrolled into
     view" and must not animate in — otherwise replacing cards under a filter
     blanks the rows the visitor is currently reading. Those reveal at once;
     only elements below the fold get the observer. */
  function observeAll(root) {
    if (!revealObserver) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    root.querySelectorAll('.geo-reveal:not(.is-in),.geo-sec:not(.is-in)').forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top < vh) el.classList.add('is-in');
      else revealObserver.observe(el);
    });
  }

  /* Cards are re-rendered wholesale by renderCards(). Rather than edit that
     function, watch the grid and tag whatever appears. Stagger is capped so
     a long list never leaves the last card waiting. */
  function watchGrid() {
    var grid = document.getElementById('grid');
    if (!grid || reduced || !('MutationObserver' in window)) return;
    var mo = new MutationObserver(function () {
      var cards = grid.querySelectorAll('.card:not(.geo-reveal)');
      cards.forEach(function (card, i) {
        card.classList.add('geo-reveal');
        card.style.setProperty('--geo-delay', Math.min(i, 8) * 55 + 'ms');
      });
      observeAll(grid);
    });
    mo.observe(grid, { childList: true });
  }

  /* ── 3. Stat count-up ──────────────────────────────────────────────────
     Only runs on values that are actually numeric, preserves any prefix or
     suffix (so "$0" and "7" both work), and never invents a number: if the
     element is still showing a placeholder it is left alone. */
  function countUp(el) {
    var raw = (el.textContent || '').trim();
    var m = raw.match(/^([^\d-]*)(-?[\d,]+)(.*)$/);
    if (!m) return;
    var prefix = m[1], suffix = m[3];
    var target = parseInt(m[2].replace(/,/g, ''), 10);
    if (isNaN(target)) return;
    if (reduced) { return; }              // leave the final value in place
    var dur = 900, start = null;
    el.classList.add('geo-counting');
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else { el.textContent = prefix + target.toLocaleString() + suffix; el.classList.remove('geo-counting'); }
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || seen.has(e.target)) return;
        seen.add(e.target);
        countUp(e.target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.p-stat b').forEach(function (el) { io.observe(el); });

    /* #pStatCount is filled in after the activities land, so re-run it once
       its text actually becomes a number. */
    var live = document.getElementById('pStatCount');
    if (live && 'MutationObserver' in window) {
      var done = false;
      new MutationObserver(function () {
        if (done) return;
        if (/\d/.test(live.textContent || '')) { done = true; countUp(live); }
      }).observe(live, { childList: true, characterData: true, subtree: true });
    }
  }

  /* ── 4. Auto-scrolling ticker ──────────────────────────────────────────
     Duplicated track so the -50% keyframe loops seamlessly. Pauses on
     hover, on keyboard focus anywhere inside, on an explicit button, and
     whenever the tab is hidden (no point animating offscreen).

     WCAG 2.2.2: the button is the required pause mechanism. Under
     prefers-reduced-motion the animation never starts at all. */
  function initTicker() {
    var wrap = document.getElementById('geoTicker');
    if (!wrap) return;
    var track = wrap.querySelector('.geo-track');
    var btn = wrap.querySelector('.geo-pause');
    if (!track) return;

    // Duplicate the content once so translate(-50%) lands seamlessly.
    track.innerHTML = track.innerHTML + track.innerHTML;

    // Pace it by content width so short and long lists scroll at one speed.
    requestAnimationFrame(function () {
      var w = track.scrollWidth / 2;
      if (w > 0) track.style.setProperty('--geo-marquee-dur', Math.round(w / 42) + 's');
    });

    var manual = false;          // the visitor's explicit choice wins
    function setPaused(p, isManual) {
      if (isManual) manual = p;
      wrap.setAttribute('data-paused', (manual || p) ? 'true' : 'false');
      if (btn) {
        var paused = wrap.getAttribute('data-paused') === 'true';
        btn.textContent = paused ? '▶' : '❚❚';
        btn.setAttribute('aria-label', paused ? 'Resume the scrolling highlights' : 'Pause the scrolling highlights');
        btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      }
    }

    if (reduced) {
      wrap.setAttribute('data-paused', 'true');
      if (btn) btn.style.display = 'none';   // nothing is moving to pause
      return;
    }

    setPaused(false, false);
    if (btn) btn.addEventListener('click', function () { setPaused(!manual, true); });
    wrap.addEventListener('mouseenter', function () { if (!manual) setPaused(true, false); });
    wrap.addEventListener('mouseleave', function () { if (!manual) setPaused(false, false); });
    wrap.addEventListener('focusin', function () { if (!manual) setPaused(true, false); });
    wrap.addEventListener('focusout', function () { if (!manual) setPaused(false, false); });
    document.addEventListener('visibilitychange', function () {
      if (!manual) setPaused(document.hidden, false);
    });
  }

  /* ── 5. Smooth in-page scrolling ───────────────────────────────────────
     Honours reduced motion, which CSS scroll-behavior:smooth alone does
     not do reliably across browsers. */
  function initSmoothScroll() {
    document.documentElement.style.scrollBehavior = reduced ? 'auto' : 'smooth';
  }

  /* ── boot ──────────────────────────────────────────────────────────── */
  function boot() {
    /* Matches the inline head script: under reduced motion the flag is never
       set, so the reveal styles never apply at all rather than relying on the
       !important override in the media query. */
    if (!reduced) document.documentElement.classList.add('geo-ready');
    scrollProgress();
    initReveal();
    watchGrid();
    initCounters();
    initTicker();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
