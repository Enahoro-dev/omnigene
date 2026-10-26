import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icons';
import Legend from './Legend';
import { drawScene, getBounds } from '../lib/render';

// layers: [{ values (0..1 per cell), shades (BINS css colours) }]
export default function CanvasViewer({
  x, y, layers = [], blend = 'normal', threshold = 0, pointSize = 3, image = null,
  legend, loading = false, error = null, ctrlZoom = false, hint,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const view = useRef({ k: 1, tx: 0, ty: 0 });
  const drag = useRef(null);
  const ctrlZoomRef = useRef(ctrlZoom);
  ctrlZoomRef.current = ctrlZoom;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const redraw = () => setTick((t) => t + 1);

  const bounds = useMemo(() => getBounds(x, y), [x, y]);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => {
      // ctrlZoom: only Ctrl/Cmd+wheel zooms, so plain scroll moves the page
      if (ctrlZoomRef.current && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const v = view.current;
      const k = Math.min(40, Math.max(1, v.k * Math.exp(-e.deltaY * 0.0015)));
      v.tx = mx - ((mx - v.tx) * k) / v.k;
      v.ty = my - ((my - v.ty) * k) / v.k;
      v.k = k;
      redraw();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const { w, h } = size;
    if (!w || !h) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawScene(ctx, w, h, { x, y, bounds, layers, blend, threshold, pointSize, image, view: view.current });
  }, [size, bounds, layers, blend, threshold, pointSize, image, x, y, tick]);

  const onDown = (e) => {
    if (ctrlZoom && view.current.k === 1) return;
    canvasRef.current.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    view.current.tx += e.clientX - drag.current.x;
    view.current.ty += e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    redraw();
  };
  const reset = () => { view.current = { k: 1, tx: 0, ty: 0 }; redraw(); };

  return (
    <div className={`viewer${ctrlZoom ? ' scrolly' : ''}`} ref={wrapRef}
      title={ctrlZoom ? 'Ctrl/⌘ + scroll to zoom' : undefined}>
      <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)} onDoubleClick={reset} />
      <button type="button" className="viewer-reset" aria-label="Reset view" title="Reset view" onClick={reset}>
        <Icon name="fit" size={18} />
      </button>
      {legend && <Legend {...legend} />}
      {hint && !loading && !error && <div className="overlay hint">{hint}</div>}
      {loading && <div className="overlay"><span className="spinner" /></div>}
      {error && <div className="overlay error">{error}</div>}
    </div>
  );
}
