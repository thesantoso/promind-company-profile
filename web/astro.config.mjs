import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.SITE_URL || 'https://promind.co.id',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  // assetsInlineLimit 0: Astro would otherwise inline small bundled <script> tags, which our CSP forbids.
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
