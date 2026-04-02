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
});