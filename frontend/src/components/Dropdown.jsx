import { useEffect, useRef, useState } from 'react';
import Icon from './Icons';

export default function Dropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  return (
    <div className="field dropdown" ref={ref}>
      <span className="field-label">{label}</span>
      <button type="button" className="dropdown-btn" aria-label={label} title={label}
        aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="swatch" style={{ background: current?.swatch }} />
        <Icon name="chevron" size={16} />
      </button>
      {open && (
        <ul className="menu" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button type="button" role="option" aria-selected={o.value === value} title={o.label}
                className={o.value === value ? 'on' : ''}
                onClick={() => { onChange(o.value); setOpen(false); }}>
                <span className="swatch wide" style={{ background: o.swatch }} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
