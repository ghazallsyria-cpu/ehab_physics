import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // Vite automatically exposes VITE_ prefixed env variables on `import.meta.env`.
    // We only need to define the custom API_KEY logic.
    define: {
      'import.meta.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_FIREBASE_API_KEY),
    },
    build: {
      outDir: 'build',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        external: ['@zoomus/websdk'],
      },
    },
    server: {
      port: 3000,
      open: true,
    }
  };
});
