export default function Coexpression({ items }) {
  if (!items.length) return null;
  return (
    <div className="coex">
      {items.map((s) => (
        <div className="coex-card" key={s.key}
          title="r: Pearson correlation across cells. Co-expressed: cells expressing both genes divided by cells expressing either.">
          <span className="coex-pair">
            <i style={{ background: s.colors[0] }} /><i style={{ background: s.colors[1] }} />
            {s.genes[0]} × {s.genes[1]}
          </span>
          <span className="coex-stat">r = {Number.isNaN(s.r) ? '—' : s.r.toFixed(2)}</span>
          <span className="coex-stat">{Math.round(s.overlap * 100)}% co-expressed</span>
        </div>
      ))}
    </div>
  );
}
