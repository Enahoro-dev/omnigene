import { useEffect, useState } from 'react';
import { fetchDatasetInfo } from '../api';

export function useDatasetInfo(version = 0) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let alive = true;
    setInfo(null);
    fetchDatasetInfo().then((d) => alive && setInfo(d)).catch(() => {});
    return () => { alive = false; };
  }, [version]);
  return info;
}
