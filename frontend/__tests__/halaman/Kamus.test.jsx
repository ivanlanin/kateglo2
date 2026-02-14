import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Kamus from '../../src/halaman/Kamus';
import { cariKamus } from '../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockSetSearchParams = vi.fn();
let currentQuery = '';

vi.mock('../../src/api/apiPublik', () => ({
  cariKamus: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(currentQuery ? `q=${currentQuery}` : ''), mockSetSearchParams],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

describe('Kamus', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockSetSearchParams.mockReset();
    currentQuery = '';
    cariKamus.mockClear();
  });

  it('menampilkan browse index saat q kosong', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Kamus />);
    expect(screen.getByText(/Gunakan kolom pencarian/i)).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('submit query valid memanggil setSearchParams', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Kamus />);
    fireEvent.change(screen.getByPlaceholderText('Ketik kata yang dicari...'), { target: { value: ' kata ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ q: 'kata' });
  });

  it('submit query kosong tidak memanggil setSearchParams', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    render(<Kamus />);
    fireEvent.change(screen.getByPlaceholderText('Ketik kata yang dicari...'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockSetSearchParams).not.toHaveBeenCalled();
  });

  it('menampilkan hasil pencarian dan preview definisi', () => {
    currentQuery = 'kata';
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: { data: [{ phrase: 'kata', lex_class: 'n', definition_preview: 'arti kata' }] },
        isLoading: false,
        isError: false,
      };
    });
    render(<Kamus />);
    expect(screen.getByText(/Hasil pencarian/i)).toBeInTheDocument();
    expect(screen.getByText('arti kata')).toBeInTheDocument();
    expect(cariKamus).toHaveBeenCalledWith('kata', 50);
  });

  it('menampilkan label actual_phrase dan pesan kosong', () => {
    currentQuery = 'kata';
    mockUseQuery.mockReturnValue({
      data: { data: [{ phrase: 'aktip', actual_phrase: 'aktif', lex_class: 'adj' }] },
      isLoading: false,
      isError: false,
    });
    render(<Kamus />);
    expect(screen.getByText('→ aktif')).toBeInTheDocument();

    mockUseQuery.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });
    render(<Kamus />);
    expect(screen.getByText(/Frasa yang dicari tidak ditemukan/i)).toBeInTheDocument();
  });

  it('menampilkan pesan error dan kosong', () => {
    currentQuery = 'zzz';
    mockUseQuery.mockReturnValue({ data: { data: [] }, isLoading: false, isError: true });
    render(<Kamus />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });
});
