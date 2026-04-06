import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Artikel, __private } from '../../../../src/pages/publik/artikel/Artikel';
import { ambilDaftarArtikel } from '../../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockAuth = null;
let mockSsrPrefetch = null;

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilDaftarArtikel: vi.fn(),
}));

vi.mock('../../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuth,
}));

vi.mock('../../../../src/context/ssrPrefetchContext', () => ({
  useSsrPrefetch: () => mockSsrPrefetch,
}));

describe('Artikel publik', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockAuth = null;
    mockSsrPrefetch = null;
  });

  it('menampilkan daftar artikel tanpa filter topik atas dan menaruh topik setelah ringkasan', () => {
    mockUseQuery.mockImplementation((options) => {
      const key = options?.queryKey?.[0];
      if (key === 'artikel-daftar') {
        return {
          data: {
            data: [
              {
                id: 1,
                slug: 'asal-kata-merdeka',
                judul: 'Asal *Kata* Merdeka',
                cuplikan: 'Cuplikan artikel pertama.',
                topik: ['linguistik', 'etimologi'],
                penulis_nama: 'Ivan Lanin',
                diterbitkan_pada: '2026-04-04T10:45:00',
              },
              {
                id: 2,
                slug: 'bahasa-dan-ejaan',
                judul: 'Bahasa dan Ejaan',
                cuplikan: 'Cuplikan artikel kedua.',
                topik: ['linguistik'],
                penulis_nama: 'Editor Kateglo',
                diterbitkan_pada: '2026-04-03T09:15:00',
              },
            ],
          },
          isLoading: false,
          isError: false,
        };
      }

      return { data: undefined, isLoading: false, isError: false };
    });

    render(
      <MemoryRouter initialEntries={["/artikel"]}>
        <Artikel />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Artikel' })).toBeInTheDocument();
    expect(screen.queryByText('Ulasan, tanya jawab, dan catatan seputar bahasa Indonesia.')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Daftar artikel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Asal Kata Merdeka' })).toHaveAttribute('href', '/artikel/asal-kata-merdeka');
    expect(screen.getByRole('link', { name: 'Bahasa dan Ejaan' })).toHaveAttribute('href', '/artikel/bahasa-dan-ejaan');
    expect(screen.queryByText('Ivan Lanin')).not.toBeInTheDocument();
    expect(screen.queryByText('Editor Kateglo')).not.toBeInTheDocument();
    expect(screen.getByText('Cuplikan artikel pertama.…')).toBeInTheDocument();
    expect(screen.getByText('Cuplikan artikel kedua.…')).toBeInTheDocument();
    expect(screen.getAllByText('linguistik').length).toBeGreaterThan(0);
    expect(screen.getByText('etimologi')).toBeInTheDocument();
    expect(screen.getByText('Kata', { selector: 'em' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Sunting artikel di Redaksi')).not.toBeInTheDocument();
  });

  it('menampilkan ikon edit di kanan judul kartu saat pengguna admin', () => {
    mockAuth = { adalahAdmin: true };
    mockUseQuery.mockImplementation((options) => {
      const key = options?.queryKey?.[0];
      if (key === 'artikel-daftar') {
        return {
          data: {
            data: [
              {
                id: 17,
                slug: 'asal-kata-merdeka',
                judul: 'Asal Kata Merdeka',
                cuplikan: 'Cuplikan artikel pertama.',
                topik: ['linguistik'],
              },
            ],
          },
          isLoading: false,
          isError: false,
        };
      }

      return { data: undefined, isLoading: false, isError: false };
    });

    render(
      <MemoryRouter initialEntries={["/artikel"]}>
        <Artikel />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Sunting artikel di Redaksi')).toHaveAttribute('href', '/redaksi/artikel/17');
  });

  it('menyertakan query pencarian dalam key dan request daftar artikel', () => {
    mockUseQuery.mockImplementation((options) => {
      expect(options.queryKey).toEqual(['artikel-daftar', 'bahasa', 'serapan']);
      options.queryFn();
      return {
        data: { data: [] },
        isLoading: false,
        isError: false,
      };
    });

    render(
      <MemoryRouter initialEntries={["/artikel?topik=bahasa&q=serapan"]}>
        <Artikel />
      </MemoryRouter>
    );
  });

  it('memakai initialData SSR saat topik dan query cocok', () => {
    mockSsrPrefetch = {
      type: 'artikel-daftar',
      topik: 'bahasa',
      q: 'serapan',
      data: [{ id: 9, slug: 'serapan', judul: 'Serapan' }],
      total: 1,
    };

    mockUseQuery.mockImplementation((options) => {
      expect(options.initialData).toEqual({
        success: true,
        data: [{ id: 9, slug: 'serapan', judul: 'Serapan' }],
        total: 1,
        limit: 30,
        offset: 0,
      });
      return {
        data: options.initialData,
        isLoading: false,
        isError: false,
      };
    });

    render(
      <MemoryRouter initialEntries={["/artikel?topik=bahasa&q=serapan"]}>
        <Artikel />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Serapan' })).toHaveAttribute('href', '/artikel/serapan');
  });

  it('menampilkan state kosong bertopik saat SSR prefetch tidak cocok dengan query aktif', () => {
    mockSsrPrefetch = {
      type: 'artikel-daftar',
      topik: 'berbeda',
      q: 'lain',
      data: [{ id: 1, slug: 'tidak-dipakai', judul: 'Tidak Dipakai' }],
      total: 1,
    };

    mockUseQuery.mockImplementation((options) => {
      expect(options.initialData).toBeUndefined();
      return {
        data: { data: [] },
        isLoading: false,
        isError: false,
      };
    });

    render(
      <MemoryRouter initialEntries={["/artikel?topik=bahasa&q=serapan"]}>
        <Artikel />
      </MemoryRouter>
    );

    expect(screen.getByText('Belum ada artikel dalam topik "bahasa".')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Artikel Topik bahasa' })).toBeInTheDocument();
  });

  it('menampilkan state kosong umum saat tidak ada topik aktif', () => {
    mockUseQuery.mockImplementation((options) => {
      options.queryFn();
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      };
    });

    render(
      <MemoryRouter initialEntries={['/artikel']}>
        <Artikel />
      </MemoryRouter>
    );

    expect(screen.getByText('Belum ada artikel.')).toBeInTheDocument();
    expect(ambilDaftarArtikel).toHaveBeenCalledWith({ topik: undefined, q: undefined, limit: 30 });
  });

  it('helper private membersihkan cuplikan markdown dan memetakan initial data SSR', () => {
    expect(__private.bersihkanCuplikan('  #Cuplikan* [uji]!  ')).toBe('Cuplikan uji');
    expect(__private.bersihkanCuplikan('')).toBe('');

    expect(__private.resolveInitialArtikelData(null, '', '')).toBeUndefined();
    expect(__private.resolveInitialArtikelData({ type: 'lain' }, '', '')).toBeUndefined();
    expect(__private.resolveInitialArtikelData({ type: 'artikel-daftar', topik: 'bahasa' }, 'lain', '')).toBeUndefined();
    expect(__private.resolveInitialArtikelData({ type: 'artikel-daftar', topik: '', q: 'serapan' }, '', 'beda')).toBeUndefined();
    expect(__private.resolveInitialArtikelData({
      type: 'artikel-daftar',
      topik: '',
      q: '',
      data: [{ id: 1 }],
      total: 1,
    }, '', '')).toEqual({
      success: true,
      data: [{ id: 1 }],
      total: 1,
      limit: 30,
      offset: 0,
    });
    expect(__private.resolveInitialArtikelData({ type: 'artikel-daftar' }, '', '')).toEqual({
      success: true,
      data: [],
      total: 0,
      limit: 30,
      offset: 0,
    });
  });
});
