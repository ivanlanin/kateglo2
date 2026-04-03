import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TataLetakPublik from '../../../src/components/tampilan/TataLetakPublik';

let mockPathname = '/kamus';
let mockSearch = '';
let mockHash = '';
let mockNavigationType = 'PUSH';
let mockAuthOptional = { adalahRedaksi: false };

vi.mock('../../../src/components/navigasi/NavbarPublik', () => ({ default: () => <div>Navbar Mock</div> }));
vi.mock('react-markdown', () => ({
  default: ({ children }) => <div>{String(children).replace(/^#\s+/gm, '')}</div>,
}));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Outlet: () => <div>Outlet Mock</div>,
  useLocation: () => ({ pathname: mockPathname, search: mockSearch, hash: mockHash }),
  useNavigationType: () => mockNavigationType,
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuthOptional,
}));

describe('TataLetakPublik', () => {
  beforeEach(() => {
    mockPathname = '/kamus';
    mockSearch = '';
    mockHash = '';
    mockNavigationType = 'PUSH';
    mockAuthOptional = { adalahRedaksi: false };
    global.fetch.mockReset();
    window.scrollTo = vi.fn();
  });

  it('merender navbar, outlet, dan toggle tema', () => {
    render(<TataLetakPublik />);

    expect(screen.getByText('Navbar Mock')).toBeInTheDocument();
    expect(screen.getByText('Outlet Mock')).toBeInTheDocument();
    expect(screen.getByTitle(/Mode gelap|Mode terang/)).toBeInTheDocument();
  });

  it('reset scroll ke atas saat navigasi route publik baru', () => {
    render(<TataLetakPublik />);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('tidak reset scroll saat navigasi browser back/forward', () => {
    mockNavigationType = 'POP';

    render(<TataLetakPublik />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('tidak reset scroll saat navigasi hash anchor', () => {
    mockHash = '#bagian-1';

    render(<TataLetakPublik />);

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('toggle tema menyimpan preferensi ke localStorage', () => {
    render(<TataLetakPublik />);
    fireEvent.click(screen.getByTitle(/Mode gelap|Mode terang/));
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('membuka modal dan memuat dokumen changelog/todo', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    render(<TataLetakPublik />);
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

    render(<TataLetakPublik />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));

    await waitFor(() => {
      expect(screen.getByText('Gagal memuat dokumen.')).toBeInTheDocument();
    });
  });

  it('pembukaan modal kedua tidak fetch ulang saat data sudah ada', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    render(<TataLetakPublik />);
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

    const { container } = render(<TataLetakPublik />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));
    await waitFor(() => expect(screen.getByText('Changelog')).toBeInTheDocument());

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByText('Changelog')).not.toBeInTheDocument();
  });

  it('menggunakan theme tersimpan dari localStorage saat inisialisasi', () => {
    localStorage.getItem.mockReturnValue('dark');

    render(<TataLetakPublik />);

    expect(localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('menggunakan theme terang saat localStorage berisi light', () => {
    localStorage.getItem.mockReturnValue('light');

    render(<TataLetakPublik />);

    expect(localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('menggunakan preferensi sistem saat localStorage kosong', () => {
    localStorage.getItem.mockReturnValue(null);
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addListener: vi.fn(), removeListener: vi.fn() });

    render(<TataLetakPublik />);

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('menambahkan kelas beranda saat pathname root', () => {
    mockPathname = '/';

    const { container } = render(<TataLetakPublik />);
    const main = container.querySelector('main');

    expect(main.className).toContain('kateglo-main-content-beranda');
  });

  it('tautan Redaksi tidak ada di footer saat user adalah redaksi (dipindah ke dropdown avatar)', () => {
    mockAuthOptional = { adalahRedaksi: true };

    render(<TataLetakPublik />);

    // Link Redaksi sudah dipindah ke dropdown avatar di NavbarPublik, tidak lagi di footer
    expect(screen.queryByRole('link', { name: 'Redaksi' })).not.toBeInTheDocument();
  });

  it('dapat kembali ke tab Riwayat setelah tab Tugas', async () => {
    global.fetch
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Changelog') })
      .mockResolvedValueOnce({ text: vi.fn().mockResolvedValue('# Todo') });

    render(<TataLetakPublik />);
    fireEvent.click(screen.getByRole('button', { name: /Kateglo/i }));
    await waitFor(() => expect(screen.getByText('Changelog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Tugas' }));
    await waitFor(() => expect(screen.getByText('Todo')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(screen.getByText('Changelog')).toBeInTheDocument();
  });
});
