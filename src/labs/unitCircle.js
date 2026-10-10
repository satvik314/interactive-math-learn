// Lab 01: Trigonometry. A point travelling round the unit circle draws the
// sine and cosine waves. Drag the point (or scrub the wave) to set the angle.

import {
  COLORS, TAU, clamp, dot, drawPaper, fmt, handle, labShell, line, mod, pointerPos, prefersReducedMotion, text,
} from '../lib/canvas.js';

const SNAP = Math.PI / 12; // 15°
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** Turns an angle into a friendly multiple of π when it lands on one. */
export function piLabel(a) {
  const twelfths = a / (Math.PI / 12);
  const k = Math.round(twelfths);
  if (Math.abs(twelfths - k) > 0.02) return `${fmt(a / Math.PI, 2)}π`;
  if (k === 0) return '0';
  const g = gcd(k, 12);
  const num = k / g;
  const den = 12 / g;
  const top = num === 1 ? 'π' : `${num}π`;
  return den === 1 ? top : `${top}/${den}`;
}

export function createUnitCircle(canvas, { preview = false, onFrame } = {}) {
  const state = {
    theta: Math.PI / 6,
    playing: preview && !prefersReducedMotion(),
    speed: 1,
    show: { sin: true, cos: true, tan: false },
    snap: false,
    drag: null,
    hover: false,
    touched: false, // the learner moved the angle themselves
    lap: 0, // angle travelled while playing since the last preset
    // derived each frame
    deg: 30, sin: 0.5, cos: Math.sqrt(3) / 2,
  };

  const setAngle = (a) => {
    state.theta = state.snap ? Math.round(a / SNAP) * SNAP : a;
    state.touched = true;
  };

  const shell = labShell(canvas, (dt) => {
    if (state.playing && !state.drag) {
      const step = (dt * state.speed * TAU) / 8;
      state.theta = mod(state.theta + step, TAU);
      state.lap += step;
    }
    const a = mod(state.theta, TAU);
    state.deg = (a * 180) / Math.PI;
    state.sin = Math.sin(a);
    state.cos = Math.cos(a);
    draw();
    onFrame?.(state);
  });
  const { view, ctx } = shell;

  function layout() {
    const W = view.width;
    const H = view.height;
    const pad = 16;
    const R = Math.max(28, Math.min(H * 0.36, W * (W < 560 ? 0.22 : 0.19)));
    const cx = pad + R + 14;
    const cy = H / 2;
    const x0 = cx + R + Math.max(24, W * 0.05);
    const x1 = W - pad - 10;
    return { W, H, R, cx, cy, x0, x1, ww: Math.max(10, x1 - x0) };
  }

  function plot(fn, L, upto, color, width, limit = Infinity) {
    const { x0, ww, cy, R } = L;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
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
    const s = state.sin;
    const c = state.cos;
    const px = cx + R * c;
    const py = cy - R * s;
    const wx = x0 + (a / TAU) * ww;
    const tanLimit = (H / 2 - 6) / R;
    const { show } = state;

    drawPaper(ctx, W, H);

    // Axes
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    line(ctx, cx - R - 12, cy, x1 + 4, cy);
    line(ctx, cx, cy - R - 12, cx, cy + R + 12);
    line(ctx, x0, cy - R - 12, x0, cy + R + 12);

    // ±1 guides
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(31,29,26,0.25)';
    line(ctx, cx - R, cy - R, x1, cy - R);
    line(ctx, cx - R, cy + R, x1, cy + R);
    ctx.restore();
    text(ctx, '1', x0 - 6, cy - R + 4, { color: COLORS.muted, size: 11, align: 'right' });
    text(ctx, '−1', x0 - 6, cy + R + 4, { color: COLORS.muted, size: 11, align: 'right' });

    [[Math.PI / 2, 'π/2'], [Math.PI, 'π'], [(3 * Math.PI) / 2, '3π/2'], [TAU, '2π']].forEach(([ang, label]) => {
      const x = x0 + (ang / TAU) * ww;
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 1.5;
      line(ctx, x, cy - 4, x, cy + 4);
      text(ctx, label, x, cy + 18, { color: COLORS.muted, size: 11, align: 'center' });
    });

    // Unit circle
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    // Waves: faint full period + solid trace up to the current angle
    if (show.tan) {
      plot(Math.tan, L, TAU, 'rgba(138,132,120,0.35)', 1.5, tanLimit);
      plot(Math.tan, L, a, COLORS.faint, 2.5, tanLimit);
    }
    if (show.cos) {
      plot(Math.cos, L, TAU, 'rgba(31,29,26,0.18)', 1.5);
      plot(Math.cos, L, a, COLORS.ink, 2.5);
    }
    if (show.sin) {
      plot(Math.sin, L, TAU, 'rgba(77,124,255,0.28)', 1.5);
      plot(Math.sin, L, a, COLORS.blue, 3.5);
    }

    // Tangent line x = 1 and the ray through P
    if (show.tan) {
      ctx.save();
      ctx.strokeStyle = COLORS.faint;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      line(ctx, cx + R, cy - R - 12, cx + R, cy + R + 12);
      ctx.restore();
      if (Math.abs(c) > 1e-3) {
        const t = Math.tan(a);
        const ty = clamp(cy - R * t, -2000, H + 2000);
        ctx.strokeStyle = COLORS.faint;
        ctx.lineWidth = 1.5;
        line(ctx, cx, cy, cx + R, ty);
        ctx.lineWidth = 3;
        line(ctx, cx + R, cy, cx + R, ty);
        if (Math.abs(t) <= tanLimit) dot(ctx, cx + R, ty, 4, COLORS.faint, COLORS.ink, 1.5);
      }
    }

    // Right triangle inside the circle: cos (ink) along x, sin (blue) up
    ctx.fillStyle = 'rgba(77,124,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, cy);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();

    ctx.lineCap = 'round';
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    line(ctx, cx, cy, px, py);
    if (show.cos) {
      ctx.lineWidth = 4;
      line(ctx, cx, cy, px, cy);
    }
    if (show.sin) {
      ctx.strokeStyle = COLORS.blue;
      ctx.lineWidth = 4;
      line(ctx, px, cy, px, py);
    }
    ctx.lineCap = 'butt';

    // Angle arc
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(22, R * 0.3), 0, -a, true);
    ctx.stroke();
    const mid = -a / 2;
    const lr = Math.min(36, R * 0.48);
    text(ctx, 'θ', cx + lr * Math.cos(mid), cy + lr * Math.sin(mid) + 4, { color: COLORS.red, size: 13, align: 'center', weight: 600 });

    // Projection guides
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(77,124,255,0.7)';
    if (show.sin) line(ctx, px, py, wx, py);
    ctx.strokeStyle = 'rgba(31,29,26,0.3)';
    line(ctx, wx, cy - R - 8, wx, cy + R + 8);
    ctx.restore();

    if (show.cos) dot(ctx, wx, cy - c * R, 5, COLORS.paper, COLORS.ink, 2);
    if (show.sin) dot(ctx, wx, py, 5.5, COLORS.blue, COLORS.ink, 2);

    if (R > 50) {
      if (show.sin && Math.abs(s) > 0.18) {
        text(ctx, 'sin θ', px + (c >= 0 ? 8 : -8), cy - (R * s) / 2 + 4, { color: COLORS.blue, size: 11, align: c >= 0 ? 'left' : 'right', weight: 600 });
      }
      if (show.cos && Math.abs(c) > 0.25) {
        text(ctx, 'cos θ', cx + (R * c) / 2, cy + (s >= 0 ? 16 : -8), { color: COLORS.ink, size: 11, align: 'center', weight: 600 });
      }
    }

    handle(ctx, px, py, !preview && (state.hover || !!state.drag), 8);

    // Legend
    let lx = x0 + 6;
    [['sin θ', COLORS.blue, show.sin], ['cos θ', COLORS.ink, show.cos], ['tan θ', COLORS.faint, show.tan]].forEach(([label, color, on]) => {
      if (!on) return;
      ctx.fillStyle = color;
      ctx.fillRect(lx, 14, 14, 3);
      text(ctx, label, lx + 20, 20, { color, size: 11, weight: 600 });
      lx += 76;
    });
  }

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
    setAngle(mod(ang, TAU));
  }
  if (!preview) {
    shell.on('pointerdown', (e) => {
      const p = pointerPos(canvas, e);
      const mode = hitMode(p);
      if (!mode) return;
      state.drag = mode;
      state.playing = false;
      canvas.setPointerCapture(e.pointerId);
      dragTo(p);
    });
    shell.on('pointermove', (e) => {
      const p = pointerPos(canvas, e);
      if (state.drag) return dragTo(p);
      const L = layout();
      const a = mod(state.theta, TAU);
      state.hover = Math.hypot(p.x - (L.cx + L.R * Math.cos(a)), p.y - (L.cy - L.R * Math.sin(a))) < 20;
      canvas.style.cursor = hitMode(p) ? 'grab' : 'default';
    });
    const end = () => (state.drag = null);
    shell.on('pointerup', end);
    shell.on('pointercancel', end);
    shell.on('pointerleave', () => (state.hover = false));
  }

  shell.start();

  const controls = [
    {
      id: 'play', kind: 'button', primary: true,
      label: () => (state.playing ? 'Pause' : 'Play'),
      press: () => (state.playing = !state.playing),
    },
    {
      id: 'angle', kind: 'range', label: 'angle θ', min: 0, max: 359, step: 1,
      value: () => Math.round(state.deg) % 360,
      display: () => `${Math.round(state.deg) % 360}°`,
      set: (v) => {
        state.playing = false;
        setAngle((v * Math.PI) / 180);
      },
    },
    {
      id: 'speed', kind: 'range', label: 'speed', min: 0.25, max: 3, step: 0.25,
      value: () => state.speed,
      display: () => `${state.speed}×`,
      set: (v) => (state.speed = v),
    },
    {
      id: 'show', kind: 'toggles', label: 'show',
      options: [{ value: 'sin', label: 'sin' }, { value: 'cos', label: 'cos' }, { value: 'tan', label: 'tan' }, { value: 'snap', label: 'snap 15°' }],
      isOn: (v) => (v === 'snap' ? state.snap : state.show[v]),
      toggle: (v) => {
        if (v === 'snap') {
          state.snap = !state.snap;
          if (state.snap) state.theta = Math.round(state.theta / SNAP) * SNAP;
        } else {
          state.show[v] = !state.show[v];
        }
      },
    },
  ];

  return {
    state,
    controls,
    header: () => {
      const a = mod(state.theta, TAU);
      const tan = Math.abs(state.cos) < 1e-3 ? '∞' : fmt(state.sin / state.cos, 3);
      return `θ = <b>${state.deg.toFixed(0)}°</b> <span class="dim">(${piLabel(a)})</span> · sin <b>${fmt(state.sin, 3)}</b> · cos <b>${fmt(state.cos, 3)}</b>${state.show.tan ? ` · tan <b>${tan}</b>` : ''}`;
    },
    preset: (p = {}) => {
      if ('theta' in p) state.theta = p.theta;
      if ('playing' in p) state.playing = p.playing;
      if ('show' in p) Object.assign(state.show, p.show);
      if ('snap' in p) state.snap = p.snap;
      state.touched = false;
      state.lap = 0;
    },
    destroy: shell.destroy,
  };
}
