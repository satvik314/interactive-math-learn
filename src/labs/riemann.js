// Lab 03: Calculus. Approximate the area under a curve with rectangles
// (Riemann sums) and watch the approximation converge to the exact integral.

import {
  COLORS, clamp, dot, drawPaper, fmt, labShell, line, pointerPos, prefersReducedMotion, text,
} from '../lib/canvas.js';

export const FUNCTIONS = {
  square: { label: 'x²', f: (x) => x * x, F: (x) => (x * x * x) / 3, view: [-0.6, 3.6, -1, 10], range: [0, 3], domain: [-0.6, 3.6] },
  sine: { label: 'sin x + 1', f: (x) => Math.sin(x) + 1, F: (x) => x - Math.cos(x), view: [-0.5, 7, -0.6, 2.6], range: [0, Math.PI * 1.5], domain: [-0.5, 7] },
  sqrt: { label: '√x', f: Math.sqrt, F: (x) => (2 / 3) * Math.pow(x, 1.5), view: [-0.4, 5, -0.4, 2.6], range: [0, 4], domain: [0, 5] },
  recip: { label: '1/x', f: (x) => 1 / x, F: Math.log, view: [-0.3, 5, -0.4, 4.2], range: [0.5, 4], domain: [0.25, 5] },
  cubic: { label: 'x³ − 3x', f: (x) => x * x * x - 3 * x, F: (x) => (x ** 4) / 4 - 1.5 * x * x, view: [-2.4, 2.4, -4, 4], range: [-1, 2], domain: [-2.4, 2.4] },
};

const METHODS = {
  left: (f, x, dx) => f(x),
  right: (f, x, dx) => f(x + dx),
  mid: (f, x, dx) => f(x + dx / 2),
  trap: (f, x, dx) => (f(x) + f(x + dx)) / 2,
};
export const METHOD_LABELS = { left: 'Left', right: 'Right', mid: 'Midpoint', trap: 'Trapezoid' };

const MAX_N = 100;
const ANIM_SECONDS = 5;

