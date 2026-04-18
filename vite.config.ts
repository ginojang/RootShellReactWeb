import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env 값 로드
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // Netlify나 자체서버에선 이거 유지
    plugins: [
      react(),
      createHtmlPlugin({
        inject: {
          data: {
            VITE_APP_VERSION: env.VITE_APP_VERSION || '0.0.0'
          }
        }
      })
    ],
    server: {
      port: 3000,
      watch: {
        usePolling: true,
        interval: 100
      }
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      }
    }
  };
});
