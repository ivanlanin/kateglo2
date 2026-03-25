import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AlatIndex from '../../../../src/pages/publik/alat/AlatIndex';

const mockUseAuthOptional = vi.fn();

vi.mock('../../../../src/context/authContext', () => ({
  useAuthOptional: () => mockUseAuthOptional(),
}));

describe('AlatIndex', () => {
  beforeEach(() => {
    mockUseAuthOptional.mockReturnValue(null);
  });

  it('menampilkan daftar alat yang tersedia', () => {
    render(
      <MemoryRouter>
        <AlatIndex />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Alat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penganalisis Teks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penghitung Huruf' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pohon Kalimat' })).not.toBeInTheDocument();
    expect(screen.queryByText('Tersedia')).not.toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Buka alat' });
    expect(links[0]).toHaveAttribute('href', '/alat/penganalisis-teks');
    expect(links[1]).toHaveAttribute('href', '/alat/penghitung-huruf');
  });

  it('menampilkan alat internal untuk redaksi', () => {
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
    expect(screen.getByText('Internal')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Buka alat' });
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/alat/penganalisis-teks',
      '/alat/penghitung-huruf',
      '/alat/pohon-kalimat',
    ]);
  });
});