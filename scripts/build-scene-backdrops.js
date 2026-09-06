#!/usr/bin/env node
/**
 * Draws the DIY and Local Table page backdrops and writes the same four
 * assets per scene the photographic backdrops ship:
 *
 *   public/images/seasonal/diy-rocks{,-tall}.{webp,jpg}
 *   public/images/seasonal/local-food{,-tall}.{webp,jpg}
 *
 *   node scripts/build-scene-backdrops.js
 *
 * Why drawn and not photographed: the repo has no rock-painting or food
 * photograph anywhere near backdrop size — the largest are 272x136 and
 * 400x300, and upscaling either to 1280 wide gives mush. These are drawn
 * on Chromium's canvas through the Playwright already in this environment,
 * the same no-new-dependency route scripts/optimise-hero.js takes.
 *
 * Composition rule, and the whole reason these two scenes look the way
 * they do: the page content sits in a 1048px column, so on a desktop
 * viewport ONLY the margins are ever seen — roughly 200px down each side.
 * Anything interesting in the middle is covered. So the big readable
 * objects (a painted rock, a bowl) are anchored to the left and right
 * edges, and the centre carries texture only. That is what the Halloween
 * backdrop does by accident, with its trees at both edges.
 *
 * Two sizes, as with the photographic backdrops: `wide` for a landscape
 * viewport, `tall` for a phone, where a vertical slice of the wide crop
 * would show one bowl and no scene.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'images', 'seasonal');
const QUALITY = 0.62;
const SIZES = [
  { suffix: '',      w: 1280, h: 717 },
  { suffix: '-tall', w: 620,  h: 1000 },
];

function findPlaywright() {
  for (const p of ['/opt/node22/lib/node_modules/playwright', 'playwright']) {
    try { return require(p); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found');
}

/* The drawing code runs inside the page. It is passed as a string so the
   helpers below can be shared by both scenes without a bundler. */
