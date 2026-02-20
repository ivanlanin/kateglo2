import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Paginasi from '../../../src/komponen/bersama/Paginasi';

describe('Paginasi', () => {
  it('tetap menampilkan info jika total halaman <= 1 tanpa kontrol navigasi', () => {
    render(<Paginasi total={10} limit={20} offset={0} onChange={vi.fn()} />);
    expect(screen.getByText(/Menampilkan 1–10 dari 10 entri/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Halaman pertama' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Halaman sebelumnya' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Halaman berikutnya' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Halaman terakhir' })).not.toBeInTheDocument();
  });

  it('menampilkan rentang dan tombol navigasi ikon', () => {
    render(<Paginasi total={120} limit={20} offset={20} onChange={vi.fn()} />);

    expect(screen.getByText(/Menampilkan 21–40 dari 120 entri/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Halaman pertama' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Halaman terakhir' })).toBeInTheDocument();
  });

  it('memanggil onChange saat navigasi halaman', () => {
    const onChange = vi.fn();
    render(<Paginasi total={120} limit={20} offset={20} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Halaman berikutnya' }));
    expect(onChange).toHaveBeenCalledWith(40);

    fireEvent.click(screen.getByRole('button', { name: 'Halaman sebelumnya' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('memanggil onChange saat klik halaman pertama dan terakhir', () => {
    const onChange = vi.fn();
    render(<Paginasi total={120} limit={20} offset={20} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Halaman terakhir' }));
    expect(onChange).toHaveBeenCalledWith(100);

    fireEvent.click(screen.getByRole('button', { name: 'Halaman pertama' }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('men-disable tombol di batas awal dan akhir', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Paginasi total={300} limit={20} offset={0} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Halaman pertama' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman terakhir' })).not.toBeDisabled();

    rerender(<Paginasi total={300} limit={20} offset={280} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Halaman pertama' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman terakhir' })).toBeDisabled();
  });

  it('mode cursor memanggil onNavigateCursor untuk semua aksi', () => {
    const onNavigateCursor = vi.fn();

    render(
      <Paginasi
        total={250}
        limit={100}
        pageInfo={{ hasPrev: true, hasNext: true }}
        currentPage={2}
        onNavigateCursor={onNavigateCursor}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Halaman pertama' }));
    fireEvent.click(screen.getByRole('button', { name: 'Halaman sebelumnya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Halaman berikutnya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Halaman terakhir' }));

    expect(onNavigateCursor).toHaveBeenNthCalledWith(1, 'first');
    expect(onNavigateCursor).toHaveBeenNthCalledWith(2, 'prev');
    expect(onNavigateCursor).toHaveBeenNthCalledWith(3, 'next');
    expect(onNavigateCursor).toHaveBeenNthCalledWith(4, 'last');
  });

  it('mode cursor men-disable tombol berdasarkan pageInfo', () => {
    const onNavigateCursor = vi.fn();
    const { rerender } = render(
      <Paginasi
        total={250}
        limit={100}
        pageInfo={{ hasPrev: false, hasNext: true }}
        currentPage={1}
        onNavigateCursor={onNavigateCursor}
      />
    );

    expect(screen.getByRole('button', { name: 'Halaman pertama' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman terakhir' })).not.toBeDisabled();

    rerender(
      <Paginasi
        total={250}
        limit={100}
        pageInfo={{ hasPrev: true, hasNext: false }}
        currentPage={3}
        onNavigateCursor={onNavigateCursor}
      />
    );

    expect(screen.getByRole('button', { name: 'Halaman pertama' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Halaman terakhir' })).toBeDisabled();
  });

  it('tetap menampilkan navigasi saat total halaman 1 tetapi pageInfo cursor aktif', () => {
    const onNavigateCursor = vi.fn();

    render(
      <Paginasi
        total={10}
        limit={20}
        pageInfo={{ hasPrev: false, hasNext: true }}
        currentPage={1}
        onNavigateCursor={onNavigateCursor}
      />
    );

    expect(screen.getByRole('button', { name: 'Halaman pertama' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeInTheDocument();
  });

  it('tetap menampilkan navigasi saat total halaman 1 tetapi hasPrev aktif', () => {
    const onNavigateCursor = vi.fn();

    render(
      <Paginasi
        total={10}
        limit={20}
        pageInfo={{ hasPrev: true, hasNext: false }}
        currentPage={1}
        onNavigateCursor={onNavigateCursor}
      />
    );

    expect(screen.getByRole('button', { name: 'Halaman pertama' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Halaman sebelumnya' })).toBeInTheDocument();
  });

  it('menampilkan rentang 0–0 saat total nol', () => {
    render(<Paginasi total={0} limit={20} offset={0} onChange={vi.fn()} />);
    expect(screen.getByText(/Menampilkan 0–0 dari 0 entri/i)).toBeInTheDocument();
  });
});
