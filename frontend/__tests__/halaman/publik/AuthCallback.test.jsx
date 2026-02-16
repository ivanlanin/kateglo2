/**
 * @fileoverview Test halaman callback autentikasi
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthCallback from '../../src/halaman/AuthCallback';

const mockNavigate = vi.fn();
const mockSetAuthToken = vi.fn();
const mockAmbilReturnTo = vi.fn(() => '/');
const mockSearchParamsGet = vi.fn(() => '');

vi.mock('../../src/context/authContext', () => ({
  useAuth: () => ({
    setAuthToken: (...args) => mockSetAuthToken(...args),
  }),
}));

vi.mock('../../src/api/apiAuth', () => ({
  ambilReturnTo: (...args) => mockAmbilReturnTo(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [{ get: (...args) => mockSearchParamsGet(...args) }],
}));

describe('halaman/AuthCallback', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSetAuthToken.mockReset();
    mockAmbilReturnTo.mockReset();
    mockAmbilReturnTo.mockReturnValue('/kamus/cari/rumah');
    mockSearchParamsGet.mockReset();
    mockSearchParamsGet.mockReturnValue('');
    window.location.hash = '';
  });

  it('menampilkan teks proses login', () => {
    render(<AuthCallback />);

    expect(screen.getByText('Memproses login Google...')).toBeInTheDocument();
  });

  it('redirect ke root dengan pesan error saat query error tersedia', async () => {
    mockSearchParamsGet.mockReturnValue('Login Google dibatalkan');

    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', {
        replace: true,
        state: { authError: 'Login Google dibatalkan' },
      });
    });
    expect(mockSetAuthToken).not.toHaveBeenCalled();
  });

  it('redirect ke root saat token tidak ada di hash', async () => {
    window.location.hash = '#foo=bar';

    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', {
        replace: true,
        state: { authError: 'Token login tidak ditemukan' },
      });
    });
  });

  it('set token dan navigate ke returnTo saat hash berisi token', async () => {
    window.location.hash = '#token=jwt-token-123';
    mockAmbilReturnTo.mockReturnValue('/tesaurus/cari/aktif');

    render(<AuthCallback />);

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledWith('jwt-token-123');
      expect(mockAmbilReturnTo).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/tesaurus/cari/aktif', { replace: true });
    });
  });

  it('memproses callback hanya sekali meski di StrictMode', async () => {
    window.location.hash = '#token=jwt-token-once';

    render(
      <React.StrictMode>
        <AuthCallback />
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(mockSetAuthToken).toHaveBeenCalledTimes(1);
      expect(mockAmbilReturnTo).toHaveBeenCalledTimes(1);
    });
  });
});
