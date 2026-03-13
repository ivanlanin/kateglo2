/**
 * @fileoverview Test untuk komponen NavbarPublik
 * @tested_in frontend/src/components/publik/NavbarPublik.jsx
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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavbarPublik from '../../../src/components/publik/NavbarPublik';

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
});
