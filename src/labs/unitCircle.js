// Lab 01 — Trigonometry: a point travelling round the unit circle draws the
// sine and cosine waves. Drag the point (or the wave) to set the angle.

import {
  COLORS, MONO, TAU, binder, clamp, dot, drawGrid, fmt, line, mod,
  pointerPos, prefersReducedMotion, runWhenVisible, setupCanvas, text,
} from '../lib/canvas.js';
import { createChallenges } from '../challenges.js';

const SNAP = Math.PI / 12; // 15°

/** Turns an angle into a friendly multiple of π when it lands on one. */
function piLabel(a) {
  const twelfths = a / (Math.PI / 12);
  const k = Math.round(twelfths);
  if (Math.abs(twelfths - k) > 0.02) return `${fmt(a / Math.PI, 3)}π`;
  if (k === 0) return '0';
  const g = gcd(k, 12);
  const num = k / g;
  const den = 12 / g;
  const top = num === 1 ? 'π' : `${num}π`;
  return den === 1 ? top : `${top}/${den}`;
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

export function mountUnitCircle(root) {
  const $ = (s) => root.querySelector(s);
  const canvas = $('canvas');
  const view = setupCanvas(canvas);
  const { ctx } = view;

  const playBtn = $('[data-action="play"]');
  const angleInput = $('input[name="angle"]');
  const speedInput = $('input[name="speed"]');
  const toggle = {
    sin: $('input[name="sin"]'),
    cos: $('input[name="cos"]'),
    tan: $('input[name="tan"]'),
    snap: $('input[name="snap"]'),
  };
  const set = binder({
    deg: $('[data-out="deg"]'),
    rad: $('[data-out="rad"]'),
    sin: $('[data-out="sin"]'),
    cos: $('[data-out="cos"]'),
    tan: $('[data-out="tan"]'),
    sum: $('[data-out="sum"]'),
  });

  const state = {
    theta: Math.PI / 6,
    playing: false,
    speed: 1,
    drag: null,
    hover: false,
  };

  const challenges = createChallenges($('[data-challenges]'), 'trig', [
    { id: 'ninety', text: 'Stop the point at <b>θ = 90°</b>. What is sin θ there — and why?', test: (s) => s.still && Math.abs(s.deg - 90) < 0.75 },
    { id: 'q2', text: 'Make <b>cos θ negative</b> while <b>sin θ stays positive</b>. Which quarter of the circle is that?', test: (s) => s.still && s.cos < -0.15 && s.sin > 0.15 },
    { id: 'equal', text: 'Find an angle where <b>sin θ = cos θ</b>.', test: (s) => s.still && Math.abs(s.sin - s.cos) < 0.01 },
    { id: 'tan', text: 'Switch on <b>tan θ</b> and find an angle where it shoots off to infinity.', test: (s) => s.still && s.showTan && Math.abs(s.cos) < 0.02 },
  ]);

  function setPlaying(on) {
    state.playing = on;
    playBtn.setAttribute('aria-pressed', String(on));
    playBtn.querySelector('span').textContent = on ? 'Pause' : 'Play';
  }

  function setAngle(a) {
    state.theta = toggle.snap.checked ? Math.round(a / SNAP) * SNAP : a;
  }

  function layout() {
    const W = view.width;
    const H = view.height;
    const pad = 18;
    const R = Math.max(28, Math.min(H * 0.36, W * (W < 640 ? 0.22 : 0.19)));
    const cx = pad + R + 14;
    const cy = H / 2;
    const x0 = cx + R + Math.max(26, W * 0.05);
    const x1 = W - pad - 10;
    return { W, H, R, cx, cy, x0, x1, ww: Math.max(10, x1 - x0) };
  }

  function plot(fn, L, upto, color, width, limit = Infinity) {
    const { x0, ww, cy, R } = L;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    let pen = false;
    const steps = Math.ceil(ww / 1.5);
    for (let i = 0; i <= steps; i++) {
      const ang = (i / steps) * TAU;
      if (ang > upto) break;
      const v = fn(ang);
      if (!Number.isFinite(v) || Math.abs(v) > limit) {
        pen = false;
        continue;
      }
      const x = x0 + (ang / TAU) * ww;
      const y = cy - v * R;
      if (pen) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
      pen = true;
    }
    ctx.stroke();
  }

  function draw() {
    const L = layout();
    const { W, H, R, cx, cy, x0, x1, ww } = L;
    const a = mod(state.theta, TAU);
    const s = Math.sin(a);
    const c = Math.cos(a);
    const px = cx + R * c;
    const py = cy - R * s;
    const wx = x0 + (a / TAU) * ww;
    const tanLimit = (H / 2 - 6) / R;

    ctx.clearRect(0, 0, W, H);
    drawGrid(ctx, W, H, 28);

    // Axes
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    line(ctx, cx - R - 12, cy, x1 + 4, cy);
    line(ctx, cx, cy - R - 12, cx, cy + R + 12);
    line(ctx, x0, cy - R - 12, x0, cy + R + 12);

    // ±1 guides across the wave
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    line(ctx, cx - R, cy - R, x1, cy - R);
    line(ctx, cx - R, cy + R, x1, cy + R);
    ctx.restore();
    text(ctx, '1', x0 - 6, cy - R + 4, { color: COLORS.muted, size: 11, align: 'right' });
    text(ctx, '−1', x0 - 6, cy + R + 4, { color: COLORS.muted, size: 11, align: 'right' });

    // Angle ticks on the wave axis
    [[Math.PI / 2, 'π/2'], [Math.PI, 'π'], [(3 * Math.PI) / 2, '3π/2'], [TAU, '2π']].forEach(([ang, label]) => {
      const x = x0 + (ang / TAU) * ww;
      ctx.strokeStyle = COLORS.axis;
      line(ctx, x, cy - 4, x, cy + 4);
      text(ctx, label, x, cy + 18, { color: COLORS.muted, size: 11, align: 'center' });
    });

    // Unit circle
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    // Waves: faint full period + bright trace up to the current angle
    if (toggle.tan.checked) {
      plot(Math.tan, L, TAU, 'rgba(160,160,155,0.25)', 1.5, tanLimit);
      plot(Math.tan, L, a, COLORS.gray, 2, tanLimit);
    }
    if (toggle.cos.checked) {
      plot(Math.cos, L, TAU, 'rgba(244,244,239,0.18)', 1.5);
      plot(Math.cos, L, a, COLORS.white, 2.5);
    }
    if (toggle.sin.checked) {
      plot(Math.sin, L, TAU, 'rgba(255,212,0,0.22)', 1.5);
      plot(Math.sin, L, a, COLORS.yellow, 3);
    }

    // Tangent line x = 1 and the ray through P
    if (toggle.tan.checked) {
      ctx.save();
      ctx.strokeStyle = 'rgba(160,160,155,0.5)';
      ctx.setLineDash([4, 4]);
      line(ctx, cx + R, cy - R - 12, cx + R, cy + R + 12);
      ctx.restore();
      if (Math.abs(c) > 1e-3) {
        const t = Math.tan(a);
        const ty = clamp(cy - R * t, -2000, H + 2000);
        ctx.strokeStyle = COLORS.gray;
        ctx.lineWidth = 1.5;
        line(ctx, cx, cy, cx + R, ty);
        ctx.lineWidth = 3;
        line(ctx, cx + R, cy, cx + R, ty);
        if (Math.abs(t) <= tanLimit) dot(ctx, cx + R, ty, 4, COLORS.gray);
      }
    }

    // Right triangle inside the circle: cos (white) along x, sin (yellow) up
    ctx.fillStyle = 'rgba(255,212,0,0.07)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();

    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    line(ctx, cx, cy, px, py);
    if (toggle.cos.checked) {
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = 3.5;
      line(ctx, cx, cy, px, cy);
    }
    if (toggle.sin.checked) {
      ctx.strokeStyle = COLORS.yellow;
      ctx.lineWidth = 3.5;
      line(ctx, px, cy, px, py);
    }
    ctx.lineCap = 'butt';

    // Angle arc
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(22, R * 0.3), 0, -a, true);
    ctx.stroke();
    const mid = -a / 2;
    const lr = Math.min(36, R * 0.48);
    text(ctx, 'θ', cx + lr * Math.cos(mid), cy + lr * Math.sin(mid) + 4, { color: COLORS.yellow, size: 13, align: 'center', weight: 600 });

    // Projection guides from the circle to the waves
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,212,0,0.55)';
    if (toggle.sin.checked) line(ctx, px, py, wx, py);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    line(ctx, wx, cy - R - 8, wx, cy + R + 8);
    ctx.restore();

    if (toggle.cos.checked) dot(ctx, wx, cy - c * R, 5, COLORS.white);
    if (toggle.sin.checked) dot(ctx, wx, py, 6, COLORS.yellow);

    // Segment labels
    if (R > 50) {
      if (toggle.sin.checked && Math.abs(s) > 0.18) {
        text(ctx, 'sin θ', px + (c >= 0 ? 8 : -8), cy - (R * s) / 2 + 4, { color: COLORS.yellow, size: 11, align: c >= 0 ? 'left' : 'right' });
      }
      if (toggle.cos.checked && Math.abs(c) > 0.25) {
        text(ctx, 'cos θ', cx + (R * c) / 2, cy + (s >= 0 ? 16 : -8), { color: COLORS.white, size: 11, align: 'center' });
      }
    }

    // Draggable point
    if (state.hover || state.drag) {
      ctx.fillStyle = 'rgba(255,212,0,0.18)';
      ctx.beginPath();
      ctx.arc(px, py, 16, 0, TAU);
      ctx.fill();
    }
    dot(ctx, px, py, 8, COLORS.yellow, COLORS.bg, 3);

    // Legend
    let lx = x0 + 6;
    const ly = 22;
    [['sin θ', COLORS.yellow, toggle.sin], ['cos θ', COLORS.white, toggle.cos], ['tan θ', COLORS.gray, toggle.tan]].forEach(([label, color, el]) => {
      if (!el.checked) return;
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly - 8, 14, 3);
      text(ctx, label, lx + 20, ly - 2, { color, size: 11 });
      lx += 76;
    });
  }

  function update() {
    const a = mod(state.theta, TAU);
    const s = Math.sin(a);
    const c = Math.cos(a);
    const deg = (a * 180) / Math.PI;
    set('deg', `${deg.toFixed(1)}°`);
    set('rad', piLabel(a));
    set('sin', fmt(s));
    set('cos', fmt(c));
    set('tan', Math.abs(c) < 1e-3 ? 'undefined' : fmt(s / c));
    set('sum', fmt(s * s + c * c));
    if (document.activeElement !== angleInput) angleInput.value = String(Math.round(deg) % 360);

    challenges.check({
      deg, sin: s, cos: c,
      still: !state.playing,
      showTan: toggle.tan.checked,
    });
  }

  // Controls
  playBtn.addEventListener('click', () => setPlaying(!state.playing));
  speedInput.addEventListener('input', () => (state.speed = Number(speedInput.value)));
  angleInput.addEventListener('input', () => {
    setPlaying(false);
    setAngle((Number(angleInput.value) * Math.PI) / 180);
  });
  toggle.snap.addEventListener('change', () => toggle.snap.checked && setAngle(state.theta));

  // Pointer: drag on/near the circle, or scrub along the wave
  function hitMode(p) {
    const L = layout();
    if (Math.hypot(p.x - L.cx, p.y - L.cy) < L.R + 36) return 'circle';
    if (p.x >= L.x0 - 8 && p.x <= L.x1 + 8) return 'wave';
    return null;
  }
  function dragTo(p) {
    const L = layout();
    const ang = state.drag === 'circle'
      ? Math.atan2(L.cy - p.y, p.x - L.cx)
      : clamp((p.x - L.x0) / L.ww, 0, 0.99999) * TAU;
    setAngle(ang);
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = pointerPos(canvas, e);
    const mode = hitMode(p);
    if (!mode) return;
    state.drag = mode;
    canvas.setPointerCapture(e.pointerId);
    setPlaying(false);
    dragTo(p);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointerPos(canvas, e);
    if (state.drag) return dragTo(p);
    const L = layout();
    const a = mod(state.theta, TAU);
    state.hover = Math.hypot(p.x - (L.cx + L.R * Math.cos(a)), p.y - (L.cy - L.R * Math.sin(a))) < 20;
    canvas.style.cursor = hitMode(p) ? 'grab' : 'default';
  });
  const end = () => (state.drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => (state.hover = false));

  setPlaying(!prefersReducedMotion());

  runWhenVisible(canvas, (dt) => {
    if (state.playing && !state.drag) state.theta = mod(state.theta + (dt * state.speed * TAU) / 8, TAU);
    draw();
    update();
  });
}
