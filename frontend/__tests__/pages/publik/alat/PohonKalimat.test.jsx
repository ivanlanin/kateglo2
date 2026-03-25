import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PohonKalimat from '../../../../src/pages/publik/alat/PohonKalimat';

describe('PohonKalimat', () => {
  it('merender builder tunggal dan memunculkan pohon setelah contoh dipilih', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Pohon Kalimat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tunggal' })).toBeInTheDocument();
    expect(screen.getByText('Pohon akan muncul di sini.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kalimat tunggal — tiga unsur' }));

    expect(screen.getByLabelText('Pohon sintaksis kalimat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unduh SVG' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unduh PNG' })).toBeInTheDocument();
  });

  it('berpindah ke mode majemuk dan dapat menambah sub-klausa tersisip', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Majemuk' }));

    expect(screen.getByLabelText('Konjungsi')).toBeInTheDocument();
    const tombolTambahTersisip = screen.getAllByRole('button', { name: '+ Tambah sub-klausa tersisip' });
    expect(tombolTambahTersisip.length).toBeGreaterThan(0);

    fireEvent.click(tombolTambahTersisip[0]);

    expect(screen.getByText('Sub-klausa tersisip')).toBeInTheDocument();
    expect(screen.getByLabelText('Konjungsi sub-klausa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus sub-klausa' })).toBeInTheDocument();
  });
});
