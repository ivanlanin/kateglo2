import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import KartuKategori from '../../../src/komponen/publik/KartuKategori';

describe('KartuKategori', () => {
  it('mengembalikan null saat items kosong atau bukan array', () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <KartuKategori judul="Kategori" items={[]} getKey={(item) => item.id} getTo={() => '/x'} getLabel={() => 'x'} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <MemoryRouter>
        <KartuKategori judul="Kategori" items={null} getKey={(item) => item.id} getTo={() => '/x'} getLabel={() => 'x'} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it('merender judul dan link item', () => {
    render(
      <MemoryRouter>
        <KartuKategori
          judul="Bidang"
          items={[{ id: 1, nama: 'Kimia' }, { id: 2, nama: 'Biologi' }]}
          getKey={(item) => item.id}
          getTo={(item) => `/glosarium/bidang/${item.nama}`}
          getLabel={(item) => item.nama}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Bidang')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kimia' })).toHaveAttribute('href', '/glosarium/bidang/Kimia');
    expect(screen.getByRole('link', { name: 'Biologi' })).toBeInTheDocument();
  });
});
