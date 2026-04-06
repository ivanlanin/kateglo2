import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KamusAcak from '../../../../src/pages/publik/kamus/KamusAcak';

const mockAmbilEntriAcakKamus = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilEntriAcakKamus: (...args) => mockAmbilEntriAcakKamus(...args),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/kamus/acak', search: '' }),
  };
});

describe('KamusAcak', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAmbilEntriAcakKamus.mockReset();
    mockAmbilEntriAcakKamus.mockResolvedValue({
      url: '/kamus/detail/acak',
    });
  });

  it('mengalihkan ke detail entri acak saat API berhasil', async () => {
    render(<KamusAcak />);

    expect(screen.getByText('Mengarahkan ke entri acak …')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/kamus/detail/acak', { replace: true });
    });
  });

  it('menampilkan pesan gagal saat API tidak memberi URL', async () => {
    mockAmbilEntriAcakKamus.mockResolvedValueOnce({});

    render(<KamusAcak />);

    await waitFor(() => {
      expect(screen.getByText('Entri acak belum tersedia.')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('menampilkan pesan gagal saat API melempar error', async () => {
    mockAmbilEntriAcakKamus.mockRejectedValueOnce(new Error('gagal'));

    render(<KamusAcak />);

    await waitFor(() => {
      expect(screen.getByText('Entri acak belum tersedia.')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('tidak menavigasi saat komponen sudah unmount sebelum respons selesai', async () => {
    let resolveResponse;
    mockAmbilEntriAcakKamus.mockReturnValueOnce(new Promise((resolve) => {
      resolveResponse = resolve;
    }));

    const view = render(<KamusAcak />);
    view.unmount();
    resolveResponse({ url: '/kamus/detail/terlambat' });

    await Promise.resolve();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});