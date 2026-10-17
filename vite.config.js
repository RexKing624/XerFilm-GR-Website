import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const release = JSON.parse(readFileSync(resolve('src/release.json'), 'utf8'));
const packagedRelease = process.env.VITE_RELEASE_MODE !== 'external' && release.parts.every(part => existsSync(resolve('public/downloads', part.file)));
export default defineConfig({ plugins: [vue()], base: './', define: { __PACKAGED_RELEASE__: JSON.stringify(packagedRelease) } });
