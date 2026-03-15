import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const render = vi.fn();
  const createRoot = vi.fn(() => ({ render }));
  const hydrateRoot = vi.fn();
  const getRegistrations = vi.fn();
  const unregister = vi.fn();

  return {
    render,
    createRoot,
    hydrateRoot,
    getRegistrations,
    unregister,
  };
});

vi.mock('react-dom/client', () => ({
  createRoot: mocks.createRoot,
  hydrateRoot: mocks.hydrateRoot,
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <>{children}</>,
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../src/context/authContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../src/App', () => ({
  default: () => <div>App Root</div>,
}));

describe('main.jsx', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.render.mockClear();
    mocks.createRoot.mockClear();
    mocks.hydrateRoot.mockClear();
    mocks.getRegistrations.mockReset();
    mocks.unregister.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('memanggil createRoot saat elemen root kosong dan unregister service worker saat dev', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    mocks.unregister.mockResolvedValue(true);
    mocks.getRegistrations.mockResolvedValue([{ unregister: mocks.unregister }]);
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations: mocks.getRegistrations,
      },
    });

    await import('../src/main.jsx');

    expect(mocks.getRegistrations).toHaveBeenCalledTimes(1);
    expect(mocks.unregister).toHaveBeenCalledTimes(1);
    expect(mocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mocks.render).toHaveBeenCalledTimes(1);
    expect(mocks.hydrateRoot).not.toHaveBeenCalled();
  });

  it('memanggil hydrateRoot saat root sudah berisi child node dan menoleransi error unregister', async () => {
    document.body.innerHTML = '<div id="root"><div>ssr</div></div>';
    mocks.getRegistrations.mockRejectedValue(new Error('sw gagal'));
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations: mocks.getRegistrations,
      },
    });

    await import('../src/main.jsx');

    expect(mocks.hydrateRoot).toHaveBeenCalledWith(document.getElementById('root'), expect.any(Object));
    expect(mocks.createRoot).not.toHaveBeenCalled();
  });

  it('tidak mencoba hydrate atau create saat elemen root tidak ada', async () => {
    vi.stubGlobal('navigator', {});

    await import('../src/main.jsx');

    expect(mocks.createRoot).not.toHaveBeenCalled();
    expect(mocks.hydrateRoot).not.toHaveBeenCalled();
  });
});