import { useMemo, useState } from 'react';
import CanvasViewer from '../components/CanvasViewer';
import ControlPanel from '../components/ControlPanel';
import Dropdown from '../components/Dropdown';
import ExportButton from '../components/ExportButton';
import GeneSearch from '../components/GeneSearch';
import Notice from '../components/Notice';
import LayoutSelect from '../components/LayoutSelect';
import Select from '../components/Select';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import { useAnnotation } from '../hooks/useAnnotation';
import { useLayout } from '../hooks/useLayout';
import { useNormalized } from '../hooks/useNormalized';
import { useSpatial } from '../hooks/useSpatial';
import { BINS, COLORMAP_OPTIONS, colormapShades, colormapStops } from '../lib/colormaps';
import { exportPanels } from '../lib/exportPng';
import { fmtPct, fmtPercent, fmtPx } from '../lib/format';
import { PALETTE } from '../lib/palette';

export default function SingleGeneView({ genes, active, info, section, image }) {
  const [colorBy, setColorBy] = useState('gene');
  const [gene, setGene] = useState(null);
  const [colormap, setColormap] = useState('omni');
  const [saturation, setSaturation] = useState(99);
  const [threshold, setThreshold] = useState(0);
  const [pointSize, setPointSize] = useState(3);
  const [showImage, setShowImage] = useState(true);
  const [hidden, setHidden] = useState(() => new Set());
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const byGene = colorBy === 'gene';
  const { layout, isUmap, hasUmap, setLayout } = useLayout(info);
  const spatial = useSpatial(byGene && gene ? [gene] : [], active, section, !byGene, layout);
  const annotation = useAnnotation(colorBy, section, active && !byGene);
  const norm = useNormalized(spatial.data, saturation);
  const shades = useMemo(() => colormapShades(colormap), [colormap]);

  const g = byGene && gene ? norm[gene] : null;
  const ann = byGene ? null : annotation.data;
  const data = byGene && !gene ? null : spatial.data;
  const effThreshold = byGene ? threshold : 0;

  const layers = useMemo(() => {
    if (g) return [{ values: g.values, shades }];
    if (ann) {
      const values = new Float32Array(ann.codes.length);
      for (let i = 0; i < values.length; i++) {
        const c = ann.codes[i];
        values[i] = c < 0 || hidden.has(c) ? -1 : (c + 0.5) / BINS;
      }
      return [{ values, shades: PALETTE }];
    }
    return [];
  }, [g, ann, hidden, shades]);

  const toggleCategory = (i) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const legend = g
    ? { title: `${gene} expression`, stops: colormapStops(colormap), min: g.min, max: g.max }
    : ann
      ? {
          title: colorBy,
          categories: ann.categories.map((name, i) => ({ name, color: PALETTE[i], hidden: hidden.has(i) })),
          onToggle: toggleCategory,
        }
      : undefined;

  const annotations = (info?.annotations ?? []).filter((n) => !/ontology/i.test(n));
  const colorOptions = [{ value: 'gene', label: 'Gene expression' }, ...annotations.map((n) => ({ value: n, label: n }))];

  const onExport = async () => {
    if (!data || !layers.length) return setNotice(byGene ? 'Pick a gene first.' : 'Nothing to export yet.');
    setBusy(true);
    try {
      await exportPanels({
        filename: `omnigene-${byGene ? gene : colorBy}${isUmap ? '-umap' : ''}.png`,
        panels: [{
          label: byGene ? gene : colorBy,
          legend,
          scene: { x: data.x, y: data.y, layers, threshold: effThreshold, pointSize, image: showImage && !isUmap ? image : null },
        }],
      });
    } catch (e) {
      setNotice(`Export failed: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ControlPanel>
        {hasUmap && <LayoutSelect layout={layout} onChange={setLayout} />}
        {annotations.length > 0 && (
          <Select label="Color by" value={colorBy} options={colorOptions}
            onChange={(v) => { setColorBy(v); setHidden(new Set()); }} />
        )}
        {byGene && (
          <>
            <GeneSearch label="Gene" genes={genes} value={gene} onChange={setGene} />
            <Dropdown label="Colormap" value={colormap} options={COLORMAP_OPTIONS} onChange={setColormap} />
            <Slider label="Saturation" format={fmtPercent} value={saturation} min={90} max={100} step={1} onChange={setSaturation} />
            <Slider label="Threshold" format={fmtPct} value={threshold} max={0.95} onChange={setThreshold} />
          </>
        )}
        <Slider label="Point size" format={fmtPx} value={pointSize} min={1} max={10} step={0.5} onChange={setPointSize} />
        {image && !isUmap && <Toggle label="Tissue image" checked={showImage} onChange={setShowImage} />}
        <ExportButton onClick={onExport} busy={busy} />
      </ControlPanel>
      <CanvasViewer key={layout} x={data?.x} y={data?.y} layers={layers} threshold={effThreshold} pointSize={pointSize}
        image={showImage && !isUmap ? image : null} legend={legend}
        hint={byGene && !gene ? 'Search for a gene to begin' : undefined}
        loading={spatial.loading || annotation.loading} error={spatial.error || annotation.error} />
      <Notice message={notice} onClose={() => setNotice(null)} />
    </>
  );
}
