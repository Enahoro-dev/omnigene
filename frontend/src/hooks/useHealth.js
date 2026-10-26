import { useEffect, useState } from 'react';
import { fetchHealth } from '../api';

export function useHealth() {
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    let alive = true;
    const ping = () =>
      fetchHealth()
        .then(() => alive && setStatus('online'))
        .catch(() => alive && setStatus('offline'));
    ping();
    const id = setInterval(ping, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return status;
}
