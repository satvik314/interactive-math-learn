// Hero visual: a slowly morphing Lissajous curve with a glowing tracer.

import { COLORS, TAU, dot, drawGrid, prefersReducedMotion, runWhenVisible, setupCanvas, text } from './lib/canvas.js';

export function mountHero(canvas) {
  const view = setupCanvas(canvas);
  const { ctx } = view;
  const still = prefersReducedMotion();
  let t = 1.2;

  runWhenVisible(canvas, (dt) => {
    if (!still) t += dt;
    const W = view.width;
    const H = view.height;
    const cx = W / 2;
    const cy = H / 2;
    const A = Math.min(W, H) * 0.4;
    const phase = t * 0.22;
    const fx = 3;
    const fy = 2;
    const P = (u) => [cx + A * Math.sin(fx * u + phase), cy + A * Math.sin(fy * u)];

    ctx.clearRect(0, 0, W, H);
    drawGrid(ctx, W, H, 32, 'rgba(255, 212, 0, 0.06)');

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - A - 16, cy);
    ctx.lineTo(cx + A + 16, cy);
    ctx.moveTo(cx, cy - A - 16);
    ctx.lineTo(cx, cy + A + 16);
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = 'rgba(255, 212, 0, 0.55)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 480; i++) {
      const [x, y] = P((i / 480) * TAU);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Tracer with its projections onto the axes
    const u = t * 0.9;
    const [px, py] = P(u);
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, cy);
    ctx.moveTo(px, py);
    ctx.lineTo(cx, py);
    ctx.stroke();
    ctx.restore();
    dot(ctx, px, cy, 4, COLORS.white, null);
    dot(ctx, cx, py, 4, COLORS.white, null);
    ctx.save();
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = 24;
    dot(ctx, px, py, 7, COLORS.yellow, COLORS.bg, 3);
    ctx.restore();

    text(ctx, `x = sin(${fx}t + ${(phase % TAU).toFixed(2)})`, 18, H - 38, { color: COLORS.muted, size: 12 });
    text(ctx, `y = sin(${fy}t)`, 18, H - 18, { color: COLORS.muted, size: 12 });
  });
}
