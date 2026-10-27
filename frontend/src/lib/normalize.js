export function percentile(raw, p) {
  const step = Math.max(1, Math.floor(raw.length / 20000));
  const sample = new Float32Array(Math.ceil(raw.length / step));
  for (let i = 0, j = 0; i < raw.length; i += step) sample[j++] = raw[i];
  sample.sort();
  return sample[Math.min(sample.length - 1, Math.floor((p / 100) * (sample.length - 1)))];
}

export function normalize(raw, min, hi) {
  const out = new Float32Array(raw.length);
  const span = hi - min;
  if (span <= 0) return out;
  for (let i = 0; i < raw.length; i++) {
    const v = (raw[i] - min) / span;
    out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return out;
}

export function pairStats(a, b) {
  const n = a.length;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, both = 0, either = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y;
    if (x > 0 || y > 0) { either++; if (x > 0 && y > 0) both++; }
  }
  const va = saa - (sa * sa) / n;
  const vb = sbb - (sb * sb) / n;
  const r = va > 0 && vb > 0 ? (sab - (sa * sb) / n) / Math.sqrt(va * vb) : NaN;
  return { r, overlap: either ? both / either : 0 };
}
