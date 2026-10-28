import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL || 'https://promind.co.id',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  // Never inline bundled scripts: Astro would otherwise put small <script> bodies in the HTML, which our CSP forbids.
  // (Other small assets keep Vite's default inlining.)
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: (file) => (/\.(js|ts)$/.test(file) ? false : undefined) } },
});
