import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Kamus from '../../../src/halaman/publik/Kamus';
import { cariKamus } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = {};

vi.mock('../../../src/api/apiPublik', () => ({
  cariKamus: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilKategoriKamus: vi.fn().mockResolvedValue({}),
  ambilEntriPerKategori: vi.fn().mockResolvedValue({ data: [], total: 0, label: null }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onNavigateCursor }) => (
    <button type="button" onClick={() => onNavigateCursor('next')}>
      Ubah halaman
    </button>
  ),
}));

describe('Kamus', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    cariKamus.mockClear();
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
            unsur_terikat: [
              { kode: 'prefiks', nama: 'prefiks' },
              { kode: 'prakategorial', nama: 'prakategorial' },
            ],
            kelas_kata: [],
            ragam: [{ kode: 'umum_sekali', nama: 'Umum Sekali' }],
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
    expect(screen.getByText('Bentuk Terikat')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dasar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prefiks' })).toHaveAttribute('href', '/kamus/bentuk/prefiks');
    expect(screen.getByRole('link', { name: 'Prakategorial' })).toHaveAttribute('href', '/kamus/bentuk/prakategorial');
    expect(screen.getByRole('link', { name: 'Umum Sekali' })).toHaveAttribute('href', '/kamus/ragam/umum-sekali');
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
    expect(screen.getByRole('link', { name: 'nomina' })).toHaveAttribute('href', '/kamus/kelas/nomina');
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

  it('menampilkan hasil kategori dari route /kamus/kelas/:kelas', () => {
    mockParams = { kelas: 'verba' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 2, entri: 'makan' }],
            total: 1,
            label: { nama: 'verba' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Kelas Kata Verba' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'makan' })).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Khusus Kata Dasar' })).toBeInTheDocument();
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

  it('kategori bentuk dengan kode unsur terikat memakai judul Bentuk', () => {
    mockParams = { kategori: 'bentuk', kode: 'prefiks' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 11, entri: 'meng-' }],
            total: 1,
            label: { nama: 'prefiks' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Bentuk Prefiks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'meng-' })).toBeInTheDocument();
  });

  it('kategori bentuk dengan kode non-unsur-terikat memakai judul Bentuk', () => {
    mockParams = { kategori: 'bentuk', kode: 'dasar' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 12, entri: 'kata dasar' }],
            total: 1,
            label: { nama: 'dasar' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Bentuk Dasar' })).toBeInTheDocument();
  });

  it('kategori kelas_kata tetap dipetakan ke judul Kelas Kata', () => {
    mockParams = { kategori: 'kelas_kata', kode: 'nomina' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 13, entri: 'kata benda' }],
            total: 1,
            label: { nama: 'nomina' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Kelas Kata Nomina' })).toBeInTheDocument();
  });

  it('kategori kelas-kata tetap dipetakan ke judul Kelas Kata', () => {
    mockParams = { kategori: 'kelas-kata', kode: 'verba' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'kamus-kategori-entri') {
        return {
          data: {
            data: [{ id: 14, entri: 'berlari' }],
            total: 1,
            label: { nama: 'verba' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);

    expect(screen.getByRole('heading', { name: 'Kelas Kata Verba' })).toBeInTheDocument();
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

  it('menampilkan kontrol paginasi saat hasil tersedia', () => {
    mockParams = { kata: 'kata' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const { queryKey } = options;
      if (queryKey[0] === 'cari-kamus') {
        return {
          data: {
            data: [{ id: 1, entri: 'kata' }],
            total: 300,
            pageInfo: { hasPrev: false, hasNext: true, nextCursor: 'CUR_NEXT' },
          },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Kamus />);
    expect(screen.getAllByRole('button', { name: 'Ubah halaman' }).length).toBeGreaterThan(0);
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
