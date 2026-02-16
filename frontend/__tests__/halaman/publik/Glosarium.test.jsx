import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Glosarium from '../../../src/halaman/publik/Glosarium';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let mockParams = {};
let params = '';

vi.mock('../../../src/api/apiPublik', () => ({
  cariGlosarium: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilGlosariumPerBidang: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilGlosariumPerSumber: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilDaftarBidang: vi.fn().mockResolvedValue([]),
  ambilDaftarSumber: vi.fn().mockResolvedValue([]),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams(params), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange(100)}>
      Halaman glosarium berikut
    </button>
  ),
}));

describe('Glosarium', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockSetSearchParams.mockReset();
    params = '';
    mockParams = {};
    cariGlosarium.mockClear();
    ambilGlosariumPerBidang.mockClear();
    ambilGlosariumPerSumber.mockClear();
    ambilDaftarBidang.mockClear();
    ambilDaftarSumber.mockClear();
  });

  it('menampilkan browse bidang/sumber saat belum mencari', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ bidang: 'ling' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [{ sumber: 'kbbi' }], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByText('Bidang')).toBeInTheDocument();
    expect(screen.getByText('Sumber')).toBeInTheDocument();
    expect(ambilDaftarBidang).toHaveBeenCalled();
    expect(ambilDaftarSumber).toHaveBeenCalled();
  });

  it('menampilkan hasil pencarian kata dengan format indonesia (asing)', () => {
    mockParams = { kata: 'istilah' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'istilah', asing: 'term' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByText(/Hasil Pencarian/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'istilah' })).toBeInTheDocument();
    expect(screen.getByText('(term)')).toBeInTheDocument();
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', { limit: 100, offset: 0 });

    screen.getByRole('button', { name: 'Halaman glosarium berikut' }).click();
    expect(mockSetSearchParams).toHaveBeenCalledWith({ offset: '100' });
  });

  it('menampilkan hasil mode bidang', () => {
    mockParams = { bidang: 'linguistik' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'fonem', asing: 'phoneme' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Bidang linguistik' })).toBeInTheDocument();
    expect(ambilGlosariumPerBidang).toHaveBeenCalledWith('linguistik', { limit: 100, offset: 0 });
  });

  it('menampilkan hasil mode sumber', () => {
    mockParams = { sumber: 'kbbi' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'entri', asing: 'entry' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Sumber kbbi' })).toBeInTheDocument();
    expect(ambilGlosariumPerSumber).toHaveBeenCalledWith('kbbi', { limit: 100, offset: 0 });
  });

  it('menampilkan state kosong, loading, dan error', () => {
    mockParams = { kata: 'kosong' };
    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: { data: [], total: 0 }, isLoading: false, isError: false });

    const { rerender } = render(<Glosarium />);
    expect(screen.getByText(/Tidak ada entri glosarium yang ditemukan/i)).toBeInTheDocument();

    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false });

    rerender(<Glosarium />);
    expect(screen.getByText(/Mencari data/i)).toBeInTheDocument();

    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true });

    rerender(<Glosarium />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });
});
