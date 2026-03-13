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
    expect(screen.getByRole('link', { name: 'Buka alat' })).toHaveAttribute('href', '/alat/penganalisis-teks');
  });
});