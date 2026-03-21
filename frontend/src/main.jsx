import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/authContext';
import { SsrPrefetchProvider } from './context/ssrPrefetchContext';
import './styles/index.css';

if (import.meta.env.DEV && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const rootElement = document.getElementById('root');
const ssrPrefetchedData = typeof window !== 'undefined'
  ? window.__KATEGLO_SSR_DATA__ ?? null
  : null;

const appElement = (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SsrPrefetchProvider value={ssrPrefetchedData}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SsrPrefetchProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

if (rootElement?.hasChildNodes()) {
  hydrateRoot(rootElement, appElement);
} else if (rootElement) {
  createRoot(rootElement).render(appElement);
}
