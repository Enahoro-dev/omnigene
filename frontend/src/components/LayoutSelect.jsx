import Select from './Select';

const OPTIONS = [{ value: 'spatial', label: 'Tissue' }, { value: 'umap', label: 'UMAP' }];

export default function LayoutSelect({ layout, onChange }) {
  return <Select label="Layout" value={layout} options={OPTIONS} onChange={onChange} />;
}
