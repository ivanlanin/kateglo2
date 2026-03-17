import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function buatTimestampBuild() {
  const now = new Date();
  const date = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(/-/g, '');
  const time = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).slice(0, 5).replace(/:/g, '');
  return `${date}.${time}`;
}

const buildTimestamp = (() => {
  if (process.env.APP_TIMESTAMP) {
    return process.env.APP_TIMESTAMP;
  }
  return buatTimestampBuild();
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('react-markdown')
            || id.includes('remark-gfm')
            || id.includes('/remark-')
            || id.includes('/rehype-')
            || id.includes('/unified/')
            || id.includes('/micromark')
            || id.includes('/mdast')
            || id.includes('/hast')
            || id.includes('/vfile')
          ) {
            return 'markdown-vendor';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (
            id.includes('/react/')
            || id.includes('/react-dom/')
            || id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('react-router') || id.includes('@remix-run')) {
            return 'router-vendor';
          }

          if (id.includes('/axios/')) {
            return 'http-vendor';
          }

          if (id.includes('/dayjs/')) {
            return 'date-vendor';
          }

          if (id.includes('/lucide-react/')) {
            return 'icon-vendor';
          }

          return undefined;
        },
      },
    },
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
        '**/*.test.{js,jsx}'
      ],
      thresholds: {
        perFile: true,
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    }
  }
});
