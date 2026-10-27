import Icon from './Icons';
import UploadButton from './UploadButton';
import { limitLabel } from '../lib/upload';

export default function EmptyState({ onUploaded, maxMb }) {
  return (
    <main className="stage">
      <div className="empty-state">
        <span className="empty-icon"><Icon name="upload" size={28} /></span>
        <h2>No dataset loaded</h2>
        <p>Upload a spatial dataset (.h5ad, .loom, .csv, .tsv or .parquet, up to {limitLabel(maxMb)}) to start exploring.</p>
        <UploadButton onUploaded={onUploaded} maxMb={maxMb} />
      </div>
    </main>
  );
}
