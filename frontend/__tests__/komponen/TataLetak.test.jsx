import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TataLetak from '../../src/komponen/TataLetak';

vi.mock('../../src/komponen/Navbar', () => ({ default: () => <div>Navbar Mock</div> }));
vi.mock('react-router-dom', () => ({
  Outlet: () => <div>Outlet Mock</div>,
  useLocation: () => ({ pathname: '/kamus' }),
}));

describe('TataLetak', () => {
  beforeEach(() => {
    global.fetch.mockReset();
  });

  it('merender navbar, outlet, dan toggle tema', () => {
    render(<TataLetak />);

    expect(screen.getByText('Navbar Mock')).toBeInTheDocument();
    expect(screen.getByText('Outlet Mock')).toBeInTheDocument();
    expect(screen.getByTitle(/Mode gelap|Mode terang/)).toBeInTheDocument();
  });

  it('toggle tema menyimpan preferensi ke localStorage', () => {
    render(<TataLetak />);
    fireEvent.click(screen.getByTitle(/Mode gelap|Mode terang/));
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('membuka modal dan memuat dokumen changelog/todo', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    render(<TataLetak />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));

    await waitFor(() => {
      expect(screen.getByText('Changelog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tugas' }));
    await waitFor(() => {
      expect(screen.getByText('Todo')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByText('Todo')).not.toBeInTheDocument();
  });

  it('menampilkan fallback pesan saat fetch gagal', async () => {
    global.fetch.mockRejectedValue(new Error('network error'));

    render(<TataLetak />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));

    await waitFor(() => {
      expect(screen.getByText('Gagal memuat dokumen.')).toBeInTheDocument();
    });
  });

  it('pembukaan modal kedua tidak fetch ulang saat data sudah ada', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    render(<TataLetak />);
    const versiBtn = screen.getByRole('button', { name: /Kateglo/i });

    fireEvent.click(versiBtn);
    await waitFor(() => expect(screen.getByText('Changelog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '×' }));
    fireEvent.click(versiBtn);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('klik overlay menutup modal', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    const { container } = render(<TataLetak />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));
    await waitFor(() => expect(screen.getByText('Changelog')).toBeInTheDocument());

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByText('Changelog')).not.toBeInTheDocument();
  });

  it('menggunakan theme tersimpan dari localStorage saat inisialisasi', () => {
    localStorage.getItem.mockReturnValue('dark');

    render(<TataLetak />);

    expect(localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('dapat kembali ke tab Riwayat setelah tab Tugas', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    render(<TataLetak />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));
    await waitFor(() => expect(screen.getByText('Changelog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Tugas' }));
    await waitFor(() => expect(screen.getByText('Todo')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });
});
