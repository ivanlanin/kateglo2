import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Glosarium from '../../src/halaman/Glosarium';
import { cariGlosarium, ambilDaftarBidang, ambilDaftarSumber } from '../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let params = '';

vi.mock('../../src/api/apiPublik', () => ({
  cariGlosarium: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilDaftarBidang: vi.fn().mockResolvedValue([]),
  ambilDaftarSumber: vi.fn().mockResolvedValue([]),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(params), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

describe('Glosarium', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockSetSearchParams.mockReset();
    params = '';
    cariGlosarium.mockClear();
    ambilDaftarBidang.mockClear();
    ambilDaftarSumber.mockClear();
  });

  it('menampilkan browse bidang/sumber saat belum mencari', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ discipline: 'ling', discipline_name: 'Linguistik', glossary_count: 3 }] };
      if (key === 'glosarium-sumber') return { data: [{ ref_source: 'kbbi', ref_source_name: 'KBBI', glossary_count: 2 }] };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);
    expect(screen.getByText(/Menurut bidang/i)).toBeInTheDocument();
    expect(screen.getByText(/Menurut sumber/i)).toBeInTheDocument();
    expect(ambilDaftarBidang).toHaveBeenCalled();
    expect(ambilDaftarSumber).toHaveBeenCalled();
  });

  it('mengubah nilai filter bidang dan sumber', () => {
    mockUseQuery.mockImplementation((options) => {
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') {
        return { data: [{ discipline: 'ling', discipline_name: 'Linguistik', glossary_count: 3 }] };
      }
      if (key === 'glosarium-sumber') {
        return { data: [{ ref_source: 'kbbi', ref_source_name: 'KBBI', glossary_count: 2 }] };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    const bidangSelect = screen.getByLabelText('Bidang');
    const sumberSelect = screen.getByLabelText('Sumber');

    fireEvent.change(bidangSelect, { target: { value: 'ling' } });
    fireEvent.change(sumberSelect, { target: { value: 'kbbi' } });

    expect(screen.getByRole('option', { name: 'Linguistik' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'KBBI' })).toBeInTheDocument();
  });

  it('submit filter memanggil setSearchParams', () => {
    params = 'q=istilah&bidang=ling&sumber=kbbi';
    mockUseQuery
      .mockReturnValueOnce({ data: [{ discipline: 'ling', discipline_name: 'Linguistik', glossary_count: 3 }] })
      .mockReturnValueOnce({ data: [{ ref_source: 'kbbi', ref_source_name: 'KBBI', glossary_count: 2 }] });

    render(<Glosarium />);
    fireEvent.change(screen.getByLabelText('Lema'), { target: { value: ' istilah ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'istilah', bidang: 'ling', sumber: 'kbbi' });
  });

  it('menampilkan hasil tabel saat sedang mencari', () => {
    params = 'q=istilah';
    mockUseQuery
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({
        data: {
          data: [{ glo_uid: 1, phrase: 'istilah', original: 'term', discipline_name: 'Linguistik', ref_source_name: 'KBBI' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      });

    render(<Glosarium />);
    expect(screen.getByText('Bahasa Indonesia')).toBeInTheDocument();
    expect(screen.getByText('istilah')).toBeInTheDocument();
  });

  it('menampilkan pesan saat hasil glosarium kosong', () => {
    params = 'q=kosong';
    mockUseQuery
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({
        data: { data: [], total: 0 },
        isLoading: false,
        isError: false,
      });

    render(<Glosarium />);
    expect(screen.getByText(/Tidak ada entri glosarium yang ditemukan/i)).toBeInTheDocument();
  });

  it('pagination memanggil handleOffset dan mempertahankan filter', () => {
    params = 'q=istilah&bidang=ling&sumber=kbbi';
    mockUseQuery
      .mockReturnValueOnce({ data: [{ discipline: 'ling', discipline_name: 'Linguistik', glossary_count: 3 }] })
      .mockReturnValueOnce({ data: [{ ref_source: 'kbbi', ref_source_name: 'KBBI', glossary_count: 2 }] })
      .mockReturnValueOnce({
        data: {
          data: Array.from({ length: 20 }).map((_, i) => ({
            glo_uid: i + 1,
            phrase: `istilah-${i + 1}`,
            original: `term-${i + 1}`,
          })),
          total: 45,
        },
        isLoading: false,
        isError: false,
      });

    render(<Glosarium />);
    fireEvent.click(screen.getByRole('button', { name: '›' }));

    expect(mockSetSearchParams).toHaveBeenCalledWith({
      q: 'istilah',
      bidang: 'ling',
      sumber: 'kbbi',
      offset: '20',
    });
  });

  it('menampilkan state loading dan error', () => {
    params = 'q=istilah';
    mockUseQuery
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false });

    render(<Glosarium />);
    expect(screen.getByText(/Mencari data/i)).toBeInTheDocument();

    mockUseQuery
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: [] })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true });

    render(<Glosarium />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });

  it('mengeksekusi semua queryFn useQuery (bidang, sumber, data)', () => {
    params = 'q=istilah&bidang=ling&sumber=kbbi';
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') {
        return { data: [{ discipline: 'ling', discipline_name: 'Linguistik', glossary_count: 3 }] };
      }
      if (key === 'glosarium-sumber') {
        return { data: [{ ref_source: 'kbbi', ref_source_name: 'KBBI', glossary_count: 2 }] };
      }
      return {
        data: {
          data: [{ glo_uid: 1, phrase: 'istilah', original: 'term', discipline_name: 'Linguistik', ref_source_name: 'KBBI' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(ambilDaftarBidang).toHaveBeenCalled();
    expect(ambilDaftarSumber).toHaveBeenCalled();
    expect(cariGlosarium).toHaveBeenCalled();
  });
});
