// Shared canvas helpers: HiDPI sizing, a visibility-aware animation loop,
// pointer coordinates and a few math utilities used by every lab.

export const COLORS = {
  bg: '#0a0a0a',
  panel: '#141414',
  grid: 'rgba(255, 255, 255, 0.045)',
  axis: 'rgba(255, 255, 255, 0.28)',
  text: '#f4f4ef',
  muted: '#8c8c86',
  yellow: '#FFD400',
  yellowSoft: 'rgba(255, 212, 0, 0.16)',
  pale: '#FFF1A6',
  white: '#f4f4ef',
  gray: '#7a7a74',
  tri: '#1b1b1b',
};

export const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
export const SANS = '"Space Grotesk", system-ui, sans-serif';

export const TAU = Math.PI * 2;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const mod = (x, m) => ((x % m) + m) % m;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Keeps the canvas backing store in sync with its CSS size and device pixel ratio. */
export function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { ctx, width: 1, height: 1, version: 0 };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.width = w;
    view.height = h;
    view.version++;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  return view;
}

/** Runs `frame(dt)` on every animation frame, but only while `el` is on screen. */
export function runWhenVisible(el, frame) {
  let raf = 0;
  let last = 0;
  let visible = false;
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame(dt);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !visible) {
      visible = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!entry.isIntersecting && visible) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  }).observe(el);
}

export function pointerPos(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

export function drawGrid(ctx, W, H, step = 28, color = COLORS.grid) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = step; x < W; x += step) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, H);
  }
  for (let y = step; y < H; y += step) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(W, Math.round(y) + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

export function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function dot(ctx, x, y, r, fill, stroke = COLORS.bg, strokeWidth = 2) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function text(ctx, str, x, y, { color = COLORS.text, size = 12, font = MONO, align = 'left', baseline = 'alphabetic', weight = 400 } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

/** Writes to a DOM node only when the value actually changes. */
export function binder(nodes) {
  const cache = {};
  return (key, value) => {
    if (cache[key] === value || !nodes[key]) return;
    cache[key] = value;
    nodes[key].textContent = value;
  };
}

/** Formats a number with a real minus sign. */
export const fmt = (v, digits = 3) => {
  const s = v.toFixed(digits);
  return (s.startsWith('-') ? '−' + s.slice(1) : s).replace(/^−(0\.0+)$/, '$1');
};
