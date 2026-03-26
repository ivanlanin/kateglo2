import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GimIndex from '../../../../src/pages/publik/gim/GimIndex';

vi.mock('../../../../src/components/tampilan/HalamanPublik', () => ({
  default: ({ children, judul, tampilkanJudul = true }) => (
    <div>
      {tampilkanJudul ? <h1>{judul}</h1> : null}
      {children}
    </div>
  ),
}));

describe('GimIndex', () => {
  it('merender daftar gim dan tautan ke halaman indeks turunannya', () => {
    render(
      <MemoryRouter>
        <GimIndex />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Gim' })).toBeInTheDocument();
    expect(screen.getByText('Kuis Kata')).toBeInTheDocument();
    expect(screen.getByText('Susun Kata')).toBeInTheDocument();
    expect(screen.queryByText('Tersedia')).not.toBeInTheDocument();
    const tautanBuka = screen.getAllByRole('link', { name: 'Buka gim' });
    expect(tautanBuka[0]).toHaveAttribute('href', '/gim/kuis-kata');
    expect(tautanBuka[1]).toHaveAttribute('href', '/gim/susun-kata/harian');
  });
});