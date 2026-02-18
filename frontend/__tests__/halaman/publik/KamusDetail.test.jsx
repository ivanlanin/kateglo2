import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KamusDetail from '../../../src/halaman/publik/KamusDetail';
import { ambilDetailKamus, ambilKomentarKamus, simpanKomentarKamus, ambilKategoriKamus } from '../../../src/api/apiPublik';
import {
  renderMarkdown,
  buatPathKategoriKamus,
  formatTitleCase,
  normalizeToken,
  buildLabelMap,
  tentukanKategoriJenis,
  bandingkanEntriKamus,
  bandingkanJenisSubentri,
  formatInfoWaktuEntri,
} from '../../../src/halaman/publik/KamusDetail';

const mockUseQuery = vi.fn();
let mockParams = { indeks: 'kata' };
const mockUseAuth = vi.fn(() => ({
  isAuthenticated: false,
  isLoading: false,
  loginDenganGoogle: vi.fn(),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  ambilDetailKamus: vi.fn().mockResolvedValue(null),
  ambilKomentarKamus: vi.fn().mockResolvedValue({
    success: true,
    data: { loggedIn: false, activeCount: 0, komentar: [] },
  }),
  simpanKomentarKamus: vi.fn(),
  ambilKategoriKamus: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
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
    ambilKomentarKamus.mockClear();
    simpanKomentarKamus.mockClear();
    ambilKategoriKamus.mockClear();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });
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
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return {
          isLoading: false,
          isError: false,
          data: {
            'kelas-kata': [{ kode: 'n', nama: 'nomina' }],
          },
        };
      }
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
    expect(screen.getByRole('heading', { name: /Nomina/i })).toBeInTheDocument();

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
    expect(screen.getByRole('link', { name: 'Turunan' })).toHaveAttribute('href', '/kamus/bentuk/turunan');
    expect(screen.getByRole('link', { name: 'kata dasar' })).toHaveAttribute('href', '/kamus/detail/kata%20dasar');
    expect(screen.getByRole('link', { name: 'cak' })).toHaveAttribute('href', '/kamus/ragam/cak');
    expect(screen.getByRole('link', { name: 'slang' })).toHaveAttribute('href', '/kamus/ragam/slang');
    expect(screen.getByRole('link', { name: 'kiasan' })).toHaveAttribute('href', '/kamus/ragam/kiasan');
    expect(screen.getByRole('link', { name: 'Arab' })).toHaveAttribute('href', '/kamus/bahasa/arab');
    expect(screen.getByRole('link', { name: 'akr' })).toHaveAttribute('href', '/kamus/bentuk/akr');
    expect(screen.getByText('species', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText(/arti contoh/i)).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
    expect(screen.getAllByText('(2)').length).toBeGreaterThan(0);
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

  it('menampilkan teaser komentar saat belum login dan ada komentar aktif', () => {
    let panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          data: { loggedIn: false, activeCount: 3, komentar: [] },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.queryByText(/Ada 3 komentar pada entri ini/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Masuk dengan Google' })).toBeInTheDocument();
  });

  it('menampilkan komentar terbaca saat login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    let panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          data: {
            loggedIn: true,
            activeCount: 1,
            komentar: [
              {
                id: 1,
                aktif: false,
                komentar: 'baris 1\nbaris 2',
                pengguna_nama: 'Budi',
                updated_at: '2026-02-17T00:00:00.000Z',
              },
            ],
          },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.getByText(/baris 1/)).toBeInTheDocument();
    expect(screen.getByText(/baris 2/)).toBeInTheDocument();
  });

  it('komentar login menampilkan fallback nama pengguna dan tanggal dari created_at', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    let panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }
      if (panggilan === 2) {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: {
              loggedIn: true,
              activeCount: 1,
              komentar: [{ id: 8, komentar: 'uji', pengguna_nama: '', updated_at: '', created_at: '2026-02-17T01:00:00.000Z' }],
            },
          },
        };
      }
      return { isLoading: false, isError: false, data: {} };
    });

    render(<KamusDetail />);

    expect(screen.getByText('Pengguna')).toBeInTheDocument();
    expect(screen.getByText(/\d{2} [A-Za-z]{3} \d{4} \d{2}\.\d{2}/)).toBeInTheDocument();
  });

  it('menampilkan prompt komentar saat login namun belum ada komentar', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    let panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (panggilan === 2) {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: { loggedIn: true, activeCount: 0, komentar: [] },
          },
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: { 'kelas-kata': [], ragam: [], bidang: [], bahasa: [] },
      };
    });

    render(<KamusDetail />);

    expect(screen.queryByText(/Punya pertanyaan, masukan, atau catatan tentang halaman ini\?/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tulis komentar ...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kirim komentar' })).toBeDisabled();
  });

  it('mengirim komentar saat login: tombol aktif setelah isi, sukses, dan refetch', async () => {
    const mockRefetchKomentar = vi.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      const key = options?.queryKey?.[0];
      if (key === 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (key === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: { loggedIn: true, activeCount: 0, komentar: [] },
          },
          refetch: mockRefetchKomentar,
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: { 'kelas-kata': [], ragam: [], bidang: [], bahasa: [] },
      };
    });

    simpanKomentarKamus.mockResolvedValue({ success: true });

    render(<KamusDetail />);

    const tombolKirim = screen.getByRole('button', { name: 'Kirim komentar' });
    expect(tombolKirim).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Tulis komentar ...'), {
      target: { value: 'Komentar uji' },
    });
    expect(tombolKirim).toBeEnabled();
    fireEvent.click(tombolKirim);

    await waitFor(() => {
      expect(simpanKomentarKamus).toHaveBeenCalledWith('kata', 'Komentar uji');
      expect(screen.getByText('Komentar tersimpan dan menunggu peninjauan redaksi.')).toBeInTheDocument();
      expect(mockRefetchKomentar).toHaveBeenCalled();
    });
  });

  it('menampilkan error saat kirim komentar gagal', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    let panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (panggilan === 2) {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: { loggedIn: true, activeCount: 0, komentar: [] },
          },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: { 'kelas-kata': [], ragam: [], bidang: [], bahasa: [] },
      };
    });

    simpanKomentarKamus.mockRejectedValue(new Error('gagal'));

    render(<KamusDetail />);

    fireEvent.change(screen.getByPlaceholderText('Tulis komentar ...'), {
      target: { value: 'Komentar gagal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim komentar' }));

    await waitFor(() => {
      expect(screen.getByText('Gagal menyimpan komentar. Silakan coba lagi.')).toBeInTheDocument();
    });
  });

  it('klik tautan login Google memanggil loginDenganGoogle pada kedua mode teaser', () => {
    const loginDenganGoogle = vi.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginDenganGoogle,
    });

    let panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }
      if (panggilan === 2) {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 2, komentar: [] } },
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: { 'kelas-kata': [], ragam: [], bidang: [], bahasa: [] },
      };
    });

    const { rerender } = render(<KamusDetail />);
    fireEvent.click(screen.getByRole('link', { name: 'Masuk dengan Google' }));

    panggilan = 0;
    mockUseQuery.mockImplementation(() => {
      panggilan += 1;
      if (panggilan === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, kelas_kata: '-', makna: 'definisi' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }
      if (panggilan === 2) {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: { 'kelas-kata': [], ragam: [], bidang: [], bahasa: [] },
      };
    });

    rerender(<KamusDetail />);
  fireEvent.click(screen.getByRole('link', { name: 'Masuk dengan Google' }));

    expect(loginDenganGoogle).toHaveBeenCalledTimes(2);
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

  it('tidak menampilkan prefiks nomor saat hanya satu makna', () => {
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

    expect(screen.queryByText('(1)')).not.toBeInTheDocument();
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

  it('menampilkan subentri varian sebagai teks non-klik', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: [
          {
            id: 1,
            entri: 'ber-',
            indeks: 'ber',
            jenis: 'dasar',
            makna: [{ id: 11, kelas_kata: null, makna: 'imbuhan' }],
            subentri: {
              varian: [{ id: 2, entri: 'be-', indeks: 'be', jenis: 'varian' }],
            },
          },
        ],
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText('Varian')).toBeInTheDocument();
    expect(screen.getByText('be-')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'be-' })).not.toBeInTheDocument();
  });

  it('membentuk fallback entri dari indeks route dan memetakan jenis ke kategori ekspresi/jenis', () => {
    mockParams = { indeks: 'kata%20route' };
    let jumlahDetail = 0;
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] !== 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
        };
      }

      jumlahDetail += 1;

      if (jumlahDetail === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            indeks: 'idiom-data',
            jenis: 'idiom',
            makna: [{ id: 1, kelas_kata: '-', makna: 'makna idiom' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {
          jenis: 'khusus',
          rujukan: true,
          entri_rujuk: 'kata tujuan',
          entri_rujuk_indeks: '',
        },
      };
    });

    const { rerender } = render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'Idiom' })).toHaveAttribute('href', '/kamus/ekspresi/idiom');
    expect(screen.getByText('idiom-data')).toBeInTheDocument();

    rerender(<KamusDetail />);
    expect(screen.getByRole('link', { name: 'Khusus' })).toHaveAttribute('href', '/kamus/bentuk/khusus');
    expect(screen.getByRole('link', { name: 'kata tujuan' })).toHaveAttribute('href', '/kamus/detail/kata%20tujuan');
    expect(screen.getByText('kata route')).toBeInTheDocument();
  });

  it('mengurutkan entri dan subentri sesuai prioritas internal', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: [
          {
            id: 1,
            entri: 'c',
            indeks: 'c',
            lafal: 'ce',
            urutan: 1,
            homonim: 1,
            jenis: 'dasar',
            makna: [{ id: 11, kelas_kata: null, makna: 'makna c' }],
            subentri: {},
          },
          {
            id: 2,
            entri: 'a',
            indeks: 'a',
            lafal: null,
            urutan: 2,
            homonim: 2,
            jenis: 'dasar',
            makna: [{ id: 12, kelas_kata: null, makna: 'makna a' }],
            subentri: {},
          },
          {
            id: 3,
            entri: 'b',
            indeks: 'b',
            lafal: null,
            urutan: 1,
            homonim: 1,
            jenis: 'varian',
            makna: [{ id: 13, kelas_kata: null, makna: 'makna b' }],
            subentri: {
              zeta: [{ id: 31, entri: 'zeta', indeks: 'zeta' }],
              turunan: [{ id: 32, entri: 'turunan-b', indeks: 'turunan-b' }],
              alfa: [{ id: 33, entri: 'alfa', indeks: 'alfa' }],
            },
          },
          {
            id: 4,
            entri: 'aa',
            indeks: 'aa',
            lafal: null,
            urutan: 1,
            homonim: 2,
            jenis: 'dasar',
            makna: [{ id: 14, kelas_kata: null, makna: 'makna aa' }],
            subentri: {},
          },
          {
            id: 5,
            entri: 'ab',
            indeks: 'ab',
            lafal: null,
            urutan: 1,
            homonim: 2,
            jenis: 'dasar',
            makna: [{ id: 15, kelas_kata: null, makna: 'makna ab' }],
            subentri: {},
          },
        ],
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);

    const headingTexts = Array.from(container.querySelectorAll('.kamus-detail-heading-main'))
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean);
    expect(headingTexts.slice(0, 5)).toEqual(['b', 'aa', 'ab', 'a', 'c']);

    const subentryHeadings = Array.from(container.querySelectorAll('.kamus-detail-subentry-group h3'))
      .map((el) => (el.textContent || '').replace(/\(\d+\)/g, '').trim());
    expect(subentryHeadings.slice(0, 3)).toEqual(['Turunan', 'Alfa', 'Zeta']);
  });
});

