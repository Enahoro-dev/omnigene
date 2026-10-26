import Icon from './Icons';

export default function ExportButton({ onClick, busy = false }) {
  return (
    <button type="button" className="export-btn" onClick={onClick} disabled={busy}>
      <Icon name="download" size={18} />
      {busy ? 'Exporting…' : 'Export PNG'}
    </button>
  );
}
