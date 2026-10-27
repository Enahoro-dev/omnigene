export function decodeSpatial(buf) {
  const metaLen = new DataView(buf).getUint32(0, true);
  const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, metaLen)));
  let offset = 4 + metaLen;
  const take = () => {
    const arr = new Float32Array(buf, offset, meta.n);
    offset += meta.n * 4;
    return arr;
  };
  const x = take();
  const y = take();
  const genes = {};
  for (const g of meta.genes) genes[g.name] = { raw: take(), min: g.min, max: g.max };
  return { n: meta.n, x, y, genes, source: meta.coords_source };
}
