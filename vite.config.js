import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
for (const manifest of ['release.json','gr3-release.json','gr3x-release.json','enhanced-release.json']) {
  const release = JSON.parse(readFileSync(resolve('src', manifest), 'utf8'));
  if (!release.parts.every(part => existsSync(resolve('public/downloads', part.file)))) {
    throw new Error(`Missing download files for ${manifest}. Restore the release assets before building.`);
  }
}
export default defineConfig({ plugins: [vue()], base: './' });
