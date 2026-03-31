import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KamusAcak from '../../../../src/pages/publik/kamus/KamusAcak';

const mockAmbilEntriAcakKamus = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilEntriAcakKamus: (...args) => mockAmbilEntriAcakKamus(...args),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

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
});