const DRAW = /* js */ `
function mk(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function lerp(a, b, t){ return a + (b - a) * t; }
/* Deterministic noise so a rebuild produces byte-identical art. */
function rng(seed){
  let s = seed >>> 0;
  return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function ell(ctx, x, y, rx, ry, rot){
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.closePath();
}
function grad(ctx, x0, y0, x1, y1, stops){
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const s of stops) g.addColorStop(s[0], s[1]);
  return g;
}
/* A soft drop shadow under a rounded object, drawn as a squashed radial so
   the scene reads as lit from above without a real light model. */
function contact(ctx, x, y, rx, ry, a){
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, 'rgba(58,40,24,' + a + ')');
  g.addColorStop(0.55, 'rgba(58,40,24,' + (a * 0.55) + ')');
  g.addColorStop(1, 'rgba(58,40,24,0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ───────────────────────── DIY — painted river rocks ─────────────────────
   A patch of grass with painted rocks on it, a jar of brushes, and a
   paint palette. Big rocks hug both edges; the middle keeps small ones and
   grass texture, because the middle is behind the content column. */
function drawRocks(ctx, W, H, tall){
  const r = rng(20260905);
  const horizon = H * (tall ? 0.30 : 0.36);

  ctx.fillStyle = grad(ctx, 0, 0, 0, horizon, [
    [0, '#CFE6F5'], [0.55, '#E8F1F3'], [1, '#F3EEDF']]);
  ctx.fillRect(0, 0, W, horizon + 1);

  /* Hedge line: overlapping circles, darker at the back. */
  for (let pass = 0; pass < 2; pass++){
    const base = pass === 0 ? '#7FA05C' : '#6C9150';
    const yb = horizon - (pass === 0 ? H * 0.035 : 0);
    ctx.fillStyle = base;
    for (let x = -40; x < W + 60; x += W * 0.045){
      const rad = W * (0.035 + r() * 0.03);
      ctx.beginPath(); ctx.arc(x + r() * 20, yb - rad * 0.35, rad, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.fillStyle = grad(ctx, 0, horizon, 0, H, [
    [0, '#84A85F'], [0.45, '#9BBC6B'], [1, '#B7CE84']]);
  ctx.fillRect(0, horizon - 2, W, H - horizon + 2);

  /* Grass blades, thinning toward the horizon so the ground has depth. */
  for (let i = 0; i < (tall ? 2600 : 3400); i++){
    const t = Math.pow(r(), 0.6);
    const y = lerp(horizon, H, t);
    const x = r() * W;
    const len = lerp(H * 0.006, H * 0.03, t);
    ctx.strokeStyle = 'rgba(' + Math.round(lerp(96, 150, r())) + ',' +
                      Math.round(lerp(132, 186, r())) + ',' +
                      Math.round(lerp(70, 104, r())) + ',0.7)';
    ctx.lineWidth = lerp(0.8, 2.2, t);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (r() - 0.5) * len, y - len * 0.6, x + (r() - 0.5) * len * 2, y - len);
    ctx.stroke();
  }

  /* Daisies. The centre of the frame is behind the content column at
     1048px and up, but a 1100px window shows a sliver of it, and a bare
     green field there looked like a rendering fault rather than a lawn. */
  for (let i = 0; i < (tall ? 26 : 40); i++){
    const t = Math.pow(r(), 0.55);
    const y = lerp(horizon + H * 0.01, H, t);
    const x = r() * W;
    const pr2 = lerp(W * 0.004, W * 0.010, t);
    ctx.fillStyle = 'rgba(255,252,242,0.92)';
    for (let k = 0; k < 5; k++){
      const a = k / 5 * Math.PI * 2;
      ell(ctx, x + Math.cos(a) * pr2, y + Math.sin(a) * pr2 * 0.8, pr2 * 0.62, pr2 * 0.5, a);
      ctx.fill();
    }
    ctx.fillStyle = '#F7D154';
    ell(ctx, x, y, pr2 * 0.5, pr2 * 0.42, 0); ctx.fill();
  }

  /* ── the rocks. Motifs are the ones a kid actually paints. ── */
  const STONE = ['#B9B2A6', '#CFC6B6', '#A9A296', '#DCD3C2', '#C2B7A4'];

  function rock(x, y, rx, ry, rot, tone, motif){
    contact(ctx, x, y + ry * 0.86, rx * 1.02, ry * 0.34, 0.34);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    /* body */
    const g = ctx.createLinearGradient(0, -ry, 0, ry);
    g.addColorStop(0, tone[1]); g.addColorStop(1, tone[0]);
    ctx.fillStyle = g;
    ell(ctx, 0, 0, rx, ry, 0); ctx.fill();
    /* clip everything painted to the stone */
    ctx.save(); ctx.clip();
    motif(ctx, rx, ry, r);
    /* top-left sheen and bottom shade, inside the clip so it stays a stone */
    const sh = ctx.createLinearGradient(-rx, -ry, rx, ry);
    sh.addColorStop(0, 'rgba(255,255,255,0.16)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(70,58,44,0.16)');
    ctx.fillStyle = sh; ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    ctx.restore();
    /* thin unpainted edge, the way a painted rock never quite reaches
       its own rim */
    ctx.strokeStyle = 'rgba(120,106,88,0.35)';
    ctx.lineWidth = Math.max(1, rx * 0.03);
    ell(ctx, 0, 0, rx, ry, 0); ctx.stroke();
    ctx.restore();
  }

  const mDots = function(cols){ return function(c, rx, ry, rr){
    c.fillStyle = cols[0];
    ell(c, 0, 0, rx * 0.985, ry * 0.985, 0); c.fill();
    for (let i = 0; i < 22; i++){
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * 0.74;
      c.fillStyle = cols[1 + (i % (cols.length - 1))];
      c.beginPath();
      c.arc(Math.cos(a) * rx * d, Math.sin(a) * ry * d, Math.max(2, rx * 0.075), 0, Math.PI * 2);
      c.fill();
    }
  }; };
  function mHeart(c, rx, ry){
    c.fillStyle = '#F7D154'; ell(c, 0, 0, rx * 0.985, ry * 0.985, 0); c.fill();
    const s = rx * 0.5;
    c.fillStyle = '#E4572E';
    c.beginPath();
    c.moveTo(0, s * 0.85);
    c.bezierCurveTo(-s * 1.5, -s * 0.35, -s * 0.55, -s * 1.25, 0, -s * 0.42);
    c.bezierCurveTo(s * 0.55, -s * 1.25, s * 1.5, -s * 0.35, 0, s * 0.85);
    c.fill();
  }
  function mRainbow(c, rx, ry){
    c.fillStyle = '#BFE0F2'; ell(c, 0, 0, rx * 0.985, ry * 0.985, 0); c.fill();
    const bands = ['#E4572E', '#F2A93B', '#F7D154', '#6FBF73', '#2E9BD6', '#7A5FBF'];
    c.lineWidth = ry * 0.15; c.lineCap = 'butt';
    for (let i = 0; i < bands.length; i++){
      c.strokeStyle = bands[i];
      c.beginPath();
      c.arc(0, ry * 0.52, rx * 0.72 - i * ry * 0.15, Math.PI * 1.04, Math.PI * 1.96);
      c.stroke();
    }
  }
  function mLadybug(c, rx, ry, rr){
    c.fillStyle = '#D63C25'; ell(c, 0, 0, rx * 0.985, ry * 0.985, 0); c.fill();
    c.fillStyle = '#241A16';
    /* wing split, then the head as a wide cap at one end — a narrow stripe
       plus a small round head read as a lollipop at margin scale */
    c.fillRect(-rx * 0.03, -ry * 0.55, rx * 0.06, ry * 1.4);
    ell(c, 0, -ry * 0.62, rx * 0.52, ry * 0.34, 0); c.fill();
    c.fillStyle = '#FFF3E2';
    ell(c, -rx * 0.2, -ry * 0.66, rx * 0.08, ry * 0.07, 0); c.fill();
    ell(c, rx * 0.2, -ry * 0.66, rx * 0.08, ry * 0.07, 0); c.fill();
    c.fillStyle = '#241A16';
    for (let i = 0; i < 7; i++){
      const a = rr() * Math.PI * 2, d = 0.3 + rr() * 0.42;
      c.beginPath();
      c.arc(Math.cos(a) * rx * d, Math.sin(a) * ry * d + ry * 0.12,
            Math.max(2, rx * 0.1), 0, Math.PI * 2);
      c.fill();
    }
  }
  function mFlower(c, rx, ry){
    c.fillStyle = '#2E9BD6'; ell(c, 0, 0, rx * 0.985, ry * 0.985, 0); c.fill();
    c.fillStyle = '#FFF3E2';
    for (let i = 0; i < 6; i++){
      const a = i / 6 * Math.PI * 2;
      ell(c, Math.cos(a) * rx * 0.36, Math.sin(a) * ry * 0.36, rx * 0.2, ry * 0.2, 0);
      c.fill();
    }
    c.fillStyle = '#F7D154'; ell(c, 0, 0, rx * 0.2, ry * 0.2, 0); c.fill();
  }
  function mStripes(c, rx, ry){
    const cols = ['#F2A93B', '#FFF3E2', '#6FBF73', '#FFF3E2', '#2E9BD6'];
    for (let i = 0; i < cols.length; i++){
      c.fillStyle = cols[i];
      c.fillRect(-rx + i * (rx * 2 / cols.length), -ry, rx * 2 / cols.length + 1, ry * 2);
    }
  }
  function mSmiley(c, rx, ry){
    c.fillStyle = '#F7D154'; ell(c, 0, 0, rx * 0.985, ry * 0.985, 0); c.fill();
    c.fillStyle = '#3B2A1A';
    ell(c, -rx * 0.28, -ry * 0.2, rx * 0.09, ry * 0.12, 0); c.fill();
    ell(c, rx * 0.28, -ry * 0.2, rx * 0.09, ry * 0.12, 0); c.fill();
    c.strokeStyle = '#3B2A1A'; c.lineWidth = Math.max(2, ry * 0.09); c.lineCap = 'round';
    c.beginPath(); c.arc(0, ry * 0.02, rx * 0.42, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
  }

  /* x is a fraction of width, y a fraction of the ground band. The two
     biggest rocks sit at 0.06 and 0.94 — in the margins. */
  const layout = tall ? [
    [0.16, 0.30, 0.155, mRainbow], [0.74, 0.26, 0.140, mHeart],
    [0.44, 0.46, 0.120, mDots(['#7A5FBF', '#F7D154', '#FFF3E2', '#6FBF73'])],
    [0.83, 0.56, 0.150, mLadybug], [0.20, 0.66, 0.145, mSmiley],
    [0.58, 0.80, 0.135, mFlower], [0.07, 0.90, 0.120, mStripes],
  ] : [
    [0.055, 0.42, 0.085, mRainbow], [0.945, 0.36, 0.078, mHeart],
    [0.135, 0.80, 0.080, mLadybug], [0.875, 0.86, 0.082, mSmiley],
    [0.045, 0.94, 0.070, mFlower],  [0.965, 0.66, 0.062, mStripes],
    [0.30, 0.55, 0.052, mDots(['#7A5FBF', '#F7D154', '#FFF3E2', '#6FBF73'])],
    [0.66, 0.72, 0.055, mDots(['#2E9BD6', '#FFF3E2', '#F2A93B', '#E4572E'])],
    [0.50, 0.92, 0.048, mStripes],
  ];
  /* plain unpainted stones, scattered, for the ones still waiting */
  for (let i = 0; i < (tall ? 10 : 14); i++){
    const x = r() * W, y = lerp(horizon + H * 0.02, H, Math.pow(r(), 0.7));
    const rx = W * (0.012 + r() * 0.014);
    rock(x, y, rx, rx * 0.72, (r() - 0.5) * 0.5,
         [STONE[i % STONE.length], '#E7E0D2'], function(){});
  }
  for (const L of layout){
    const rx = W * L[2];
    rock(W * L[0], lerp(horizon + H * 0.04, H * 0.99, L[1]),
         rx, rx * 0.76, (r() - 0.5) * 0.42,
         [STONE[Math.floor(r() * STONE.length)], '#E7E0D2'], L[3]);
  }

  /* Jar of brushes, bottom-left of a wide frame — margin territory. */
  const jx = tall ? W * 0.84 : W * 0.235, jy = tall ? H * 0.94 : H * 0.94;
  const jw = W * (tall ? 0.13 : 0.062), jh = jw * 1.3;
  contact(ctx, jx, jy, jw * 1.5, jw * 0.45, 0.32);
  const brushes = [['#E4572E', -0.30, -1.9], ['#2E9BD6', 0.02, -2.1], ['#F7D154', 0.32, -1.8]];
  for (const b of brushes){
    ctx.save(); ctx.translate(jx + jw * b[1], jy - jh);
    ctx.rotate(b[1] * 0.5);
    ctx.fillStyle = '#8A6A45'; ctx.fillRect(-jw * 0.05, jw * b[2] * -0.5, jw * 0.1, jh * 1.1);
    ctx.fillStyle = b[0];
    ctx.beginPath();
    ctx.moveTo(-jw * 0.09, jw * b[2] * -0.5); ctx.lineTo(jw * 0.09, jw * b[2] * -0.5);
    ctx.lineTo(0, jw * b[2] * -0.5 - jh * 0.22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  const jr = jw * 0.16;
  function jarPath(){
    ctx.beginPath();
    ctx.moveTo(jx - jw / 2, jy - jh);
    ctx.lineTo(jx + jw / 2, jy - jh);
    ctx.lineTo(jx + jw / 2, jy - jr);
    ctx.quadraticCurveTo(jx + jw / 2, jy, jx + jw / 2 - jr, jy);
    ctx.lineTo(jx - jw / 2 + jr, jy);
    ctx.quadraticCurveTo(jx - jw / 2, jy, jx - jw / 2, jy - jr);
    ctx.closePath();
  }
  jarPath();
  ctx.fillStyle = 'rgba(228,240,246,0.72)'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(108,172,200,0.62)';
  ctx.fillRect(jx - jw / 2, jy - jh * 0.40, jw, jh * 0.40);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(jx - jw * 0.40, jy - jh * 0.92, jw * 0.12, jh * 0.8);
  ctx.restore();
  jarPath();
  ctx.strokeStyle = 'rgba(126,158,174,0.8)'; ctx.lineWidth = Math.max(1.5, W * 0.0018);
  ctx.stroke();

  /* Palette of paint blobs on the other side. */
  const px = tall ? W * 0.22 : W * 0.775, py = tall ? H * 0.93 : H * 0.90;
  const pr = W * (tall ? 0.115 : 0.058);
  contact(ctx, px, py + pr * 0.3, pr * 1.5, pr * 0.5, 0.3);
  ctx.fillStyle = '#E9DFCB'; ell(ctx, px, py, pr, pr * 0.7, -0.12); ctx.fill();
  ctx.strokeStyle = 'rgba(120,100,74,0.45)'; ctx.lineWidth = Math.max(1.5, W * 0.0014); ctx.stroke();
  const blobs = ['#E4572E', '#F2A93B', '#F7D154', '#6FBF73', '#2E9BD6', '#7A5FBF'];
  for (let i = 0; i < blobs.length; i++){
    const a = -Math.PI * 0.9 + i / (blobs.length - 1) * Math.PI * 1.5;
    ctx.fillStyle = blobs[i];
    ell(ctx, px + Math.cos(a) * pr * 0.58, py + Math.sin(a) * pr * 0.42,
        pr * 0.17, pr * 0.13, 0);
    ctx.fill();
  }
}

/* ─────────────────────── Local Table — a table from above ────────────────
   Wooden planks, then bowls and plates ringed around the edges. Same
   margin rule: the biggest bowls are at x 0.07 and 0.93. */
function drawFood(ctx, W, H, tall){
  const r = rng(20260906);

  ctx.fillStyle = '#A9754A'; ctx.fillRect(0, 0, W, H);
  /* planks, running across the long axis */
  const plank = (tall ? W : H) / (tall ? 5 : 5.5);
  for (let i = 0; i * plank < (tall ? W : H) + plank; i++){
    const tint = 0.5 + r() * 0.5;
    ctx.fillStyle = 'rgba(' + Math.round(lerp(150, 186, tint)) + ',' +
                    Math.round(lerp(104, 134, tint)) + ',' +
                    Math.round(lerp(64, 88, tint)) + ',1)';
    if (tall) ctx.fillRect(i * plank, 0, plank - 2, H);
    else      ctx.fillRect(0, i * plank, W, plank - 2);
    ctx.fillStyle = 'rgba(92,60,34,0.35)';
    if (tall) ctx.fillRect(i * plank + plank - 3, 0, 3, H);
    else      ctx.fillRect(0, i * plank + plank - 3, W, 3);
    /* grain */
    for (let g = 0; g < 26; g++){
      ctx.strokeStyle = 'rgba(112,74,42,' + (0.05 + r() * 0.09) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (tall){
        const x = i * plank + r() * plank, y0 = r() * H;
        ctx.moveTo(x, y0); ctx.lineTo(x + (r() - 0.5) * 4, y0 + H * 0.2);
      } else {
        const y = i * plank + r() * plank, x0 = r() * W;
        ctx.moveTo(x0, y); ctx.lineTo(x0 + W * 0.2, y + (r() - 0.5) * 4);
      }
      ctx.stroke();
    }
  }
  /* warm pool of light in the middle so the edges read as the darker rim */
  const lg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.72);
  lg.addColorStop(0, 'rgba(255,226,178,0.34)');
  lg.addColorStop(1, 'rgba(60,34,16,0.30)');
  ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

  function dish(x, y, rad, rim, inner, fill){
    contact(ctx, x, y + rad * 0.16, rad * 1.5, rad * 1.2, 0.34);
    ctx.fillStyle = rim; ell(ctx, x, y, rad, rad, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ell(ctx, x - rad * 0.16, y - rad * 0.2, rad * 0.72, rad * 0.66, -0.5); ctx.fill();
    ctx.fillStyle = inner; ell(ctx, x, y, rad * 0.74, rad * 0.74, 0); ctx.fill();
    if (fill) fill(x, y, rad * 0.74);
  }
  function steam(x, y, s){
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = Math.max(2, s * 0.1); ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++){
      ctx.beginPath(); ctx.moveTo(x + i * s * 0.4, y);
      ctx.bezierCurveTo(x + i * s * 0.4 - s * 0.35, y - s * 0.6,
                        x + i * s * 0.4 + s * 0.35, y - s * 1.1,
                        x + i * s * 0.4, y - s * 1.7);
      ctx.stroke();
    }
  }

  const R = Math.min(W, H);
  /* curry: an orange bowl with a swirl of cream and a scatter of herbs */
  function curry(x, y, ir){
    ctx.fillStyle = '#C4571C'; ell(ctx, x, y, ir * 0.94, ir * 0.94, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,241,220,0.85)'; ctx.lineWidth = ir * 0.12; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.4; a += 0.12){
      const rr = ir * 0.12 + a * ir * 0.075;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = '#4F7C33';
    for (let i = 0; i < 12; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.8;
      ell(ctx, x + Math.cos(a) * ir * d, y + Math.sin(a) * ir * d, ir * 0.06, ir * 0.03, a);
      ctx.fill();
    }
    steam(x, y - ir * 1.1, ir * 0.6);
  }
  /* noodles / momos: a pale broth with dumpling humps */
  function momos(x, y, ir){
    ctx.fillStyle = '#D9B77C'; ell(ctx, x, y, ir * 0.94, ir * 0.94, 0); ctx.fill();
    for (let i = 0; i < 6; i++){
      const a = i / 6 * Math.PI * 2 + 0.3;
      const dx = x + Math.cos(a) * ir * 0.44, dy = y + Math.sin(a) * ir * 0.44;
      ctx.fillStyle = '#F4E6CA'; ell(ctx, dx, dy, ir * 0.3, ir * 0.26, a); ctx.fill();
      ctx.strokeStyle = 'rgba(190,160,110,0.8)'; ctx.lineWidth = Math.max(1, ir * 0.035);
      for (let k = -2; k <= 2; k++){
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + Math.cos(a + k * 0.5) * ir * 0.28, dy + Math.sin(a + k * 0.5) * ir * 0.24);
        ctx.stroke();
      }
    }
    steam(x, y - ir * 1.1, ir * 0.55);
  }
  /* dosa: a golden cone on a plate, with two little chutney pots */
  function dosa(x, y, ir){
    ctx.fillStyle = '#FBF3E4'; ell(ctx, x, y, ir * 0.94, ir * 0.94, 0); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
    const g = ctx.createLinearGradient(-ir * 0.8, 0, ir * 0.8, 0);
    g.addColorStop(0, '#E7B25C'); g.addColorStop(0.5, '#D99A3E'); g.addColorStop(1, '#C4832E');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-ir * 0.78, -ir * 0.30); ctx.lineTo(ir * 0.78, -ir * 0.12);
    ctx.lineTo(ir * 0.72, ir * 0.24); ctx.lineTo(-ir * 0.80, ir * 0.16);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,238,200,0.5)';
    ctx.fillRect(-ir * 0.7, -ir * 0.18, ir * 1.3, ir * 0.07);
    ctx.restore();
    ctx.fillStyle = '#8FB86A'; ell(ctx, x - ir * 0.44, y + ir * 0.55, ir * 0.2, ir * 0.2, 0); ctx.fill();
    ctx.fillStyle = '#C4571C'; ell(ctx, x + ir * 0.36, y + ir * 0.58, ir * 0.18, ir * 0.18, 0); ctx.fill();
  }
  /* boba: a cup seen from above, tan tea and dark pearls */
  function boba(x, y, rad){
    contact(ctx, x, y + rad * 0.2, rad * 1.5, rad * 1.2, 0.32);
    ctx.fillStyle = '#EFE7DA'; ell(ctx, x, y, rad, rad, 0); ctx.fill();
    ctx.fillStyle = '#C79A6B'; ell(ctx, x, y, rad * 0.82, rad * 0.82, 0); ctx.fill();
    ctx.fillStyle = '#3A2A20';
    for (let i = 0; i < 9; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.66;
      ell(ctx, x + Math.cos(a) * rad * d, y + Math.sin(a) * rad * d, rad * 0.11, rad * 0.11, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#F6C6D0';
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
    ctx.fillRect(-rad * 0.09, -rad * 1.15, rad * 0.18, rad * 1.9); ctx.restore();
  }
  function naan(x, y, rad, rot){
    contact(ctx, x, y + rad * 0.14, rad * 1.4, rad * 0.9, 0.28);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createLinearGradient(-rad, 0, rad, 0);
    g.addColorStop(0, '#F0DCB4'); g.addColorStop(1, '#DFC391');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 14){
      const rr = rad * (0.86 + Math.sin(a * 3) * 0.09);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.72;
      a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(150,102,52,0.35)';
    for (let i = 0; i < 7; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.62;
      ell(ctx, Math.cos(a) * rad * d, Math.sin(a) * rad * 0.7 * d, rad * 0.11, rad * 0.07, a);
      ctx.fill();
    }
    ctx.restore();
  }

  function cutlery(x, y, len, rot){
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    contact(ctx, 0, len * 0.1, len * 0.22, len * 0.5, 0.26);
    ctx.fillStyle = '#D8D3C8';
    /* handle */
    ctx.fillRect(-len * 0.035, -len * 0.1, len * 0.07, len * 0.6);
    /* bowl of the spoon */
    ell(ctx, 0, -len * 0.32, len * 0.10, len * 0.17, 0); ctx.fill();
    /* fork alongside */
    ctx.translate(len * 0.22, 0);
    ctx.fillRect(-len * 0.03, -len * 0.1, len * 0.06, len * 0.6);
    for (let i = -1; i <= 1; i++){
      ctx.fillRect(i * len * 0.055 - len * 0.018, -len * 0.42, len * 0.036, len * 0.34);
    }
    ctx.fillRect(-len * 0.075, -len * 0.14, len * 0.15, len * 0.07);
    ctx.restore();
  }

  /* x, y as fractions. Wide: the two big bowls at the very edges. */
  if (tall){
    dish(W * 0.30, H * 0.16, R * 0.20, '#FDF6EA', '#F3E7D2', function(x, y, ir){ curry(x, y, ir); });
    boba(W * 0.82, H * 0.11, R * 0.115);
    dish(W * 0.74, H * 0.35, R * 0.185, '#FDF6EA', '#F3E7D2', function(x, y, ir){ momos(x, y, ir); });
    naan(W * 0.22, H * 0.40, R * 0.16, 0.35);
    dish(W * 0.28, H * 0.62, R * 0.205, '#FDF6EA', '#FBF3E4', function(x, y, ir){ dosa(x, y, ir); });
    boba(W * 0.80, H * 0.60, R * 0.10);
    dish(W * 0.70, H * 0.82, R * 0.175, '#FDF6EA', '#F3E7D2', function(x, y, ir){ curry(x, y, ir); });
    naan(W * 0.20, H * 0.88, R * 0.15, -0.28);
    cutlery(W * 0.50, H * 0.25, R * 0.30, 0.10);
    cutlery(W * 0.50, H * 0.73, R * 0.28, -3.05);
  } else {
    dish(W * 0.075, H * 0.30, R * 0.235, '#FDF6EA', '#F3E7D2', function(x, y, ir){ curry(x, y, ir); });
    dish(W * 0.925, H * 0.26, R * 0.225, '#FDF6EA', '#F3E7D2', function(x, y, ir){ momos(x, y, ir); });
    dish(W * 0.135, H * 0.80, R * 0.215, '#FDF6EA', '#FBF3E4', function(x, y, ir){ dosa(x, y, ir); });
    dish(W * 0.885, H * 0.83, R * 0.20, '#FDF6EA', '#F3E7D2', function(x, y, ir){ curry(x, y, ir); });
    boba(W * 0.245, H * 0.13, R * 0.10);
    boba(W * 0.775, H * 0.63, R * 0.095);
    naan(W * 0.30, H * 0.52, R * 0.155, 0.3);
    naan(W * 0.70, H * 0.20, R * 0.14, -0.4);
    dish(W * 0.50, H * 0.88, R * 0.15, '#FDF6EA', '#F3E7D2', function(x, y, ir){ momos(x, y, ir); });
    dish(W * 0.52, H * 0.34, R * 0.11, '#FDF6EA', '#C4571C', null);
    cutlery(W * 0.395, H * 0.74, R * 0.30, 0.12);
    cutlery(W * 0.625, H * 0.50, R * 0.26, -3.02);
  }
}

window.__render = function(name, w, h){
  const c = mk(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const tall = h > w;
  if (name === 'diy-rocks') drawRocks(ctx, w, h, tall);
  else drawFood(ctx, w, h, tall);
  return { jpeg: c.toDataURL('image/jpeg', ${QUALITY}), webp: c.toDataURL('image/webp', ${QUALITY}) };
};
`;

