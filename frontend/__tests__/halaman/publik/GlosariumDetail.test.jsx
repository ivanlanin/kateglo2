import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlosariumDetail from '../../../src/halaman/publik/GlosariumDetail';
import { __private } from '../../../src/halaman/publik/GlosariumDetail';
import { upsertMetaTag } from '../../../src/halaman/publik/GlosariumDetail';
import { ambilDetailGlosarium } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = { asing: 'zero%20sum' };
let mockAuth = { adalahAdmin: false };
let queryState = {
  data: undefined,
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null,
};

vi.mock('../../../src/api/apiPublik', () => ({
  ambilDetailGlosarium: vi.fn().mockResolvedValue({}),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuth,
}));

describe('GlosariumDetail', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    ambilDetailGlosarium.mockClear();
    mockParams = { asing: 'zero%20sum' };
    mockAuth = { adalahAdmin: false };
    queryState = {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    };

    document.title = 'Kateglo';
    document.head.querySelector('meta[name="description"]')?.remove();
    document.head.querySelector('meta[property="og:title"]')?.remove();
    document.head.querySelector('meta[property="og:description"]')?.remove();
    document.head.querySelector('meta[name="twitter:title"]')?.remove();
    document.head.querySelector('meta[name="twitter:description"]')?.remove();

    mockUseQuery.mockImplementation((options) => {
      if (options?.placeholderData) {
        const previousData = { persis: [{ id: 'prev' }] };
        expect(options.placeholderData(previousData)).toBe(previousData);
      }
      if (options?.enabled !== false && options?.queryFn) {
        options.queryFn();
      }
      return queryState;
    });
  });

  it('menampilkan loading dan error feedback', () => {
    queryState = { data: undefined, isLoading: true, isFetching: false, isError: false, error: null };
    const { rerender } = render(<GlosariumDetail />);
    expect(screen.getByText('Memuat …')).toBeInTheDocument();

    queryState = { data: undefined, isLoading: false, isFetching: false, isError: true, error: new Error('gagal') };
    rerender(<GlosariumDetail />);
    expect(screen.getByText('Gagal mengambil data.')).toBeInTheDocument();
  });

  it('helper sortAlirEntriItems mengurutkan bidang lalu label dengan fallback kosong', () => {
    const sorted = __private.sortAlirEntriItems([
      { id: 3, bidang: '', asing: 'zeta', indonesia: 'zeta' },
      { id: 1, bidang: 'Kimia', asing: 'asam', indonesia: 'asam' },
      { id: 2, bidang: 'Biologi', asing: '', indonesia: 'akar' },
      { id: 4, bidang: '', asing: '', indonesia: 'alfa' },
    ]);

    expect(sorted.map((item) => item.id)).toEqual([2, 1, 4, 3]);

    const sortedBidangSama = __private.sortAlirEntriItems([
      { id: 11, bidang: 'Biologi', asing: 'zeta', indonesia: '' },
      { id: 10, bidang: 'Biologi', asing: 'alfa', indonesia: '' },
    ]);
    expect(sortedBidangSama.map((item) => item.id)).toEqual([10, 11]);

    const sortedBidangKosong = __private.sortAlirEntriItems([
      { id: 21, bidang: '', asing: '', indonesia: 'beta' },
      { id: 20, bidang: '', asing: '', indonesia: 'alfa' },
    ]);
    expect(sortedBidangKosong.map((item) => item.id)).toEqual([20, 21]);

    const sortedSemuaKosong = __private.sortAlirEntriItems([
      { id: 30, bidang: '', asing: '', indonesia: '' },
      { id: 31, bidang: '', asing: '', indonesia: '' },
    ]);
    expect(sortedSemuaKosong.map((item) => item.id)).toEqual([30, 31]);

    const sortedLabelCampuran = __private.sortAlirEntriItems([
      { id: 41, bidang: '', asing: 'beta', indonesia: '' },
      { id: 40, bidang: '', asing: '', indonesia: 'alfa' },
    ]);
    expect(sortedLabelCampuran.map((item) => item.id)).toEqual([40, 41]);

    const sortedPrioritasIndonesia = __private.sortAlirEntriItems([
      { id: 51, bidang: 'Kimia', asing: 'zeta', indonesia: 'beta' },
      { id: 50, bidang: 'Kimia', asing: 'alfa', indonesia: 'alfa' },
    ], { prioritizeIndonesia: true, sortByBidang: true });
    expect(sortedPrioritasIndonesia.map((item) => item.id)).toEqual([50, 51]);

    const sortedFallbackIndonesia = __private.sortAlirEntriItems([
      { id: 60, bidang: 'Kimia', asing: 'zeta', indonesia: '' },
      { id: 61, bidang: 'Kimia', asing: 'alfa', indonesia: '' },
      { id: 62, bidang: 'Kimia', asing: '', indonesia: '' },
    ], { prioritizeIndonesia: true, sortByBidang: true });
    expect(sortedFallbackIndonesia.map((item) => item.id)).toEqual([62, 61, 60]);

    const sortedFallbackLabelB = __private.sortAlirEntriItems([
      { id: 71, bidang: 'Kimia', asing: 'beta', indonesia: 'beta' },
      { id: 70, bidang: 'Kimia', asing: '', indonesia: '' },
    ], { prioritizeIndonesia: true, sortByBidang: true });
    expect(sortedFallbackLabelB.map((item) => item.id)).toEqual([70, 71]);

    const sortedDenganBAsing = __private.sortAlirEntriItems([
      { id: 80, bidang: 'Kimia', asing: 'delta', indonesia: 'delta' },
      { id: 81, bidang: 'Kimia', asing: 'alpha', indonesia: '' },
    ], { prioritizeIndonesia: true, sortByBidang: true });
    expect(sortedDenganBAsing.map((item) => item.id)).toEqual([81, 80]);

    const sortedDenganBAsingReversed = __private.sortAlirEntriItems([
      { id: 82, bidang: 'Kimia', asing: 'alpha', indonesia: '' },
      { id: 83, bidang: 'Kimia', asing: 'delta', indonesia: 'delta' },
    ], { prioritizeIndonesia: true, sortByBidang: true });
    expect(sortedDenganBAsingReversed.map((item) => item.id)).toEqual([82, 83]);
  });

  it('helper AlirEntri menampilkan badge bidang hanya saat bidang berubah', () => {
    const AlirEntri = __private.AlirEntri;
    render(
      <AlirEntri
        items={[
          { id: 1, bidang: 'Kimia', bidang_kode: 'Kim', indonesia: 'asam' },
          { id: 2, bidang: 'Kimia', bidang_kode: 'Kim', indonesia: 'basa' },
          { id: 3, bidang: '', indonesia: 'garam' },
        ]}
      />
    );

    expect(screen.getAllByRole('link', { name: 'Kim' })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Kim' })).toHaveAttribute('href', '/glosarium/bidang/kimia');
    expect(screen.getByRole('link', { name: 'Kim' })).toHaveAttribute('title', 'Kimia');
  });

  it('helper AlirEntri menampilkan tombol edit saat mode asing dan indonesia lengkap', () => {
    const AlirEntri = __private.AlirEntri;
    render(
      <AlirEntri
        tautAsing
        tampilkanEdit
        items={[
          { id: 51, bidang: 'Kimia', bidang_kode: 'kim', asing: 'acid', indonesia: 'asam' },
        ]}
      />
    );

    const editLinks = screen.getAllByRole('link').filter((el) => el.getAttribute('href') === '/redaksi/glosarium/51');
    expect(editLinks).toHaveLength(1);
  });

  it('helper AlirEntri menampilkan tombol edit saat mode indonesia dan id tersedia', () => {
    const AlirEntri = __private.AlirEntri;
    render(
      <AlirEntri
        tampilkanEdit
        items={[
          { id: 61, bidang: 'Kimia', bidang_kode: 'kim', indonesia: 'garam' },
        ]}
      />
    );

    const editLinks = screen.getAllByRole('link').filter((el) => el.getAttribute('href') === '/redaksi/glosarium/61');
    expect(editLinks).toHaveLength(1);
  });

  it('helper AlirEntri membentuk tautan sumber meski nama sumber kosong', () => {
    const AlirEntri = __private.AlirEntri;
    render(
      <AlirEntri
        items={[
          { id: 71, bidang: 'Kimia', bidang_kode: 'kim', sumber_kode: 'KBBI', sumber: '', indonesia: 'asam' },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'KBBI' })).toHaveAttribute('href', '/glosarium/sumber/');
  });

  it('helper AlirEntri menampilkan nama lengkap pada hover badge sumber', () => {
    const AlirEntri = __private.AlirEntri;
    render(
      <AlirEntri
        items={[
          {
            id: 72,
            bidang: 'Kimia',
            bidang_kode: 'Kim',
            sumber_kode: 'WHO',
            sumber: 'World Health Organization',
            indonesia: 'asam',
          },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: 'WHO' })).toHaveAttribute('title', 'World Health Organization');
  });

  it('helper getBidangSebelumnya menormalisasi bidang sebelumnya', () => {
    expect(__private.getBidangSebelumnya([], 0)).toBe('');
    expect(__private.getBidangSebelumnya([{ bidang: ' Kimia ' }, { bidang: 'Biologi' }], 1)).toBe('kimia');
    expect(__private.getBidangSebelumnya([undefined, { bidang: 'Biologi' }], 1)).toBe('');
  });

  it('helper AlirEntri mengurutkan daftar indonesia per bidang secara abjad', () => {
    const AlirEntri = __private.AlirEntri;
    render(
      <AlirEntri
        items={[
          { id: 1, bidang: 'Hukum', bidang_kode: 'huk', indonesia: 'penerimaan' },
          { id: 2, bidang: 'Hukum', bidang_kode: 'huk', indonesia: 'akseptasi' },
          { id: 3, bidang: 'Hukum', bidang_kode: 'huk', indonesia: 'dikabulkan' },
        ]}
      />
    );

    const flowText = document.querySelector('.kamus-detail-subentry-flow')?.textContent || '';
    expect(flowText.indexOf('akseptasi')).toBeLessThan(flowText.indexOf('dikabulkan'));
    expect(flowText.indexOf('dikabulkan')).toBeLessThan(flowText.indexOf('penerimaan'));
  });

  it('helper sortAlirEntriItems mengurutkan asing sambil tetap mengelompokkan bidang', () => {
    const sorted = __private.sortAlirEntriItems([
      { id: 1, bidang: 'Kimia', asing: 'zeta', indonesia: 'x' },
      { id: 2, bidang: 'Biologi', asing: 'omega', indonesia: 'y' },
      { id: 3, bidang: 'Kimia', asing: 'alfa', indonesia: 'z' },
    ], { prioritizeIndonesia: false, sortByBidang: true });

    expect(sorted.map((item) => item.id)).toEqual([2, 3, 1]);
  });

  it('helper pilihLabelAlir memilih label sesuai prioritas indonesia/asing', () => {
    expect(__private.pilihLabelAlir({ indonesia: 'ind', asing: 'asg' }, true)).toBe('ind');
    expect(__private.pilihLabelAlir({ indonesia: '', asing: 'asg' }, true)).toBe('asg');
    expect(__private.pilihLabelAlir({ indonesia: '', asing: '' }, true)).toBe('');

    expect(__private.pilihLabelAlir({ indonesia: 'ind', asing: 'asg' }, false)).toBe('asg');
    expect(__private.pilihLabelAlir({ indonesia: 'ind', asing: '' }, false)).toBe('ind');
    expect(__private.pilihLabelAlir({ indonesia: '', asing: '' }, false)).toBe('');
  });

  it('menampilkan seksi persis/memuat/mirip, tautan, dan navigasi cursor', () => {
    mockAuth = { adalahAdmin: true };
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: {
        persis: [
          { id: 1, indonesia: 'istilah; data', bidang: 'Kimia', bidang_kode: 'Kim', sumber: 'KBBI', sumber_kode: 'kbbi' },
          { id: 2, indonesia: 'tanpa badge' },
        ],
        mengandung: [
          { id: 11, asing: 'zero sum game', indonesia: 'permainan jumlah nol', bidang: 'Ekonomi', bidang_kode: 'Eko', sumber: 'Istilah', sumber_kode: '' },
          { id: 12, asing: 'zero day', indonesia: '', bidang: 'Ekonomi', bidang_kode: 'Eko', sumber: '' },
        ],
        mengandungPage: { hasPrev: true, hasNext: true, prevCursor: 'meng-prev', nextCursor: 'meng-next' },
        mengandungTotal: 8,
        mirip: [
          { id: 21, asing: 'sum', indonesia: 'jumlah', bidang: 'Matematika', bidang_kode: 'Mat', sumber: 'KBBI', sumber_kode: 'kbbi' },
          { id: 22, asing: 'summation', indonesia: 'penjumlahan' },
        ],
        miripPage: { hasPrev: true, hasNext: true, prevCursor: 'mir-prev', nextCursor: 'mir-next' },
        miripTotal: 3,
      },
    };

    const { rerender } = render(<GlosariumDetail />);

    expect(screen.getByRole('heading', { name: 'Persis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Memuat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mirip' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Kim' })).toHaveAttribute('href', '/glosarium/bidang/kimia');
    expect(screen.getAllByRole('link', { name: 'Eko' })).toHaveLength(1);
    expect(screen.queryByRole('link', { name: 'KBBI' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'istilah' })).toHaveAttribute('href', '/kamus/detail/istilah');
    expect(screen.getByRole('link', { name: 'zero sum game' })).toHaveAttribute('href', '/glosarium/detail/zero%20sum%20game');
    expect(screen.getAllByText(';').length).toBeGreaterThan(0);

    const tombolNav = screen.getAllByRole('button');
    tombolNav.forEach((btn) => fireEvent.click(btn));

    rerender(<GlosariumDetail />);

    expect(ambilDetailGlosarium).toHaveBeenCalledWith('zero sum', { mengandungCursor: null, miripCursor: null });
    expect(ambilDetailGlosarium).toHaveBeenCalledWith('zero sum', { mengandungCursor: 'meng-prev', miripCursor: null });
    expect(ambilDetailGlosarium).toHaveBeenCalledWith('zero sum', { mengandungCursor: 'meng-next', miripCursor: 'mir-prev' });
    expect(ambilDetailGlosarium).toHaveBeenCalledWith('zero sum', { mengandungCursor: 'meng-next', miripCursor: 'mir-next' });
  });

  it('menampilkan pesan kosong dan tidak merender judul saat param asing kosong', () => {
    mockParams = { asing: '' };
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: {
        persis: [],
        mengandung: [],
        mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        mengandungTotal: 0,
        mirip: [],
        miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        miripTotal: 0,
      },
    };

    render(<GlosariumDetail />);

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByText('Tidak ada entri glosarium yang ditemukan.')).toBeInTheDocument();
    expect(ambilDetailGlosarium).not.toHaveBeenCalled();
  });

  it('memperbarui title dan meta SEO pada render ulang', () => {
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: { persis: [{ id: 1, indonesia: 'istilah' }], mengandung: [], mirip: [] },
    };

    const { rerender } = render(<GlosariumDetail />);
    expect(document.title).toContain('zero sum — Kateglo');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('zero sum');

    mockParams = { asing: 'new%20term' };
    queryState = {
      ...queryState,
      data: { persis: [], mengandung: [], mirip: [] },
    };

    rerender(<GlosariumDetail />);

    expect(document.title).toContain('new term — Kateglo');
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toContain('new term — Kateglo');
    expect(document.head.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toContain('new term');
  });

  it('upsertMetaTag membuat tag baru dan memperbarui tag existing', () => {
    document.head.querySelector('meta[property="og:glosarium-test"]')?.remove();
    document.head.querySelector('meta[name="glosarium-custom-name"]')?.remove();

    upsertMetaTag({ name: 'glosarium-custom-name', content: 'nama' });
    expect(document.head.querySelector('meta[name="glosarium-custom-name"]')?.getAttribute('content')).toBe('nama');

    upsertMetaTag({ property: 'og:glosarium-test', content: 'awal' });
    expect(document.head.querySelector('meta[property="og:glosarium-test"]')?.getAttribute('content')).toBe('awal');

    upsertMetaTag({ property: 'og:glosarium-test', content: 'baru' });
    const semua = document.head.querySelectorAll('meta[property="og:glosarium-test"]');
    expect(semua).toHaveLength(1);
    expect(semua[0]?.getAttribute('content')).toBe('baru');
  });

  it('seksi memuat/mirip tanpa cursor tidak memicu navigasi saat tombol diklik', () => {
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: {
        persis: [],
        mengandung: [{ id: 11, asing: 'alpha', indonesia: 'alfa' }],
        mengandungPage: { hasPrev: true, hasNext: true, prevCursor: null, nextCursor: null },
        mengandungTotal: 1,
        mirip: [{ id: 21, asing: 'beta', indonesia: 'beta' }],
        miripPage: { hasPrev: true, hasNext: true, prevCursor: null, nextCursor: null },
        miripTotal: 1,
      },
    };

    render(<GlosariumDetail />);
    expect(ambilDetailGlosarium).toHaveBeenCalledTimes(1);

    screen.getAllByRole('button').forEach((btn) => fireEvent.click(btn));

    expect(ambilDetailGlosarium).toHaveBeenCalledTimes(1);
  });

  it('saat pageInfo tanpa prev/next, seksi tetap tampil dengan tombol navigasi disabled di heading', () => {
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: {
        persis: [],
        mengandung: [{ id: 1, asing: 'alpha', indonesia: 'alfa' }],
        mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        mengandungTotal: 1,
        mirip: [{ id: 2, asing: 'beta', indonesia: 'beta' }],
        miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
        miripTotal: 1,
      },
    };

    render(<GlosariumDetail />);

    expect(screen.getByRole('heading', { name: 'Memuat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mirip' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '‹' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '›' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: '‹' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '›' })[0]).toBeDisabled();
  });

  it('tetap stabil saat fetching aktif (tanpa reset navigasi)', () => {
    queryState = {
      isLoading: false,
      isFetching: true,
      isError: false,
      error: null,
      data: {
        persis: [{ id: 1, indonesia: 'istilah' }],
        mengandung: [],
        mirip: [],
      },
    };

    render(<GlosariumDetail />);

    expect(screen.getByRole('heading', { name: 'Persis' })).toBeInTheDocument();
  });

  it('menampilkan overlay hanya saat navigasi aktif dan tombol tetap simbol', () => {
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: {
        persis: [],
        mengandung: [{ id: 11, asing: 'alpha', indonesia: 'alfa' }],
        mengandungPage: { hasPrev: true, hasNext: true, prevCursor: 'm-prev', nextCursor: 'm-next' },
        mengandungTotal: 1,
        mirip: [{ id: 21, asing: 'beta', indonesia: 'beta' }],
        miripPage: { hasPrev: true, hasNext: true, prevCursor: 'r-prev', nextCursor: 'r-next' },
        miripTotal: 1,
      },
    };

    const { container, rerender } = render(<GlosariumDetail />);

    queryState = { ...queryState, isFetching: true };
    rerender(<GlosariumDetail />);
    expect(screen.queryByText('Memuat glosarium …')).not.toBeInTheDocument();
    queryState = { ...queryState, isFetching: false };
    rerender(<GlosariumDetail />);

    const klikDanFetch = (index) => {
      fireEvent.click(screen.getAllByRole('button')[index]);
      queryState = { ...queryState, isFetching: true };
      rerender(<GlosariumDetail />);
      expect(screen.getByText('Memuat glosarium …')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: '‹' })[0]).toHaveTextContent('‹');
      expect(screen.getAllByRole('button', { name: '›' })[0]).toHaveTextContent('›');
      queryState = { ...queryState, isFetching: false };
      rerender(<GlosariumDetail />);
    };

    klikDanFetch(0);
    klikDanFetch(1);
    klikDanFetch(2);
    klikDanFetch(3);

    expect(container.querySelector('.rima-heading-nav-button svg.animate-spin')).toBeNull();
  });
});
