/**
 * @fileoverview Test untuk komponen NavbarPublik
 * @tested_in frontend/src/components/navigasi/NavbarPublik.jsx
 */

// Mock react-router-dom SEBELUM import komponen
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/kamus', search: '' };
const mockAuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  loginDenganGoogle: vi.fn(),
  logout: vi.fn(),
};

const mockSimpanReturnTo = vi.fn();
const mockBuatUrlLoginGoogle = vi.fn(() => '#login-google');

vi.mock('../../../src/api/apiPublik', () => ({
  autocomplete: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../src/api/apiAuth', () => ({
  simpanReturnTo: (...args) => mockSimpanReturnTo(...args),
  buatUrlLoginGoogle: (...args) => mockBuatUrlLoginGoogle(...args),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, onClick, ...props }) => (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        if (onClick) onClick(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavbarPublik, { __private } from '../../../src/components/navigasi/NavbarPublik';

function aturUkuranNavbar({ lebarNavbar = 1200, lebarLogo = 96, lebarMenu = 520 } = {}) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function clientWidthGetter() {
    if (this.classList?.contains('navbar-inner')) {
      return lebarNavbar;
    }

    return 0;
  });

  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function offsetWidthGetter() {
    if (this.classList?.contains('navbar-logo')) {
      return lebarLogo;
    }

    return 0;
  });

  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function scrollWidthGetter() {
    if (this.classList?.contains('navbar-menu-measure')) {
      return lebarMenu;
    }

    return 0;
  });
}

