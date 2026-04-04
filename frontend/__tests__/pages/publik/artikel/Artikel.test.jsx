import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Artikel } from '../../../../src/pages/publik/artikel/Artikel';

const mockUseQuery = vi.fn();
let mockAuth = null;

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilDaftarArtikel: vi.fn(),
}));

vi.mock('../../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuth,
}));

describe('Artikel publik', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockAuth = null;
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
});
