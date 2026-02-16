import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KebijakanPrivasi from '../../../src/halaman/publik/KebijakanPrivasi';

describe('KebijakanPrivasi', () => {
  it('menampilkan isi kebijakan privasi', () => {
    render(
      <MemoryRouter>
        <KebijakanPrivasi />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Kebijakan Privasi' })).toBeInTheDocument();
    expect(screen.getByText('1. Data yang kami proses')).toBeInTheDocument();
    expect(screen.getByText('2. Penggunaan data')).toBeInTheDocument();
    expect(screen.getByText('3. Penyimpanan dan keamanan')).toBeInTheDocument();
    expect(screen.getByText('4. Hak pengguna')).toBeInTheDocument();
    expect(screen.getByText('5. Perubahan kebijakan')).toBeInTheDocument();
    expect(screen.getByText('Terakhir diperbarui: 16 Februari 2026')).toBeInTheDocument();
  });
});