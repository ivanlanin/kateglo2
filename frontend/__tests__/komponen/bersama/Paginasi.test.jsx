import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Paginasi from '../../../src/komponen/bersama/Paginasi';

describe('Paginasi', () => {
  it('tetap menampilkan info jika total halaman <= 1 tanpa kontrol navigasi', () => {
    render(<Paginasi total={10} limit={20} offset={0} onChange={vi.fn()} />);
    expect(screen.getByText(/Menampilkan 1–10 dari 10 entri/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '‹' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '›' })).not.toBeInTheDocument();
  });

  it('menampilkan rentang dan tombol halaman', () => {
    render(<Paginasi total={120} limit={20} offset={20} onChange={vi.fn()} />);

    expect(screen.getByText(/Menampilkan 21–40 dari 120 entri/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('memanggil onChange saat navigasi halaman', () => {
    const onChange = vi.fn();
    render(<Paginasi total={120} limit={20} offset={20} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '›' }));
    expect(onChange).toHaveBeenCalledWith(40);

    fireEvent.click(screen.getByRole('button', { name: '‹' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('memanggil onChange saat klik nomor halaman', () => {
    const onChange = vi.fn();
    render(<Paginasi total={120} limit={20} offset={0} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onChange).toHaveBeenCalledWith(40);
  });

  it('menampilkan tombol awal/akhir dan memanggil onChange', () => {
    const onChange = vi.fn();
    render(<Paginasi total={300} limit={20} offset={120} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '15' }));

    expect(onChange).toHaveBeenCalledWith(0);
    expect(onChange).toHaveBeenCalledWith(280);
  });
});
