import Icon from './Icons';
import Select from './Select';
import UploadButton from './UploadButton';

const STATUS = { checking: 'Connecting…', online: 'Backend online', offline: 'Backend offline' };

export default function Navbar({ tabs, active, onChange, status, info, maxMb, onUploaded, section, onSection }) {
  const sections = info?.sections;
  return (
    <header className="navbar">
      <div className="brand">
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#12d68c" /><stop offset="1" stopColor="#7b3ff2" />
            </linearGradient>
          </defs>
          <rect width="34" height="34" rx="10" fill="url(#g)" />
          <circle cx="12" cy="13" r="3.2" fill="#fff" /><circle cx="22" cy="13" r="3.2" fill="#fff" opacity=".7" />
          <circle cx="17" cy="22" r="3.2" fill="#fff" opacity=".45" />
        </svg>
        <span className="wordmark">OmniGene</span>
      </div>

      <nav className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={active === t.id}
            aria-label={t.label} title={t.label} className={active === t.id ? 'on' : ''}
            onClick={() => onChange(t.id)}>
            <Icon name={t.icon} size={20} />
            <span>{t.short}</span>
          </button>
        ))}
      </nav>

      <div className="actions">
        {sections && (
          <Select label="Section" value={section ?? ''} onChange={onSection}
            options={[{ value: '', label: 'All sections' }, ...sections.values.map((v) => ({ value: v, label: v }))]} />
        )}
        {info?.loaded && !info.is_spatial && (
          <span className="chip" title={info.note}>Not spatial · {info.label}</span>
        )}
        <UploadButton onUploaded={onUploaded} maxMb={maxMb} />
        <span className={`status ${status}`} title={STATUS[status]} aria-label={STATUS[status]} />
      </div>
    </header>
  );
}
