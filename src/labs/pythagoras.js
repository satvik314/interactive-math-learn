// Lab 02 — Geometry: the Pythagorean theorem, twice.
// Left: a right triangle with a square on every side (drag the yellow corners).
// Right: the classic rearrangement proof — four copies of the triangle slide
// inside an (a+b)×(a+b) square, and the uncovered area turns from c² into a² + b².

import {
  COLORS, SANS, TAU, binder, clamp, dot, easeInOut, fmt, lerp,
  pointerPos, runWhenVisible, setupCanvas, text,
} from '../lib/canvas.js';
import { createChallenges } from '../challenges.js';

const MIN = 1;
const MAX = 9;
const TITLE_H = 34;
const FOOT_H = 34;
const round1 = (v) => Math.round(v * 10) / 10;
const isWhole = (v, tol = 0.001) => Math.abs(v - Math.round(v)) < tol;

const rotate = ([x, y], deg) => {
  const r = (deg * Math.PI) / 180;
  const c = Math.round(Math.cos(r));
  const s = Math.round(Math.sin(r));
  return [x * c - y * s, x * s + y * c];
};

export function mountPythagoras(root) {
  const $ = (s) => root.querySelector(s);
  const canvas = $('canvas');
  const view = setupCanvas(canvas);
  const { ctx } = view;

  const inputA = $('input[name="a"]');
  const inputB = $('input[name="b"]');
  const proofInput = $('input[name="proof"]');
  const rearrangeBtn = $('[data-action="rearrange"]');
  const set = binder({
    a: $('[data-out="a"]'),
    b: $('[data-out="b"]'),
    a2: $('[data-out="a2"]'),
    b2: $('[data-out="b2"]'),
    c2: $('[data-out="c2"]'),
    c: $('[data-out="c"]'),
    aVal: $('[data-out="a-val"]'),
    bVal: $('[data-out="b-val"]'),
  });

  const state = {
    a: 2,
    b: 3,
    t: 0, // proof progress 0 → 1
    target: null, // where the proof animation is heading (null while scrubbing)
    drag: null, // 'a' | 'b'
    hover: null,
    touched: false,
    cam: null, // smoothed camera for the left panel
    camVersion: -1,
  };

  const challenges = createChallenges($('[data-challenges]'), 'geo', [
    { id: 'triple', text: 'Find a triangle where <b>a, b and c are all whole numbers</b> — a <i>Pythagorean triple</i>.', test: (s) => isWhole(s.a) && isWhole(s.b) && isWhole(s.c) },
    { id: 'ten', text: 'Now find a whole-number triangle with <b>c = 10</b>.', test: (s) => isWhole(s.a) && isWhole(s.b) && Math.abs(s.c - 10) < 0.001 },
    { id: 'iso', text: 'Make both legs equal. How does <b>c²</b> compare to <b>a²</b>?', test: (s) => s.touched && Math.abs(s.a - s.b) < 0.001 },
    { id: 'proof', text: 'Play the <b>rearrangement proof</b> all the way to the end.', test: (s) => s.t >= 0.999 },
  ]);

  function panels() {
    const W = view.width;
    const H = view.height;
    if (W / H >= 1.25) return [{ x: 0, y: 0, w: W / 2, h: H }, { x: W / 2, y: 0, w: W / 2, h: H }];
    return [{ x: 0, y: 0, w: W, h: H / 2 }, { x: 0, y: H / 2, w: W, h: H / 2 }];
  }

  // Camera that fits the triangle + its three squares into the left panel.
  function fitLeft(P) {
    const { a, b } = state;
    const ih = P.h - TITLE_H - FOOT_H;
    const k = Math.min((P.w - 40) / (a + 2 * b), ih / (2 * a + b));
    // Bounding box in triangle units: x ∈ [-b, a+b], y ∈ [-a, a+b]
    return {
      k,
      ox: P.x + P.w / 2 - (a / 2) * k,
      oy: P.y + TITLE_H + ih / 2 + (b / 2) * k,
    };
  }

  function drawSquare(S, p0, u, v, side, fill, gridColor) {
    const corners = [
      p0,
      [p0[0] + u[0] * side, p0[1] + u[1] * side],
      [p0[0] + (u[0] + v[0]) * side, p0[1] + (u[1] + v[1]) * side],
      [p0[0] + v[0] * side, p0[1] + v[1] * side],
    ].map(([x, y]) => S(x, y));
    ctx.beginPath();
    corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // Unit grid so students can count the area
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < side - 1e-6; i++) {
      const [ax, ay] = S(p0[0] + u[0] * i, p0[1] + u[1] * i);
      const [bx, by] = S(p0[0] + u[0] * i + v[0] * side, p0[1] + u[1] * i + v[1] * side);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      const [cx2, cy2] = S(p0[0] + v[0] * i, p0[1] + v[1] * i);
      const [dx2, dy2] = S(p0[0] + v[0] * i + u[0] * side, p0[1] + v[1] * i + u[1] * side);
      ctx.moveTo(cx2, cy2);
      ctx.lineTo(dx2, dy2);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(10,10,10,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();

    const cx = corners.reduce((s, p) => s + p[0], 0) / 4;
    const cy = corners.reduce((s, p) => s + p[1], 0) / 4;
    return { cx, cy, px: Math.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1]) };
  }

  function areaLabel(sq, name, value) {
    if (sq.px < 26) return;
    const big = sq.px > 90;
    text(ctx, name, sq.cx, sq.cy + (big ? -2 : 5), { color: COLORS.bg, size: big ? 22 : 15, font: SANS, align: 'center', weight: 700 });
    if (big) text(ctx, fmt(value, 2), sq.cx, sq.cy + 18, { color: 'rgba(10,10,10,0.75)', size: 12, align: 'center', weight: 600 });
  }

  function paleToYellow(x1, y1, x2, y2) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, COLORS.yellow);
    g.addColorStop(1, COLORS.pale);
    return g;
  }

  function drawLeft(P, cam) {
    const { a, b } = state;
    const c = Math.hypot(a, b);
    const S = (x, y) => [cam.ox + x * cam.k, cam.oy - y * cam.k];

    text(ctx, 'SQUARES ON EACH SIDE', P.x + 16, P.y + 22, { color: COLORS.muted, size: 11, weight: 600 });

    ctx.save();
    ctx.beginPath();
    ctx.rect(P.x, P.y + TITLE_H - 8, P.w, P.h - TITLE_H + 8);
    ctx.clip();

    const sqA = drawSquare(S, [0, 0], [1, 0], [0, -1], a, COLORS.yellow, 'rgba(10,10,10,0.22)');
    const sqB = drawSquare(S, [0, 0], [0, 1], [-1, 0], b, COLORS.pale, 'rgba(10,10,10,0.18)');
    const [hx1, hy1] = S(a, 0);
    const [hx2, hy2] = S(b, a + b);
    const sqC = drawSquare(S, [a, 0], [-a / c, b / c], [b / c, a / c], c, paleToYellow(hx1, hy1, hx2, hy2), 'rgba(10,10,10,0.18)');

    // The triangle itself
    const O = S(0, 0);
    const A = S(a, 0);
    const B = S(0, b);
    ctx.beginPath();
    ctx.moveTo(...O);
    ctx.lineTo(...A);
    ctx.lineTo(...B);
    ctx.closePath();
    ctx.fillStyle = COLORS.tri;
    ctx.fill();
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right-angle marker
    const m = Math.min(12, cam.k * 0.35);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(O[0] + m, O[1]);
    ctx.lineTo(O[0] + m, O[1] - m);
    ctx.lineTo(O[0], O[1] - m);
    ctx.stroke();

    areaLabel(sqA, 'a²', a * a);
    areaLabel(sqB, 'b²', b * b);
    areaLabel(sqC, 'c²', c * c);

    // Side labels inside the triangle
    if (cam.k * Math.min(a, b) > 34) {
      text(ctx, 'a', (O[0] + A[0]) / 2, O[1] - 8, { color: COLORS.yellow, size: 13, align: 'center', weight: 600 });
      text(ctx, 'b', O[0] + 8, (O[1] + B[1]) / 2 + 4, { color: COLORS.pale, size: 13, weight: 600 });
      const inX = ((A[0] + B[0]) / 2) * 0.82 + O[0] * 0.18;
      const inY = ((A[1] + B[1]) / 2) * 0.82 + O[1] * 0.18;
      text(ctx, 'c', inX, inY + 4, { color: COLORS.white, size: 13, align: 'center', weight: 600 });
    }

    // Drag handles
    [['a', A], ['b', B]].forEach(([key, [x, y]]) => {
      if (state.hover === key || state.drag === key) {
        ctx.fillStyle = 'rgba(255,212,0,0.22)';
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, TAU);
        ctx.fill();
      }
      dot(ctx, x, y, 8, COLORS.yellow, COLORS.bg, 3);
    });
    ctx.restore();

    text(ctx, `${fmt(a * a, 2)} + ${fmt(b * b, 2)} = ${fmt(c * c, 2)}`, P.x + P.w / 2, P.y + P.h - 12, { color: COLORS.text, size: 12, align: 'center' });
  }

  function drawRight(P) {
    const { a, b } = state;
    const s = a + b;
    const ih = P.h - TITLE_H - FOOT_H - 14;
    const k = Math.min(P.w - 40, ih) / s;
    const ox = P.x + (P.w - s * k) / 2;
    const oy = P.y + TITLE_H + (ih + s * k) / 2;
    const S = (x, y) => [ox + x * k, oy - y * k];
    const t = state.t;

    text(ctx, 'REARRANGEMENT PROOF', P.x + 16, P.y + 22, { color: COLORS.muted, size: 11, weight: 600 });

    // What isn't covered by triangles: c² before, a² + b² after.
    const [sx, sy] = S(0, s);
    ctx.globalAlpha = 1 - easeInOut(t);
    ctx.fillStyle = paleToYellow(sx, sy + s * k, sx + s * k, sy);
    ctx.fillRect(sx, sy, s * k, s * k);
    ctx.globalAlpha = easeInOut(t);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(...S(0, a), a * k, a * k);
    ctx.fillStyle = COLORS.pale;
    ctx.fillRect(...S(a, s), b * k, b * k);
    ctx.globalAlpha = 1;

    // Four identical triangles. Canonical: right angle at origin, legs a (→x) and b (→y).
    const tris = [
      { rot: 0, from: [0, 0], to: [0, a], order: 0 },
      { rot: 90, from: [s, 0], to: [s, 0], order: -1 },
      { rot: 180, from: [s, s], to: [a, s], order: 1 },
      { rot: 270, from: [0, s], to: [a, a], order: 2 },
    ];
    const canon = [[0, 0], [a, 0], [0, b]];
    tris.forEach((tri) => {
      const local = tri.order < 0 ? 0 : easeInOut(clamp((t - tri.order * 0.25) / 0.5, 0, 1));
      const tx = lerp(tri.from[0], tri.to[0], local);
      const ty = lerp(tri.from[1], tri.to[1], local);
      ctx.beginPath();
      canon.forEach((p, i) => {
        const [rx, ry] = rotate(p, tri.rot);
        const [X, Y] = S(rx + tx, ry + ty);
        if (i) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      });
      ctx.closePath();
      ctx.fillStyle = COLORS.tri;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,212,0,0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Outer (a+b) square
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, s * k, s * k);

    // Region labels
    const label = (str, x, y, alpha, side) => {
      if (alpha < 0.02 || side * k < 24) return;
      ctx.globalAlpha = alpha;
      const [X, Y] = S(x, y);
      text(ctx, str, X, Y + 7, { color: COLORS.bg, size: side * k > 70 ? 22 : 15, font: SANS, align: 'center', weight: 700 });
      ctx.globalAlpha = 1;
    };
    label('c²', s / 2, s / 2, 1 - t, Math.hypot(a, b) * 0.7);
    label('a²', a / 2, a / 2, t, a);
    label('b²', a + b / 2, a + b / 2, t, b);

    // Edge lengths along the bottom
    const [bx0, by0] = S(0, 0);
    const [bxa] = S(a, 0);
    const [bxs] = S(s, 0);
    text(ctx, 'a', (bx0 + bxa) / 2, by0 + 15, { color: COLORS.yellow, size: 12, align: 'center', weight: 600 });
    text(ctx, 'b', (bxa + bxs) / 2, by0 + 15, { color: COLORS.pale, size: 12, align: 'center', weight: 600 });

    const eq = t < 0.5 ? '(a+b)² = c² + 4 triangles' : '(a+b)² = a² + b² + 4 triangles';
    ctx.globalAlpha = Math.abs(t - 0.5) * 2;
    text(ctx, eq, P.x + P.w / 2, P.y + P.h - 10, { color: COLORS.text, size: 12, align: 'center' });
    ctx.globalAlpha = 1;
  }

  function draw(dt) {
    const W = view.width;
    const H = view.height;
    const [PL, PR] = panels();

    // Smooth the left camera, but freeze it while dragging so the handle tracks the pointer.
    const target = fitLeft(PL);
    if (!state.cam || state.camVersion !== view.version) {
      state.cam = target;
      state.camVersion = view.version;
    } else if (!state.drag) {
      const f = 1 - Math.exp(-dt * 10);
      state.cam = {
        k: lerp(state.cam.k, target.k, f),
        ox: lerp(state.cam.ox, target.ox, f),
        oy: lerp(state.cam.oy, target.oy, f),
      };
    }

    ctx.clearRect(0, 0, W, H);
    drawLeft(PL, state.cam);
    drawRight(PR);

    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (PR.x > 0) {
      ctx.moveTo(PR.x + 0.5, 16);
      ctx.lineTo(PR.x + 0.5, H - 16);
    } else {
      ctx.moveTo(16, PR.y + 0.5);
      ctx.lineTo(W - 16, PR.y + 0.5);
    }
    ctx.stroke();
  }

  function setLegs(a, b) {
    state.a = round1(clamp(a, MIN, MAX));
    state.b = round1(clamp(b, MIN, MAX));
    state.touched = true;
  }

  function update(dt) {
    if (state.target !== null) {
      const dir = Math.sign(state.target - state.t);
      state.t = clamp(state.t + dir * dt * 0.4, 0, 1);
      if (state.t === state.target) state.target = null;
    }

    const { a, b, t } = state;
    const c = Math.hypot(a, b);
    set('a', fmt(a, 1));
    set('b', fmt(b, 1));
    set('aVal', fmt(a, 1));
    set('bVal', fmt(b, 1));
    set('a2', fmt(a * a, 2));
    set('b2', fmt(b * b, 2));
    set('c2', fmt(c * c, 2));
    set('c', fmt(c, 3));
    if (document.activeElement !== inputA) inputA.value = String(a);
    if (document.activeElement !== inputB) inputB.value = String(b);
    if (document.activeElement !== proofInput) proofInput.value = String(t);
    const label = (state.target ?? (t < 0.5 ? 0 : 1)) === 1 ? 'Reset' : 'Rearrange';
    if (rearrangeBtn.dataset.label !== label) {
      rearrangeBtn.dataset.label = label;
      rearrangeBtn.querySelector('span').textContent = label;
    }

    challenges.check({ a, b, c, t, touched: state.touched });
  }

  // Controls
  inputA.addEventListener('input', () => setLegs(Number(inputA.value), state.b));
  inputB.addEventListener('input', () => setLegs(state.a, Number(inputB.value)));
  proofInput.addEventListener('input', () => {
    state.target = null;
    state.t = Number(proofInput.value);
  });
  rearrangeBtn.addEventListener('click', () => {
    const goingTo = state.target ?? (state.t < 0.5 ? 0 : 1);
    state.target = goingTo === 1 ? 0 : 1;
  });

  // Drag the triangle's corners in the left panel
  function handleAt(p) {
    const cam = state.cam;
    if (!cam) return null;
    const A = [cam.ox + state.a * cam.k, cam.oy];
    const B = [cam.ox, cam.oy - state.b * cam.k];
    const dA = Math.hypot(p.x - A[0], p.y - A[1]);
    const dB = Math.hypot(p.x - B[0], p.y - B[1]);
    if (Math.min(dA, dB) > 22) return null;
    return dA <= dB ? 'a' : 'b';
  }
  canvas.addEventListener('pointerdown', (e) => {
    const key = handleAt(pointerPos(canvas, e));
    if (!key) return;
    state.drag = key;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointerPos(canvas, e);
    if (state.drag) {
      const cam = state.cam;
      if (state.drag === 'a') setLegs((p.x - cam.ox) / cam.k, state.b);
      else setLegs(state.a, (cam.oy - p.y) / cam.k);
      return;
    }
    state.hover = handleAt(p);
    canvas.style.cursor = state.hover ? 'grab' : 'default';
  });
  const end = () => (state.drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  runWhenVisible(canvas, (dt) => {
    update(dt);
    draw(dt);
  });
}
