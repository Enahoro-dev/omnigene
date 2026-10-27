import { useState } from 'react';

// 'spatial' (tissue) or 'umap'; falls back to tissue when the dataset has no UMAP
export function useLayout(info) {
  const [choice, setLayout] = useState('spatial');
  const hasUmap = Boolean(info?.has_umap);
  const layout = hasUmap ? choice : 'spatial';
  return { layout, isUmap: layout === 'umap', hasUmap, setLayout };
}
