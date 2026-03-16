import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KepalaAdmin from '../../../src/components/tampilan/KepalaAdmin';

describe('KepalaAdmin', () => {
  it('mengembalikan null saat tidak ada judul, aksi, dan children', () => {
    const { container } = render(<KepalaAdmin />);
    expect(container).toBeEmptyDOMElement();
  });

  it('merender judul dan aksi jika tersedia', () => {
    render(<KepalaAdmin judul="Admin" aksi={<button type="button">Tambah</button>} />);
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah' })).toBeInTheDocument();
  });

  it('tetap merender children saat hanya children yang tersedia', () => {
    render(<KepalaAdmin><div>Isi tambahan</div></KepalaAdmin>);
    expect(screen.getByText('Isi tambahan')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('merender placeholder judul saat hanya aksi yang tersedia', () => {
    render(<KepalaAdmin aksi={<button type="button">Aksi saja</button>} />);
    expect(screen.getByRole('button', { name: 'Aksi saja' })).toBeInTheDocument();
  });
});
