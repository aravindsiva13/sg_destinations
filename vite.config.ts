/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Framework core: cached on its own, unaffected by app deploys.
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router'))
            return 'vendor-react';
          // Animation + UI libraries.
          if (id.includes('node_modules/framer-motion')) return 'vendor-ui';
          // Charts are only used by the admin reports page.
          if (id.includes('node_modules/recharts')) return 'vendor-charts';
        },
      },
    },
  },
  server: {
    // Honor a PORT assigned by the environment (e.g. the preview launcher),
    // otherwise use Vite's default 5173.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // In dev, forward API calls to the backend so the app can use same-origin
    // relative URLs (matches how it's served in production behind the edge).
    proxy: {
      '/api': 'http://127.0.0.1:4000',
      '/health': 'http://127.0.0.1:4000',
    },
  },
  preview: {
    port: 4173,
    // Allow access through tunnels (e.g. trycloudflare.com) which forward
    // an external Host header that Vite would otherwise reject with 403.
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
