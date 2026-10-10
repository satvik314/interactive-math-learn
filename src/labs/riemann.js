// Lab 03 — Calculus: approximate the area under a curve with rectangles
// (Riemann sums) and watch the approximation converge to the exact integral.

import {
  COLORS, MONO, binder, clamp, dot, drawGrid, fmt, line,
  pointerPos, runWhenVisible, setupCanvas, text,
} from '../lib/canvas.js';
import { createChallenges } from '../challenges.js';

const FUNCTIONS = {
  square: { f: (x) => x * x, F: (x) => (x * x * x) / 3, view: [-0.6, 3.6, -1, 10], range: [0, 3], domain: [-0.6, 3.6] },
  sine: { f: (x) => Math.sin(x) + 1, F: (x) => x - Math.cos(x), view: [-0.5, 7, -0.6, 2.6], range: [0, Math.PI * 1.5], domain: [-0.5, 7] },
  sqrt: { f: Math.sqrt, F: (x) => (2 / 3) * Math.pow(x, 1.5), view: [-0.4, 5, -0.4, 2.6], range: [0, 4], domain: [0, 5] },
  recip: { f: (x) => 1 / x, F: Math.log, view: [-0.3, 5, -0.4, 4.2], range: [0.5, 4], domain: [0.25, 5] },
  cubic: { f: (x) => x * x * x - 3 * x, F: (x) => (x ** 4) / 4 - 1.5 * x * x, view: [-2.4, 2.4, -4, 4], range: [-1, 2], domain: [-2.4, 2.4] },
};

const METHODS = {
  left: (f, x, dx) => f(x),
  right: (f, x, dx) => f(x + dx),
  mid: (f, x, dx) => f(x + dx / 2),
  trap: (f, x, dx) => (f(x) + f(x + dx)) / 2,
};

const MAX_N = 100;
const ANIM_SECONDS = 5;

function riemann(fn, method, a, b, n) {
  const dx = (b - a) / n;
  const h = METHODS[method];
  let sum = 0;
  for (let i = 0; i < n; i++) sum += h(fn.f, a + i * dx, dx) * dx;
  return sum;
}

function niceStep(span) {
  const raw = span / 6;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / pow;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * pow;
}