describe('KamusDetail helpers', () => {
  it('renderMarkdown, formatTitleCase, dan path kategori menangani fallback', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown('**tebal** dan *miring*')).toContain('<strong>tebal</strong>');
    expect(formatTitleCase('kata_kunci-utama')).toBe('Kata Kunci Utama');
    expect(buatPathKategoriKamus('', 'nilai')).toBe('/kamus');
    expect(buatPathKategoriKamus('ragam', '')).toBe('/kamus');
    expect(buatPathKategoriKamus('ragam', 'cak')).toBe('/kamus/ragam/cak');
  });

  it('normalizeToken dan buildLabelMap menangani nilai kosong/tidak valid', () => {
    expect(normalizeToken('  NOmIna  ')).toBe('nomina');
    expect(normalizeToken()).toBe('');
    expect(buildLabelMap()).toEqual({});
    expect(buildLabelMap(null)).toEqual({});

    const map = buildLabelMap([
      { kode: ' n ', nama: 'Nomina' },
      { kode: 'v', nama: '' },
      { kode: '', nama: 'Kosong' },
      null,
    ]);
    expect(map).toEqual({ n: 'Nomina', nomina: 'Nomina', v: 'v', kosong: 'Kosong' });
  });

  it('tentukanKategoriJenis memetakan bentuk, ekspresi, dan fallback jenis', () => {
    expect(tentukanKategoriJenis('dasar')).toBe('bentuk');
    expect(tentukanKategoriJenis('idiom')).toBe('ekspresi');
    expect(tentukanKategoriJenis('prefiks')).toBe('bentuk');
    expect(tentukanKategoriJenis('')).toBe('bentuk');
    expect(tentukanKategoriJenis('lain')).toBe('bentuk');
  });

  it('bandingkanEntriKamus menutup cabang prioritas lafal, urutan, homonim, dan alfabet', () => {
    expect(bandingkanEntriKamus({ lafal: 'a' }, { lafal: '' })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 2 }, { lafal: '', urutan: 1 })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 1, homonim: 2 }, { lafal: '', urutan: 1, homonim: 1 })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 1, homonim: 1, entri: 'b' }, { lafal: '', urutan: 1, homonim: 1, entri: 'a' })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: undefined, homonim: 'abc', entri: undefined }, { lafal: '', urutan: undefined, homonim: null, entri: undefined })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: undefined, homonim: 1, entri: 'a' }, { lafal: '', urutan: 1, homonim: 1, entri: 'a' })).toBeLessThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 1, homonim: 1, entri: 'a' }, { lafal: '', urutan: undefined, homonim: 1, entri: 'a' })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 1, homonim: 1, entri: undefined }, { lafal: '', urutan: 1, homonim: 'x', entri: 'a' })).toBeLessThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 1, homonim: 1, entri: undefined }, { lafal: '', urutan: 1, homonim: 1, entri: 'a' })).toBeLessThan(0);
    expect(bandingkanEntriKamus({ lafal: '', urutan: 1, homonim: 1, entri: 'a' }, { lafal: '', urutan: 1, homonim: 1, entri: undefined })).toBeGreaterThan(0);
  });

  it('bandingkanJenisSubentri menutup prioritas daftar dan fallback alfabet', () => {
    const urutan = ['turunan', 'gabungan', 'idiom', 'peribahasa', 'varian'];
    expect(bandingkanJenisSubentri('turunan', 'idiom', urutan)).toBeLessThan(0);
    expect(bandingkanJenisSubentri('turunan', 'xyz', urutan)).toBeLessThan(0);
    expect(bandingkanJenisSubentri('xyz', 'turunan', urutan)).toBeGreaterThan(0);
    expect(bandingkanJenisSubentri('beta', 'alfa', urutan)).toBeGreaterThan(0);
    expect(bandingkanJenisSubentri(undefined, undefined, urutan)).toBe(0);
  });

  it('formatInfoWaktuEntri menampilkan format dibuat/diubah secara aman', () => {
    const keduanya = formatInfoWaktuEntri('2026-02-17 10:20:30.000', '2026-02-18 05:00:00.000');
    expect(keduanya).toContain('Dibuat ');
    expect(keduanya).toContain('Diubah ');
    expect(keduanya).toContain('·');

    const samaPersis = formatInfoWaktuEntri('2026-02-17 10:20:30.000', '2026-02-17 10:20:30.000');
    expect(samaPersis).toContain('Dibuat ');
    expect(samaPersis).not.toContain('Diubah ');
    expect(samaPersis).not.toContain('·');

    const hanyaDibuat = formatInfoWaktuEntri('2026-02-17 10:20:30.000', null);
    expect(hanyaDibuat).toContain('Dibuat ');
    expect(hanyaDibuat).not.toContain('Diubah ');

    expect(formatInfoWaktuEntri(null, null)).toBe('');
    expect(formatInfoWaktuEntri('invalid', 'invalid')).toBe('');
  });

  it('normalisasi fallback data detail menutup cabang default untuk jenis, makna, subentri, dan entri rujuk', () => {
    mockParams = { indeks: 'route%20fallback' };
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: '',
        indeks: '',
        jenis: '',
        rujukan: true,
        entri_rujuk: 'tujuan fallback',
        entri_rujuk_indeks: '',
        makna: undefined,
        subentri: undefined,
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'Dasar' })).toHaveAttribute('href', '/kamus/bentuk/dasar');
    expect(screen.getByRole('link', { name: 'tujuan fallback' })).toHaveAttribute('href', '/kamus/detail/tujuan%20fallback');
    expect(screen.getByText('route fallback')).toBeInTheDocument();
  });

  it('array entri dengan nilai kosong menutup fallback inline makna/subentri/jenis/rujukan', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: [
          {
            id: 1,
            entri: 'entri kosong',
            indeks: 'entri-kosong',
            jenis: '',
            makna: undefined,
            subentri: undefined,
            rujukan: true,
            entri_rujuk: 'target rujuk',
            entri_rujuk_indeks: '',
          },
        ],
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'Dasar' })).toHaveAttribute('href', '/kamus/bentuk/dasar');
    expect(screen.getByRole('link', { name: 'target rujuk' })).toHaveAttribute('href', '/kamus/detail/target%20rujuk');
  });

  it('data non-array dengan entri langsung memakai fallback indeks dari entri', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'langsung',
        indeks: '',
        makna: [],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText('langsung')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dasar' })).toHaveAttribute('href', '/kamus/bentuk/dasar');
  });

  it('data non-array mengikuti prioritas entri lalu indeks pada fallback berjenjang', () => {
    let jumlahDetail = 0;
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] !== 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
        };
      }

      jumlahDetail += 1;

      if (jumlahDetail === 1) {
        return {
          isLoading: false,
          isError: false,
          data: {
            id: 77,
            entri: 'utama',
            indeks: 'cadangan',
            makna: [],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {
          id: 0,
          entri: '',
          indeks: 'cadangan',
          makna: [],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    const { rerender } = render(<KamusDetail />);
    expect(screen.getByText('utama')).toBeInTheDocument();

    rerender(<KamusDetail />);
    expect(screen.getByText('cadangan')).toBeInTheDocument();
  });

  it('fallback decode memakai indeks kosong saat route indeks tidak tersedia', () => {
    mockParams = {};
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: '',
        indeks: '',
        makna: [],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'Dasar' })).toHaveAttribute('href', '/kamus/bentuk/dasar');
  });
});
