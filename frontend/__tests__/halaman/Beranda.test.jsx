import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Beranda from '../../src/halaman/Beranda';
import { ambilDataBeranda } from '../../src/api/apiPublik';

const mockNavigate = vi.fn();
const mockUseQuery = vi.fn();

vi.mock('../../src/api/apiPublik', () => ({
  ambilDataBeranda: vi.fn().mockResolvedValue({}),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

describe('Beranda', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseQuery.mockReset();
    ambilDataBeranda.mockClear();
  });

  it('menampilkan hero dan statistik saat data tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      return {
        data: {
          statistik: { kamus: 10, glosarium: 2, peribahasa: 3, singkatan: 4 },
          lemaAcak: [{ phrase: 'akar' }],
          salahEja: [{ phrase: 'aktip', actual_phrase: 'aktif' }],
          populer: [{ phrase: 'kata', search_count: 12 }],
        },
        isLoading: false,
      };
    });

    render(<Beranda />);
    expect(screen.getByText('Kateglo')).toBeInTheDocument();
    expect(screen.getByText(/10 lema/i)).toBeInTheDocument();
    expect(screen.getByText('Lema Acak')).toBeInTheDocument();
    expect(screen.getByText('Salah Eja')).toBeInTheDocument();
    expect(screen.getByText('Paling Dicari')).toBeInTheDocument();
    expect(ambilDataBeranda).toHaveBeenCalled();
  });

  it('submit query kosong tidak menavigasi', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<Beranda />);

    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submit query menavigasi ke halaman kamus', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });
    render(<Beranda />);

    fireEvent.change(screen.getByPlaceholderText('Cari kata dalam kamus...'), { target: { value: 'anak ibu' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).toHaveBeenCalledWith('/kamus?q=anak%20ibu');
  });
});
