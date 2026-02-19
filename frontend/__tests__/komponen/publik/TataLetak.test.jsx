import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TataLetak from '../../../src/komponen/publik/TataLetak';
import { hitungModeGelapAwal } from '../../../src/komponen/publik/TataLetak';
import { bacaPreferensiTema } from '../../../src/komponen/publik/TataLetak';

let mockPathname = '/kamus';

vi.mock('../../../src/komponen/publik/Navbar', () => ({ default: () => <div>Navbar Mock</div> }));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Outlet: () => <div>Outlet Mock</div>,
  useLocation: () => ({ pathname: mockPathname }),
}));

describe('TataLetak', () => {
  beforeEach(() => {
    mockPathname = '/kamus';
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

  it('menggunakan theme terang saat localStorage berisi light', () => {
    localStorage.getItem.mockReturnValue('light');

    render(<TataLetak />);

    expect(localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('menggunakan preferensi sistem saat localStorage kosong', () => {
    localStorage.getItem.mockReturnValue(null);
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() });

    render(<TataLetak />);

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('menambahkan kelas beranda saat pathname root', () => {
    mockPathname = '/';

    const { container } = render(<TataLetak />);
    const main = container.querySelector('main');

    expect(main.className).toContain('kateglo-main-content-beranda');
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

  it('hitungModeGelapAwal menangani no-window, tema tersimpan, dan preferensi sistem', () => {
    expect(hitungModeGelapAwal({ hasWindow: false, tersimpan: null, prefersDark: true })).toBe(false);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: 'dark', prefersDark: false })).toBe(true);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: 'light', prefersDark: true })).toBe(false);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: null, prefersDark: true })).toBe(true);
    expect(hitungModeGelapAwal({ hasWindow: true, tersimpan: null, prefersDark: false })).toBe(false);
  });

  it('bacaPreferensiTema menangani runtime null dan runtime browser', () => {
    expect(bacaPreferensiTema(null)).toEqual({ hasWindow: false, tersimpan: null, prefersDark: false });

    const runtimeMock = {
      localStorage: { getItem: vi.fn().mockReturnValue('dark') },
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    };

    expect(bacaPreferensiTema(runtimeMock)).toEqual({ hasWindow: true, tersimpan: 'dark', prefersDark: true });
    expect(runtimeMock.localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(runtimeMock.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});
