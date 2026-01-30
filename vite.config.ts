import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables from .env files regardless of the `VITE_` prefix.
  // FIX: Cast `process` to `any` to resolve TypeScript error when `process.cwd` is not found on the default `Process` type.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    // Define `process.env` to make all loaded env vars available in the client-side code.
    // This ensures compatibility with services that expect `process.env`.
    define: {
      'process.env': Object.entries(env).reduce((prev, [key, val]) => {
        return {
          ...prev,
          [key]: JSON.stringify(val),
        }
      }, {}),
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
