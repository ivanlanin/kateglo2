import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Glosarium, { resolveKategoriNama } from '../../../src/halaman/publik/Glosarium';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = {};

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
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onNavigateCursor }) => (
    <div>
      <button type="button" aria-label="glosarium-first" onClick={() => onNavigateCursor('first')}>first</button>
      <button type="button" aria-label="glosarium-prev" onClick={() => onNavigateCursor('prev')}>prev</button>
      <button type="button" aria-label="glosarium-next" onClick={() => onNavigateCursor('next')}>next</button>
      <button type="button" aria-label="glosarium-last" onClick={() => onNavigateCursor('last')}>last</button>
    </div>
  ),
}));

describe('Glosarium', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
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

    expect(screen.getAllByText('Glosarium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Ling' })).toBeInTheDocument();
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
          data: [{ id: 1, indonesia: '1 istilah; 2 data', asing: 'term' }],
          total: 1,
          pageInfo: { hasPrev: false, hasNext: true, nextCursor: 'CUR_NEXT' },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByText(/Hasil Pencarian/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'istilah' })).toHaveAttribute('href', '/kamus/detail/istilah');
    expect(screen.getByRole('link', { name: 'data' })).toHaveAttribute('href', '/kamus/detail/data');
    expect(screen.getByText('(term)')).toBeInTheDocument();
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });

    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('menampilkan hasil mode bidang', () => {
    mockParams = { bidang: 'ling' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: 'ling', nama: 'Linguistik' }], isLoading: false, isError: false };
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

    expect(screen.getByRole('heading', { name: 'Glosarium Linguistik' })).toBeInTheDocument();
    expect(ambilGlosariumPerBidang).toHaveBeenCalledWith('ling', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('mode bidang tetap memakai fallback nama dari param saat daftar tidak cocok', () => {
    mockParams = { bidang: 'tak-ada' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: 'ling', nama: '' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return { data: { data: [], total: 0 }, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Glosarium Tak-ada' })).toBeInTheDocument();
  });

  it('menampilkan hasil mode sumber', () => {
    mockParams = { sumber: 'kbbi-iv' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [{ kode: 'kbbi-iv', nama: 'KBBI IV' }], isLoading: false, isError: false };
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

    expect(screen.getByRole('heading', { name: 'Glosarium KBBI IV' })).toBeInTheDocument();
    expect(ambilGlosariumPerSumber).toHaveBeenCalledWith('kbbi-iv', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('browse tanpa daftar bidang/sumber tidak menampilkan kartu kategori', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.queryByText('Bidang')).not.toBeInTheDocument();
    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
  });

  it('browse memakai fallback item.nama saat kode/bidang/sumber kosong dan resolve nama dari key alternatif', () => {
    mockParams = { bidang: 'kimia', sumber: 'kbbi' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') {
        return { data: [{ kode: 'kimia', bidang: '', nama: '' }], isLoading: false, isError: false };
      }
      if (key === 'glosarium-sumber') {
        return { data: [{ kode: '', sumber: 'kbbi', nama: '' }], isLoading: false, isError: false };
      }
      return { data: { data: [], total: 0, pageInfo: { hasPrev: false, hasNext: false } }, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Glosarium Kimia' })).toBeInTheDocument();

    mockParams = {};
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ nama: 'Kesehatan' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [{ nama: 'WHO' }], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByRole('link', { name: 'Kesehatan' })).toHaveAttribute('href', '/glosarium/bidang/Kesehatan');
    expect(screen.getByRole('link', { name: 'WHO' })).toHaveAttribute('href', '/glosarium/sumber/WHO');
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

  it('navigasi cursor first/last/next/prev memperbarui opsi query', () => {
    mockParams = { kata: 'istilah' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'istilah', asing: 'term' }],
          total: 230,
          pageInfo: { hasPrev: true, hasNext: true, nextCursor: 'NEXT_CUR', prevCursor: 'PREV_CUR' },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-next' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-prev' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-last' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-first' })[0]);

    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: 'NEXT_CUR',
      direction: 'next',
      lastPage: false,
    });
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: 'PREV_CUR',
      direction: 'prev',
      lastPage: false,
    });
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: 'NEXT_CUR',
      direction: 'next',
      lastPage: true,
    });
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('aksi last tetap valid saat total 0 (fallback targetPage ke 1)', () => {
    mockParams = { kata: 'nol' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'nol', asing: null }],
          total: 0,
          pageInfo: { hasPrev: false, hasNext: false },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-last' })[0]);

    expect(cariGlosarium).toHaveBeenCalledWith('nol', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
    });
  });

  it('helper resolveKategoriNama menutup cabang match dan fallback', () => {
    expect(resolveKategoriNama()).toBe('');
    expect(resolveKategoriNama('', [{ kode: 'x', nama: 'X' }], ['nama'], ['kode'])).toBe('');
    expect(resolveKategoriNama('x', null, ['nama'], ['kode'])).toBe('x');
    expect(resolveKategoriNama('x', [], ['nama'], ['kode'])).toBe('x');
    expect(resolveKategoriNama('abc', [{ kode: 'def', nama: 'Nama' }], ['nama'], ['kode'])).toBe('abc');
    expect(resolveKategoriNama('kim', [{ kode: 'kim', nama: '' }], ['nama', 'bidang'], ['kode'])).toBe('kim');
    expect(resolveKategoriNama('kim', [{ kode: 'kim', nama: 'Kimia' }], ['nama'], ['kode'])).toBe('Kimia');
  });

  it('browse tetap merender link saat label bidang kosong total', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: '', bidang: '', nama: '' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    const { container } = render(<Glosarium />);
    expect(container.querySelector('a[href="/glosarium/bidang/"]')).toBeInTheDocument();
  });
});
