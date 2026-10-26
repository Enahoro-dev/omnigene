import { BINS } from './colormaps';

export const BG = '#0e0b22';
const PAD = 28;

export function getBounds(x, y) {
  if (!x?.length) return null;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < x.length; i++) {
    if (x[i] < x0) x0 = x[i];
    if (x[i] > x1) x1 = x[i];
    if (y[i] < y0) y0 = y[i];
    if (y[i] > y1) y1 = y[i];
  }
  return { x0, y0, dx: x1 - x0 || 1, dy: y1 - y0 || 1 };
}

// layers: [{ values (0..1 per cell, <threshold hides), shades (BINS css colours) }]
export function drawScene(ctx, w, h, {
  x, y, bounds, layers = [], blend = 'normal', threshold = 0, pointSize = 3,
  image = null, view = { k: 1, tx: 0, ty: 0 },
}) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  if (!bounds || !x) return;

  const s = Math.min((w - PAD * 2) / bounds.dx, (h - PAD * 2) / bounds.dy);
  const ox = (w - bounds.dx * s) / 2;
  const oy = (h - bounds.dy * s) / 2;
  const { k, tx, ty } = view;
  const r = Math.max(0.6, (pointSize / 2) * Math.sqrt(k));
  const sx = (v) => ((v - bounds.x0) * s + ox) * k + tx;
  const sy = (v) => ((v - bounds.y0) * s + oy) * k + ty;

  if (image) {
    ctx.globalAlpha = 0.85;
    ctx.drawImage(image.bitmap, sx(0), sy(0), (image.bitmap.width / image.scale) * s * k, (image.bitmap.height / image.scale) * s * k);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  for (let i = 0; i < x.length; i++) {
    const px = sx(x[i]), py = sy(y[i]);
    if (px < -r || py < -r || px > w + r || py > h + r) continue;
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, 6.2832);
  }
  ctx.fill();

  ctx.globalCompositeOperation = blend === 'add' ? 'lighter' : 'source-over';
  for (const layer of layers) {
    if (!layer?.values) continue;
    const buckets = Array.from({ length: BINS }, () => []);
    for (let i = 0; i < layer.values.length; i++) {
      const v = layer.values[i];
      if (v >= threshold && v >= 0) buckets[Math.min(BINS - 1, Math.floor(v * BINS))].push(i);
    }
    for (let b = 0; b < BINS; b++) {
      if (!buckets[b].length) continue;
      ctx.fillStyle = layer.shades[b];
      ctx.beginPath();
      for (const i of buckets[b]) {
        const px = sx(x[i]), py = sy(y[i]);
        if (px < -r || py < -r || px > w + r || py > h + r) continue;
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, 6.2832);
      }
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}
