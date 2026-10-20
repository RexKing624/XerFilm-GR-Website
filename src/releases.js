import gr4 from './release.json';
import gr3 from './gr3-release.json';
import gr3x from './gr3x-release.json';

export const cameras = [
  { id: 'gr4', label: 'GR IV / HDF', release: gr4 },
  { id: 'gr3', label: 'GR III / HDF', release: gr3 },
  { id: 'gr3x', label: 'GR IIIx / HDF', release: gr3x },
];
export const fileSize = release => `${(release.size / 1048576).toFixed(1)} MiB`;
