
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in the browser after build safely
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fix for some libraries expecting global process
      'process.env': {}
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
            utils: ['katex', 'qrcode.react']
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
