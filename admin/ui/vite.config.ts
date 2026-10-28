import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Tanpa data: URI untuk font/gambar: CSP font-src hanya 'self'.
    assetsInlineLimit: 0,
    sourcemap: false,
    target: 'es2022',
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8788', changeOrigin: false } },
  },
});
