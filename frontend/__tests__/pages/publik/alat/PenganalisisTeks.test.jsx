import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PenganalisisTeks from '../../../../src/pages/publik/alat/PenganalisisTeks';

describe('PenganalisisTeks', () => {
  it('menampilkan hasil dalam panel kanan dan pill ringkasan aktif setelah analisis', () => {
    render(
      <MemoryRouter>
        <PenganalisisTeks />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: 'Ringkasan' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.change(screen.getByLabelText('Teks untuk dianalisis'), {
      target: { value: 'Satu kalimat.\n\nDua kalimat pertama. Dua kalimat kedua! 12.30 50% Andi.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));

    expect(screen.getByText('Karakter/Kata')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Ringkasan' })).toHaveAttribute('aria-selected', 'true');
  });

  it('berpindah antar pill hasil, menukar tampilan kalimat, dan membersihkan hasil', () => {
    render(
      <MemoryRouter>
        <PenganalisisTeks />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Isi contoh' }));
    expect(screen.getByDisplayValue(/Bahasa berkembang bersama cara kita memakainya/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Detail Paragraf' }));
    expect(screen.getByRole('tab', { name: 'Detail Paragraf' })).toHaveAttribute('aria-selected', 'true');

    const toggleButton = screen.getByRole('button', { name: /6 kata:Bahasa berkembang ....?/i });
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /6 kata:Bahasa berkembang bersama cara kita memakainya\./i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Frekuensi Kata' }));
    expect(screen.getByRole('tab', { name: 'Frekuensi Kata' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Kata (1x)')).toBeInTheDocument();
    expect(screen.getByText(/bahasa \(1\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan' }));
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Frekuensi Kata' }));
    expect(screen.getByText('Belum ada frekuensi yang ditampilkan.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Frekuensi Kata' })).toHaveAttribute('aria-selected', 'true');
  });

  it('menampilkan pesan validasi saat teks kosong', () => {
    render(
      <MemoryRouter>
        <PenganalisisTeks />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Analisis' }));
    expect(screen.getByText('Silakan masukkan teks terlebih dahulu.')).toBeInTheDocument();
  });
});