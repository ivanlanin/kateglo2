import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
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
        '**/main.jsx'
      ]
    }
  }
});
