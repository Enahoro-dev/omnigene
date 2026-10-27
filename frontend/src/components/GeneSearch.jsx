import { useMemo, useState } from 'react';
import Icon from './Icons';

const MAX_RESULTS = 8;

export default function GeneSearch({ genes, value, onChange, label = 'Gene', accent, allowClear = false, disabledGenes = [] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const query = q.trim();
  const takenKey = disabledGenes.join('|');

  const matches = useMemo(() => {
    if (!query) return [];
    const s = query.toLowerCase();
    const taken = new Set(takenKey.split('|'));
    const starts = [];
    const contains = [];
    for (const g of genes) {
      if (taken.has(g)) continue;
      const l = g.toLowerCase();
      if (l.startsWith(s)) starts.push(g);
      else if (l.includes(s)) contains.push(g);
      if (starts.length >= MAX_RESULTS) break;
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS);
  }, [genes, query, takenKey]);
  const takenHit = query && matches.length === 0 && disabledGenes.some((g) => g.toLowerCase().includes(query.toLowerCase()));

  const pick = (g) => { onChange(g); setOpen(false); setQ(''); };

  return (
    <div className="field gene-field">
      <span className="field-label">{label}</span>
      <div className="gene">
        {accent ? <span className="dot" style={{ background: accent }} /> : <Icon name="search" size={18} />}
        <input
          aria-label={label} placeholder="Type a gene" spellCheck={false} autoComplete="off"
          value={open ? q : value || ''}
          onFocus={(e) => { setOpen(true); setQ(''); e.target.select(); }}
          onBlur={() => setOpen(false)}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches[0]) pick(matches[0]);
            if (e.key === 'Escape') e.target.blur();
          }}
        />
        {allowClear && value && (
          <button type="button" className="icon-btn" aria-label="Clear gene" onClick={() => onChange(null)}>
            <Icon name="close" size={16} />
          </button>
        )}
        {open && query && (
          <ul className="menu" role="listbox">
            {matches.length === 0 && <li className="empty">{takenHit ? 'Already used in another channel' : 'Gene not found'}</li>}
            {matches.map((g) => (
              <li key={g}>
                <button type="button" role="option" aria-selected={g === value}
                  className={g === value ? 'on' : ''}
                  onMouseDown={(e) => { e.preventDefault(); pick(g); }}>
                  {g}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
