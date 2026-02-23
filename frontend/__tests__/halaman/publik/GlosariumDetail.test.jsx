import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlosariumDetail from '../../../src/halaman/publik/GlosariumDetail';
import { upsertMetaTag } from '../../../src/halaman/publik/GlosariumDetail';
import { ambilDetailGlosarium } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = { asing: 'zero%20sum' };
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

describe('GlosariumDetail', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    ambilDetailGlosarium.mockClear();
    mockParams = { asing: 'zero%20sum' };
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
    expect(screen.getByText('Memuat…')).toBeInTheDocument();

    queryState = { data: undefined, isLoading: false, isFetching: false, isError: true, error: new Error('gagal') };
    rerender(<GlosariumDetail />);
    expect(screen.getByText('Gagal mengambil data.')).toBeInTheDocument();
  });

  it('menampilkan seksi persis/memuat/mirip, tautan, dan navigasi cursor', () => {
    queryState = {
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      data: {
        persis: [
          { id: 1, indonesia: '1 istilah; 2 data', bidang: 'Kimia', bidang_kode: 'kim', sumber: 'KBBI', sumber_kode: 'kbbi' },
          { id: 2, indonesia: 'tanpa badge' },
        ],
        mengandung: [
          { id: 11, asing: 'zero sum game', indonesia: 'permainan jumlah nol', bidang: 'Ekonomi', bidang_kode: '', sumber: 'Istilah', sumber_kode: '' },
          { id: 12, asing: 'zero day', indonesia: '', bidang: 'Ekonomi', bidang_kode: '', sumber: '' },
        ],
        mengandungPage: { hasPrev: true, hasNext: true, prevCursor: 'meng-prev', nextCursor: 'meng-next' },
        mengandungTotal: 8,
        mirip: [
          { id: 21, asing: 'sum', indonesia: 'jumlah', bidang: 'Matematika', bidang_kode: 'mat', sumber: 'KBBI', sumber_kode: 'kbbi' },
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

    expect(screen.getByRole('link', { name: 'Kimia' })).toHaveAttribute('href', '/glosarium/bidang/kim');
    expect(screen.getAllByRole('link', { name: 'Ekonomi' })).toHaveLength(1);
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
