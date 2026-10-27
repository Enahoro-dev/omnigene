import { useEffect, useState } from 'react';
import { fetchImage } from '../api';

export function useTissueImage(info, version) {
  const [image, setImage] = useState(null);
  const meta = info?.image;
  useEffect(() => {
    setImage(null);
    if (!meta) return;
    let alive = true;
    fetchImage()
      .then((bitmap) => alive && setImage({ bitmap, scale: meta.scale }))
      .catch(() => {});
    return () => { alive = false; };
  }, [meta?.width, meta?.height, meta?.scale, version]);
  return image;
}
