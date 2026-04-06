import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AlatIndex from '../../../../src/pages/publik/alat/AlatIndex';

const mockUseAuthOptional = vi.fn();
const mockAmbilDaftarAlat = vi.fn();

vi.mock('../../../../src/context/authContext', () => ({
  useAuthOptional: () => mockUseAuthOptional(),
}));

vi.mock('../../../../src/constants/katalogFitur', () => ({
  ambilDaftarAlat: (...args) => mockAmbilDaftarAlat(...args),
}));

describe('AlatIndex', () => {
  beforeEach(() => {
    mockUseAuthOptional.mockReturnValue(null);
    mockAmbilDaftarAlat.mockImplementation(() => [
      { slug: 'analisis-teks', judul: 'Analisis Teks', deskripsi: 'Analisis teks.', href: '/alat/analisis-teks', tampilPublik: true },
      { slug: 'penghitung-huruf', judul: 'Penghitung Huruf', deskripsi: 'Hitung huruf.', href: '/alat/penghitung-huruf', tampilPublik: true },
      { slug: 'pohon-kalimat', judul: 'Pohon Kalimat', deskripsi: 'Pohon sintaksis.', href: '/alat/pohon-kalimat', tampilPublik: true },
      { slug: 'analisis-korpus', judul: 'Analisis Korpus', deskripsi: 'Analisis korpus.', href: '/alat/analisis-korpus', tampilPublik: true },
    ]);
  });

  it('menampilkan daftar alat yang tersedia', () => {
    render(
      <MemoryRouter>
        <AlatIndex />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Alat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Analisis Teks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penghitung Huruf' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pohon Kalimat' })).toBeInTheDocument();
    expect(screen.queryByText('Internal')).not.toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Buka alat' });
    expect(links[0]).toHaveAttribute('href', '/alat/analisis-teks');
    expect(links[1]).toHaveAttribute('href', '/alat/penghitung-huruf');
    expect(links[2]).toHaveAttribute('href', '/alat/pohon-kalimat');
    expect(links[3]).toHaveAttribute('href', '/alat/analisis-korpus');
    expect(links).toHaveLength(4);
  });

  it('redaksi tetap melihat daftar alat tanpa badge internal untuk analisis korpus', () => {
    mockUseAuthOptional.mockReturnValue({
      adalahRedaksi: true,
      adalahAdmin: false,
    });

    render(
      <MemoryRouter>
        <AlatIndex />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Pohon Kalimat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();
  expect(screen.queryByText('Internal')).not.toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Buka alat' });
    expect(links).toHaveLength(4);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/alat/analisis-teks',
      '/alat/penghitung-huruf',
      '/alat/pohon-kalimat',
      '/alat/analisis-korpus',
    ]);
  });

  it('menampilkan badge internal saat admin melihat alat nonpublik', () => {
    mockUseAuthOptional.mockReturnValue({ adalahRedaksi: false, adalahAdmin: true });
    mockAmbilDaftarAlat.mockImplementation(() => [
      { slug: 'alat-internal', judul: 'Alat Internal', deskripsi: 'Khusus admin.', href: '/alat/internal', tampilPublik: false },
    ]);

    render(
      <MemoryRouter>
        <AlatIndex />
      </MemoryRouter>
    );

    expect(screen.getByText('Internal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka alat' })).toHaveAttribute('href', '/alat/internal');
  });
});