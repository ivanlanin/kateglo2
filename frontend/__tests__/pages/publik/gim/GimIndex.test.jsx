import { render, screen } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GimIndex from '../../../../src/pages/publik/gim/GimIndex';

const mockUseAuthOptional = vi.fn(() => null);
const mockAmbilDaftarGim = vi.fn();

vi.mock('../../../../src/components/tampilan/HalamanPublik', () => ({
  default: ({ children, judul, tampilkanJudul = true }) => (
    <div>
      {tampilkanJudul ? <h1>{judul}</h1> : null}
      {children}
    </div>
  ),
}));

vi.mock('../../../../src/context/authContext', () => ({
  useAuthOptional: () => mockUseAuthOptional(),
}));

vi.mock('../../../../src/constants/katalogFitur', () => ({
  ambilDaftarGim: (...args) => mockAmbilDaftarGim(...args),
}));

describe('GimIndex', () => {
  beforeEach(() => {
    mockUseAuthOptional.mockReturnValue(null);
    mockAmbilDaftarGim.mockImplementation(() => [
      { slug: 'kuis-kata', judul: 'Kuis Kata', deskripsi: 'Kuis cepat.', href: '/gim/kuis-kata', tampilPublik: true },
      { slug: 'susun-kata', judul: 'Susun Kata', deskripsi: 'Susun kata.', href: '/gim/susun-kata/harian', tampilPublik: true },
    ]);
  });

  it('merender daftar gim dan tautan ke halaman indeks turunannya', () => {
    render(
      <MemoryRouter>
        <GimIndex />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Gim' })).toBeInTheDocument();
    expect(screen.getByText('Kuis Kata')).toBeInTheDocument();
    expect(screen.getByText('Susun Kata')).toBeInTheDocument();
    expect(screen.queryByText('Tersedia')).not.toBeInTheDocument();
    const tautanBuka = screen.getAllByRole('link', { name: 'Buka gim' });
    expect(tautanBuka[0]).toHaveAttribute('href', '/gim/kuis-kata');
    expect(tautanBuka[1]).toHaveAttribute('href', '/gim/susun-kata/harian');
  });

  it('menampilkan badge internal saat redaksi melihat gim nonpublik', () => {
    mockUseAuthOptional.mockReturnValue({ adalahRedaksi: true, adalahAdmin: false });
    mockAmbilDaftarGim.mockImplementation(() => [
      { slug: 'gim-internal', judul: 'Gim Internal', deskripsi: 'Khusus redaksi.', href: '/gim/internal', tampilPublik: false },
    ]);

    render(
      <MemoryRouter>
        <GimIndex />
      </MemoryRouter>
    );

    expect(screen.getByText('Internal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka gim' })).toHaveAttribute('href', '/gim/internal');
  });

  it('admin juga melihat gim internal ketika bukan redaksi', () => {
    mockUseAuthOptional.mockReturnValue({ adalahRedaksi: false, adalahAdmin: true });
    mockAmbilDaftarGim.mockImplementation(() => [
      { slug: 'gim-internal', judul: 'Gim Admin', deskripsi: 'Khusus admin.', href: '/gim/admin', tampilPublik: false },
    ]);

    render(
      <MemoryRouter>
        <GimIndex />
      </MemoryRouter>
    );

    expect(screen.getByText('Internal')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka gim' })).toHaveAttribute('href', '/gim/admin');
  });
});