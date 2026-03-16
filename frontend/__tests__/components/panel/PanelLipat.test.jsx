import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PanelLipat from '../../../src/components/panel/PanelLipat';

describe('PanelLipat', () => {
  it('tertutup secara default dan bisa dibuka', () => {
    render(
      <PanelLipat judul="Relasi">
        <div>Isi Panel</div>
      </PanelLipat>
    );

    expect(screen.queryByText('Isi Panel')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Relasi/i }));
    expect(screen.getByText('Isi Panel')).toBeInTheDocument();
  });

  it('menampilkan badge jumlah saat tersedia', () => {
    render(
      <PanelLipat judul="Peribahasa" jumlah={3} terbukaAwal={true}>
        <div>Konten</div>
      </PanelLipat>
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Konten')).toBeInTheDocument();
  });

  it('mode aksiKanan menampilkan heading custom dan tombol toggle terpisah', () => {
    render(
      <PanelLipat judul="Relasi" jumlah={2} terbukaAwal={false} aksiKanan={<button type="button">Aksi</button>}>
        <div>Isi Aksi</div>
      </PanelLipat>
    );

    expect(screen.getByText('Aksi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Relasi/i }));
    expect(screen.getByText('Isi Aksi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Relasi/i }));
    expect(screen.queryByText('Isi Aksi')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Buka panel' }));
    expect(screen.getByText('Isi Aksi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup panel' }));
    expect(screen.queryByText('Isi Aksi')).not.toBeInTheDocument();
  });
});
