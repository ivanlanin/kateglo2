import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Kamus from '../../src/halaman/Kamus';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let mockParams = {};

vi.mock('../../src/api/apiPublik', () => ({
  cariKamus: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilKategoriKamus: vi.fn().mockResolvedValue({}),
  ambilLemaPerKategori: vi.fn().mockResolvedValue({ data: [], total: 0, label: null }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams(''), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../src/komponen/Paginasi', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange(100)}>
      Ubah halaman
    </button>
  ),
}));

describe('Kamus', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockSetSearchParams.mockReset();
    mockParams = {};
  });

  it('menampilkan browse kategori saat tanpa pencarian', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori') {
        return {
          data: { abjad: [{ kode: 'A', nama: 'A' }], jenis: [{ kode: 'dasar', nama: 'dasar' }] },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByText('Abjad')).toBeInTheDocument();
    expect(screen.getByText('Jenis')).toBeInTheDocument();
  });

  it('menampilkan hasil pencarian kata', () => {
    mockParams = { kata: 'kata' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'cari-kamus') {
        return {
          data: { data: [{ id: 1, lema: 'kata' }], total: 1 },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByText(/Hasil Pencarian/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kata' })).toBeInTheDocument();
  });

  it('menampilkan hasil kategori dari route /kamus/:kategori/:kode', () => {
    mockParams = { kategori: 'abjad', kode: 'a' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-lema') {
        return {
          data: {
            data: [{ id: 1, lema: 'akar' }],
            total: 1,
            label: { nama: 'a' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Abjad A' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'akar' })).toBeInTheDocument();
  });

  it('mode kategori memakai fallback nama kategori, decode label, dan empty result', () => {
    mockParams = { kategori: 'khusus', kode: 'kata%20dasar' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-lema') {
        return {
          data: {
            data: [],
            total: 0,
            label: null,
          },
          isLoading: false,
          isError: false,
        };
      }
      if (queryKey[0] === 'kamus-kategori') {
        return {
          data: {
            abjad: [],
            jenis: [],
            kelas_kata: [],
            ragam: [],
            bahasa: [],
            bidang: [],
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'khusus Kata dasar' })).toBeInTheDocument();
    expect(screen.getByText(/Tidak ada entri untuk kategori ini/i)).toBeInTheDocument();
  });

  it('menampilkan pesan kosong saat hasil tidak ditemukan', () => {
    mockParams = { kata: 'zzz' };

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'cari-kamus') {
        return { data: { data: [], total: 0 }, isLoading: false, isError: false };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
  });

  it('mengubah offset saat paginasi dipicu', () => {
    mockParams = { kata: 'kata' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'cari-kamus') {
        return {
          data: { data: [{ id: 1, lema: 'kata' }], total: 300 },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);
    screen.getByRole('button', { name: 'Ubah halaman' }).click();

    expect(mockSetSearchParams).toHaveBeenCalledWith({ offset: '100' });
  });

  it('menampilkan pesan error saat query gagal', () => {
    mockParams = { kata: 'zzz' };

    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'cari-kamus') {
        return { data: undefined, isLoading: false, isError: true };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });
});
