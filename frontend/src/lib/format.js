export const fmtPct = (v) => `${Math.round(v * 100)}%`;
export const fmtPx = (v) => `${v} px`;
export const fmtNum = (v) =>
  Math.abs(v) >= 100 ? String(Math.round(v)) : String(Number(Number(v).toPrecision(2)));
export const fmtPercent = (v) => `${v}%`;
export const fmtSpeed = (bytesPerSec) =>
  bytesPerSec >= 1048576 ? `${(bytesPerSec / 1048576).toFixed(1)} MB/s` : `${Math.round(bytesPerSec / 1024)} KB/s`;
export const fmtEta = (sec) =>
  sec < 5 ? 'almost done' : sec < 60 ? `${Math.ceil(sec)} s left` : `${Math.ceil(sec / 60)} min left`;
