import { defineConfig } from 'vitest/config';
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
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './__tests__/_support/setup.js',
    testTimeout: 10000,
    include: [
      '__tests__/**/*.test.{js,jsx}',
      'src/**/*.test.{js,jsx}'
    ],
    exclude: [
      'node_modules/',
      '__tests__/_support/'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'node_modules/',
        '**/*.test.{js,jsx}',
        '**/main.jsx',
        'src/halaman/KebijakanPrivasi.jsx'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    }
  }
});
