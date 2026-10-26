export default function Slider({ label, value, min = 0, max = 1, step = 0.01, format, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="field">
      <span className="field-head">
        <span className="field-label">{label}</span>
        <span className="field-value">{format ? format(value) : value}</span>
      </span>
      <span className="slider">
        <input
          type="range" min={min} max={max} step={step} value={value}
          aria-label={label} style={{ '--pct': `${pct}%` }}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    </label>
  );
}
