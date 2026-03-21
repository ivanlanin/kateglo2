import { createContext, useContext } from 'react';

const SsrPrefetchContext = createContext(null);

function SsrPrefetchProvider({ value = null, children }) {
  return (
    <SsrPrefetchContext.Provider value={value}>
      {children}
    </SsrPrefetchContext.Provider>
  );
}

function useSsrPrefetch() {
  return useContext(SsrPrefetchContext);
}

export { SsrPrefetchProvider, useSsrPrefetch };