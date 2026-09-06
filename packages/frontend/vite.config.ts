// packages/frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // ✅ Ensure workers are properly handled
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['monaco-editor'],
    exclude: ['@monaco-editor/react'],
  },
  // ✅ Build configuration
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ Separate Monaco into its own chunk
          'monaco-editor': ['monaco-editor', '@monaco-editor/react'],
        },
      },
    },
  },
});