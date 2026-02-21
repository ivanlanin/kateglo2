import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Makna, { amanDecode } from '../../../src/halaman/publik/Makna';
import { cariMakna, ambilContohMakna } from '../../../src/api/apiPublik';

let mockParams = {};
const mockUseQuery = vi.fn();
const mockHandleCursor = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/hooks/bersama/useCursorPagination', () => ({
  useCursorPagination: () => ({
    cursorState: { page: 1, cursor: 'c1', direction: 'next', lastPage: false },
    handleCursor: mockHandleCursor,
  }),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  cariMakna: vi.fn(),
  ambilContohMakna: vi.fn(),
}));

vi.mock('../../../src/komponen/publik/HalamanDasar', () => ({
  default: ({ judul, deskripsi, children }) => (
    <section>
      <h1>{judul}</h1>
      <p>{deskripsi}</p>
      {children}
    </section>
  ),
}));

vi.mock('../../../src/komponen/publik/HasilPencarian', () => ({
  default: ({ results, renderItems, emptyState, onNavigateCursor }) => (
    <div>
      <button type="button" onClick={() => onNavigateCursor?.('next')}>cursor-next</button>
      {results?.length ? renderItems(results) : emptyState}
    </div>
  ),
}));

describe('Makna', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    cariMakna.mockResolvedValue({ data: [], total: 0, pageInfo: { hasPrev: false, hasNext: false } });
    ambilContohMakna.mockResolvedValue({ data: [] });
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'makna-contoh') return { data: { data: ['air', 'api'] }, isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false, error: null };
    });
  });

  it('menampilkan mode browse dengan contoh makna', () => {
    render(<Makna />);

    expect(screen.getByRole('heading', { name: 'Makna' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'air' })).toHaveAttribute('href', '/makna/cari/air');
    expect(screen.getByRole('link', { name: 'api' })).toHaveAttribute('href', '/makna/cari/api');
    expect(cariMakna).not.toHaveBeenCalled();
    expect(ambilContohMakna).toHaveBeenCalled();
  });

  it('menampilkan hasil pencarian makna dan memanggil API dengan cursor', () => {
    mockParams = { kata: 'air' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'cari-makna') {
        return {
          data: {
            total: 1,
            pageInfo: { hasPrev: false, hasNext: true },
            data: [{
              id: 1,
              entri: 'air (2)',
              indeks: 'air',
              makna_cocok: [{ makna: '**air** adalah cairan', kelas_kata: 'n' }],
            }],
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(<Makna />);

    expect(cariMakna).toHaveBeenCalledWith('air', {
      limit: 50,
      cursor: 'c1',
      direction: 'next',
      lastPage: false,
    });
    fireEvent.click(screen.getByText('cursor-next'));
    expect(mockHandleCursor).toHaveBeenCalledWith('next', expect.any(Object));
    expect(screen.getByRole('link', { name: /air/i })).toHaveAttribute('href', '/kamus/detail/air');
    expect(screen.getByText('n')).toBeInTheDocument();
    expect(screen.getByText(/adalah c/i)).toBeInTheDocument();
  });

  it('tetap aman saat decode kata gagal dan saat item tidak punya makna_cocok', () => {
    mockParams = { kata: '%' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'cari-makna') {
        return {
          data: {
            total: 1,
            pageInfo: { hasPrev: false, hasNext: false },
            data: [{ id: 2, entri: 'uji', indeks: 'uji', makna_cocok: [] }],
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(<Makna />);

    expect(cariMakna).toHaveBeenCalledWith('%', expect.any(Object));
    expect(screen.getByRole('link', { name: 'uji' })).toHaveAttribute('href', '/kamus/detail/uji');
  });

  it('menangani markdown italic, fallback entri saat indeks kosong, dan teks makna kosong', () => {
    mockParams = { kata: 'uji' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'cari-makna') {
        return {
          data: {
            total: 2,
            pageInfo: { hasPrev: false, hasNext: false },
            data: [
              {
                id: 10,
                entri: 'uji entri',
                indeks: '',
                makna_cocok: [{ makna: '*uji* coba', kelas_kata: '' }],
              },
              {
                id: 11,
                entri: 'tanpa makna',
                indeks: 'tanpa-makna',
                makna_cocok: [{ makna: '', kelas_kata: 'n' }],
              },
            ],
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(<Makna />);

    expect(screen.getByRole('link', { name: 'uji entri' })).toHaveAttribute('href', '/kamus/detail/uji%20entri');
    expect(screen.getByText(/coba/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tanpa makna' })).toHaveAttribute('href', '/kamus/detail/tanpa-makna');
  });

  it('menampilkan contoh browse dengan tanda baca koma dan atau untuk 3 item', () => {
    mockParams = {};
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'makna-contoh') {
        return { data: { data: ['air', 'api', 'tanah'] }, isLoading: false, isError: false };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(<Makna />);

    expect(screen.getByRole('link', { name: 'air' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'api' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'tanah' })).toBeInTheDocument();
    expect(screen.getByText(', atau')).toBeInTheDocument();
  });

  it('saat hasil kosong menampilkan tawaran cari kata itu di kamus', () => {
    mockParams = { kata: 'laut dalam' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'cari-makna') {
        return {
          data: {
            total: 0,
            pageInfo: { hasPrev: false, hasNext: false },
            data: [],
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }
      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(<Makna />);

    expect(screen.getByText(/Tidak ada kata yang maknanya mengandung/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kata itu di kamus' })).toHaveAttribute('href', '/kamus/cari/laut%20dalam');
  });

  it('helper amanDecode fallback saat URI invalid', () => {
    expect(amanDecode('%E0%A4%A')).toBe('%E0%A4%A');
    expect(amanDecode('air')).toBe('air');
    expect(amanDecode(null)).toBe('');
  });
});