export function riemann(fn, method, a, b, n) {
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

export function createRiemann(canvas, { preview = false, onFrame } = {}) {
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
    clock: 0,
    // derived each frame
    approx: 0, exact: 9, err: 0, rel: 0,
  };
  const fn = () => FUNCTIONS[state.fnId];

  const shell = labShell(canvas, (dt) => {
    if (preview) {
      if (!prefersReducedMotion()) state.clock += dt;
      else state.clock = 5;
      const c = state.clock % 6;
      state.n = c < 4.5 ? Math.max(1, Math.round(1 + 47 * Math.pow(c / 4.5, 2))) : 48;
    } else if (state.anim) {
      state.anim.t += dt;
      const p = Math.min(state.anim.t / ANIM_SECONDS, 1);
      state.n = Math.max(1, Math.round(1 + (MAX_N - 1) * p * p));
      if (p >= 1) {
        state.anim = null;
        state.animDone = true;
      }
    }
    const F = fn();
    state.approx = riemann(F, state.method, state.a, state.b, state.n);
    state.exact = F.F(state.b) - F.F(state.a);
    state.err = Math.abs(state.approx - state.exact);
    state.rel = Math.abs(state.exact) > 1e-6 ? state.err / Math.abs(state.exact) : Infinity;
    draw();
    onFrame?.(state);
  });
  const { view, ctx } = shell;

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

    drawPaper(ctx, W, H);

    const xs = niceStep(x1 - x0);
    const ys = niceStep(y1 - y0);
    for (let x = Math.ceil(x0 / xs) * xs; x <= x1; x += xs) {
      if (Math.abs(x) < 1e-9) continue;
      text(ctx, fmt(x, xs < 1 ? 1 : 0), X(x), B + 30, { color: COLORS.muted, size: 11, align: 'center' });
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      line(ctx, X(x), Y(0) - 3, X(x), Y(0) + 3);
    }
    for (let y = Math.ceil(y0 / ys) * ys; y <= y1; y += ys) {
      if (Math.abs(y) < 1e-9) continue;
      text(ctx, fmt(y, ys < 1 ? 1 : 0), L - 8, Y(y) + 4, { color: COLORS.muted, size: 11, align: 'right' });
    }

    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
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
        ? (hovered ? 'rgba(77,124,255,0.7)' : 'rgba(77,124,255,0.34)')
        : (hovered ? 'rgba(224,83,61,0.55)' : 'rgba(224,83,61,0.24)');
      ctx.fill();
      if (outline) {
        ctx.strokeStyle = h >= 0 ? COLORS.blue : COLORS.red;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      if (n <= 24 && method !== 'trap') {
        const sx = method === 'left' ? xl : method === 'right' ? xr : xl + dx / 2;
        dot(ctx, X(sx), Y(h), 3, COLORS.card, COLORS.ink, 1.5);
      }
    }

    // The curve
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let pen = false;
    const [d0, d1] = F.domain;
    for (let px = L; px <= R; px += 1.5) {
      const x = G.invX(px);
      if (x < d0 || x > d1) {
        pen = false;
        continue;
      }
      const py = clamp(Y(F.f(x)), T - 200, B + 200);
      if (pen) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
      pen = true;
    }
    ctx.stroke();
    ctx.restore();

    // Bounds a and b: square tags with a hard shadow, like the UI buttons
    [['a', a], ['b', b]].forEach(([key, v]) => {
      const x = X(v);
      const active = !preview && (state.drag === key || state.hover?.kind === key);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = active ? COLORS.blue : 'rgba(31,29,26,0.45)';
      ctx.lineWidth = 1.5;
      line(ctx, x, T, x, B);
      ctx.restore();
      const s = 18;
      if (active) {
        ctx.fillStyle = 'rgba(77,124,255,0.22)';
        ctx.fillRect(x - s / 2 - 6, B - s / 2 - 6, s + 12, s + 12);
      }
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(x - s / 2 + 2, B - s / 2 + 2, s, s);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(x - s / 2, B - s / 2, s, s);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - s / 2, B - s / 2, s, s);
      text(ctx, key, x, B + 4, { color: '#fff', size: 12, align: 'center', weight: 600 });
    });

    // Tooltip for the hovered strip
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
      ctx.fillStyle = COLORS.ink;
      ctx.fillRect(bx + 4, by + 4, bw, bh);
      ctx.fillStyle = COLORS.card;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);
      lines.forEach((l, k) => text(ctx, l, bx + 10, by + 20 + k * 16, { color: k === 3 ? (h >= 0 ? COLORS.blue : COLORS.red) : COLORS.ink, size: 11, weight: k === 3 ? 600 : 400 }));
    }
  }

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
  if (!preview) {
    shell.on('pointerdown', (e) => {
      const hit = hitTest(pointerPos(canvas, e));
      if (!hit || hit.kind === 'rect') return;
      state.drag = hit.kind;
      canvas.setPointerCapture(e.pointerId);
    });
    shell.on('pointermove', (e) => {
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
    shell.on('pointerup', end);
    shell.on('pointercancel', end);
    shell.on('pointerleave', () => (state.hover = null));
  }

  shell.start();

  const setFn = (id) => {
    state.fnId = id;
    [state.a, state.b] = FUNCTIONS[id].range;
    state.movedBounds = false;
  };

  const controls = [
    {
      id: 'fn', kind: 'chips', label: 'f(x) =',
      options: Object.entries(FUNCTIONS).map(([value, f]) => ({ value, label: f.label })),
      value: () => state.fnId,
      set: setFn,
    },
    {
      id: 'n', kind: 'range', label: 'rectangles n', min: 1, max: MAX_N, step: 1,
      value: () => state.n, display: () => String(state.n),
      set: (v) => {
        state.anim = null;
        state.n = v;
      },
    },
    {
      id: 'method', kind: 'chips', label: 'height from',
      options: Object.entries(METHOD_LABELS).map(([value, label]) => ({ value, label })),
      value: () => state.method,
      set: (v) => (state.method = v),
    },
    {
      id: 'animate', kind: 'button', primary: true,
      label: () => (state.anim ? 'Stop' : 'Animate n → 100'),
      press: () => (state.anim = state.anim ? null : { t: 0 }),
    },
  ];

  return {
    state,
    controls,
    header: () => {
      const err = Number.isFinite(state.rel) ? `${(state.rel * 100).toFixed(1)}%` : fmt(state.err, 3);
      return `Σ f(xᵢ)·Δx = <b>${fmt(state.approx, 3)}</b> · exact <b>${fmt(state.exact, 3)}</b> · error <b class="${(Number.isFinite(state.rel) ? state.rel : state.err) < 0.01 ? '' : 'warn'}">${err}</b>`;
    },
    preset: (p = {}) => {
      if ('fnId' in p) setFn(p.fnId);
      if ('a' in p) state.a = p.a;
      if ('b' in p) state.b = p.b;
      if ('n' in p) state.n = p.n;
      if ('method' in p) state.method = p.method;
      state.anim = null;
      state.movedBounds = false;
    },
    destroy: shell.destroy,
  };
}
