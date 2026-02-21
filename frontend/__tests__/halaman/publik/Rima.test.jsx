import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Rima from '../../../src/halaman/publik/Rima';
import { ambilContohRima, cariRima } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = { kata: 'kata' };

vi.mock('../../../src/api/apiPublik', () => ({
  cariRima: vi.fn(),
  ambilContohRima: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options) => mockUseQuery(options),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

describe('Rima', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    cariRima.mockReset();
    ambilContohRima.mockClear();
    mockParams = { kata: 'kata' };
    document.title = 'Awal';
  });

  it('menampilkan loading dan error state', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      isError: false,
      error: null,
    });

    const { rerender } = render(<Rima />);
    expect(screen.getByText('Mencari rima …')).toBeInTheDocument();

    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('gagal'),
    });

    rerender(<Rima />);
    expect(screen.getByText('Gagal mengambil data. Coba lagi.')).toBeInTheDocument();
  });

  it('query rima memakai placeholderData dari hasil sebelumnya', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'cari-rima') {
        const previous = { rima_akhir: { data: [] }, rima_awal: { data: [] } };
        expect(options.placeholderData(previous)).toBe(previous);
      }
      return {
        data: null,
        isLoading: true,
        isFetching: false,
        isError: false,
        error: null,
      };
    });

    render(<Rima />);
  });

  it('menampilkan hasil rima serta fallback tidak ditemukan', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled && options?.queryFn) options.queryFn();
      return {
        data: {
          rima_akhir: {
            total: 2,
            hasPrev: false,
            hasNext: false,
            data: [{ indeks: 'kota' }, { indeks: 'nota' }],
          },
          rima_awal: {
            total: 0,
            hasPrev: false,
            hasNext: false,
            data: [],
          },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      };
    });

    render(<Rima />);

    expect(screen.getByRole('heading', { name: /Hasil Pencarian Rima/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kota' })).toHaveAttribute('href', '/kamus/detail/kota');
    expect(screen.getByText('Tidak ditemukan.')).toBeInTheDocument();
    expect(document.title).toBe('Hasil Pencarian Rima "kata" — Kateglo');
  });

  it('navigasi cursor rima akhir dan awal meneruskan state ke query berikutnya', async () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled && options?.queryFn) options.queryFn();
      return {
        data: {
          rima_akhir: {
            total: 3,
            hasPrev: true,
            hasNext: true,
            prevCursor: 'akhir-prev',
            nextCursor: 'akhir-next',
            data: [{ indeks: 'kota' }],
          },
          rima_awal: {
            total: 3,
            hasPrev: true,
            hasNext: true,
            prevCursor: 'awal-prev',
            nextCursor: 'awal-next',
            data: [{ indeks: 'kata' }],
          },
        },
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      };
    });

    render(<Rima />);

    await waitFor(() => {
      expect(cariRima).toHaveBeenCalledWith('kata', {
        limit: 50,
        cursorAkhir: null,
        directionAkhir: 'next',
        cursorAwal: null,
        directionAwal: 'next',
      });
    });

    fireEvent.click(screen.getAllByRole('button', { name: '«' })[0]);
    await waitFor(() => {
      expect(cariRima).toHaveBeenLastCalledWith('kata', {
        limit: 50,
        cursorAkhir: 'akhir-prev',
        directionAkhir: 'prev',
        cursorAwal: null,
        directionAwal: 'next',
      });
    });

    fireEvent.click(screen.getAllByRole('button', { name: '»' })[0]);
    await waitFor(() => {
      expect(cariRima).toHaveBeenLastCalledWith('kata', {
        limit: 50,
        cursorAkhir: 'akhir-next',
        directionAkhir: 'next',
        cursorAwal: null,
        directionAwal: 'next',
      });
    });

    fireEvent.click(screen.getAllByRole('button', { name: '«' })[1]);
    await waitFor(() => {
      expect(cariRima).toHaveBeenLastCalledWith('kata', {
        limit: 50,
        cursorAkhir: 'akhir-next',
        directionAkhir: 'next',
        cursorAwal: 'awal-prev',
        directionAwal: 'prev',
      });
    });

    fireEvent.click(screen.getAllByRole('button', { name: '»' })[1]);
    await waitFor(() => {
      expect(cariRima).toHaveBeenLastCalledWith('kata', {
        limit: 50,
        cursorAkhir: 'akhir-next',
        directionAkhir: 'next',
        cursorAwal: 'awal-next',
        directionAwal: 'next',
      });
    });
  });

  it('aman saat kata kosong: query disabled dan title default', () => {
    mockParams = { kata: '' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'rima-contoh') {
        return {
          data: { data: ['kata', 'rasa', 'jalan'] },
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
          enabled: options?.enabled,
        };
      }
      return {
        data: null,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
        enabled: options?.enabled,
      };
    });

    render(<Rima />);

    expect(cariRima).not.toHaveBeenCalled();
    expect(document.title).toBe('Rima — Kateglo');
    expect(screen.getByRole('heading', { name: 'Rima' })).toBeInTheDocument();
    expect(screen.getByText(/Gunakan kolom pencarian di atas untuk mencari kata yang berima/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kata' })).toHaveAttribute('href', '/rima/cari/kata');
    expect(screen.getByRole('link', { name: 'rasa' })).toHaveAttribute('href', '/rima/cari/rasa');
    expect(screen.getByRole('link', { name: 'jalan' })).toHaveAttribute('href', '/rima/cari/jalan');
    expect(screen.queryByText(/Hasil Pencarian Rima/i)).not.toBeInTheDocument();
  });

  it('menampilkan spinner loading pada tombol prev/next akhir dan awal sesuai navigasi aktif', async () => {
    let isFetchingState = false;
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled && options?.queryFn) options.queryFn();
      return {
        data: {
          rima_akhir: {
            total: 3,
            hasPrev: true,
            hasNext: true,
            prevCursor: 'akhir-prev',
            nextCursor: 'akhir-next',
            data: [{ indeks: 'kota' }],
          },
          rima_awal: {
            total: 3,
            hasPrev: true,
            hasNext: true,
            prevCursor: 'awal-prev',
            nextCursor: 'awal-next',
            data: [{ indeks: 'kata' }],
          },
        },
        isLoading: false,
        isFetching: isFetchingState,
        isError: false,
        error: null,
      };
    });

    const { container, rerender } = render(<Rima />);

    fireEvent.click(screen.getAllByRole('button', { name: '«' })[0]);
    isFetchingState = true;
    rerender(<Rima />);
    await waitFor(() => {
      expect(container.querySelector('svg.animate-spin')).not.toBeNull();
    });

    isFetchingState = false;
    rerender(<Rima />);
    fireEvent.click(screen.getAllByRole('button', { name: '»' })[0]);
    isFetchingState = true;
    rerender(<Rima />);
    await waitFor(() => {
      expect(container.querySelector('svg.animate-spin')).not.toBeNull();
    });

    isFetchingState = false;
    rerender(<Rima />);
    fireEvent.click(screen.getAllByRole('button', { name: '«' })[1]);
    isFetchingState = true;
    rerender(<Rima />);
    await waitFor(() => {
      expect(container.querySelector('svg.animate-spin')).not.toBeNull();
    });

    isFetchingState = false;
    rerender(<Rima />);
    fireEvent.click(screen.getAllByRole('button', { name: '»' })[1]);
    isFetchingState = true;
    rerender(<Rima />);
    await waitFor(() => {
      expect(container.querySelector('svg.animate-spin')).not.toBeNull();
    });
  });
});
