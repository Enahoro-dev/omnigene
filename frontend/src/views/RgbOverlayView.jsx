import { useMemo, useState } from 'react';
import CanvasViewer from '../components/CanvasViewer';
import Coexpression from '../components/Coexpression';
import ControlPanel from '../components/ControlPanel';
import ExportButton from '../components/ExportButton';
import GeneSearch from '../components/GeneSearch';
import Notice from '../components/Notice';
import Slider from '../components/Slider';
import Toggle from '../components/Toggle';
import { useNormalized } from '../hooks/useNormalized';
import { useSpatial } from '../hooks/useSpatial';
import { channelShades } from '../lib/colormaps';
import { exportPanels } from '../lib/exportPng';
import { fmtPct, fmtPercent, fmtPx } from '../lib/format';
import { pairStats } from '../lib/normalize';

const CHANNELS = [
  { id: 'r', name: 'Red', color: [255, 59, 92] },
  { id: 'g', name: 'Green', color: [25, 230, 140] },
  { id: 'b', name: 'Blue', color: [61, 123, 255] },
  { id: 'y', name: 'Yellow', color: [255, 200, 40] },
];
const css = ([r, g, b]) => `rgb(${r},${g},${b})`;
const SHADES = CHANNELS.map((c) => channelShades(c.color));

export default function RgbOverlayView({ genes, active, section, image }) {
  const [picks, setPicks] = useState([null, null, null, null]);
  const [saturation, setSaturation] = useState(99);
  const [threshold, setThreshold] = useState(0);
  const [pointSize, setPointSize] = useState(3);
  const [showImage, setShowImage] = useState(true);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const hasGene = picks.some(Boolean);
  const { data, loading, error } = useSpatial(picks, active, section);
  const norm = useNormalized(data, saturation);

  const layers = useMemo(
    () => picks.map((g, i) => ({ values: g ? norm[g]?.values : undefined, shades: SHADES[i] })),
    [norm, picks]
  );

  const stats = useMemo(() => {
    const out = [];
    if (!data) return out;
    for (let i = 0; i < picks.length; i++) {
      for (let j = i + 1; j < picks.length; j++) {
        const a = picks[i] && data.genes[picks[i]];
        const b = picks[j] && data.genes[picks[j]];
        if (a && b) {
          out.push({
            key: `${i}-${j}`, genes: [picks[i], picks[j]],
            colors: [css(CHANNELS[i].color), css(CHANNELS[j].color)], ...pairStats(a.raw, b.raw),
          });
        }
      }
    }
    return out;
  }, [data, picks]);

  const setPick = (i, g) =>
    setPicks((p) => (g && p.some((v, j) => j !== i && v === g) ? p : p.map((v, j) => (j === i ? g : v))));

  const legend = { channels: CHANNELS.map((c, i) => ({ color: css(c.color), name: picks[i] })) };

  const onExport = async () => {
    const chosen = picks.map((g, i) => ({ g, i })).filter((c) => c.g);
    if (chosen.length < 2) return setNotice('Select at least 2 genes to export an overlay.');
    if (!data || chosen.some((c) => !norm[c.g])) return setNotice('Data is still loading. Try again in a moment.');
    setBusy(true);
    try {
      await exportPanels({
        filename: 'omnigene-overlay.png',
        panels: [{
          legend,
          scene: { x: data.x, y: data.y, layers, blend: 'add', threshold, pointSize, image: showImage ? image : null },
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
        {CHANNELS.map((c, i) => (
          <GeneSearch key={c.id} label={`${c.name} channel`} genes={genes} value={picks[i]}
            accent={css(c.color)} allowClear
            disabledGenes={picks.filter((p, j) => p && j !== i)} onChange={(g) => setPick(i, g)} />
        ))}
        <Slider label="Saturation" format={fmtPercent} value={saturation} min={90} max={100} step={1} onChange={setSaturation} />
        <Slider label="Threshold" format={fmtPct} value={threshold} max={0.95} onChange={setThreshold} />
        <Slider label="Point size" format={fmtPx} value={pointSize} min={1} max={10} step={0.5} onChange={setPointSize} />
        {image && <Toggle label="Tissue image" checked={showImage} onChange={setShowImage} />}
        <ExportButton onClick={onExport} busy={busy} />
      </ControlPanel>
      <CanvasViewer x={hasGene ? data?.x : undefined} y={hasGene ? data?.y : undefined} layers={layers}
        blend="add" threshold={threshold} pointSize={pointSize} image={showImage ? image : null} legend={legend}
        hint={hasGene ? undefined : 'Pick a gene for any channel'} loading={loading} error={error} />
      <Coexpression items={stats} />
      <Notice message={notice} onClose={() => setNotice(null)} />
    </>
  );
}
