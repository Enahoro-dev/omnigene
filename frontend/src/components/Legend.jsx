import { fmtNum } from '../lib/format';

// gradient: { title, stops, min, max }   channels: { channels: [{ color, name }] }
// categories: { title, categories: [{ name, color, hidden }], onToggle }
export default function Legend({ title = 'Expression', stops, min, max, channels, categories, onToggle }) {
  if (channels) {
    const named = channels.filter((c) => c.name);
    if (!named.length) return null;
    return (
      <div className="legend">
        {named.map((c) => (
          <span key={c.color} className="legend-chip"><i style={{ background: c.color }} />{c.name}</span>
        ))}
      </div>
    );
  }
  if (categories) {
    return (
      <div className="legend legend-cats">
        <span className="legend-title">{title}</span>
        <div className="legend-list">
          {categories.map((c, i) => (
            <button key={`${c.name}-${i}`} type="button" title="Show / hide"
              className={`legend-chip${c.hidden ? ' off' : ''}`} onClick={() => onToggle?.(i)}>
              <i style={{ background: c.color }} />{c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="legend">
      <span className="legend-title">{title}</span>
      <span className="legend-bar" style={{ background: `linear-gradient(90deg, ${stops.join(', ')})` }} />
      <span className="legend-scale">
        <span>{min != null ? fmtNum(min) : 'Low'}</span>
        <span>{max != null ? fmtNum(max) : 'High'}</span>
      </span>
    </div>
  );
}
