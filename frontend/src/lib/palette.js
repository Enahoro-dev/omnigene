import { BINS } from './colormaps';

export const PALETTE = Array.from(
  { length: BINS },
  (_, i) => `hsl(${Math.round((i * 137.508) % 360)}, 68%, ${54 + (i % 3) * 7}%)`
);
