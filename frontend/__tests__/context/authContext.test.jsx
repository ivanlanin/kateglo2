/**
 * @fileoverview Test auth context frontend
 */

import { act, useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../src/context/authContext';

const mockAmbilProfilSaya = vi.fn();
const mockMulaiLoginGoogle = vi.fn();

vi.mock('../../src/api/apiAuth', () => ({
  ambilProfilSaya: (...args) => mockAmbilProfilSaya(...args),
  mulaiLoginGoogle: (...args) => mockMulaiLoginGoogle(...args),
}));

function AuthProbe() {
  const {
    token,
    user,
    isLoading,
    isAuthenticated,
    adalahAdmin,
    adalahRedaksi,
    punyaIzin,
    refreshProfil,
    loginDenganGoogle,
    setAuthToken,
    logout,
  } = useAuth();

  return (
    <div>
      <div data-testid="token">{token || '-'}</div>
      <div data-testid="user">{user ? user.email || user.name || 'user' : '-'}</div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="is-admin">{String(adalahAdmin)}</div>
      <div data-testid="is-redaksi">{String(adalahRedaksi)}</div>
      <div data-testid="has-izin-kelola">{String(punyaIzin('kelola_pengguna'))}</div>
      <button type="button" onClick={() => setAuthToken('token-baru')}>set-token</button>
      <button type="button" onClick={() => setAuthToken('')}>clear-token</button>
      <button type="button" onClick={logout}>logout</button>
      <button type="button" onClick={() => refreshProfil()}>refresh</button>
      <button type="button" onClick={() => loginDenganGoogle('/kamus')}>login-google</button>
    </div>
  );
}

function ErrorProbe() {
  useAuth();
  return <div>should not render</div>;
}

function DeferredProfileHarness({ resolveNow }) {
  const { setAuthToken } = useAuth();

  useEffect(() => {
    setAuthToken('token-lambat');
  }, [setAuthToken]);

  useEffect(() => {
    if (resolveNow) {
      resolveNow();
    }
  }, [resolveNow]);

  return null;
}

describe('context/authContext', () => {
  beforeEach(() => {
    mockAmbilProfilSaya.mockReset();
    mockMulaiLoginGoogle.mockReset();
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem.mockReset();
    localStorage.getItem.mockReturnValue(null);
  });

  it('melempar error jika useAuth dipakai di luar provider', () => {
    expect(() => render(<ErrorProbe />)).toThrow('useAuth harus digunakan di dalam AuthProvider');
  });

  it('inisialisasi tanpa token menyetel state tidak autentikasi', () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByTestId('token')).toHaveTextContent('-');
    expect(screen.getByTestId('user')).toHaveTextContent('-');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('inisialisasi dengan token tersimpan memicu bootstrap profil', async () => {
    localStorage.getItem.mockReturnValue('token-tersimpan');
    mockAmbilProfilSaya.mockResolvedValue({ email: 'awal@contoh.id' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockAmbilProfilSaya).toHaveBeenCalledWith('token-tersimpan');
    });
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('awal@contoh.id');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
  });

  it('setAuthToken menyimpan token dan memuat profil hingga autentikasi true', async () => {
    mockAmbilProfilSaya.mockResolvedValue({ email: 'user@contoh.id', name: 'User' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));

    expect(localStorage.setItem).toHaveBeenCalledWith('kateglo-auth-token', 'token-baru');
    await waitFor(() => {
      expect(mockAmbilProfilSaya).toHaveBeenCalledWith('token-baru');
    });
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('user@contoh.id');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('clear token menghapus state auth dan localStorage', async () => {
    mockAmbilProfilSaya.mockResolvedValue({ email: 'user@contoh.id' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'clear-token' }));

    expect(localStorage.removeItem).toHaveBeenCalledWith('kateglo-auth-token');
    expect(screen.getByTestId('token')).toHaveTextContent('-');
    expect(screen.getByTestId('user')).toHaveTextContent('-');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('logout menghapus state auth dan localStorage', async () => {
    mockAmbilProfilSaya.mockResolvedValue({ email: 'user@contoh.id' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(localStorage.removeItem).toHaveBeenCalledWith('kateglo-auth-token');
    expect(screen.getByTestId('token')).toHaveTextContent('-');
    expect(screen.getByTestId('user')).toHaveTextContent('-');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('menghapus token jika ambilProfilSaya gagal', async () => {
    mockAmbilProfilSaya.mockRejectedValue({ response: { status: 401 } });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));

    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledWith('token-baru'));
    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('kateglo-auth-token');
      expect(screen.getByTestId('token')).toHaveTextContent('-');
      expect(screen.getByTestId('user')).toHaveTextContent('-');
    });
  });

  it('menghapus token jika ambilProfilSaya mengembalikan 403', async () => {
    mockAmbilProfilSaya.mockRejectedValue({ response: { status: 403 } });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));

    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledWith('token-baru'));
    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('kateglo-auth-token');
      expect(screen.getByTestId('token')).toHaveTextContent('-');
    });
  });

  it('tidak menghapus token saat refresh gagal selain 401/403', async () => {
    mockAmbilProfilSaya
      .mockResolvedValueOnce({ email: 'user@contoh.id', peran: 'admin', izin: ['kelola_pengguna'] })
      .mockRejectedValueOnce({ response: { status: 500 } });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledTimes(2));

    expect(screen.getByTestId('token')).toHaveTextContent('token-baru');
    expect(screen.getByTestId('user')).toHaveTextContent('user@contoh.id');
  });

  it('mengekspos flag role dan helper izin dari profil', async () => {
    mockAmbilProfilSaya.mockResolvedValue({
      email: 'role@contoh.id',
      peran: 'penyunting',
      akses_redaksi: false,
      izin: ['kelola_pengguna'],
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));

    await waitFor(() => {
      expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      expect(screen.getByTestId('is-redaksi')).toHaveTextContent('true');
      expect(screen.getByTestId('has-izin-kelola')).toHaveTextContent('true');
    });
  });

  it('refresh berkala/focus/visibility memicu refresh profil', async () => {
    let intervalCallback = null;
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation((callback) => {
      intervalCallback = callback;
      return 1;
    });
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

    const visibilityGetter = vi.fn(() => 'hidden');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: visibilityGetter,
    });

    mockAmbilProfilSaya.mockResolvedValue({ email: 'timer@contoh.id', izin: [] });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      intervalCallback?.();
    });
    expect(mockAmbilProfilSaya.mock.calls.length).toBeGreaterThanOrEqual(1);

    visibilityGetter.mockReturnValue('visible');
    fireEvent(window, new Event('focus'));
    await waitFor(() => expect(mockAmbilProfilSaya.mock.calls.length).toBeGreaterThanOrEqual(2));

    await act(async () => {
      intervalCallback?.();
    });
    expect(mockAmbilProfilSaya.mock.calls.length).toBeGreaterThanOrEqual(2);

    fireEvent(document, new Event('visibilitychange'));
    await waitFor(() => expect(mockAmbilProfilSaya.mock.calls.length).toBeGreaterThanOrEqual(2));

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('interval callback jalur visible dapat dieksekusi tanpa error', async () => {
    let intervalCallback = null;
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation((callback) => {
      intervalCallback = callback;
      return 1;
    });
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });

    mockAmbilProfilSaya.mockResolvedValue({ email: 'visible@contoh.id' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(setIntervalSpy).toHaveBeenCalled());

    await act(async () => {
      intervalCallback?.();
    });

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('interval callback tetap dapat mengeksekusi refresh saat visibility hidden', async () => {
    let intervalCallback = null;
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation((callback) => {
      intervalCallback = callback;
      return 1;
    });
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    mockAmbilProfilSaya.mockResolvedValue({ email: 'hidden@contoh.id' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledTimes(1));

    await act(async () => {
      intervalCallback?.();
    });

    expect(mockAmbilProfilSaya.mock.calls.length).toBeGreaterThanOrEqual(1);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('interval callback menjalankan cabang hidden lalu visible', async () => {
    let intervalCallback = null;
    let visibilityStateValue = 'hidden';
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation((callback) => {
      intervalCallback = callback;
      return 1;
    });
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityStateValue,
    });

    mockAmbilProfilSaya.mockResolvedValue({ email: 'interval@contoh.id' });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(setIntervalSpy).toHaveBeenCalled());

    await act(async () => {
      intervalCallback?.();
    });

    visibilityStateValue = 'visible';
    await act(async () => {
      intervalCallback?.();
    });

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it('refreshProfil mengabaikan panggilan baru saat request masih in-flight', async () => {
    let resolveProfile;
    mockAmbilProfilSaya.mockReturnValue(new Promise((resolve) => {
      resolveProfile = resolve;
    }));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'refresh' }));
    expect(mockAmbilProfilSaya).toHaveBeenCalledTimes(1);

    resolveProfile({ email: 'inflight@contoh.id' });
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('inflight@contoh.id'));
  });

  it('menghormati interval refresh dari env saat nilainya valid', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_AUTH_PROFILE_REFRESH_MS', '45000');

    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation(() => 1);
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval').mockImplementation(() => {});

    const { AuthProvider: AuthProviderEnv, useAuth: useAuthEnv } = await import('../../src/context/authContext');

    function ProbeEnv() {
      const { setAuthToken } = useAuthEnv();
      return <button type="button" onClick={() => setAuthToken('token-env')}>set-env</button>;
    }

    mockAmbilProfilSaya.mockResolvedValue({ email: 'env@contoh.id' });

    render(
      <AuthProviderEnv>
        <ProbeEnv />
      </AuthProviderEnv>
    );

    fireEvent.click(screen.getByRole('button', { name: 'set-env' }));
    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledWith('token-env'));
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 45000);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('mengekspos loginDenganGoogle dari apiAuth', () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'login-google' }));

    expect(mockMulaiLoginGoogle).toHaveBeenCalledWith('/kamus');
  });

  it('tidak set state setelah unmount saat loadProfile selesai belakangan', async () => {
    let resolveProfile;
    const slowProfile = new Promise((resolve) => {
      resolveProfile = resolve;
    });
    mockAmbilProfilSaya.mockReturnValue(slowProfile);

    const { unmount } = render(
      <AuthProvider>
        <DeferredProfileHarness />
      </AuthProvider>
    );

    await waitFor(() => expect(mockAmbilProfilSaya).toHaveBeenCalledWith('token-lambat'));
    unmount();

    resolveProfile({ email: 'late@contoh.id' });

    await waitFor(() => {
      expect(mockAmbilProfilSaya).toHaveBeenCalledTimes(1);
    });
  });

  it('tetap aman saat localStorage tidak tersedia', async () => {
    mockAmbilProfilSaya.mockResolvedValue({ email: 'tanpa-storage@contoh.id' });
    const originalStorage = globalThis.localStorage;
    const originalWindowStorage = window.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    try {
      render(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('false');

      fireEvent.click(screen.getByRole('button', { name: 'set-token' }));
      expect(screen.getByTestId('token')).toHaveTextContent('token-baru');
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      fireEvent.click(screen.getByRole('button', { name: 'clear-token' }));
      expect(screen.getByTestId('token')).toHaveTextContent('-');

      fireEvent.click(screen.getByRole('button', { name: 'logout' }));
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalStorage,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'localStorage', {
        value: originalWindowStorage,
        writable: true,
        configurable: true,
      });
    }
  });

});