describe('NavbarPublik', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    aturUkuranNavbar();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    mockNavigate.mockClear();
    mockLocation.pathname = '/kamus';
    mockLocation.search = '';
    mockAuthState.user = null;
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = false;
    mockAuthState.logout = vi.fn();
    mockSimpanReturnTo.mockClear();
    mockBuatUrlLoginGoogle.mockClear();
    mockBuatUrlLoginGoogle.mockReturnValue('#login-google');
  });

  it('menampilkan logo Kateglo', () => {
    render(<NavbarPublik />);
    expect(screen.getByText('Kateglo')).toBeInTheDocument();
  });

  it('helper navbar menghitung kebutuhan hamburger dan kelas beranda secara eksplisit', () => {
    expect(__private.hitungKebutuhanHamburger({
      lebarNavbar: 1200,
      lebarLogo: 100,
      lebarMenu: 400,
      tampilkanKotakCari: true,
      elemenBarisUtama: [{ offsetTop: undefined }, { offsetTop: 0 }],
    })).toBe(false);

    expect(__private.hitungKebutuhanHamburger({
      lebarNavbar: 500,
      lebarLogo: 100,
      lebarMenu: 400,
      tampilkanKotakCari: true,
      elemenBarisUtama: [{ offsetTop: 0 }, { offsetTop: 20 }],
    })).toBe(true);

    expect(__private.buatKelasNavbar({ adalahBeranda: true, gunakanHamburger: true })).toContain('navbar-inner-beranda-collapsed');
    expect(__private.buatKelasNavbar({ adalahBeranda: false, gunakanHamburger: false })).toContain('navbar-inner-compact');
  });

  it('tetap aman saat lebar menu tidak terbaca dan memakai fallback nol', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function clientWidthGetter() {
      return this.classList?.contains('navbar-inner') ? 1200 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function offsetWidthGetter() {
      return this.classList?.contains('navbar-logo') ? 96 : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function scrollWidthGetter() {
      if (this.classList?.contains('navbar-menu-measure')) {
        return undefined;
      }

      return 0;
    });

    render(<NavbarPublik />);

    expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
  });

  it('di beranda menyembunyikan logo dan kotak cari navbar', () => {
    mockLocation.pathname = '/';

    render(<NavbarPublik />);

    expect(screen.queryByText('Kateglo')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Cari kata …')).not.toBeInTheDocument();
  });

  it('menampilkan link menu navigasi', () => {
    render(<NavbarPublik />);
    expect(screen.getByRole('link', { name: 'Kamus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tesaurus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Glosarium' })).toBeInTheDocument();
  });

  it('menampilkan input pencarian', () => {
    render(<NavbarPublik />);
    expect(screen.getByPlaceholderText('Cari kata …')).toBeInTheDocument();
  });

  it('di halaman Susun Kata menyembunyikan kotak cari navbar', () => {
    mockLocation.pathname = '/gim/susun-kata';

    render(<NavbarPublik />);

    expect(screen.queryByPlaceholderText('Cari kata …')).not.toBeInTheDocument();
  });

  it('navigasi ke halaman kamus saat pencarian di-submit', () => {
    render(<NavbarPublik />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    fireEvent.change(input, { target: { value: 'rumah' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/rumah');
  });

  it('tidak navigasi jika query kosong', () => {
    render(<NavbarPublik />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('encode karakter khusus dalam query', () => {
    render(<NavbarPublik />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    fireEvent.change(input, { target: { value: 'anak & ibu' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/anak%20%26%20ibu');
  });

  it('toggle menu mobile saat hamburger diklik', () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    render(<NavbarPublik />);
    const toggleBtn = screen.getByLabelText('Toggle menu');

    expect(document.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);

    expect(document.querySelector('.navbar-mobile-panel')).toBeInTheDocument();
    expect(document.querySelector('.navbar-mobile-overlay')).toBeInTheDocument();
  });

  it('klik link mobile menutup menu', () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    render(<NavbarPublik />);
    const toggleBtn = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleBtn);

    const mobileLinks = screen.getAllByText('Glosarium');
    const mobileLink = mobileLinks[mobileLinks.length - 1];
    fireEvent.click(mobileLink);

    return waitFor(() => {
      expect(screen.queryByText('Glosarium', { selector: '.navbar-mobile-link' })).not.toBeInTheDocument();
    });
  });

  it('tetap bisa submit pencarian saat navbar menggunakan hamburger', async () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    render(<NavbarPublik />);

    await waitFor(() => {
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Cari kata …');
    fireEvent.change(input, { target: { value: 'mobile kata' } });
    fireEvent.submit(input.closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/mobile%20kata');
  });

  it('menampilkan status loading auth saat isLoading true', () => {
    mockAuthState.isLoading = true;

    const { container } = render(<NavbarPublik />);

    expect(container.querySelector('.navbar-menu-desktop-visible')).toHaveTextContent('Memuat …');
  });

  it('menampilkan status loading auth pada panel mobile saat menu dibuka', () => {
    mockAuthState.isLoading = true;
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    render(<NavbarPublik />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));

    expect(document.querySelector('.navbar-mobile-panel')).toHaveTextContent('Memuat …');
  });

  it('klik backdrop menutup drawer mobile', () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    const { container } = render(<NavbarPublik />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    fireEvent.click(container.querySelector('.navbar-mobile-overlay'));

    return waitFor(() => {
      expect(container.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();
    });
  });

  it('tombol tutup menutup drawer mobile', () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    const { container } = render(<NavbarPublik />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    fireEvent.click(screen.getByLabelText('Tutup menu'));

    return waitFor(() => {
      expect(container.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();
    });
  });

  it('tombol Escape menutup drawer mobile', () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    const { container } = render(<NavbarPublik />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    fireEvent.keyDown(document, { key: 'Escape' });

    return waitFor(() => {
      expect(container.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();
    });
  });

  it('menampilkan tombol Keluar dan memanggil logout saat sudah autentikasi', () => {
    const logoutMock = vi.fn();
    mockAuthState.isAuthenticated = true;
    mockAuthState.logout = logoutMock;

    render(<NavbarPublik />);
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('klik menu Masuk menyimpan return path', () => {
    render(<NavbarPublik />);

    fireEvent.click(screen.getByRole('link', { name: 'Masuk' }));

    expect(mockSimpanReturnTo).toHaveBeenCalledWith('/kamus');
  });

  it('klik menu Masuk di mobile menyimpan return path', () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    const { container } = render(<NavbarPublik />);

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const mobileLoginLink = container.querySelector('.navbar-mobile-auth a');
    fireEvent.click(mobileLoginLink);

    expect(mockSimpanReturnTo).toHaveBeenCalledWith('/kamus');
  });

  it('logout dari menu mobile menutup panel dan memanggil logout', () => {
    const logoutMock = vi.fn();
    mockAuthState.isAuthenticated = true;
    mockAuthState.logout = logoutMock;
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    const { container } = render(<NavbarPublik />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const mobileLogoutButton = container.querySelector('.navbar-mobile-auth button');
    fireEvent.click(mobileLogoutButton);

    expect(logoutMock).toHaveBeenCalledTimes(1);

    return waitFor(() => {
      expect(container.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();
    });
  });

  it('tetap stabil saat ResizeObserver tidak tersedia dan lebar navbar nol', () => {
    const resizeObserverSebelumnya = global.ResizeObserver;
    delete global.ResizeObserver;
    aturUkuranNavbar({ lebarNavbar: 0, lebarMenu: 620 });

    render(<NavbarPublik />);

    expect(screen.queryByLabelText('Toggle menu')).not.toBeInTheDocument();
    global.ResizeObserver = resizeObserverSebelumnya;
  });

  it('menutup drawer saat layout berubah kembali ke desktop dan memulihkan overflow body', async () => {
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });

    const { container } = render(<NavbarPublik />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));

    expect(document.body.style.overflow).toBe('hidden');

    aturUkuranNavbar({ lebarNavbar: 1440, lebarMenu: 320 });
    fireEvent(window, new Event('resize'));

    await waitFor(() => {
      expect(container.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();
    });

    expect(document.body.style.overflow).toBe('');
  });

  it('membatalkan frame pengukuran sebelumnya dan mengamati elemen saat observer tersedia', () => {
    const callbacks = [];
    const observerCallbacks = [];
    const observe = vi.fn();
    const disconnect = vi.fn();

    global.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
        observerCallbacks.push(callback);
      }

      observe(element) {
        observe(element);
      }

      disconnect() {
        disconnect();
      }
    };

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<NavbarPublik />);
    fireEvent(window, new Event('resize'));

    expect(cancelSpy).toHaveBeenCalledWith(1);
    expect(observe).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledTimes(0);

    callbacks.splice(0).forEach((callback) => callback(0));

    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });
    act(() => {
      observerCallbacks.forEach((callback) => callback());
      callbacks.splice(0).forEach((callback) => callback(0));
    });

    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });

  it('membersihkan frame drawer yang tertunda dan timer close saat unmount', async () => {
    const callbacks = [];
    aturUkuranNavbar({ lebarNavbar: 720, lebarMenu: 620 });
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const view = render(<NavbarPublik />);
    act(() => {
      callbacks.splice(0).forEach((callback) => callback(0));
    });
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    view.unmount();

    expect(cancelSpy).toHaveBeenCalled();

    const mounted = render(<NavbarPublik />);
    act(() => {
      callbacks.splice(0).forEach((callback) => callback(0));
    });
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    act(() => {
      callbacks.splice(0).forEach((callback) => callback(0));
    });
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    mounted.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
