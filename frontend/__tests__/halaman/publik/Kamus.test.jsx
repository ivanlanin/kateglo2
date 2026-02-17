import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Kamus from '../../../src/halaman/publik/Kamus';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let mockParams = {};

vi.mock('../../../src/api/apiPublik', () => ({
  cariKamus: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilKategoriKamus: vi.fn().mockResolvedValue({}),
  ambilEntriPerKategori: vi.fn().mockResolvedValue({ data: [], total: 0, label: null }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams(''), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
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
          data: {
            abjad: [{ kode: 'A', nama: 'A' }],
            bentuk: [{ kode: 'dasar', nama: 'dasar' }],
            unsur_terikat: [{ kode: 'prefiks', nama: 'prefiks' }],
            kelas_kata: [],
            ragam: [],
            ekspresi: [],
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

    expect(screen.getByText('Abjad')).toBeInTheDocument();
    expect(screen.getByText('Bentuk Bebas')).toBeInTheDocument();
    expect(screen.getByText('Unsur Terikat')).toBeInTheDocument();
  });

  it('browse kategori memakai fallback array kosong untuk key yang tidak ada dan grid dua kolom saat dua kategori terisi', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori') {
        return {
          data: {
            abjad: [{ kode: 'A', nama: 'A' }],
            kelas_kata: [{ kode: 'n', nama: 'nomina' }],
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    const { container } = render(<Kamus />);

    expect(screen.getByText('Abjad')).toBeInTheDocument();
    expect(screen.getByText('Kelas Kata')).toBeInTheDocument();
    const grid = container.querySelector('.grid.grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-2');
  });

  it('menampilkan hasil pencarian kata', () => {
    mockParams = { kata: 'kata' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'cari-kamus') {
        return {
          data: { data: [{ id: 1, entri: 'kata' }], total: 1 },
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
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 1, entri: 'akar' }],
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
      if (queryKey[0] === 'kamus-kategori-entri') {
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
            bentuk: [],
            unsur_terikat: [],
            kelas_kata: [],
            ragam: [],
            ekspresi: [],
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

  it('menggunakan label Asal Bahasa pada judul kategori bahasa', () => {
    mockParams = { kategori: 'bahasa', kode: 'arab' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 9, entri: 'kabar' }],
            total: 1,
            label: { nama: 'arab' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Asal Bahasa Arab' })).toBeInTheDocument();
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
          data: { data: [{ id: 1, entri: 'kata' }], total: 300 },
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
