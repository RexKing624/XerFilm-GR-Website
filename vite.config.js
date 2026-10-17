import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const release = JSON.parse(readFileSync(resolve('src/release.json'), 'utf8'));
if (!release.parts.every(part => existsSync(resolve('public/downloads', part.file)))) {
  throw new Error('Missing firmware download files. Restore the release assets before building.');
}
export default defineConfig({ plugins: [vue()], base: './' });
