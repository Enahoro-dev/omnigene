import { useRef, useState } from 'react';
import Icon from './Icons';
import Notice from './Notice';
import { uploadDataset } from '../api';
import { fmtEta, fmtSpeed } from '../lib/format';
import { ACCEPT, validateFile } from '../lib/upload';

export default function UploadButton({ onUploaded, maxMb }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const busy = progress !== null;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateFile(file, maxMb);
    if (problem) { setError(problem); return; }
    setError(null);
    setProgress({ phase: 'uploading', fraction: 0 });
    try {
      onUploaded(await uploadDataset(file, setProgress));
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  const label = !busy ? 'Upload data'
    : progress.phase === 'compressing' ? 'Compressing…'
    : progress.phase === 'processing' ? 'Processing…'
    : `Uploading ${Math.round(progress.fraction * 100)}%`;
  const detail = progress?.phase === 'uploading' && progress.speed
    ? `${fmtSpeed(progress.speed)} · ${fmtEta(progress.eta)}` : null;

  return (
    <div className="upload">
      <input ref={input} type="file" accept={ACCEPT} hidden onChange={onFile} />
      <button type="button" className="upload-btn" disabled={busy}
        aria-label="Upload dataset" title="Upload data" onClick={() => input.current.click()}>
        {busy ? <span className="spinner small" /> : <Icon name="upload" size={18} />}
        {label}
      </button>
      {detail && <span className="upload-detail">{detail}</span>}
      <Notice message={error} onClose={() => setError(null)} />
    </div>
  );
}