(async () => {
  const { chromium } = findPlaywright();
  const browser = await chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  const page = await browser.newPage();
  await page.setContent('<!doctype html><meta charset="utf-8"><title>backdrops</title>');
  await page.addScriptTag({ content: DRAW });

  fs.mkdirSync(OUT, { recursive: true });
  let worst = 0;
  for (const name of ['diy-rocks', 'local-food']) {
    for (const s of SIZES) {
      const out = await page.evaluate(
        ({ name, w, h }) => window.__render(name, w, h),
        { name, w: s.w, h: s.h });
      const write = (u, f) => {
        const b = Buffer.from(u.split(',')[1], 'base64');
        fs.writeFileSync(f, b); return b.length;
      };
      const j = write(out.jpeg, path.join(OUT, name + s.suffix + '.jpg'));
      const w = write(out.webp, path.join(OUT, name + s.suffix + '.webp'));
      worst = Math.max(worst, w);
      console.log(`  ${(name + s.suffix).padEnd(18)} ${s.w}x${s.h}  ` +
                  `jpg ${(j / 1024).toFixed(1)} KB   webp ${(w / 1024).toFixed(1)} KB`);
    }
  }
  await browser.close();
  console.log(`\nheaviest single webp a visitor downloads: ${(worst / 1024).toFixed(0)} KB`);
})().catch(e => { console.error(e); process.exit(1); });
