
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Vital: Only replace specific keys. Do NOT map 'process.env': {} as it breaks React's NODE_ENV check.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          // The previous manualChunks config was incorrect and caused build failures.
          // Removing it allows Vite to use its default, smart chunking strategy.
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      // Ensure SPA routing works in local preview
    }
  };
});