import { useEffect, useState } from 'react';
import { fetchGenes } from '../api';

export function useGenes(version = 0) {
  const [genes, setGenes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    setGenes([]);
    setLoaded(false);
    const load = () =>
      fetchGenes()
        .then((g) => alive && (setGenes(g), setLoaded(true), setError(null)))
        .catch((e) => {
          if (!alive) return;
          setError(e.message);
          setTimeout(load, 5000); // backend may be waking up; retry
        });
    load();
    return () => { alive = false; };
  }, [version]);
  return { genes, loaded, error };
}
