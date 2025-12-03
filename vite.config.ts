
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Inject Build Environment Variables directly into the client bundle
      'process.env': {
        DeepSeek_key: env.DeepSeek_key,
        GEMINI_API_KEY: env.GEMINI_API_KEY
      }
    }
  };
});
