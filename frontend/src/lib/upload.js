export const DEFAULT_MAX_MB = 200;
export const FORMATS_LABEL = '.h5ad, .loom, .csv, .tsv, .txt (optionally .gz) or .parquet';
export const ACCEPT = '.h5ad,.loom,.csv,.tsv,.txt,.parquet,.gz';

const TABLES = ['.csv', '.tsv', '.txt'];
const BINARY = ['.h5ad', '.loom', '.parquet'];

export const limitLabel = (mb) => (mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`);

const fmtSize = (n) => (n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : `${Math.round(n / 1024 ** 2)} MB`);

export function validateFile(file, maxMb = DEFAULT_MAX_MB) {
  const name = file.name.toLowerCase();
  const gz = name.endsWith('.gz');
  const base = gz ? name.slice(0, -3) : name;
  const dot = base.lastIndexOf('.');
  const ext = dot >= 0 ? base.slice(dot) : '';
  if (!(TABLES.includes(ext) || (!gz && BINARY.includes(ext)))) return `Unsupported file type. Use ${FORMATS_LABEL}.`;
  if (file.size > maxMb * 1024 * 1024) return `This file is ${fmtSize(file.size)}. The upload limit is ${limitLabel(maxMb)}.`;
  return null;
}
