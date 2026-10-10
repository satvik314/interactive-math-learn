// Shared canvas helpers: HiDPI sizing, a visibility-aware animation loop,
// pointer coordinates and a few drawing/math utilities used by every lab.

export const COLORS = {
  paper: '#F6F2E9',
  card: '#FBF8F2',
  ink: '#1F1D1A',
  ink2: '#3A362F',
  muted: '#5A554C',
  faint: '#8A8478',
  blue: '#4D7CFF',
  blueLight: '#9DB5FF',
  blueWash: 'rgba(77, 124, 255, 0.16)',
  red: '#E0533D',
  redWash: 'rgba(224, 83, 61, 0.22)',
  grid: 'rgba(77, 124, 255, 0.14)',
};

export const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
export const SANS = '"Bricolage Grotesque", system-ui, sans-serif';

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
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  view.destroy = () => ro.disconnect();
  return view;
}

/** Runs `frame(dt)` on every animation frame while `el` is on screen. Returns a stop function. */
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
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !visible) {
      visible = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    } else if (!entry.isIntersecting && visible) {
      visible = false;
      cancelAnimationFrame(raf);
    }
  });
  io.observe(el);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}

export function pointerPos(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

/** Graph-paper background: card fill plus a faint blue grid. */
export function drawPaper(ctx, W, H, step = 24) {
  ctx.fillStyle = COLORS.card;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.strokeStyle = COLORS.grid;
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

export function dot(ctx, x, y, r, fill, stroke = COLORS.ink, strokeWidth = 2) {
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

/** A draggable handle: blue disc, ink outline, hard offset shadow (matches the UI buttons). */
export function handle(ctx, x, y, active = false, r = 8) {
  if (active) dot(ctx, x, y, r + 8, 'rgba(77,124,255,0.22)', null);
  dot(ctx, x + 2, y + 2, r, COLORS.ink, null);
  dot(ctx, x, y, r, COLORS.blue, COLORS.ink, 2);
}

export function text(ctx, str, x, y, { color = COLORS.ink, size = 12, font = MONO, align = 'left', baseline = 'alphabetic', weight = 400 } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

/** Formats a number with a real minus sign. */
export const fmt = (v, digits = 3) => {
  const s = v.toFixed(digits);
  return (s.startsWith('-') ? '−' + s.slice(1) : s).replace(/^−(0\.0+|0)$/, '$1');
};

/** Common lifecycle for a lab: canvas view, frame loop and pointer listeners, all torn down together. */
export function labShell(canvas, frame) {
  const view = setupCanvas(canvas);
  const listeners = [];
  const on = (type, fn) => {
    canvas.addEventListener(type, fn);
    listeners.push([type, fn]);
  };
  let stop = () => {};
  const start = () => (stop = runWhenVisible(canvas, frame));
  const destroy = () => {
    stop();
    view.destroy();
    listeners.forEach(([type, fn]) => canvas.removeEventListener(type, fn));
  };
  return { view, ctx: view.ctx, on, start, destroy };
}
