import { decodeSpatial } from './lib/decode';
import { sessionId } from './lib/session';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:7860').replace(/\/$/, '');

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'X-Session-ID': sessionId(), ...options.headers },
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error("Couldn't reach the server. Check that the backend is running.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res;
}

const json = (path, options) => request(path, options).then((r) => r.json());

export const fetchHealth = () => json('/');
export const fetchGenes = () => json('/api/genes').then((d) => d.genes);
export const fetchDatasetInfo = () => json('/api/dataset-info');

export async function fetchSpatial(genes, section, signal) {
  const q = new URLSearchParams({ genes: genes.join(',') });
  if (section) q.set('section', section);
  const buf = await request(`/api/spatial/batch?${q}`, { signal }).then((r) => r.arrayBuffer());
  return decodeSpatial(buf);
}

export function fetchAnnotation(name, section) {
  const q = new URLSearchParams({ name });
  if (section) q.set('section', section);
  return json(`/api/annotation?${q}`);
}

export const fetchImage = () => request('/api/image').then((r) => r.blob()).then((b) => createImageBitmap(b));

async function putChunk(id, offset, blob) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request(`/api/upload/${id}/chunk?offset=${offset}`, { method: 'PUT', body: blob });
    } catch (e) {
      if (attempt >= 2) throw e;
    }
  }
}

const PARALLEL = 4;

async function compressIfTable(file, onProgress) {
  if (!/\.(csv|tsv|txt)$/i.test(file.name) || typeof CompressionStream === 'undefined') {
    return { blob: file, name: file.name };
  }
  onProgress({ phase: 'compressing' });
  const stream = file.stream().pipeThrough(new CompressionStream('gzip'));
  return { blob: await new Response(stream).blob(), name: `${file.name}.gz` };
}

export async function uploadDataset(file, onProgress = () => {}) {
  const { blob, name } = await compressIfTable(file, onProgress);
  const start = await json('/api/upload/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: name, size: blob.size }),
  });

  const total = blob.size;
  const offsets = [];
  for (let o = 0; o < total; o += start.chunk_bytes) offsets.push(o);
  let next = 0;
  let sent = 0;
  let failure = null;
  const t0 = performance.now();
  onProgress({ phase: 'uploading', fraction: 0 });

  const worker = async () => {
    while (!failure && next < offsets.length) {
      const offset = offsets[next++];
      const piece = blob.slice(offset, offset + start.chunk_bytes);
      try {
        await putChunk(start.upload_id, offset, piece);
      } catch (e) {
        failure = failure || e;
        return;
      }
      sent += piece.size;
      const speed = sent / ((performance.now() - t0) / 1000);
      onProgress({ phase: 'uploading', fraction: sent / total, speed, eta: (total - sent) / speed });
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, offsets.length) }, worker));
  if (failure) throw failure;

  onProgress({ phase: 'processing' });
  return json(`/api/upload/${start.upload_id}/finish`, { method: 'POST' });
}
