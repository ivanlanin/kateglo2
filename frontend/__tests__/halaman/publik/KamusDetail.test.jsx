import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KamusDetail from '../../../src/halaman/publik/KamusDetail';
import { ambilDetailKamus } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = { indeks: 'kata' };

vi.mock('../../../src/api/apiPublik', () => ({
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
    mockParams = { indeks: 'kata' };
  });

  it('menampilkan loading state', () => {
    mockUseQuery.mockReturnValue({ isLoading: true, isError: false, data: null });
    render(<KamusDetail />);
    expect(screen.getByText(/Memuat detail/i)).toBeInTheDocument();
  });

  it('menampilkan not found state tanpa saran', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true, data: null, error: new Error('Entri tidak ditemukan') });
    render(<KamusDetail />);
    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kembali ke pencarian/i })).toBeInTheDocument();
  });

  it('menampilkan not found state dengan saran entri mirip', () => {
    const err = new Error('Entri tidak ditemukan');
    err.saran = ['kata', 'kota', 'kita'];
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true, data: null, error: err });
    render(<KamusDetail />);
    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kata' })).toHaveAttribute('href', '/kamus/detail/kata');
    expect(screen.getByRole('link', { name: 'kota' })).toHaveAttribute('href', '/kamus/detail/kota');
    expect(screen.getByRole('link', { name: 'kita' })).toHaveAttribute('href', '/kamus/detail/kita');
  });

  it('menampilkan detail lengkap saat data tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'kata',
          lafal: 'ka-ta',
          pemenggalan: 'ka-ta',
          jenis: 'dasar',
          makna: [{ id: 1, kelas_kata: 'n', makna: 'unsur bahasa' }],
          subentri: {
            turunan: [{ id: 7, entri: 'berkata' }],
          },
          tesaurus: { sinonim: ['ucapan'], antonim: [] },
          glosarium: [{ indonesia: 'kata kunci', asing: 'keyword' }],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getAllByRole('heading', { name: /kata/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('/ka-ta/')).toBeInTheDocument();

    expect(screen.getByText('berkata')).toBeInTheDocument();
    expect(screen.getByText('Tesaurus')).toBeInTheDocument();
    expect(screen.getByText('Glosarium')).toBeInTheDocument();
    expect(ambilDetailKamus).toHaveBeenCalledWith('kata');
  });

  it('menampilkan bentuk baku dan tautan see pada definisi', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'aktip',
        varian: 'aktif',
        makna: [
          {
            id: 2,
            kelas_kata: 'adj',
            bidang: 'Psikologi',
            makna: 'giat',
          },
        ],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText(/varian: aktif/i)).toBeInTheDocument();
    expect(screen.getByText('Psikologi')).toBeInTheDocument();
  });

  it('menampilkan mode rujukan dan metadata makna opsional', () => {
    const dataRujukan = {
      entri: 'aktip',
      rujukan: true,
      entri_rujuk: 'aktif',
    };

    const dataDetail = {
      entri: 'kata',
      pemenggalan: 'ka ta',
      jenis: 'turunan',
      induk: [{ id: 31, entri: 'kata dasar' }],
      makna: [
        {
          id: 11,
          kelas_kata: null,
          ragam: 'cak',
          ragam_varian: 'slang',
          kiasan: 1,
          bahasa: 'Arab',
          makna: 'contoh <b>makna</b>',
          tipe_penyingkat: 'akr',
          ilmiah: 'species',
          kimia: 'H2O',
          contoh: [
            { id: 1, contoh: 'contoh kalimat', makna_contoh: 'arti contoh' },
            { id: 2, contoh: 'contoh kedua', makna_contoh: '' },
          ],
        },
        {
          id: 12,
          kelas_kata: null,
          makna: 'makna kedua',
          contoh: [],
        },
      ],
      subentri: {
        turunan: [{ id: 21, entri: 'berkata' }, { id: 22, entri: 'perkataan' }],
      },
      tesaurus: { sinonim: ['sinonim satu', 'sinonim dua'], antonim: ['antonim satu', 'antonim dua'] },
      glosarium: [
        { indonesia: 'kata dasar', asing: 'base word' },
        { indonesia: 'kata turunan', asing: 'derived word' },
      ],
    };

    mockUseQuery
      .mockReturnValue({
        isLoading: false,
        isError: false,
        data: dataDetail,
      })
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: dataRujukan,
      })
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: dataDetail,
      });

    const { rerender } = render(<KamusDetail />);

    expect(screen.getByText(/Lihat/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'aktif' })).toHaveAttribute('href', '/kamus/detail/aktif');

    rerender(<KamusDetail />);

    expect(screen.getByRole('heading', { name: /kata.*ka ta/i })).toBeInTheDocument();
    expect(screen.getByText('turunan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kata dasar' })).toHaveAttribute('href', '/kamus/detail/kata%20dasar');
    expect(screen.getByText('cak', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('slang', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('kiasan', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Arab', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('akr')).toBeInTheDocument();
    expect(screen.getByText('species', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText(/arti contoh/i)).toBeInTheDocument();
    expect(screen.getByText(/^1\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^2\.$/)).toBeInTheDocument();
    expect(screen.getByText('Tesaurus')).toBeInTheDocument();
    expect(screen.getByText('Sinonim:')).toBeInTheDocument();
    expect(screen.getByText('Antonim:')).toBeInTheDocument();
    expect(screen.getByText('Sinonim:').closest('li')).not.toBeNull();
    expect(screen.getByText('Antonim:').closest('li')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'sinonim satu' })).toHaveAttribute('href', '/kamus/detail/sinonim%20satu');
    expect(screen.getByRole('link', { name: 'antonim satu' })).toHaveAttribute('href', '/kamus/detail/antonim%20satu');
    expect(screen.getByRole('link', { name: 'sinonim dua' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'antonim dua' })).toBeInTheDocument();
    expect(screen.getByText('Glosarium')).toBeInTheDocument();
    expect(screen.getByText('base word')).toBeInTheDocument();
    expect(screen.getByText('derived word')).toBeInTheDocument();
  });

  it('menggunakan judul default saat entri kosong dan menampilkan makna kosong', () => {
    mockParams = {};
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'tanpa-makna',
        makna: [],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(document.title).toBe('Kamus — Kateglo');
    expect(screen.getByText('Belum tersedia.')).toBeInTheDocument();
  });

  it('menampilkan fallback not found saat entri kosong dan data tidak ada', () => {
    mockParams = {};
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: null,
      error: undefined,
    });

    render(<KamusDetail />);

    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kembali ke pencarian/i })).toHaveAttribute('href', '/kamus');
  });

  it('menggunakan fallback makna/sublema saat field tidak tersedia', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'fallback',
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText('Belum tersedia.')).toBeInTheDocument();
    expect(screen.queryByText('Turunan')).not.toBeInTheDocument();
  });

  it('menggunakan fallback tesaurus/glosarium dan markdown kosong tanpa error', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'opsional-kosong',
        makna: [
          {
            id: 99,
            kelas_kata: '-',
            makna: '',
            contoh: [{ id: 991, contoh: 'contoh saja', makna_contoh: '' }],
          },
        ],
        subentri: {},
      },
    });

    render(<KamusDetail />);

    expect(screen.queryByText('Tesaurus')).not.toBeInTheDocument();
    expect(screen.queryByText('Glosarium')).not.toBeInTheDocument();
    expect(screen.getByText('contoh saja')).toBeInTheDocument();
  });

  it('tidak menampilkan nomor makna jika hanya satu makna', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'tunggal',
        makna: [{ id: 1, kelas_kata: '-', makna: 'hanya satu makna' }],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.queryByText(/^1\.$/)).not.toBeInTheDocument();
    expect(screen.getByText('hanya satu makna')).toBeInTheDocument();
  });

  it('tidak memakai bullet point saat hanya satu kategori tesaurus tersedia', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'satu-kategori',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        subentri: {},
        tesaurus: { sinonim: ['setara'], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    const labelSinonim = screen.getByText('Sinonim:');
    expect(labelSinonim.closest('li')).toBeNull();
    expect(screen.queryByText('Antonim:')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'setara' })).toHaveAttribute('href', '/kamus/detail/setara');
  });

  it('menampilkan blok tesaurus non-list saat hanya antonim tersedia', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'antonim-saja',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        subentri: {},
        tesaurus: { sinonim: [], antonim: ['lawan kata'] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    const labelAntonim = screen.getByText('Antonim:');
    expect(labelAntonim.closest('li')).toBeNull();
    expect(screen.queryByText('Sinonim:')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'lawan kata' })).toHaveAttribute('href', '/kamus/detail/lawan%20kata');
  });

  it('menampilkan superskrip untuk lafal dan pemenggalan di heading detail', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'per (1)',
        lafal: 'per (2)',
        pemenggalan: 'per (3)',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);

    const supLafal = container.querySelector('.kamus-detail-heading-pronunciation sup');
    const supPemenggalan = container.querySelector('.kamus-detail-heading-split sup');

    expect(supLafal).not.toBeNull();
    expect(supLafal?.textContent).toBe('2');
    expect(supPemenggalan).not.toBeNull();
    expect(supPemenggalan?.textContent).toBe('3');
  });
});
