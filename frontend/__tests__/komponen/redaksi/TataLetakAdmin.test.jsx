import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TataLetakAdmin from '../../../src/komponen/redaksi/TataLetakAdmin';
import { hitungModeGelapAwal } from '../../../src/komponen/redaksi/TataLetakAdmin';
import { bacaPreferensiTema } from '../../../src/komponen/redaksi/TataLetakAdmin';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockUseAuth = vi.fn(() => ({ user: { email: 'admin@kateglo.id' }, logout: mockLogout }));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TataLetakAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  it('menampilkan judul, user, menu aktif, dan logout', () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin judul="Kamus">Isi Admin</TataLetakAdmin>
      </MemoryRouter>
    );

    expect(document.title).toBe('Kamus — Redaksi Kateglo');
    expect(screen.getByRole('link', { name: 'Redaksi' })).toHaveAttribute('href', '/redaksi');
    expect(screen.getByRole('link', { name: 'Kateglo' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Dasbor' })).not.toBeInTheDocument();
    const menuKamus = screen.getAllByRole('link', { name: 'Kamus' });
    expect(menuKamus.some((link) => link.className.includes('navbar-menu-link-active'))).toBe(true);
    expect(screen.getByRole('link', { name: 'Kebijakan Privasi' })).toHaveAttribute('href', '/kebijakan-privasi');
    expect(screen.getByText('Isi Admin')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Keluar' })[0]);
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('menangani judul kosong dan fallback nama user', () => {
    mockUseAuth.mockReturnValueOnce({ user: { name: 'Redaksi' }, logout: mockLogout });
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    expect(document.title).toBe('Redaksi Kateglo');
    expect(screen.getByRole('link', { name: 'Redaksi' })).toHaveAttribute('href', '/redaksi');
    expect(screen.queryByText('admin@kateglo.id')).not.toBeInTheDocument();
    const menuKamus = screen.getAllByRole('link', { name: 'Kamus' });
    expect(menuKamus.some((link) => link.className.includes('navbar-menu-link-active'))).toBe(true);
  });

  it('menampilkan menu burger mobile dan bisa dibuka', () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleBtn);

    const menuKamus = screen.getAllByRole('link', { name: 'Kamus' });
    expect(menuKamus.length).toBeGreaterThan(1);
  });

  it('menu mobile logout menutup panel lalu logout', () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Keluar' })[1]);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('klik link pada menu mobile menutup panel tanpa logout', () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    fireEvent.click(screen.getAllByRole('link', { name: 'Tesaurus' })[1]);

    expect(mockLogout).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('link', { name: 'Tesaurus' })).toHaveLength(1);
  });

  it('mode gelap membaca localStorage dan toggle tema memperbarui ikon/title', () => {
    localStorage.getItem.mockReturnValue('dark');

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    const toggleTheme = document.querySelector('.kateglo-theme-toggle');
    expect(toggleTheme).not.toBeNull();
    const titleAwal = toggleTheme?.getAttribute('title');
    const ikonAwal = toggleTheme?.textContent;

    fireEvent.click(toggleTheme);

    expect(toggleTheme?.getAttribute('title')).not.toBe(titleAwal);
    expect(toggleTheme?.textContent).not.toBe(ikonAwal);
  });

  it('mode terang saat localStorage berisi light', () => {
    localStorage.getItem.mockReturnValue('light');

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    expect(localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
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
      localStorage: { getItem: vi.fn().mockReturnValue('light') },
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };

    expect(bacaPreferensiTema(runtimeMock)).toEqual({ hasWindow: true, tersimpan: 'light', prefersDark: false });
    expect(runtimeMock.localStorage.getItem).toHaveBeenCalledWith('kateglo-theme');
    expect(runtimeMock.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});