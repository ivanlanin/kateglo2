import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sumber from '../../../src/halaman/publik/Sumber';

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  ambilDaftarSumber: vi.fn(),
}));

describe('Sumber', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it('menampilkan loading dan error feedback', () => {
    mockUseQuery.mockReturnValueOnce({ data: undefined, isLoading: true, isError: false, error: null });
    const { rerender } = render(<Sumber />);
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    mockUseQuery.mockReturnValueOnce({ data: undefined, isLoading: false, isError: true, error: new Error('gagal') });
    rerender(<Sumber />);
    expect(screen.getByText('Gagal mengambil data.')).toBeInTheDocument();
  });

  it('menampilkan daftar sumber dan fallback keterangan ke nama', () => {
    mockUseQuery.mockReturnValue({
      data: [
        { id: 1, kode: 'kbbi', nama: 'KBBI', keterangan: '[Situs](https://example.com)' },
        { id: 2, kode: '', nama: 'Pusat Bahasa', keterangan: '' },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<Sumber />);

    expect(screen.getByRole('link', { name: 'Situs' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('kbbi')).toBeInTheDocument();
    expect(screen.getByText('Pusat Bahasa')).toBeInTheDocument();
  });

  it('menampilkan pesan kosong saat daftar sumber tidak ada', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false, isError: false, error: null });

    render(<Sumber />);

    expect(screen.getByText('Belum ada sumber yang tersedia.')).toBeInTheDocument();
  });
});
