import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Tesaurus from '../../../src/halaman/publik/Tesaurus';
import { cariTesaurus } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let mockParams = {};
let queryString = '';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams(queryString), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  cariTesaurus: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange(100)}>
      Halaman berikut
    </button>
  ),
}));

describe('Tesaurus', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockSetSearchParams.mockReset();
    cariTesaurus.mockClear();
    mockParams = {};
    queryString = '';
  });

  it('menampilkan state default saat tanpa kata', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    render(<Tesaurus />);

    expect(screen.getByRole('heading', { name: 'Tesaurus' })).toBeInTheDocument();
    expect(screen.getByText(/Gunakan kolom pencarian di atas/i)).toBeInTheDocument();
  });

  it('menampilkan loading dan error untuk mode pencarian', () => {
    mockParams = { kata: 'kata' };
    mockUseQuery.mockImplementationOnce((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return { data: undefined, isLoading: true, isError: false };
    });

    const { rerender } = render(<Tesaurus />);
    expect(screen.getByText(/Mencari data/i)).toBeInTheDocument();
    expect(cariTesaurus).toHaveBeenCalledWith('kata', { limit: 100, offset: 0 });

    mockUseQuery.mockImplementationOnce((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return { data: undefined, isLoading: false, isError: true };
    });
    rerender(<Tesaurus />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });

  it('menampilkan empty result', () => {
    mockParams = { kata: 'zzz' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: { data: [], total: 0 },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);
    expect(screen.getByText(/Kata tidak ditemukan di tesaurus/i)).toBeInTheDocument();
  });

  it('mengarahkan tautan ke kamus detail dan menampilkan relasi dengan simbol', () => {
    mockParams = { kata: 'anak%20ibu' };
    queryString = 'offset=20';
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            {
              id: 1,
              indeks: 'anak ibu',
              sinonim: 's1;s2;s3;s4',
              antonim: 'a1;a2',
            },
          ],
          total: 120,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByRole('heading', { name: /Hasil Pencarian \u201canak ibu\u201d/i })).toBeInTheDocument();

    // Tautan mengarah ke kamus detail, bukan tesaurus detail
    expect(screen.getByRole('link', { name: 'anak ibu' })).toHaveAttribute('href', '/kamus/detail/anak%20ibu');

    // Sinonim diringkas maks 2, badge ≈ terpisah dari teks
    expect(screen.getByText('≈')).toBeInTheDocument();
    expect(screen.getByText(/s1; s2; …/)).toBeInTheDocument();
    // Antonim tetap tampil terpisah dengan badge ≠
    expect(screen.getByText('≠')).toBeInTheDocument();
    expect(screen.getByText(/a1; a2/)).toBeInTheDocument();

    const tombolEkspansi = screen.getByRole('button', { name: '»' });
    expect(tombolEkspansi).toHaveAttribute('aria-expanded', 'false');

    // Klik untuk ekspansi — tampilkan semua
    fireEvent.click(tombolEkspansi);
    expect(tombolEkspansi).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/s1; s2; s3; s4/)).toBeInTheDocument();

    // Klik lagi untuk ciutkan
    fireEvent.click(tombolEkspansi);
    expect(tombolEkspansi).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Halaman berikut' }));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ offset: '100' });
  });

  it('menampilkan hanya antonim jika sinonim kosong', () => {
    mockParams = { kata: 'besar' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            { id: 2, indeks: 'besar', sinonim: null, antonim: 'kecil;mungil' },
          ],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByText('≠')).toBeInTheDocument();
    expect(screen.getByText(/kecil; mungil/)).toBeInTheDocument();
    expect(screen.queryByText('≈')).not.toBeInTheDocument();
  });

  it('tidak menampilkan relasi saat sinonim dan antonim kosong', () => {
    mockParams = { kata: 'hampa' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            { id: 3, indeks: 'hampa', sinonim: ' ; ', antonim: '' },
          ],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByRole('link', { name: 'hampa' })).toHaveAttribute('href', '/kamus/detail/hampa');
    expect(screen.queryByText('≈')).not.toBeInTheDocument();
    expect(screen.queryByText('≠')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '»' })).not.toBeInTheDocument();
  });
});
