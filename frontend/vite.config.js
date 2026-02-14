import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildTimestamp = (() => {
  const now = new Date();
  const date = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(/-/g, '');
  const time = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).slice(0, 5).replace(/:/g, '');
  return `${date}.${time}`;
})();

export default defineConfig({
  define: {
    __APP_TIMESTAMP__: JSON.stringify(buildTimestamp),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});
