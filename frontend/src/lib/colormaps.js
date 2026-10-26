export const BINS = 64;

const STOPS = {
  omni: ['#221d4d', '#12d68c', '#7b3ff2', '#f1e9ff'],
  fire: ['#2b0d14', '#b3122a', '#ff6a13', '#ffe08a'],
};
const LABELS = { omni: 'Default', fire: 'Red / orange' };

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function sample(stops, t) {
  const p = t * (stops.length - 1);
  const i = Math.min(Math.floor(p), stops.length - 2);
  const f = p - i;
  const a = rgb(stops[i]);
  const b = rgb(stops[i + 1]);
  return a.map((c, k) => Math.round(c + (b[k] - c) * f));
}

const cache = {};

export function colormapShades(name) {
  if (!cache[name]) {
    cache[name] = Array.from({ length: BINS }, (_, i) => `rgb(${sample(STOPS[name], i / (BINS - 1)).join(',')})`);
  }
  return cache[name];
}

export function channelShades([r, g, b]) {
  return Array.from({ length: BINS }, (_, i) => {
    const t = i / (BINS - 1);
    return `rgb(${Math.round(r * t)},${Math.round(g * t)},${Math.round(b * t)})`;
  });
}

export const colormapGradient = (name) => `linear-gradient(90deg, ${STOPS[name].join(', ')})`;
export const COLORMAP_OPTIONS = Object.keys(STOPS).map((value) => ({
  value,
  label: LABELS[value],
  swatch: colormapGradient(value),
}));

export const colormapStops = (name) => STOPS[name];
