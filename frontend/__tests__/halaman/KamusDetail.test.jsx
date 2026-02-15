import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KamusDetail from '../../src/halaman/KamusDetail';
import { ambilDetailKamus } from '../../src/api/apiPublik';

const mockUseQuery = vi.fn();

vi.mock('../../src/api/apiPublik', () => ({
  ambilDetailKamus: vi.fn().mockResolvedValue(null),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => ({ entri: 'kata' }),
}));

describe('KamusDetail', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    ambilDetailKamus.mockClear();
  });

  it('menampilkan loading state', () => {
    mockUseQuery.mockReturnValue({ isLoading: true, isError: false, data: null });
    render(<KamusDetail />);
    expect(screen.getByText(/Memuat detail/i)).toBeInTheDocument();
  });

  it('menampilkan not found state', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true, data: null });
    render(<KamusDetail />);
    expect(screen.getByText(/Entri tidak ditemukan/i)).toBeInTheDocument();
  });

  it('menampilkan detail lengkap saat data tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        isLoading: false,
        isError: false,
        data: {
          lema: 'kata',
          lafal: 'ka-ta',
          pemenggalan: 'ka-ta',
          jenis: 'dasar',
          makna: [{ id: 1, kelas_kata: 'n', makna: 'unsur bahasa' }],
          sublema: {
            turunan: [{ id: 7, lema: 'berkata' }],
          },
          terjemahan: [{ translation: 'word', ref_source: 'Oxford' }],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('heading', { name: /kata/i })).toBeInTheDocument();
    expect(screen.getByText('/ka-ta/')).toBeInTheDocument();
    expect(screen.getByText('Terjemahan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Terjemahan/i }));

    expect(screen.getByText('berkata')).toBeInTheDocument();
    expect(screen.getByText('word')).toBeInTheDocument();
    expect(ambilDetailKamus).toHaveBeenCalledWith('kata');
  });

  it('menampilkan bentuk baku dan tautan see pada definisi', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        lema: 'aktip',
        varian: 'aktif',
        makna: [
          {
            id: 2,
            kelas_kata: 'adj',
            bidang: 'Psikologi',
            makna: 'giat',
          },
        ],
        sublema: {},
        terjemahan: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText(/varian: aktif/i)).toBeInTheDocument();
    expect(screen.getByText('[Psikologi]', { exact: false })).toBeInTheDocument();
  });
});
