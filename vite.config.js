import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync, readdirSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
for (const manifest of ['release.json','gr3-release.json','gr3x-release.json','enhanced-release.json', 'gr3-enhanced-release.json', 'gr3x-enhanced-release.json']) {
  const release = JSON.parse(readFileSync(resolve('src', manifest), 'utf8'));
  if (!release.parts.every(part => existsSync(resolve('public/downloads', part.file)))) {
    throw new Error(`Missing download files for ${manifest}. Restore the release assets before building.`);
  }
}
const originals = JSON.parse(readFileSync(resolve('src/original-releases.json'), 'utf8'));
for (const release of originals) if (!release.parts.every(part => existsSync(resolve('public/downloads', part.file)))) throw new Error('Missing original firmware backup: '+release.camera);
const availability = JSON.parse(readFileSync(resolve('src/download-availability.json'), 'utf8'));
const withdrawnAssets = name => /^firmware-gr3x-v3(?:[.-])/.test(name);
const suspendedAssets = name => withdrawnAssets(name) || Object.entries(availability).some(([model, available]) => !available && (name.startsWith(`firmware-${model}-`) || name.startsWith(`stock-${model}-`)));
export default defineConfig({
  plugins: [vue(), {
    name: 'same-site-page-entries',
    closeBundle() {
      mkdirSync(resolve('dist/community'), { recursive: true });
      copyFileSync(resolve('dist/index.html'), resolve('dist/community/index.html'));
      mkdirSync(resolve('dist/community/studio'), { recursive: true });
      copyFileSync(resolve('dist/index.html'), resolve('dist/community/studio/index.html'));
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (/^\/studio\/(?:\?.*)?$/.test(request.url || '')) request.url = request.url.replace('/studio/', '/studio/index.html');
        next();
      });
    },
  }, {
    name: 'withdraw-suspended-firmware-downloads',
    closeBundle() {
      const directory = resolve('dist/downloads');
      for (const file of readdirSync(directory)) if (suspendedAssets(file)) rmSync(resolve(directory, file));
      if (readdirSync(directory).some(suspendedAssets)) throw new Error('Suspended firmware remained in public deployment');
    },
  }],
  base: '/',
});
