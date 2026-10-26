import { drawScene, getBounds } from './render';
import { fmtNum } from './format';

const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
const BOX = 'rgba(14, 11, 34, 0.78)';

function box(ctx, x, y, w, h) {
  ctx.fillStyle = BOX;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

function drawLegend(ctx, legend, bottom) {
  if (!legend) return;
  const x0 = 14, pad = 12, width = 200;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `600 13px ${FONT}`;

  const rows = legend.channels
    ? legend.channels.filter((c) => c.name).map((c) => ({ color: c.color, text: c.name }))
    : legend.categories
      ? legend.categories.filter((c) => !c.hidden).map((c) => ({ color: c.color, text: c.name }))
      : null;

  if (rows) {
    const shown = rows.slice(0, 16);
    if (rows.length > 16) shown.push({ text: `+${rows.length - 16} more` });
    if (!shown.length) return;
    const title = legend.categories ? 1 : 0;
    const h = pad * 2 + (shown.length + title) * 20 - 4;
    const y0 = bottom - 14 - h;
    box(ctx, x0, y0, width, h);
    ctx.fillStyle = '#fff';
    if (title) ctx.fillText(legend.title, x0 + pad, y0 + pad + 8, width - pad * 2);
    shown.forEach((row, i) => {
      const cy = y0 + pad + (i + title) * 20 + 8;
      if (row.color) {
        ctx.fillStyle = row.color;
        ctx.beginPath();
        ctx.arc(x0 + pad + 5, cy, 5, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.fillText(row.text, x0 + pad + (row.color ? 18 : 0), cy, width - pad * 2 - 18);
    });
    return;
  }

  const h = 66;
  const y0 = bottom - 14 - h;
  box(ctx, x0, y0, width, h);
  ctx.fillStyle = '#fff';
  ctx.fillText(legend.title, x0 + pad, y0 + pad + 6, width - pad * 2);
  const grad = ctx.createLinearGradient(x0 + pad, 0, x0 + width - pad, 0);
  legend.stops.forEach((c, i) => grad.addColorStop(i / (legend.stops.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(x0 + pad, y0 + 30, width - pad * 2, 8);
  ctx.fillStyle = '#fff';
  ctx.fillText(fmtNum(legend.min), x0 + pad, y0 + 52);
  ctx.textAlign = 'right';
  ctx.fillText(fmtNum(legend.max), x0 + width - pad, y0 + 52);
  ctx.textAlign = 'left';
}

/** panels: [{ label, legend, scene: { x, y, layers, blend, threshold, pointSize, image } }] */
export async function exportPanels({ panels, columns = 1, filename = 'omnigene.png', cellW = 900, cellH = 675 }) {
  const margin = 28, gap = 26;
  const labelH = panels.some((p) => p.label) ? 52 : 0;
  const rows = Math.ceil(panels.length / columns);
  const W = margin * 2 + columns * cellW + (columns - 1) * gap;
  const H = margin * 2 + rows * (cellH + labelH) + (rows - 1) * gap;

  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const tile = document.createElement('canvas');
  tile.width = cellW;
  tile.height = cellH;
  const tctx = tile.getContext('2d');

  panels.forEach((p, i) => {
    const left = margin + (i % columns) * (cellW + gap);
    const top = margin + Math.floor(i / columns) * (cellH + labelH + gap);
    const { x, y, pointSize = 3 } = p.scene;
    drawScene(tctx, cellW, cellH, { ...p.scene, bounds: getBounds(x, y), pointSize: pointSize * (cellW / 640) });
    drawLegend(tctx, p.legend, cellH);
    ctx.drawImage(tile, left, top);
    if (p.label) {
      ctx.fillStyle = '#15132b';
      ctx.font = `700 24px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.label, left + cellW / 2, top + cellH + labelH / 2, cellW - 20);
    }
  });

  const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('the image is too large for this browser');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}
