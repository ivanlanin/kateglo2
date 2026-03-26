import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HalamanAdminComponent from '../../../src/components/tampilan/HalamanAdmin';

function HalamanAdmin(props) {
  return <HalamanAdminComponent {...props} />;
}

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
let mockPathname = '/redaksi/kamus';
let mockSearch = '';
let mockHash = '';
let mockNavigationType = 'PUSH';
const mockUseAuth = vi.fn(() => ({
  user: { email: 'admin@kateglo.id' },
  logout: mockLogout,
  punyaIzin: () => true,
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
  useAuthOptional: () => null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname, search: mockSearch, hash: mockHash }),
    useNavigationType: () => mockNavigationType,
  };
});

describe('HalamanAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/redaksi/kamus';
    mockSearch = '';
    mockHash = '';
    mockNavigationType = 'PUSH';
    localStorage.clear();
    window.scrollTo = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it('menampilkan judul, user, menu aktif, dan logout', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin judul="Kamus">Isi Admin</HalamanAdmin>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'Redaksi Kateglo' }, { timeout: 3000 })).toHaveAttribute('href', '/redaksi');
    expect(document.title).toBe('Kamus — Redaksi Kateglo');
    expect(screen.getByRole('link', { name: 'Kateglo' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Dasbor' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Buka menu redaksi'));
    const menuKamus = screen.getAllByRole('link', { name: 'Kamus' });
    expect(menuKamus.some((link) => link.className.includes('navbar-menu-link-active'))).toBe(true);
    expect(screen.getByRole('link', { name: 'Privasi' })).toHaveAttribute('href', '/privasi');
    const sumberLinks = screen.getAllByRole('link', { name: 'Sumber' });
    expect(sumberLinks.some((link) => link.getAttribute('href') === '/sumber')).toBe(true);
    expect(screen.getByText('Isi Admin')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Keluar' })[0]);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('reset scroll ke atas saat navigasi route redaksi baru', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin judul="Kamus">Isi Admin</HalamanAdmin>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: 'Redaksi Kateglo' });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('tidak reset scroll saat navigasi browser back atau forward', async () => {
    mockNavigationType = 'POP';

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin judul="Kamus">Isi Admin</HalamanAdmin>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: 'Redaksi Kateglo' });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('tidak reset scroll saat navigasi ke anchor hash', async () => {
    mockHash = '#bagian-1';

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin judul="Kamus">Isi Admin</HalamanAdmin>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: 'Redaksi Kateglo' });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('menangani judul kosong dan fallback nama user', async () => {
    mockUseAuth.mockReturnValueOnce({ user: { name: 'Redaksi' }, logout: mockLogout, punyaIzin: () => true });
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'Redaksi Kateglo' })).toHaveAttribute('href', '/redaksi');
    expect(document.title).toBe('Redaksi Kateglo');
    expect(screen.queryByText('admin@kateglo.id')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Buka menu redaksi'));
    const menuKamus = screen.getAllByRole('link', { name: 'Kamus' });
    expect(menuKamus.some((link) => link.className.includes('navbar-menu-link-active'))).toBe(true);
  });

  it('menampilkan menu burger mobile dan bisa dibuka', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    const toggleBtn = await screen.findByLabelText('Buka menu redaksi');
    fireEvent.click(toggleBtn);

    expect(screen.getByRole('heading', { name: 'Leksikon' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kamus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kandidat Kata' })).toBeInTheDocument();
    const menuTagar = screen.getAllByRole('link', { name: 'Tagar' });
    expect(menuTagar.some((link) => link.getAttribute('href') === '/redaksi/tagar')).toBe(true);
    expect(menuTagar.some((link) => link.getAttribute('href') === '/redaksi/audit-tagar')).toBe(true);
  });

  it('logout tetap berjalan saat panel menu terbuka', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Buka menu redaksi'));
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('klik link pada menu mobile menutup panel tanpa logout', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Buka menu redaksi'));
    fireEvent.click(screen.getByRole('link', { name: 'Tesaurus' }));

    expect(mockLogout).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Leksikon' })).not.toBeInTheDocument();
  });

  it('tombol tutup panel menu mobile menutup panel', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Buka menu redaksi'));
    expect(screen.getByRole('heading', { name: 'Leksikon' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Tutup panel menu'));
    expect(screen.queryByRole('heading', { name: 'Leksikon' })).not.toBeInTheDocument();
  });

  it('overlay menu mobile menutup panel saat diklik', async () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Buka menu redaksi'));
    expect(screen.getByRole('heading', { name: 'Leksikon' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Tutup menu redaksi'));
    expect(screen.queryByRole('heading', { name: 'Leksikon' })).not.toBeInTheDocument();
  });

  it('menu admin memakai fallback user.izin saat punyaIzin tidak tersedia', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'fallback@kateglo.id', izin: ['lihat_entri', 'kelola_label'] },
      logout: mockLogout,
      punyaIzin: null,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByLabelText('Buka menu redaksi'));
    expect(screen.getByRole('link', { name: 'Kamus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Label' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tesaurus' })).not.toBeInTheDocument();
  });

  it('mode gelap membaca localStorage dan toggle tema memperbarui ikon/title', async () => {
    localStorage.getItem.mockReturnValue('dark');

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    await screen.findByRole('link', { name: 'Redaksi Kateglo' });
    const toggleTheme = document.querySelector('.kateglo-theme-toggle');
    expect(toggleTheme).not.toBeNull();
    const titleAwal = toggleTheme?.getAttribute('title');
    const ikonAwal = toggleTheme?.textContent;

    fireEvent.click(toggleTheme);

    expect(toggleTheme?.getAttribute('title')).not.toBe(titleAwal);
    expect(toggleTheme?.textContent).not.toBe(ikonAwal);
  });

  it('mode terang saat localStorage berisi light', async () => {
    localStorage.getItem.mockReturnValue('light');

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <HalamanAdmin>Konten</HalamanAdmin>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'Redaksi Kateglo' })).toHaveAttribute('href', '/redaksi');
    expect(localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});