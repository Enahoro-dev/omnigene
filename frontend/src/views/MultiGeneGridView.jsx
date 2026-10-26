import { useMemo, useRef, useState } from 'react';
import CanvasViewer from '../components/CanvasViewer';
import ControlPanel from '../components/ControlPanel';
import Dropdown from '../components/Dropdown';
import ExportButton from '../components/ExportButton';
import GeneSearch from '../components/GeneSearch';
import Icon from '../components/Icons';
import Notice from '../components/Notice';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import { useNormalized } from '../hooks/useNormalized';
import { useSpatial } from '../hooks/useSpatial';
import { COLORMAP_OPTIONS, colormapShades, colormapStops } from '../lib/colormaps';
import { exportPanels } from '../lib/exportPng';
import { fmtPct, fmtPercent, fmtPx } from '../lib/format';

const MIN_SLOTS = 2;
const MAX_SLOTS = 10;

export default function MultiGeneGridView({ genes, active, section, image }) {
  const nextId = useRef(MIN_SLOTS);
  const [slots, setSlots] = useState([{ id: 0, gene: null }, { id: 1, gene: null }]);
  const [colormap, setColormap] = useState('omni');
  const [saturation, setSaturation] = useState(99);
  const [threshold, setThreshold] = useState(0);
  const [pointSize, setPointSize] = useState(2.5);
  const [showImage, setShowImage] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const picked = slots.map((s) => s.gene).filter(Boolean);
  const { data, loading, error } = useSpatial(picked, active, section);
  const norm = useNormalized(data, saturation);
  const shades = useMemo(() => colormapShades(colormap), [colormap]);
  const stops = colormapStops(colormap);

  const setGene = (id, gene) => setSlots((s) => s.map((x) => (x.id === id ? { ...x, gene } : x)));
  const add = () => setSlots((s) => (s.length < MAX_SLOTS ? [...s, { id: nextId.current++, gene: null }] : s));
  const remove = (id) => setSlots((s) => s.filter((x) => x.id !== id));

  const legendFor = (gene) => ({ title: `${gene} expression`, stops, min: norm[gene].min, max: norm[gene].max });

  const onExport = async () => {
    const chosen = slots.filter((s) => s.gene);
    if (chosen.length < 2) return setNotice('Select at least 2 genes to export.');
    if (chosen.some((s) => !norm[s.gene])) return setNotice('Data is still loading. Try again in a moment.');
    setBusy(true);
    try {
      await exportPanels({
        filename: 'omnigene-comparison.png',
        columns: 2,
        panels: chosen.map((s) => ({
          label: s.gene,
          legend: legendFor(s.gene),
          scene: {
            x: data.x, y: data.y, layers: [{ values: norm[s.gene].values, shades }],
            threshold, pointSize, image: showImage ? image : null,
          },
        })),
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
        <Dropdown label="Colormap" value={colormap} options={COLORMAP_OPTIONS} onChange={setColormap} />
        <Slider label="Saturation" format={fmtPercent} value={saturation} min={90} max={100} step={1} onChange={setSaturation} />
        <Slider label="Threshold" format={fmtPct} value={threshold} max={0.95} onChange={setThreshold} />
        <Slider label="Point size" format={fmtPx} value={pointSize} min={1} max={8} step={0.5} onChange={setPointSize} />
        {image && <Toggle label="Tissue image" checked={showImage} onChange={setShowImage} />}
        <ExportButton onClick={onExport} busy={busy} />
      </ControlPanel>

      <div className="grid2">
        {slots.map((slot, i) => {
          const n = slot.gene ? norm[slot.gene] : null;
          return (
            <div className="cell" key={slot.id}>
              <div className="cell-head">
                <GeneSearch label={`Gene ${i + 1}`} genes={genes} value={slot.gene} onChange={(g) => setGene(slot.id, g)} />
                {i >= MIN_SLOTS && (
                  <button type="button" className="icon-btn remove" aria-label="Remove gene" title="Remove gene"
                    onClick={() => remove(slot.id)}>
                    <Icon name="close" size={18} />
                  </button>
                )}
              </div>
              <CanvasViewer x={slot.gene ? data?.x : undefined} y={slot.gene ? data?.y : undefined}
                layers={n ? [{ values: n.values, shades }] : []} ctrlZoom threshold={threshold} pointSize={pointSize}
                image={showImage ? image : null} legend={n ? legendFor(slot.gene) : undefined}
                hint={slot.gene ? undefined : 'Search for a gene'} loading={loading} error={error} />
            </div>
          );
        })}
      </div>

      {slots.length < MAX_SLOTS && (
        <button type="button" className="add-tile" onClick={add}>
          <Icon name="plus" size={18} /> Add gene <span>{slots.length} of {MAX_SLOTS}</span>
        </button>
      )}
      <Notice message={notice} onClose={() => setNotice(null)} />
    </>
  );
}
