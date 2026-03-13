import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KamusDetail from '../../../src/pages/publik/KamusDetail';
import { ambilDetailKamus, ambilKomentarKamus, simpanKomentarKamus, ambilKategoriKamus, cariGlosarium } from '../../../src/api/apiPublik';
import {
  upsertMetaTag,
  renderMarkdown,
  buatPathKategoriKamus,
  formatTitleCase,
  normalizeToken,
  buildLabelMap,
  resolveNamaLabel,
  buatPathKategoriDariLabel,
  tentukanKategoriJenis,
  bandingkanEntriKamus,
  bandingkanJenisSubentri,
  formatInfoWaktuEntri,
  shouldShowMetaSeparator,
  __private,
} from '../../../src/pages/publik/KamusDetail';

const mockUseQuery = vi.fn();
let mockParams = { indeks: 'kata' };
let mockLocation = { state: null };
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
  cariGlosarium: vi.fn().mockResolvedValue({ data: [], total: 0, pageInfo: {} }),
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
  useLocation: () => mockLocation,
}));

describe('KamusDetail', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    ambilDetailKamus.mockClear();
    ambilKomentarKamus.mockClear();
    simpanKomentarKamus.mockClear();
    ambilKategoriKamus.mockClear();
    cariGlosarium.mockClear();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });
    mockParams = { indeks: 'kata' };
    mockLocation = { state: null };
  });

  it('menampilkan loading state', () => {
    mockUseQuery.mockReturnValue({ isLoading: true, isError: false, data: null });
    render(<KamusDetail />);
    expect(screen.getByText(/Memuat detail/i)).toBeInTheDocument();
  });

  it('helper formatLabelPenyingkatanBadge memformat kode/nama penyingkatan dan mempertahankan label lain', () => {
    expect(__private.formatLabelPenyingkatanBadge('akr')).toBe('Akronim');
    expect(__private.formatLabelPenyingkatanBadge('akronim')).toBe('Akronim');
    expect(__private.formatLabelPenyingkatanBadge('kp')).toBe('Kependekan');
    expect(__private.formatLabelPenyingkatanBadge('kependekan')).toBe('Kependekan');
    expect(__private.formatLabelPenyingkatanBadge('sing')).toBe('Singkatan');
    expect(__private.formatLabelPenyingkatanBadge(' AKRONIM ')).toBe('Akronim');
    expect(__private.formatLabelPenyingkatanBadge(' singkatan ')).toBe('Singkatan');
    expect(__private.formatLabelPenyingkatanBadge()).toBe('');
  });

  it('helper ringkasLabelChip mempertahankan potongan tanpa mundur ke spasi sebelumnya', () => {
    expect(__private.ringkasLabelChip()).toBe('');
    expect(__private.ringkasLabelChip('frasa pendek', 40)).toBe('frasa pendek');
    expect(__private.ringkasLabelChip('aaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbb', 30)).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaa …');
  });

  it('helper kandidat tautan makna dan renderer makna menutup semua cabang utama', () => {
    expect(__private.ekstrakKandidatTautanMakna('')).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('*teks*')).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('(cak)')).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('tiga kata penuh')).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('kata (cak)')).toEqual({
      baseText: 'kata',
      parenthetical: ' (cak)',
    });
    expect(__private.normalisasiKunciTautanMakna('kata (2)')).toBe('kata');

    const { container } = render(
      <__private.RenderMakna
        teks="kata (cak); dua kata; *miring*"
        tautanValidSet={new Set(['kata'])}
      />
    );
    expect(screen.getByRole('link', { name: 'kata' })).toHaveAttribute('href', '/kamus/detail/kata');
    expect(screen.queryByRole('link', { name: 'dua kata' })).toBeNull();
    expect(screen.getByText('dua kata')).toBeInTheDocument();
    expect(container.querySelector('em')).not.toBeNull();
  });

  it('query detail kamus memakai placeholderData dari hasil sebelumnya', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        const previous = { entri: 'sebelumnya', makna: [], subentri: {} };
        expect(options.placeholderData(previous)).toBe(previous);
      }
      return { isLoading: true, isError: false, data: null };
    });

    render(<KamusDetail />);
  });

  it('query fallback glosarium juga memakai placeholderData dari hasil sebelumnya', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        const previous = { entri: 'sebelumnya', makna: [], subentri: {} };
        expect(options.placeholderData(previous)).toBe(previous);
        return { isLoading: false, isError: false, isFetching: false, data: null };
      }

      if (options?.queryKey?.[0] === 'glosarium-kamus-fallback') {
        const previous = { data: [{ indonesia: 'lama', asing: 'old' }] };
        expect(options.placeholderData(previous)).toBe(previous);
        if (options?.queryFn) options.queryFn();
        return { isLoading: false, isError: false, isFetching: false, data: previous };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return { isLoading: false, isError: false, isFetching: false, data: {} };
    });

    render(<KamusDetail />);
  });

  it('fallback query glosarium menormalkan indeks kosong ke string kosong', () => {
    mockParams = {};

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'glosarium-kamus-fallback') {
        if (options?.queryFn) options.queryFn();
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return { isLoading: true, isError: false, isFetching: false, data: null };
    });

    render(<KamusDetail />);

    expect(cariGlosarium).toHaveBeenCalledWith('', {
      limit: 20,
      cursor: null,
      direction: 'next',
    });
  });

  it('membuat meta tag SEO saat tag belum tersedia di head', () => {
    document.head.querySelector('meta[name="description"]')?.remove();
    document.head.querySelector('meta[property="og:title"]')?.remove();
    document.head.querySelector('meta[property="og:description"]')?.remove();
    document.head.querySelector('meta[name="twitter:title"]')?.remove();
    document.head.querySelector('meta[name="twitter:description"]')?.remove();

    mockUseQuery.mockReturnValue({ isLoading: true, isError: false, data: null });
    render(<KamusDetail />);

    expect(document.head.querySelector('meta[name="description"]')).not.toBeNull();
    expect(document.head.querySelector('meta[property="og:title"]')).not.toBeNull();
    expect(document.head.querySelector('meta[property="og:description"]')).not.toBeNull();
    expect(document.head.querySelector('meta[name="twitter:title"]')).not.toBeNull();
    expect(document.head.querySelector('meta[name="twitter:description"]')).not.toBeNull();
  });

  it('upsertMetaTag membuat tag baru saat belum ada', () => {
    document.head.querySelector('meta[property="og:test"]')?.remove();

    upsertMetaTag({ property: 'og:test', content: 'nilai-uji' });

    const tag = document.head.querySelector('meta[property="og:test"]');
    expect(tag).not.toBeNull();
    expect(tag.getAttribute('content')).toBe('nilai-uji');
  });

  it('upsertMetaTag memperbarui tag yang sudah ada', () => {
    const tag = document.createElement('meta');
    tag.setAttribute('property', 'og:uji-update');
    tag.setAttribute('content', 'lama');
    document.head.appendChild(tag);

    upsertMetaTag({ property: 'og:uji-update', content: 'baru' });

    const semuaTag = Array.from(document.head.querySelectorAll('meta[property="og:uji-update"]'));
    expect(semuaTag).toHaveLength(1);
    expect(semuaTag[0]?.getAttribute('content')).toBe('baru');
  });

  it('upsertMetaTag menangani kombinasi name+property saat membuat tag', () => {
    document.head.querySelector('meta[name="uji-meta-kombinasi"]')?.remove();

    upsertMetaTag({
      name: 'uji-meta-kombinasi',
      property: 'og:uji-meta-kombinasi',
      content: 'nilai-kombinasi',
    });

    const tag = document.head.querySelector('meta[name="uji-meta-kombinasi"]');
    expect(tag).not.toBeNull();
    expect(tag?.getAttribute('property')).toBe('og:uji-meta-kombinasi');
    expect(tag?.getAttribute('content')).toBe('nilai-kombinasi');
  });

  it('menampilkan not found state tanpa saran', () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true, data: null, error: new Error('Entri tidak ditemukan') });
    render(<KamusDetail />);
    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Kembali ke pencarian/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Komentar/i }).length).toBeGreaterThan(0);
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
          tautan_indonesia_valid: ['kata kunci'],
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
    expect(screen.getByText('ka-ta')).toBeInTheDocument();
    expect(screen.getByText('/ka-ta/')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Nomina/i })).toBeInTheDocument();

    expect(screen.getByText('berkata')).toBeInTheDocument();
    expect(screen.getByText('Tesaurus')).toBeInTheDocument();
    expect(screen.getByText('Glosarium')).toBeInTheDocument();
    expect(ambilDetailKamus).toHaveBeenCalledWith('kata', {
      glosariumLimit: 20,
      glosariumCursor: null,
      glosariumDirection: 'next',
      sumberPelacakan: null,
    });
  });

  it('cuplikan glosarium di detail kamus hanya menautkan istilah Indonesia yang valid', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          entri: 'kata',
          makna: [],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          tautan_indonesia_valid: ['istilah'],
          glosarium: [{ indonesia: 'istilah; data (ark)', asing: 'term' }],
          glosarium_page: { total: 1, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'istilah' })).toHaveAttribute('href', '/kamus/detail/istilah');
    expect(screen.queryByRole('link', { name: 'data' })).toBeNull();
    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'term' })).toHaveAttribute('href', '/glosarium/detail/term');
  });

  it('menampilkan toggle +x lainnya dan memungkinkan ringkas via klik badge jumlah', () => {
    const daftarTurunan = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      entri: `kata-${index + 1}`,
    }));

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
          jenis: 'dasar',
          makna: [{ id: 1, kelas_kata: 'n', makna: 'unsur bahasa' }],
          subentri: {
            turunan: daftarTurunan,
          },
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('button', { name: '+2 lainnya' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'kata-10' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+2 lainnya' }));

    expect(screen.getByRole('link', { name: 'kata-10' })).toHaveAttribute('href', '/kamus/detail/kata-10');
    expect(screen.queryByRole('button', { name: '+2 lainnya' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\(10\)/ }));

    expect(screen.queryByRole('link', { name: 'kata-10' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+2 lainnya' })).toBeInTheDocument();
  });

  it('tidak menautkan kata awal jika keseluruhan makna lebih dari dua kata', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'meja',
          makna: [
            {
              id: 1,
              kelas_kata: 'n',
              makna: 'perkakas (perabot) rumah yang mempunyai bidang datar sebagai daun mejanya',
            },
          ],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText(/perkakas \(perabot\) rumah yang mempunyai bidang datar/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'perkakas' })).not.toBeInTheDocument();
  });

  it('tetap menautkan makna segmen pendek satu sampai dua kata', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'alat',
          tautan_makna_valid: ['perkakas'],
          makna: [
            {
              id: 1,
              kelas_kata: 'n',
              makna: 'perkakas',
            },
          ],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'perkakas' })).toHaveAttribute('href', '/kamus/detail/perkakas');
  });

  it('menampilkan navigasi indeks sebelumnya dan sesudahnya saat tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'meja',
          entri: [
            {
              id: 100,
              entri: 'meja',
              indeks: 'meja',
              jenis: 'dasar',
              makna: [{ id: 1, makna: 'perabot untuk menaruh barang' }],
              subentri: {},
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
          navigasi: {
            prev: { indeks: 'medan', label: 'medan' },
            next: { indeks: 'mekar', label: 'mekar' },
          },
        },
      };
    });

    render(<KamusDetail />);

    const linkPrev = screen.getByRole('link', { name: /medan/i });
    const linkNext = screen.getByRole('link', { name: /mekar/i });

    expect(linkPrev).toHaveAttribute('href', '/kamus/detail/medan');
    expect(linkNext).toHaveAttribute('href', '/kamus/detail/mekar');
    expect(linkPrev).toHaveAttribute('title', 'medan');
    expect(linkNext).toHaveAttribute('title', 'mekar');
  });

  it('menampilkan placeholder kosong saat navigasi hanya punya next', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'meja',
          entri: [
            {
              id: 100,
              entri: 'meja',
              indeks: 'meja',
              jenis: 'dasar',
              makna: [{ id: 1, makna: 'perabot untuk menaruh barang' }],
              subentri: {},
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
          navigasi: {
            prev: null,
            next: { indeks: 'mekar', label: 'mekar' },
          },
        },
      };
    });

    const { container } = render(<KamusDetail />);
    const nav = screen.getByRole('navigation', { name: 'Navigasi indeks kamus' });

    expect(screen.getByRole('link', { name: /mekar/i })).toHaveAttribute('href', '/kamus/detail/mekar');
    expect(container.querySelector('.kamus-detail-sekuens-link-prev')).toBeNull();
    expect(nav.firstElementChild?.tagName).toBe('SPAN');
  });

  it('navigasi indeks memakai fallback indeks saat label tidak tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'meja',
          entri: [
            {
              entri: 'meja',
              indeks: 'meja',
              jenis: 'dasar',
              makna: [{ id: 1, makna: 'perabot untuk menaruh barang' }],
              subentri: {
                '': [
                  { entri: 'pepatah satu' },
                  { entri: 'pepatah dua' },
                  { entri: 'pepatah tiga' },
                  { entri: 'pepatah empat' },
                  { entri: 'pepatah lima' },
                ],
              },
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
          navigasi: {
            prev: { indeks: 'medan' },
            next: { indeks: 'mekar' },
          },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: /medan/i })).toHaveAttribute('title', 'medan');
    expect(screen.getByRole('link', { name: /mekar/i })).toHaveAttribute('title', 'mekar');
    expect(screen.getByRole('link', { name: /medan/i })).toHaveTextContent('medan');
    expect(screen.getByRole('link', { name: /mekar/i })).toHaveTextContent('mekar');
    expect(document.getElementById('subentri-0-jenis')).not.toBeNull();
  });

  it('navigasi indeks memakai fallback label saat indeks tidak tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'meja',
          entri: [
            {
              id: 100,
              entri: 'meja',
              indeks: 'meja',
              jenis: 'dasar',
              makna: [{ id: 1, makna: 'perabot untuk menaruh barang' }],
              subentri: {},
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
          navigasi: {
            prev: { label: 'medan' },
            next: { label: 'mekar' },
          },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: /medan/i })).toHaveAttribute('href', '/kamus/detail/medan');
    expect(screen.getByRole('link', { name: /mekar/i })).toHaveAttribute('href', '/kamus/detail/mekar');
  });

  it('menyaring tagar entri agar hanya item valid yang ditampilkan', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'menguji',
          entri: [
            {
              id: 101,
              entri: 'menguji',
              indeks: 'menguji',
              jenis: 'turunan',
              tagar: [null, 'teks', { nama: 'tanpa-kode', kode: '' }, { nama: '', kode: 'me' }, { nama: 'prefiks me', kode: 'me' }],
              makna: [{ id: 1, makna: 'melakukan uji' }],
              subentri: {},
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('prefiks me')).toBeInTheDocument();
    expect(screen.queryByText('tanpa-kode')).not.toBeInTheDocument();
  });

  it('menampilkan subentri Etimologi dengan badge bahasa, kata_asal miring, dan badge sumber', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return {
          isLoading: false,
          isError: false,
          data: {
            bahasa: [{ kode: 'belanda', nama: 'Belanda' }],
          },
        };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'adjektif',
          entri: [
            {
              id: 158,
              entri: 'adjektif',
              indeks: 'adjektif',
              jenis: 'dasar',
              makna: [],
              subentri: {},
              etimologi: [{ id: 1, bahasa: 'Belanda', kata_asal: 'adjectief', sumber_kode: 'LWIM', aktif: true }],
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('Etimologi')).toBeInTheDocument();
    const badgeBahasa = screen.getByText('Belanda');
    expect(badgeBahasa).toHaveClass('kamus-badge-bahasa');
    expect(screen.getByText('adjectief').closest('em')).not.toBeNull();
    const badgeSumber = screen.getByText('LWIM');
    expect(badgeSumber).toHaveClass('badge-sumber');
  });

  it('menampilkan aksi redaksi dan tautan rujukan KBBI saat admin dan indeks tersedia', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      adalahAdmin: true,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'kata',
          indeks: 'kata',
          id: 99,
          jenis: 'dasar',
          makna: [{ id: 1, makna: 'arti' }],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByLabelText('Sunting entri di Redaksi')).toHaveAttribute('href', '/redaksi/kamus/99');
    expect(screen.getByLabelText('Buka rujukan KBBI di tab baru')).toHaveAttribute(
      'href',
      'https://kbbi.kemendikdasmen.go.id/entri/kata'
    );
  });

  it('admin menampilkan edit etimologi dan tidak menampilkan edit entri saat id entri tidak ada', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      adalahAdmin: true,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          indeks: 'kata',
          entri: [{
            entri: 'kata',
            indeks: 'kata',
            jenis: 'dasar',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            etimologi: [{ id: 5, bahasa: 'Belanda', kata_asal: 'adjectief', sumber_kode: 'LWIM', aktif: true }],
          }],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByLabelText('Sunting etimologi di Redaksi')).toHaveAttribute('href', '/redaksi/etimologi/5');
    expect(screen.queryByLabelText('Sunting entri di Redaksi')).not.toBeInTheDocument();
  });

  it('menampilkan pemisah metadata saat info waktu dan sumber entri tersedia', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          indeks: 'kata',
          entri: [{
            entri: 'kata',
            indeks: 'kata',
            jenis: 'dasar',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            created_at: '2026-02-01 10:00:00',
            sumber_kode: 'KBBI',
          }],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('KBBI')).toBeInTheDocument();
    expect(screen.getByText('·')).toBeInTheDocument();
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
          kiasan: true,
          bahasa: 'Arab',
          makna: 'contoh <b>makna</b>',
          penyingkatan: 'akr',
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
      tautan_makna_valid: ['kata dasar', 'sinonim satu', 'antonim satu', 'sinonim dua'],
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

    const { rerender, container } = render(<KamusDetail />);

    expect(screen.getByText(/Lihat/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'aktif' })).toHaveAttribute('href', '/kamus/detail/aktif');

    rerender(<KamusDetail />);

    expect(screen.getByRole('heading', { name: /kata/i })).toBeInTheDocument();
    expect(screen.getByText('ka ta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Turunan' })).toHaveAttribute('href', '/kamus/bentuk/turunan');
    expect(screen.getAllByRole('link', { name: 'kata dasar' }).some((link) => link.getAttribute('href') === '/kamus/detail/kata%20dasar')).toBe(true);
    expect(screen.getByRole('link', { name: 'cak' })).toHaveAttribute('href', '/kamus/ragam/cak');
    expect(screen.getByRole('link', { name: 'slang' })).toHaveAttribute('href', '/kamus/ragam/slang');
    expect(screen.getByRole('link', { name: 'Kiasan' })).toHaveAttribute('href', '/kamus/ekspresi/kiasan');
    expect(screen.getByRole('link', { name: 'Arab' })).toHaveAttribute('href', '/kamus/bahasa/arab');
    expect(screen.getByRole('link', { name: 'Akronim' })).toHaveAttribute('href', '/kamus/bentuk/akronim');
    expect(screen.getByText('species', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText(/arti contoh/i)).toBeInTheDocument();
    const daftarMaknaBernomor = container.querySelector('.kamus-detail-def-list');
    expect(daftarMaknaBernomor).not.toBeNull();
    expect(daftarMaknaBernomor?.querySelectorAll('li').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Tesaurus')).toBeInTheDocument();
    expect(screen.getByText('Sinonim:')).toBeInTheDocument();
    expect(screen.getByText('Antonim:')).toBeInTheDocument();
    expect(screen.getByText('Sinonim:').closest('li')).not.toBeNull();
    expect(screen.getByText('Antonim:').closest('li')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'sinonim satu' })).toHaveAttribute('href', '/kamus/detail/sinonim%20satu');
    expect(screen.getByRole('link', { name: 'antonim satu' })).toHaveAttribute('href', '/kamus/detail/antonim%20satu');
    expect(screen.getByRole('link', { name: 'sinonim dua' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'antonim dua' })).toBeNull();
    expect(screen.getByText('antonim dua')).toBeInTheDocument();
    expect(screen.getByText('Glosarium')).toBeInTheDocument();
    expect(screen.getByText('base word')).toBeInTheDocument();
    expect(screen.getByText('derived word')).toBeInTheDocument();
  });

  it('navigasi glosarium prev/next meneruskan cursor dan direction ke query detail', async () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        if (options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: false,
          isFetching: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [{ indonesia: 'kata dasar', asing: 'base word' }],
            glosarium_page: {
              total: 10,
              hasPrev: true,
              hasNext: true,
              prevCursor: 'cur-prev',
              nextCursor: 'cur-next',
            },
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    render(<KamusDetail />);

    const tombolPrev = screen.getByRole('button', { name: '‹' });
    const tombolNext = screen.getByRole('button', { name: '›' });

    fireEvent.click(tombolPrev);
    await waitFor(() => {
      expect(ambilDetailKamus).toHaveBeenLastCalledWith('kata', {
        glosariumLimit: 20,
        glosariumCursor: 'cur-prev',
        glosariumDirection: 'prev',
        sumberPelacakan: null,
      });
    });

    fireEvent.click(tombolNext);
    await waitFor(() => {
      expect(ambilDetailKamus).toHaveBeenLastCalledWith('kata', {
        glosariumLimit: 20,
        glosariumCursor: 'cur-next',
        glosariumDirection: 'next',
        sumberPelacakan: null,
      });
    });
  });

  it('meneruskan sumber pelacakan susun-kata ke query detail', async () => {
    mockLocation = { state: { sumberPelacakan: 'susun-kata' } };

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        if (options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: false,
          isFetching: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return { isLoading: false, isError: false, data: {} };
    });

    render(<KamusDetail />);

    await waitFor(() => {
      expect(ambilDetailKamus).toHaveBeenCalledWith('kata', {
        glosariumLimit: 20,
        glosariumCursor: null,
        glosariumDirection: 'next',
        sumberPelacakan: 'susun-kata',
      });
    });
  });

  it('render tagar subentri tetap aman saat id tagar kosong', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: [
              {
                id: 77,
                entri: 'kata',
                makna: [{ id: 1, makna: 'arti' }],
                tagar: [{ id: null, kode: 'me-', nama: 'me-' }],
                subentri: {},
              },
            ],
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return { isLoading: false, isError: false, data: {} };
    });

    render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'me-' })).toHaveAttribute('href', '/kamus/tagar/me-');
  });

  it('menampilkan teks rujukan bentuk tidak baku dan menyortir subentri bentuk_tidak_baku', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: [
              {
                id: 99,
                entri: 'aktip',
                jenis_rujuk: '→',
                entri_rujuk: 'aktif',
                entri_rujuk_indeks: 'aktif',
                makna: [],
                subentri: {
                  bentuk_tidak_baku: [
                    { id: 2, entri: 'zeta', indeks: 'zeta' },
                    { id: 1, entri: 'alpha', indeks: 'alpha' },
                  ],
                },
              },
            ],
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('Bentuk tidak baku dari')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    const alphaIndex = links.findIndex((link) => link.textContent === 'alpha');
    const zetaIndex = links.findIndex((link) => link.textContent === 'zeta');
    expect(alphaIndex).toBeGreaterThanOrEqual(0);
    expect(zetaIndex).toBeGreaterThanOrEqual(0);
    expect(alphaIndex).toBeLessThan(zetaIndex);
  });

  it('sorting bentuk_tidak_baku tetap aman saat sebagian entri kosong', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: [
              {
                id: 199,
                entri: 'aktip',
                makna: [],
                subentri: {
                  bentuk_tidak_baku: [
                    { id: 21, entri: 'zeta', indeks: 'zeta' },
                    { id: 20, entri: '', indeks: '' },
                    { id: 22, entri: 'alpha', indeks: 'alpha' },
                  ],
                },
              },
            ],
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    render(<KamusDetail />);

    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.textContent === 'alpha')).toBe(true);
    expect(links.some((link) => link.textContent === 'zeta')).toBe(true);
  });

  it('mengeksekusi fallback key default untuk entri, makna, contoh, subentri, dan komentar', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          isFetching: false,
          data: {
            entri: [
              {
                jenis: 'dasar',
                makna: [
                  {
                    kelas_kata: 'n',
                    makna: 'makna fallback id kosong',
                    contoh: [],
                  },
                  {
                    kelas_kata: 'n',
                    contoh: [{ makna_contoh: 'makna contoh fallback' }],
                  },
                ],
                subentri: {
                  turunan: [{}],
                },
              },
            ],
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: {
              loggedIn: true,
              activeCount: 1,
              komentar: [
                {
                  komentar: 'komentar fallback key',
                  pengguna_nama: '',
                },
              ],
            },
          },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('makna fallback id kosong')).toBeInTheDocument();
    expect(screen.getByText(/makna contoh fallback/i)).toBeInTheDocument();
    expect(screen.getByText('komentar fallback key')).toBeInTheDocument();
  });

  it('glosarium menerima bentuk object.data serta klik prev/next no-op saat cursor kosong', async () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        if (options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: false,
          isFetching: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: { data: [{ indonesia: 'kata teknis', asing: 'technical term' }] },
            glosarium_page: {
              total: 1,
              hasPrev: true,
              hasNext: true,
              prevCursor: null,
              nextCursor: null,
            },
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('kata teknis')).toBeInTheDocument();
    expect(ambilDetailKamus).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '‹' }));
    fireEvent.click(screen.getByRole('button', { name: '›' }));

    await waitFor(() => {
      expect(ambilDetailKamus).toHaveBeenCalledTimes(1);
    });
  });

  it('glosarium tanpa indonesia tidak menampilkan pemisah titik dua setelah asing', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        if (options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: false,
          isFetching: false,
          data: {
            entri: 'kata',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [{ indonesia: '', asing: 'alpha term' }],
            glosarium_page: {
              total: 1,
              hasPrev: false,
              hasNext: false,
              prevCursor: null,
              nextCursor: null,
            },
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    const { container } = render(<KamusDetail />);

    expect(screen.getByRole('link', { name: 'alpha term' })).toHaveAttribute('href', '/glosarium/detail/alpha%20term');
    expect(container.textContent).not.toContain('alpha term:');
  });

  it('glosarium menampilkan overlay hanya saat navigasi aktif dan tombol tetap simbol', async () => {
    let isFetchingState = false;

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        if (options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: false,
          isFetching: isFetchingState,
          data: {
            entri: 'kata',
            makna: [{ id: 1, makna: 'arti' }],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [{ indonesia: 'kata teknis', asing: 'technical term' }],
            glosarium_page: {
              total: 1,
              hasPrev: true,
              hasNext: true,
              prevCursor: 'prev-1',
              nextCursor: 'next-1',
            },
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    const { container, rerender } = render(<KamusDetail />);

    isFetchingState = true;
    rerender(<KamusDetail />);
    expect(screen.queryByText('Memuat glosarium …')).not.toBeInTheDocument();
    expect(screen.queryByText('Memuat glosarium …')).not.toBeInTheDocument();

    isFetchingState = false;
    rerender(<KamusDetail />);

    fireEvent.click(screen.getByRole('button', { name: '‹' }));
    isFetchingState = true;
    rerender(<KamusDetail />);
    await waitFor(() => {
      expect(screen.getByText('Memuat glosarium …')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '‹' })).toHaveTextContent('‹');
    });

    isFetchingState = false;
    rerender(<KamusDetail />);
    fireEvent.click(screen.getByRole('button', { name: '›' }));
    isFetchingState = true;
    rerender(<KamusDetail />);
    await waitFor(() => {
      expect(screen.getByText('Memuat glosarium …')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '›' })).toHaveTextContent('›');
    });

    expect(container.querySelector('.rima-heading-nav-button svg.animate-spin')).toBeNull();
  });

  it('mode not found menjalankan query fallback glosarium dan navigasi prev/next', async () => {
    mockParams = { indeks: 'kata%20hilang' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        if (options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: true,
          isFetching: false,
          data: null,
          error: new Error('not found'),
        };
      }

      if (options?.queryKey?.[0] === 'glosarium-kamus-fallback') {
        if (options?.enabled !== false && options?.queryFn) options.queryFn();
        return {
          isLoading: false,
          isError: false,
          isFetching: false,
          data: {
            data: [
              { indonesia: 'istilah fallback', asing: 'fallback term' },
              { indonesia: 'tanpa asing' },
            ],
            total: 2,
            pageInfo: {
              hasPrev: true,
              hasNext: true,
              prevCursor: 'fb-prev',
              nextCursor: 'fb-next',
            },
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: false, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }

      return {
        isLoading: false,
        isError: false,
        data: {},
      };
    });

    render(<KamusDetail />);

    expect(cariGlosarium).toHaveBeenCalledWith('kata hilang', {
      limit: 20,
      cursor: null,
      direction: 'next',
    });
    expect(screen.getByText('tanpa asing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '‹' }));
    await waitFor(() => {
      expect(cariGlosarium).toHaveBeenLastCalledWith('kata hilang', {
        limit: 20,
        cursor: 'fb-prev',
        direction: 'prev',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: '›' }));
    await waitFor(() => {
      expect(cariGlosarium).toHaveBeenLastCalledWith('kata hilang', {
        limit: 20,
        cursor: 'fb-next',
        direction: 'next',
      });
    });
  });

  it('mengurutkan komentar saat waktu sama berdasarkan id dan menampilkan info waktu entri', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-detail') {
        return {
          isLoading: false,
          isError: false,
          data: {
            entri: 'kata',
            created_at: '2026-02-01T00:00:00.000Z',
            updated_at: null,
            makna: [],
            subentri: {},
            tesaurus: { sinonim: [], antonim: [] },
            glosarium: [],
          },
        };
      }

      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          data: {
            data: {
              loggedIn: true,
              activeCount: 2,
              komentar: [
                { id: 1, pengguna_nama: 'A', komentar: 'Komentar Lama', updated_at: '2026-02-01T10:00:00.000Z', created_at: '2026-02-01T10:00:00.000Z' },
                { id: 2, pengguna_nama: 'B', komentar: 'Komentar Baru', updated_at: '2026-02-01T10:00:00.000Z', created_at: '2026-02-01T10:00:00.000Z' },
              ],
            },
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }

      return {
        data: { 'kelas-kata': [], ragam: [], bidang: [], bahasa: [] },
        isLoading: false,
        isError: false,
      };
    });

    render(<KamusDetail />);

    const komentarNodes = screen.getAllByText(/Komentar (Baru|Lama)/i);
    expect(komentarNodes[0]).toHaveTextContent('Komentar Baru');
    expect(screen.getByText(/Dibuat/i)).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Masuk untuk Berkomentar' })).toBeInTheDocument();
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
    expect(screen.getByPlaceholderText('Tulis komentar …')).toBeInTheDocument();
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

    fireEvent.change(screen.getByPlaceholderText('Tulis komentar …'), {
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

    fireEvent.change(screen.getByPlaceholderText('Tulis komentar …'), {
      target: { value: 'Komentar gagal' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim komentar' }));

    await waitFor(() => {
      expect(screen.getByText('Gagal menyimpan komentar. Silakan coba lagi.')).toBeInTheDocument();
    });
  });

  it('klik tombol login Google memanggil loginDenganGoogle pada kedua mode teaser', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Masuk untuk Berkomentar' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Masuk untuk Berkomentar' }));

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
    expect(screen.queryByRole('link', { name: /Kembali ke pencarian/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Komentar/i }).length).toBeGreaterThan(0);
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

  it('menyembunyikan teks makna kosong saat subentri tersedia', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'fallback-subentri',
        makna: [],
        subentri: {
          turunan: [{ id: 501, entri: 'menjuang', indeks: 'menjuang' }],
        },
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    render(<KamusDetail />);

    expect(screen.queryByText('Belum tersedia.')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Turunan (1)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'menjuang' })).toHaveAttribute('href', '/kamus/detail/menjuang');
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

  it('tidak menampilkan nomor saat hanya satu makna', () => {
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

    const { container } = render(<KamusDetail />);

    const daftarMaknaBernomor = container.querySelector('.kamus-detail-def-list');
    expect(daftarMaknaBernomor).toBeNull();
    expect(container.querySelector('.kamus-detail-def-number')).toBeNull();
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
        tautan_makna_valid: ['setara'],
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
        tautan_makna_valid: ['lawan kata'],
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

  it('menampilkan superskrip untuk lafal dan pemenggalan di metadata heading detail', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'per (1)',
        lafal: 'pêr (2)',
        pemenggalan: 'pe.r (3)',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);

    const superskrip = Array.from(container.querySelectorAll('.kamus-detail-heading-meta sup'))
      .map((node) => node.textContent)
      .filter(Boolean)
      .sort();

    expect(superskrip).toEqual(['2', '3']);
  });

  it('menampilkan pemenggalan meski sama dengan entri/indeks, tapi menyembunyikan lafal jika sama', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: 'per (1)',
        indeks: 'per (2)',
        lafal: 'per (3)',
        pemenggalan: 'per (4)',
        makna: [{ id: 1, kelas_kata: '-', makna: 'makna contoh' }],
        subentri: {},
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);

    const metaRow = container.querySelector('.kamus-detail-heading-meta');
    expect(metaRow).not.toBeNull();
    expect(metaRow.querySelector('[title="Pemenggalan"]')).not.toBeNull();
    expect(metaRow.querySelector('[title="Pelafalan"]')).toBeNull();
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

  it('mengurutkan subentri bentuk tidak baku secara alfabetis dan menampilkannya sebagai tautan', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: [
          {
            id: 1,
            entri: 'kelambai',
            indeks: 'kelambai',
            jenis: 'dasar',
            makna: [{ id: 11, kelas_kata: null, makna: 'contoh makna' }],
            subentri: {
              bentuk_tidak_baku: [
                { id: 2, entri: 'Kulambai', indeks: 'kulambai' },
                { id: 3, entri: 'gelembai', indeks: 'gelembai' },
                { id: 4, entri: 'gedembai' },
              ],
            },
          },
        ],
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);

    const subentryLinks = Array.from(container.querySelectorAll('.kamus-detail-subentry-chip-list a.kamus-detail-subentry-chip-link'))
      .map((el) => ({ text: (el.textContent || '').trim(), href: el.getAttribute('href') }));

    expect(subentryLinks).toEqual([
      { text: 'gedembai', href: '/kamus/detail/gedembai' },
      { text: 'gelembai', href: '/kamus/detail/gelembai' },
      { text: 'Kulambai', href: '/kamus/detail/kulambai' },
    ]);
  });

  it('memendekkan label subentri peribahasa panjang dengan spasi sebelum elipsis', () => {
    const peribahasaPanjang = 'hujan emas di negeri orang, hujan batu di negeri sendiri, baik jua di negeri sendiri';

    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        entri: [
          {
            id: 1,
            entri: 'hujan',
            indeks: 'hujan',
            jenis: 'dasar',
            makna: [{ id: 11, kelas_kata: null, makna: 'contoh makna' }],
            subentri: {
              peribahasa: [
                { id: 2, entri: peribahasaPanjang, indeks: peribahasaPanjang },
              ],
            },
          },
        ],
        tesaurus: { sinonim: [], antonim: [] },
        glosarium: [],
      },
    });

    const { container } = render(<KamusDetail />);
    const linkPeribahasa = container.querySelector('.kamus-detail-subentry-chip-list a.kamus-detail-subentry-chip-link');

    expect(linkPeribahasa).not.toBeNull();
    const teks = (linkPeribahasa?.textContent || '').trim();
    expect(teks.endsWith(' …')).toBe(true);
    expect(linkPeribahasa?.getAttribute('title')).toBe(peribahasaPanjang);
    expect(linkPeribahasa?.getAttribute('href')).toBe('/kamus/detail/hujan%20emas%20di%20negeri%20orang%2C%20hujan%20batu%20di%20negeri%20sendiri%2C%20baik%20jua%20di%20negeri%20sendiri');
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

  it('menampilkan etimologi dengan bahasa kosong dan kata_asal kosong memunculkan tanda pisah', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: { bahasa: [] } };
      }

      return {
        isLoading: false,
        isError: false,
        isFetching: false,
        data: {
          indeks: 'kata',
          entri: [
            {
              id: 10,
              entri: 'kata',
              indeks: 'kata',
              jenis: 'dasar',
              makna: [],
              subentri: {},
              etimologi: [
                { id: null, bahasa: '', kata_asal: '', sumber_kode: '', aktif: true },
                { id: 2, bahasa: 'Inggris', kata_asal: 'word', sumber_kode: 'KBBI', aktif: true },
              ],
            },
          ],
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
          glosarium_page: { total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('Etimologi')).toBeInTheDocument();
    const semuaEm = document.querySelectorAll('em');
    const teksEm = Array.from(semuaEm).map((el) => el.textContent);
    expect(teksEm.some((t) => t === '—')).toBe(true);
    expect(teksEm.some((t) => t === 'word')).toBe(true);
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
            homograf: 3,
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
            homograf: 2,
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
            homograf: 1,
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
            homograf: 1,
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
            homograf: 1,
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
    expect(tentukanKategoriJenis('prakategorial')).toBe('bentuk');
    expect(tentukanKategoriJenis('')).toBe('bentuk');
    expect(tentukanKategoriJenis('lain')).toBe('bentuk');
  });

  it('bandingkanEntriKamus menutup cabang prioritas homograf, homonim, dan alfabet', () => {
    expect(bandingkanEntriKamus({ homograf: 2 }, { homograf: 1 })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ homograf: 1, homonim: 2 }, { homograf: 1, homonim: 1 })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ homograf: 1, homonim: 1, entri: 'b' }, { homograf: 1, homonim: 1, entri: 'a' })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ homograf: undefined, homonim: 'abc', entri: undefined }, { homograf: null, homonim: null, entri: undefined })).toBeGreaterThan(0);
    expect(bandingkanEntriKamus({ homograf: 1, homonim: 1, entri: undefined }, { homograf: 1, homonim: 'x', entri: 'a' })).toBeLessThan(0);
    expect(bandingkanEntriKamus({ homograf: 1, homonim: 1, entri: undefined }, { homograf: 1, homonim: 1, entri: 'a' })).toBeLessThan(0);
    expect(bandingkanEntriKamus({ homograf: 1, homonim: 1, entri: 'a' }, { homograf: 1, homonim: 1, entri: undefined })).toBeGreaterThan(0);
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

  it('shouldShowMetaSeparator menutup semua cabang logika', () => {
    expect(shouldShowMetaSeparator('', 'KBBI', false, null)).toBe(false);
    expect(shouldShowMetaSeparator('Dibuat 01 Jan', 'KBBI', false, null)).toBe(true);
    expect(shouldShowMetaSeparator('Dibuat 01 Jan', '', true, 10)).toBe(true);
    expect(shouldShowMetaSeparator('Dibuat 01 Jan', '', true, 0)).toBe(false);
    expect(shouldShowMetaSeparator('Dibuat 01 Jan', '', false, 10)).toBe(false);
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

  it('helper label dan path kategori menutup cabang fallback nilai kosong', () => {
    expect(resolveNamaLabel('', {})).toBe('');
    expect(resolveNamaLabel('n', { n: 'Nomina' })).toBe('Nomina');
    expect(buatPathKategoriDariLabel('kelas', '', {})).toBe('/kamus');
    expect(buatPathKategoriDariLabel('kelas', 'n', { n: 'Kata Benda' })).toBe('/kamus/kelas/kata-benda');
  });

  it('bandingkanEntriKamus menutup fallback nilai non-numerik homograf/homonim', () => {
    const lebihAwal = bandingkanEntriKamus(
      { entri: 'beta', homograf: undefined, homonim: undefined },
      { entri: 'alfa', homograf: undefined, homonim: undefined }
    );

    expect(lebihAwal).toBeGreaterThan(0);
  });

  it('submit komentar kosong berhenti lebih awal tanpa memanggil API', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: { data: { loggedIn: true, activeCount: 0, komentar: [] } },
          refetch: vi.fn(),
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'kata',
          makna: [{ id: 1, makna: 'arti' }],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    const form = screen.getByRole('button', { name: /kirim komentar/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(simpanKomentarKamus).not.toHaveBeenCalled();
    });
  });

  it('mengurutkan komentar aman saat timestamp/id tidak tersedia', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: {
              loggedIn: true,
              activeCount: 2,
              komentar: [
                { id: 1, nama: 'A', komentar: 'satu', created_at: undefined, updated_at: undefined },
                { id: 2, nama: 'B', komentar: 'dua', created_at: null, updated_at: null },
              ],
            },
          },
          refetch: vi.fn(),
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'kata',
          makna: [{ id: 1, makna: 'arti' }],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('satu')).toBeInTheDocument();
    expect(screen.getByText('dua')).toBeInTheDocument();
  });

  it('mengurutkan komentar dengan fallback id falsy saat waktu sama', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: {
              loggedIn: true,
              activeCount: 2,
              komentar: [
                { id: 0, pengguna_nama: 'A', komentar: 'id nol', updated_at: '2026-02-01T10:00:00.000Z', created_at: '2026-02-01T10:00:00.000Z' },
                { id: null, pengguna_nama: 'B', komentar: 'id null', updated_at: '2026-02-01T10:00:00.000Z', created_at: '2026-02-01T10:00:00.000Z' },
              ],
            },
          },
          refetch: vi.fn(),
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'kata',
          makna: [{ id: 1, makna: 'arti' }],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    expect(screen.getByText('id nol')).toBeInTheDocument();
    expect(screen.getByText('id null')).toBeInTheDocument();
  });

  it('mengurutkan komentar berdasarkan waktu terbaru saat timestamp berbeda', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle: vi.fn(),
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'kamus-kategori') {
        return { isLoading: false, isError: false, data: {} };
      }
      if (options?.queryKey?.[0] === 'kamus-komentar') {
        return {
          isLoading: false,
          isError: false,
          data: {
            data: {
              loggedIn: true,
              activeCount: 2,
              komentar: [
                { id: 1, pengguna_nama: 'A', komentar: 'lebih lama', updated_at: '2026-02-01T10:00:00.000Z', created_at: '2026-02-01T10:00:00.000Z' },
                { id: 2, pengguna_nama: 'B', komentar: 'lebih baru', updated_at: '2026-02-01T11:00:00.000Z', created_at: '2026-02-01T11:00:00.000Z' },
              ],
            },
          },
          refetch: vi.fn(),
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          entri: 'kata',
          makna: [{ id: 1, makna: 'arti' }],
          subentri: {},
          tesaurus: { sinonim: [], antonim: [] },
          glosarium: [],
        },
      };
    });

    render(<KamusDetail />);

    const komentarNodes = screen.getAllByText(/lebih (baru|lama)/i);
    expect(komentarNodes[0]).toHaveTextContent('lebih baru');
  });
});
