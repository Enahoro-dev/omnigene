export default function Toggle({ label, checked, onChange }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label}
        className={`switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)}>
        <i />
      </button>
    </div>
  );
}
