import { render, screen } from '@testing-library/react';
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
          lema: 'kata',
          lafal: 'ka-ta',
          pemenggalan: 'ka-ta',
          jenis: 'dasar',
          makna: [{ id: 1, kelas_kata: 'n', makna: 'unsur bahasa' }],
          serupa: [
            { id: 11, lema: 'kata (1)', lafal: null },
            { lema: 'kata- (2)', lafal: 'ka.ta' },
          ],
          sublema: {
            turunan: [{ id: 7, lema: 'berkata' }],
          },
          tesaurus: { sinonim: ['ucapan'], antonim: [] },
          glosarium: [{ indonesia: 'kata kunci', asing: 'keyword' }],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('heading', { name: /kata/i })).toBeInTheDocument();
    expect(screen.getByText('/ka-ta/')).toBeInTheDocument();

    expect(screen.getByText('berkata')).toBeInTheDocument();
    expect(screen.getByText('Serupa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /kata\s*1/i })).toHaveAttribute('href', '/kamus/detail/kata%20(1)');
    expect(screen.getByRole('link', { name: /kata-\s*2/i })).toHaveAttribute('href', '/kamus/detail/kata-%20(2)');
    expect(screen.getByText('/ka.ta/')).toBeInTheDocument();
    expect(screen.getByText('Tesaurus')).toBeInTheDocument();
    expect(screen.getByText('Glosarium')).toBeInTheDocument();
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
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.getByText(/varian: aktif/i)).toBeInTheDocument();
    expect(screen.getByText('Psikologi')).toBeInTheDocument();
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
          sublema: {
            turunan: [{ id: 21, lema: 'berkata' }, { id: 22, lema: 'perkataan' }],
          },
          tesaurus: { sinonim: ['sinonim satu', 'sinonim dua'], antonim: ['antonim satu', 'antonim dua'] },
          glosarium: [
            { indonesia: 'kata dasar', asing: 'base word' },
            { indonesia: 'kata turunan', asing: 'derived word' },
          ],
        },
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
        lema: 'tanpa-makna',
        makna: [],
        sublema: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
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
        lema: 'opsional-kosong',
        makna: [
          {
            id: 99,
            kelas_kata: '-',
            makna: '',
            contoh: [{ id: 991, contoh: 'contoh saja', makna_contoh: '' }],
          },
        ],
        sublema: {},
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
        lema: 'tunggal',
        makna: [{ id: 1, kelas_kata: '-', makna: 'hanya satu makna' }],
        sublema: {},
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
        lema: 'satu-kategori',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        sublema: {},
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
        lema: 'antonim-saja',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        sublema: {},
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
        lema: 'per (1)',
        lafal: 'per (2)',
        pemenggalan: 'per (3)',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        sublema: {},
        serupa: [{ id: 2, lema: 'per- (4)', lafal: 'per (5)' }],
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);

    const supLafal = container.querySelector('.kamus-detail-heading-pronunciation sup');
    const supPemenggalan = container.querySelector('.kamus-detail-heading-split sup');
    const supSerupaLafal = container.querySelector('.secondary-text sup');

    expect(supLafal).not.toBeNull();
    expect(supLafal?.textContent).toBe('2');
    expect(supPemenggalan).not.toBeNull();
    expect(supPemenggalan?.textContent).toBe('3');
    expect(supSerupaLafal).not.toBeNull();
    expect(supSerupaLafal?.textContent).toBe('5');
  });
});
