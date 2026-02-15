import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Tesaurus from '../../src/halaman/Tesaurus';
import { cariTesaurus } from '../../src/api/apiPublik';

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

vi.mock('../../src/api/apiPublik', () => ({
  cariTesaurus: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock('../../src/komponen/Paginasi', () => ({
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

  it('menampilkan hasil, memotong sinonim, dan mengubah offset saat paginasi', () => {
    mockParams = { kata: 'anak%20ibu' };
    queryString = 'offset=20';
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            {
              id: 1,
              lema: 'anak ibu',
              sinonim: 's1;s2;s3;s4;s5;s6',
            },
          ],
          total: 120,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByRole('heading', { name: /Hasil Pencarian “anak ibu”/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'anak ibu' })).toHaveAttribute('href', '/tesaurus/detail/anak%20ibu');
    expect(screen.getByText(/s1;\s*s2;\s*s3;\s*s4;\s*s5/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Halaman berikut' }));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ offset: '100' });
  });
});