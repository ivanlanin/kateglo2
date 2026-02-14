import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Peribahasa from '../../src/halaman/Peribahasa';
import Singkatan from '../../src/halaman/Singkatan';
import { cariPeribahasa, cariSingkatan } from '../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let params = '';

vi.mock('../../src/api/apiPublik', () => ({
  cariPeribahasa: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  cariSingkatan: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(params), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

describe('Peribahasa', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockSetSearchParams.mockReset();
    params = '';
    cariPeribahasa.mockClear();
    cariSingkatan.mockClear();
  });

  it('menampilkan petunjuk saat belum ada query', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Peribahasa />);
    expect(screen.getByText(/Gunakan kolom pencarian/i)).toBeInTheDocument();
  });

  it('submit query memanggil setSearchParams', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Peribahasa />);
    fireEvent.change(screen.getByPlaceholderText('Cari peribahasa...'), { target: { value: ' buah ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'buah' });
  });

  it('menampilkan hasil peribahasa', () => {
    params = 'q=buah';
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: { data: [{ prv_uid: 1, proverb: 'buah bibir', meaning: 'bahan pembicaraan', prv_type: 'umum' }], total: 1 },
        isLoading: false,
        isError: false,
      };
    });
    render(<Peribahasa />);
    expect(screen.getByText('buah bibir')).toBeInTheDocument();
    expect(screen.getByText(/Makna/i)).toBeInTheDocument();
    expect(cariPeribahasa).toHaveBeenCalled();
  });

  it('pagination peribahasa mengubah offset', () => {
    params = 'q=buah';
    mockUseQuery.mockReturnValue({
      data: {
        data: Array.from({ length: 20 }).map((_, i) => ({ prv_uid: i + 1, proverb: `p-${i + 1}` })),
        total: 45,
      },
      isLoading: false,
      isError: false,
    });

    render(<Peribahasa />);
    fireEvent.click(screen.getByRole('button', { name: '›' }));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'buah', offset: '20' });
  });
});

describe('Singkatan', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockSetSearchParams.mockReset();
    params = '';
  });

  it('menampilkan petunjuk saat belum mencari', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Singkatan />);
    expect(screen.getByText(/Gunakan kolom pencarian/i)).toBeInTheDocument();
  });

  it('submit query dan kepanjangan memanggil setSearchParams', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Singkatan />);
    fireEvent.change(screen.getByLabelText('Singkatan'), { target: { value: ' BUMN ' } });
    fireEvent.change(screen.getByLabelText('Kepanjangan'), { target: { value: ' badan ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'BUMN', kependekan: 'badan' });
  });

  it('menampilkan tabel hasil saat sedang mencari', () => {
    params = 'q=bumn';
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [{ abbr_idx: 1, abbr_key: 'BUMN', abbr_id: 'Badan Usaha Milik Negara', abbr_en: 'State-Owned Enterprise', abbr_type: 'institusi' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });
    render(<Singkatan />);
    expect(screen.getByRole('heading', { name: 'Singkatan & Akronim' })).toBeInTheDocument();
    expect(screen.getByText('BUMN')).toBeInTheDocument();
    expect(cariSingkatan).toHaveBeenCalled();
  });

  it('pagination singkatan mengubah offset dan mempertahankan filter', () => {
    params = 'q=bumn&kependekan=badan';
    mockUseQuery.mockReturnValue({
      data: {
        data: Array.from({ length: 20 }).map((_, i) => ({ abbr_idx: i + 1, abbr_key: `S-${i + 1}` })),
        total: 45,
      },
      isLoading: false,
      isError: false,
    });

    render(<Singkatan />);
    fireEvent.click(screen.getByRole('button', { name: '›' }));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'bumn', kependekan: 'badan', offset: '20' });
  });
});
