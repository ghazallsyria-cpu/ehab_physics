import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    define: {
      // This maps all VITE_ prefixed env variables from the build environment's process.env
      // for compatibility with code that expects process.env. This is more robust than loadEnv for Vercel.
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
      
      // Map Supabase Config
      'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      
      // Map Gemini API Key. Fallback to Firebase API key if not set separately.
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_FIREBASE_API_KEY),
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
