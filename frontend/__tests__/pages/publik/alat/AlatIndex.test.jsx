import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AlatIndex from '../../../../src/pages/publik/alat/AlatIndex';

describe('AlatIndex', () => {
  it('menampilkan daftar alat yang tersedia', () => {
    render(
      <MemoryRouter>
        <AlatIndex />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Kumpulan alat bantu bahasa Indonesia' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penganalisis Teks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penghitung Huruf' })).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Buka alat' });
    expect(links[0]).toHaveAttribute('href', '/alat/penganalisis-teks');
    expect(links[1]).toHaveAttribute('href', '/alat/penghitung-huruf');
  });
});