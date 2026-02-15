import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KamusDetail from '../../src/halaman/KamusDetail';
import { ambilDetailKamus } from '../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = { entri: 'kata' };

vi.mock('../../src/api/apiPublik', () => ({
  ambilDetailKamus: vi.fn().mockResolvedValue(null),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

describe('KamusDetail', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    ambilDetailKamus.mockClear();
    mockParams = { entri: 'kata' };
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

  it('menampilkan mode rujukan dan metadata makna opsional', () => {
    mockUseQuery
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: {
          lema: 'aktip',
          rujukan: true,
          lema_rujuk: 'aktif',
        },
      })
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: {
          lema: 'kata',
          pemenggalan: 'ka ta',
          jenis: 'turunan',
          induk: { lema: 'kata dasar' },
          makna: [
            {
              id: 11,
              kelas_kata: null,
              ragam: 'cak',
              kiasan: 1,
              makna: 'contoh <b>makna</b>',
              tipe_penyingkat: 'akr',
              ilmiah: 'species',
              kimia: 'H2O',
              contoh: [
                { id: 1, contoh: 'contoh kalimat', makna_contoh: 'arti contoh' },
              ],
            },
          ],
          sublema: {
            turunan: [{ id: 21, lema: 'berkata' }, { id: 22, lema: 'perkataan' }],
          },
          terjemahan: [{ translation: 'word', ref_source: '' }],
        },
      });

    const { rerender } = render(<KamusDetail />);

    expect(screen.getByText(/Lihat/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'aktif' })).toHaveAttribute('href', '/kamus/detail/aktif');

    rerender(<KamusDetail />);

    expect(screen.getByText('ka ta')).toBeInTheDocument();
    expect(screen.getByText('turunan')).toBeInTheDocument();
    expect(screen.getByText('kata dasar')).toBeInTheDocument();
    expect(screen.getByText('cak', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('ki', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('akr')).toBeInTheDocument();
    expect(screen.getByText('[species]', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('(H2O)', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/arti contoh/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lihat di Tesaurus/i })).toHaveAttribute('href', '/tesaurus/detail/kata');
  });

  it('menggunakan judul default saat entri kosong dan menampilkan makna kosong', () => {
    mockParams = {};
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        lema: 'tanpa-makna',
        makna: [],
        sublema: {},
        terjemahan: [],
      },
    });

    render(<KamusDetail />);

    expect(document.title).toBe('Kamus — Kateglo');
    expect(screen.getByText('Belum tersedia.')).toBeInTheDocument();
  });

  it('menggunakan fallback makna/sublema saat field tidak tersedia', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        lema: 'fallback',
        terjemahan: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText('Belum tersedia.')).toBeInTheDocument();
    expect(screen.queryByText('Turunan')).not.toBeInTheDocument();
  });
});
