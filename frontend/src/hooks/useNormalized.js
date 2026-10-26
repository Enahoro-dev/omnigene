import { useMemo } from 'react';
import { normalize, percentile } from '../lib/normalize';

/** saturation (90-100): expression at this percentile maps to the top of the colour scale */
export function useNormalized(data, saturation) {
  return useMemo(() => {
    const out = {};
    if (!data) return out;
    for (const [name, g] of Object.entries(data.genes)) {
      let hi = g.max;
      if (saturation < 100) {
        const p = percentile(g.raw, saturation);
        if (p > g.min) hi = p;
      }
      out[name] = { values: normalize(g.raw, g.min, hi), min: g.min, max: hi };
    }
    return out;
  }, [data, saturation]);
}
