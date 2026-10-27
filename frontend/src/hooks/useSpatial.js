import { useEffect, useState } from 'react';
import { fetchSpatial } from '../api';

const cache = new Map();
const CACHE_LIMIT = 8;

// allowEmpty: fetch coordinates only when no genes are requested
export function useSpatial(genes, enabled = true, section = null, allowEmpty = false, layout = 'spatial') {
  const key = [...new Set(genes.filter(Boolean))].join(',');
  const cacheKey = `${layout}|${section || ''}|${key}`;
  const [state, setState] = useState({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!enabled || (!key && !allowEmpty)) return;
    if (cache.has(cacheKey)) {
      setState({ data: cache.get(cacheKey), loading: false, error: null });
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchSpatial(key ? key.split(',') : [], section, ctrl.signal, layout)
      .then((data) => {
        cache.set(cacheKey, data);
        if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
        setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: e.message }));
      });
    return () => ctrl.abort();
  }, [cacheKey, enabled, allowEmpty]);

  return state;
}

export const clearSpatialCache = () => cache.clear();