export function mountRiemann(root) {
  const $ = (s) => root.querySelector(s);
  const canvas = $('canvas.lab-canvas');
  const spark = $('canvas.spark');
  const view = setupCanvas(canvas);
  const sparkView = setupCanvas(spark);
  const { ctx } = view;

  const nInput = $('input[name="n"]');
  const animBtn = $('[data-action="animate"]');
  const set = binder({
    n: $('[data-out="n"]'),
    nVal: $('[data-out="n-val"]'),
    dx: $('[data-out="dx"]'),
    approx: $('[data-out="approx"]'),
    exact: $('[data-out="exact"]'),
    error: $('[data-out="error"]'),
    bounds: $('[data-out="bounds"]'),
  });

  const state = {
    fnId: 'square',
    method: 'left',
    n: 6,
    a: 0,
    b: 3,
    drag: null,
    hover: null, // { kind: 'a'|'b'|'rect', i }
    anim: null,
    animDone: false,
    movedBounds: false,
  };

  const challenges = createChallenges($('[data-challenges]'), 'calc', [
    { id: 'left5', text: 'On <b>x²</b> with the <b>Left</b> rule, push the error below <b>5%</b>. How many rectangles did it take?', test: (s) => s.fnId === 'square' && s.method === 'left' && s.rel < 0.05 },
    { id: 'mid', text: 'Switch to <b>Midpoint</b> and get under <b>1% error</b> using <b>10 rectangles or fewer</b>.', test: (s) => s.method === 'mid' && s.n <= 10 && s.rel < 0.01 },
    { id: 'zero', text: 'Pick <b>x³ − 3x</b> and drag <b>a</b> and <b>b</b> until the exact area is <b>0</b>. Where did the area go?', test: (s) => s.fnId === 'cubic' && s.movedBounds && Math.abs(s.exact) < 0.05 },
    { id: 'anim', text: 'Press <b>Animate</b> and watch the sum home in on the exact area.', test: (s) => s.animDone },
  ]);

  const fn = () => FUNCTIONS[state.fnId];

  function layout() {
    const W = view.width;
    const H = view.height;
    const L = 44;
    const R = W - 16;
    const T = 16;
    const B = H - 42;
    const [x0, x1, y0, y1] = fn().view;
    return {
      W, H, L, R, T, B,
      X: (x) => L + ((x - x0) / (x1 - x0)) * (R - L),
      Y: (y) => B - ((y - y0) / (y1 - y0)) * (B - T),
      invX: (px) => x0 + ((px - L) / (R - L)) * (x1 - x0),
    };
  }

  function draw() {
    const G = layout();
    const { W, H, L, R, T, B, X, Y } = G;
    const F = fn();
    const [x0, x1, y0, y1] = F.view;
    const { a, b, n, method } = state;
    const dx = (b - a) / n;

    ctx.clearRect(0, 0, W, H);
    drawGrid(ctx, W, H, 28);

    // Ticks
    const xs = niceStep(x1 - x0);
    const ys = niceStep(y1 - y0);
    for (let x = Math.ceil(x0 / xs) * xs; x <= x1; x += xs) {
      if (Math.abs(x) < 1e-9) continue;
      text(ctx, fmt(x, xs < 1 ? 1 : 0), X(x), B + 30, { color: COLORS.muted, size: 11, align: 'center' });
      ctx.strokeStyle = COLORS.axis;
      line(ctx, X(x), Y(0) - 3, X(x), Y(0) + 3);
    }
    for (let y = Math.ceil(y0 / ys) * ys; y <= y1; y += ys) {
      if (Math.abs(y) < 1e-9) continue;
      text(ctx, fmt(y, ys < 1 ? 1 : 0), L - 8, Y(y) + 4, { color: COLORS.muted, size: 11, align: 'right' });
    }

    // Axes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    line(ctx, L, Y(0), R, Y(0));
    if (x0 < 0 && x1 > 0) line(ctx, X(0), T, X(0), B);

    ctx.save();
    ctx.beginPath();
    ctx.rect(L, T, R - L, B - T);
    ctx.clip();

    // Rectangles / trapezoids
    const outline = n <= 60;
    for (let i = 0; i < n; i++) {
      const xl = a + i * dx;
      const xr = xl + dx;
      const hovered = state.hover?.kind === 'rect' && state.hover.i === i;
      ctx.beginPath();
      let h;
      if (method === 'trap') {
        const fl = F.f(xl);
        const fr = F.f(xr);
        h = (fl + fr) / 2;
        ctx.moveTo(X(xl), Y(0));
        ctx.lineTo(X(xl), Y(fl));
        ctx.lineTo(X(xr), Y(fr));
        ctx.lineTo(X(xr), Y(0));
      } else {
        h = METHODS[method](F.f, xl, dx);
        ctx.rect(X(xl), Y(Math.max(h, 0)), X(xr) - X(xl), Math.abs(Y(h) - Y(0)));
      }
      ctx.closePath();
      ctx.fillStyle = h >= 0
        ? (hovered ? 'rgba(255,212,0,0.85)' : 'rgba(255,212,0,0.5)')
        : (hovered ? 'rgba(244,244,239,0.6)' : 'rgba(244,244,239,0.22)');
      ctx.fill();
      if (outline) {
        ctx.strokeStyle = h >= 0 ? COLORS.yellow : COLORS.white;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // Mark the sample point that sets each rectangle's height
      if (n <= 24 && method !== 'trap') {
        const sx = method === 'left' ? xl : method === 'right' ? xr : xl + dx / 2;
        dot(ctx, X(sx), Y(h), 3, COLORS.bg, h >= 0 ? COLORS.yellow : COLORS.white, 1.5);
      }
    }

    // The curve
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let pen = false;
    const [d0, d1] = F.domain;
    for (let px = L; px <= R; px += 1.5) {
      const x = G.invX(px);
      if (x < d0 || x > d1) {
        pen = false;
        continue;
      }
      const y = F.f(x);
      const py = clamp(Y(y), T - 200, B + 200);
      if (pen) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
      pen = true;
    }
    ctx.stroke();
    ctx.restore();

    // Bounds a and b
    [['a', a], ['b', b]].forEach(([key, v]) => {
      const x = X(v);
      const active = state.drag === key || state.hover?.kind === key;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = active ? COLORS.yellow : 'rgba(255,212,0,0.55)';
      ctx.lineWidth = 1.5;
      line(ctx, x, T, x, B);
      ctx.restore();
      if (active) dot(ctx, x, B, 15, 'rgba(255,212,0,0.22)', null);
      dot(ctx, x, B, 10, COLORS.yellow, COLORS.bg, 2);
      text(ctx, key, x, B + 4, { color: COLORS.bg, size: 12, align: 'center', weight: 700 });
    });

    // Tooltip for the hovered rectangle
    if (state.hover?.kind === 'rect' && !state.drag) {
      const i = state.hover.i;
      const xl = a + i * dx;
      const h = METHODS[method](F.f, xl, dx);
      const lines = [`strip ${i + 1} of ${n}`, `height ≈ ${fmt(h, 3)}`, `width Δx = ${fmt(dx, 3)}`, `area ≈ ${fmt(h * dx, 3)}`];
      const bw = 168;
      const bh = 16 * lines.length + 14;
      let bx = X(xl + dx / 2) + 12;
      if (bx + bw > R) bx = X(xl + dx / 2) - bw - 12;
      const by = T + 8;
      ctx.fillStyle = 'rgba(10,10,10,0.92)';
      ctx.strokeStyle = 'rgba(255,212,0,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      lines.forEach((l, k) => text(ctx, l, bx + 10, by + 20 + k * 16, { color: k === 3 ? COLORS.yellow : COLORS.text, size: 11 }));
    }
  }

  let sparkKey = '';
  function drawSpark(exact) {
    const key = `${state.fnId}|${state.method}|${state.a}|${state.b}|${state.n}|${sparkView.version}`;
    if (key === sparkKey) return;
    sparkKey = key;
    const c = sparkView.ctx;
    const W = sparkView.width;
    const H = sparkView.height;
    const F = fn();
    const vals = [];
    for (let n = 1; n <= MAX_N; n++) vals.push(riemann(F, state.method, state.a, state.b, n));
    let lo = Math.min(exact, ...vals);
    let hi = Math.max(exact, ...vals);
    const padV = (hi - lo) * 0.15 || 0.5;
    lo -= padV;
    hi += padV;
    const X = (n) => 8 + ((n - 1) / (MAX_N - 1)) * (W - 16);
    const Y = (v) => H - 18 - ((v - lo) / (hi - lo)) * (H - 30);

    c.clearRect(0, 0, W, H);
    c.save();
    c.setLineDash([4, 4]);
    c.strokeStyle = 'rgba(244,244,239,0.5)';
    c.lineWidth = 1;
    line(c, 8, Y(exact), W - 8, Y(exact));
    c.restore();

    c.strokeStyle = COLORS.yellow;
    c.lineWidth = 2;
    c.beginPath();
    vals.forEach((v, i) => (i ? c.lineTo(X(i + 1), Y(v)) : c.moveTo(X(1), Y(v))));
    c.stroke();
    dot(c, X(state.n), Y(vals[state.n - 1]), 4.5, COLORS.yellow, COLORS.bg, 2);

    text(c, 'exact', W - 8, Y(exact) - 6, { color: COLORS.muted, size: 10, align: 'right', font: MONO });
    text(c, 'n = 1', 8, H - 4, { color: COLORS.muted, size: 10, font: MONO });
    text(c, `n = ${MAX_N}`, W - 8, H - 4, { color: COLORS.muted, size: 10, align: 'right', font: MONO });
  }

  function update(dt) {
    if (state.anim) {
      state.anim.t += dt;
      const p = Math.min(state.anim.t / ANIM_SECONDS, 1);
      state.n = Math.max(1, Math.round(1 + (MAX_N - 1) * p * p));
      if (p >= 1) {
        state.anim = null;
        state.animDone = true;
        animBtn.querySelector('span').textContent = 'Animate';
      }
    }

    const { a, b, n } = state;
    const F = fn();
    const approx = riemann(F, state.method, a, b, n);
    const exact = F.F(b) - F.F(a);
    const err = Math.abs(approx - exact);
    const rel = Math.abs(exact) > 1e-6 ? err / Math.abs(exact) : Infinity;

    set('n', String(n));
    set('nVal', String(n));
    set('dx', fmt((b - a) / n, 4));
    set('approx', fmt(approx, 4));
    set('exact', fmt(exact, 4));
    set('error', Number.isFinite(rel) ? `${fmt(err, 4)} (${(rel * 100).toFixed(2)}%)` : fmt(err, 4));
    set('bounds', `[${fmt(a, 2)}, ${fmt(b, 2)}]`);
    if (document.activeElement !== nInput) nInput.value = String(n);

    drawSpark(exact);
    challenges.check({ ...state, exact, rel });
  }

  // Controls
  root.querySelectorAll('input[name="fn"]').forEach((el) =>
    el.addEventListener('change', () => {
      state.fnId = el.value;
      [state.a, state.b] = FUNCTIONS[el.value].range;
      state.movedBounds = false;
    }),
  );
  root.querySelectorAll('input[name="method"]').forEach((el) =>
    el.addEventListener('change', () => (state.method = el.value)),
  );
  nInput.addEventListener('input', () => {
    state.anim = null;
    animBtn.querySelector('span').textContent = 'Animate';
    state.n = Number(nInput.value);
  });
  animBtn.addEventListener('click', () => {
    if (state.anim) {
      state.anim = null;
      animBtn.querySelector('span').textContent = 'Animate';
      return;
    }
    state.anim = { t: 0 };
    animBtn.querySelector('span').textContent = 'Stop';
  });

  // Pointer: drag the bounds, hover strips for details
  function hitTest(p) {
    const G = layout();
    if (p.y < G.T - 10 || p.y > G.B + 16) return null;
    const dA = Math.abs(p.x - G.X(state.a));
    const dB = Math.abs(p.x - G.X(state.b));
    if (Math.min(dA, dB) < 12) return { kind: dA <= dB ? 'a' : 'b' };
    const x = G.invX(p.x);
    if (x > state.a && x < state.b && p.y <= G.B) {
      const i = Math.floor(((x - state.a) / (state.b - state.a)) * state.n);
      return { kind: 'rect', i: clamp(i, 0, state.n - 1) };
    }
    return null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const hit = hitTest(pointerPos(canvas, e));
    if (!hit || hit.kind === 'rect') return;
    state.drag = hit.kind;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointerPos(canvas, e);
    if (state.drag) {
      const G = layout();
      const [d0, d1] = fn().domain;
      const x = Math.round(G.invX(p.x) * 100) / 100;
      if (state.drag === 'a') state.a = clamp(x, d0, state.b - 0.1);
      else state.b = clamp(x, state.a + 0.1, d1);
      state.movedBounds = true;
      return;
    }
    state.hover = hitTest(p);
    canvas.style.cursor = state.hover && state.hover.kind !== 'rect' ? 'ew-resize' : 'default';
  });
  const end = () => (state.drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => (state.hover = null));

  runWhenVisible(root, (dt) => {
    update(dt);
    draw();
  });
}
