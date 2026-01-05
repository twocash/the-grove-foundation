import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // API Key Configuration
  // =====================
  // CHAT: No longer needs client-side API key - uses server-side /api/chat
  // TTS (Admin): Still requires client-side key for audioService.ts
  //
  // The key is ONLY needed for:
  // - Admin TTS audio generation (audioService.ts)
  // - Legacy generateArtifact (geminiService.ts - deprecated)
  //
  // TODO: Move TTS to server-side to eliminate client-side key exposure entirely
  const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      },
      watch: {
        // Exclude telemetry logs and data files that update during runtime
        ignored: ['**/data/**', '**/concept-stream.jsonl']
      }
    },
    plugins: [react()],
    define: {
      // Expose API key for admin TTS feature only
      // Main chat functionality uses server-side API via /api/chat
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
      // Legacy - kept for backwards compatibility during migration
      'process.env.API_KEY': JSON.stringify(geminiApiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@core': path.resolve(__dirname, './src/core'),
        '@surface': path.resolve(__dirname, './src/surface'),
        '@foundation': path.resolve(__dirname, './src/foundation'),
        '@explore': path.resolve(__dirname, './src/explore'),
        '@widget': path.resolve(__dirname, './src/widget'),
        '@garden': path.resolve(__dirname, './src/garden'),
        '@data': path.resolve(__dirname, './src/data'),
        '@bedrock': path.resolve(__dirname, './src/bedrock'),
      }
    }
  };
});
