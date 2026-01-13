
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
          manualChunks: {
            vendor: ['react', 'react-dom', 'lucide-react'],
            ai: ['@google/genai'],
manualChunks: {
  vendor: ['react', 'react-dom', 'lucide-react'],
  ai: ['@google/genai']
}
          }
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
