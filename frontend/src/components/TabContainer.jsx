import { useEffect, useState } from 'react';
import SingleGeneView from '../views/SingleGeneView';
import MultiGeneGridView from '../views/MultiGeneGridView';
import RgbOverlayView from '../views/RgbOverlayView';

const VIEWS = { single: SingleGeneView, grid: MultiGeneGridView, rgb: RgbOverlayView };

// visited views stay mounted so their state survives tab switches
export default function TabContainer({ active, ...shared }) {
  const [visited, setVisited] = useState(() => new Set([active]));
  useEffect(() => setVisited((v) => (v.has(active) ? v : new Set(v).add(active))), [active]);

  return (
    <main className="stage">
      {Object.entries(VIEWS).map(([id, View]) =>
        visited.has(id) ? (
          <section key={id} className="view" hidden={id !== active}>
            <View active={id === active} {...shared} />
          </section>
        ) : null
      )}
    </main>
  );
}
