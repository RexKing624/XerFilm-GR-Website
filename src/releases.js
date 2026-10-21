import gr4 from './release.json';
import gr3 from './gr3-release.json';
import gr3x from './gr3x-release.json';
import gr4Enhanced from './enhanced-release.json';
import gr3Enhanced from './gr3-enhanced-release.json';
import gr3xEnhanced from './gr3x-enhanced-release.json';

export const cameras = [
  { id: 'gr4', label: 'GR IV / HDF', release: gr4 },
  { id: 'gr3', label: 'GR III / HDF', release: gr3 },
  { id: 'gr3x', label: 'GR IIIx / HDF', release: gr3x },
];
export const enhancedReleases = { gr4: gr4Enhanced, gr3: gr3Enhanced, gr3x: gr3xEnhanced };
export const fileSize = release => `${(release.size / 1048576).toFixed(1)} MiB`;
