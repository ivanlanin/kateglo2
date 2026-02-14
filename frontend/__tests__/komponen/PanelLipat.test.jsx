import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PanelLipat from '../../src/komponen/PanelLipat';

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
});
