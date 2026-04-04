import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ArtikelDetail, __private } from '../../../../src/pages/publik/artikel/ArtikelDetail';

const mockUseQuery = vi.fn();
let mockParams = { slug: 'asal-kata-merdeka' };
let mockAuth = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilDetailArtikel: vi.fn(),
  ambilDaftarArtikel: vi.fn(),
}));

vi.mock('../../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuth,
}));

describe('ArtikelDetail publik', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockParams = { slug: 'asal-kata-merdeka' };
    mockAuth = null;
  });

  it('menampilkan detail sederhana dengan sidebar artikel lain maksimal 10 item', () => {
    mockUseQuery.mockImplementation((options) => {
      const key = options?.queryKey?.[0];

      if (key === 'artikel-detail') {
        return {
          data: {
            data: {
              id: 1,
              slug: 'asal-kata-merdeka',
              judul: 'Asal *Kata* Merdeka',
              topik: ['linguistik', 'etimologi'],
              penulis_nama: 'Ivan Lanin',
              penyunting_nama: 'Editor Kateglo',
              diterbitkan_pada: '2026-04-04T10:45:00',
              cuplikan: 'Cuplikan artikel.',
              konten: '# Huruf Miring\n\nIsi artikel.\n\nLihat [halaman Gramatika](/gramatika/inversi) dan [sumber luar](https://contoh.org).',
            },
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }

      if (key === 'artikel-daftar-sidebar') {
        return {
          data: {
            data: [
              { id: 1, slug: 'asal-kata-merdeka', judul: 'Asal Kata Merdeka' },
              ...Array.from({ length: 11 }, (_, index) => ({
                id: index + 2,
                slug: `artikel-${index + 1}`,
                judul: `Artikel ${index + 1}`,
              })),
            ],
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }

      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(
      <MemoryRouter>
        <ArtikelDetail />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb artikel' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Artikel' })).toHaveAttribute('href', '/artikel');
    expect(screen.getByRole('heading', { name: 'Asal Kata Merdeka' })).toBeInTheDocument();
    expect(screen.queryByText(/Ivan Lanin/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Editor Kateglo/)).not.toBeInTheDocument();
    expect(screen.getByText('Kata', { selector: 'em' })).toBeInTheDocument();
    expect(screen.queryByText('← Kembali ke semua artikel')).not.toBeInTheDocument();
    expect(screen.getByText('Isi artikel.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'halaman Gramatika' })).toHaveAttribute('href', '/gramatika/inversi');
    expect(screen.getByRole('link', { name: 'sumber luar' })).toHaveAttribute('target', '_blank');
    expect(screen.queryByLabelText('Sunting artikel di Redaksi')).not.toBeInTheDocument();

    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).getByRole('heading', { name: 'Artikel lain' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('list')).toBeInTheDocument();
    const sidebarLinks = within(sidebar).getAllByRole('link');
    expect(sidebarLinks).toHaveLength(10);
    expect(sidebarLinks[0]).toHaveAttribute('href', '/artikel/artikel-1');
    expect(within(sidebar).queryByRole('link', { name: 'Asal Kata Merdeka' })).not.toBeInTheDocument();
  });

  it('menampilkan ikon edit di kanan judul saat pengguna admin', () => {
    mockAuth = { adalahAdmin: true };
    mockUseQuery.mockImplementation((options) => {
      const key = options?.queryKey?.[0];

      if (key === 'artikel-detail') {
        return {
          data: {
            data: {
              id: 21,
              slug: 'asal-kata-merdeka',
              judul: 'Asal Kata Merdeka',
              topik: [],
              cuplikan: 'Cuplikan artikel.',
              konten: 'Isi artikel.',
            },
          },
          isLoading: false,
          isError: false,
          error: null,
        };
      }

      if (key === 'artikel-daftar-sidebar') {
        return {
          data: { data: [] },
          isLoading: false,
          isError: false,
          error: null,
        };
      }

      return { data: undefined, isLoading: false, isError: false, error: null };
    });

    render(
      <MemoryRouter>
        <ArtikelDetail />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Sunting artikel di Redaksi')).toHaveAttribute('href', '/redaksi/artikel/21');
  });

  it('helper private membedakan tautan internal artikel', () => {
    expect(__private.isArtikelInternalHref('/gramatika/inversi')).toBe(true);
    expect(__private.isArtikelInternalHref('https://contoh.org')).toBe(false);
  });
});
