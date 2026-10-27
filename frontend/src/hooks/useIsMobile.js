import { useEffect, useState } from 'react';

// phones and small tablets: narrow screens, or touch screens up to tablet width
const MOBILE_QUERY = '(max-width: 820px), (pointer: coarse) and (max-width: 1024px)';

export function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}
