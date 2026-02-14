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
  useParams: () => ({ slug: 'kata' }),
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
          frasa: 'kata',
          frasaAktual: 'kata',
          namaKelasLeksikal: 'nomina',
          namaTipeFrasa: 'dasar',
          namaSumber: 'KBBI',
          pelafalan: 'ka-ta',
          info: 'ragam, umum',
          definisi: [{ def_uid: 1, lex_class: 'n', lex_class_name: 'nomina', def_text: 'unsur bahasa' }],
          relasi: { s: { nama: 'Sinonim', daftar: ['istilah'] } },
          peribahasa: [{ prv_uid: 1, proverb: 'buah bibir', meaning: 'bahan pembicaraan' }],
          terjemahan: [{ translation: 'word', ref_source_name: 'Oxford' }],
          tautan: [{ ext_uid: 1, url: 'https://contoh.test', label: 'Contoh' }],
          kataDasar: ['kata'],
          etimologi: 'serapan',
          catatan: 'catatan uji',
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('heading', { name: /kata\/ka-ta\//i })).toBeInTheDocument();
    expect(screen.getByText('Definisi')).toBeInTheDocument();
    expect(screen.getByText('Kata Terkait')).toBeInTheDocument();
    expect(screen.getByText('Peribahasa')).toBeInTheDocument();
    expect(screen.getByText('Terjemahan')).toBeInTheDocument();
    expect(screen.getByText('Tautan Luar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Peribahasa/i }));
    fireEvent.click(screen.getByRole('button', { name: /Terjemahan/i }));
    fireEvent.click(screen.getByRole('button', { name: /Tautan Luar/i }));

    expect(screen.getByText('buah bibir')).toBeInTheDocument();
    expect(screen.getByText('word')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contoh' })).toBeInTheDocument();
    expect(ambilDetailKamus).toHaveBeenCalledWith('kata');
  });

  it('menampilkan bentuk baku dan tautan see pada definisi', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        frasa: 'aktip',
        frasaAktual: 'aktif',
        namaKelasLeksikal: 'adjektiva',
        definisi: [
          {
            def_uid: 2,
            lex_class: 'adj',
            lex_class_name: 'adjektiva',
            def_text: 'giat',
            sample: 'anak aktif',
            see: 'enerjik',
            discipline_name: 'Psikologi',
          },
        ],
        relasi: {},
        peribahasa: [],
        terjemahan: [],
        tautan: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText(/Bentuk baku/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'aktif' })).toBeInTheDocument();
    expect(screen.getByText('[Psikologi]', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'enerjik' })).toBeInTheDocument();
  });
});
