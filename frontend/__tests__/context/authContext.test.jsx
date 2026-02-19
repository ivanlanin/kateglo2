/**
 * @fileoverview Test auth context frontend
 */

import { useEffect } from 'react';
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
      <button type="button" onClick={() => setAuthToken('token-baru')}>set-token</button>
      <button type="button" onClick={() => setAuthToken('')}>clear-token</button>
      <button type="button" onClick={logout}>logout</button>
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
    mockAmbilProfilSaya.mockRejectedValue(new Error('unauthorized'));

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

  it('tetap aman saat localStorage tidak tersedia', () => {
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
