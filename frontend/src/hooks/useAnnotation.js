import { useEffect, useState } from 'react';
import { fetchAnnotation } from '../api';

export function useAnnotation(name, section, enabled) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  useEffect(() => {
    if (!enabled || !name) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchAnnotation(name, section)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => { alive = false; };
  }, [name, section, enabled]);
  return state;
}
