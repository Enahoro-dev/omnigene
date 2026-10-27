import { useState } from 'react';
import EmptyState from './components/EmptyState';
import Navbar from './components/Navbar';
import TabContainer from './components/TabContainer';
import { useDatasetInfo } from './hooks/useDatasetInfo';
import { useGenes } from './hooks/useGenes';
import { useHealth } from './hooks/useHealth';
import { clearSpatialCache } from './hooks/useSpatial';
import { useTissueImage } from './hooks/useTissueImage';
import { DEFAULT_MAX_MB } from './lib/upload';
import { TABS } from './tabs';

export default function App() {
  const [active, setActive] = useState(TABS[0].id);
  const [version, setVersion] = useState(0);
  const [sectionChoice, setSectionChoice] = useState(undefined);
  const { genes, loaded } = useGenes(version);
  const info = useDatasetInfo(version);
  const status = useHealth();
  const image = useTissueImage(info, version);

  const section = sectionChoice === undefined ? info?.sections?.values?.[0] ?? null : sectionChoice || null;
  const maxMb = info?.max_upload_mb ?? DEFAULT_MAX_MB;
  const onUploaded = () => {
    clearSpatialCache();
    setSectionChoice(undefined);
    setVersion((v) => v + 1);
  };

  return (
    <>
      <Navbar tabs={TABS} active={active} onChange={setActive} status={status} info={info} maxMb={maxMb}
        onUploaded={onUploaded} section={section} onSection={setSectionChoice} />
      {loaded && genes.length === 0
        ? <EmptyState onUploaded={onUploaded} maxMb={maxMb} />
        : <TabContainer key={version} active={active} genes={genes} info={info} section={section} image={image} />}
    </>
  );
}
