/**
 * @fileoverview Test untuk komponen Navbar
 * @tested_in frontend/src/komponen/publik/Navbar.jsx
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

import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../../../src/komponen/publik/Navbar';

describe('Navbar', () => {
  beforeEach(() => {
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
    render(<Navbar />);
    expect(screen.getByText('Kateglo')).toBeInTheDocument();
  });

  it('di beranda menyembunyikan logo dan kotak cari navbar', () => {
    mockLocation.pathname = '/';

    render(<Navbar />);

    expect(screen.queryByText('Kateglo')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Cari kata …')).not.toBeInTheDocument();
  });

  it('menampilkan link menu navigasi', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'Kamus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tesaurus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Glosarium' })).toBeInTheDocument();
  });

  it('menampilkan input pencarian', () => {
    render(<Navbar />);
    expect(screen.getByPlaceholderText('Cari kata …')).toBeInTheDocument();
  });

  it('navigasi ke halaman kamus saat pencarian di-submit', () => {
    render(<Navbar />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    fireEvent.change(input, { target: { value: 'rumah' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/rumah');
  });

  it('tidak navigasi jika query kosong', () => {
    render(<Navbar />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('encode karakter khusus dalam query', () => {
    render(<Navbar />);
    const input = screen.getAllByPlaceholderText('Cari kata …')[0];
    fireEvent.change(input, { target: { value: 'anak & ibu' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/anak%20%26%20ibu');
  });

  it('toggle menu mobile saat hamburger diklik', () => {
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText('Toggle menu');

    // Menu mobile belum terlihat (link hanya tampil di desktop)
    const linksBefore = screen.getAllByText('Kamus');
    const countBefore = linksBefore.length;

    // Klik hamburger
    fireEvent.click(toggleBtn);

    // Sekarang link mobile muncul
    const linksAfter = screen.getAllByText('Kamus');
    expect(linksAfter.length).toBeGreaterThan(countBefore);
  });

  it('klik link mobile menutup menu', () => {
    render(<Navbar />);
    const toggleBtn = screen.getByLabelText('Toggle menu');
    fireEvent.click(toggleBtn);

    const mobileLinks = screen.getAllByText('Glosarium');
    const mobileLink = mobileLinks[mobileLinks.length - 1];
    fireEvent.click(mobileLink);

    expect(screen.queryByText('Glosarium', { selector: '.navbar-mobile-link' })).not.toBeInTheDocument();
  });

  it('submit pencarian dari form mobile melakukan navigasi', () => {
    render(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));

    const inputs = screen.getAllByPlaceholderText('Cari kata …');
    const mobileInput = inputs[inputs.length - 1];
    fireEvent.change(mobileInput, { target: { value: 'mobile kata' } });
    fireEvent.submit(mobileInput.closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/mobile%20kata');
  });

  it('menampilkan status loading auth saat isLoading true', () => {
    mockAuthState.isLoading = true;

    render(<Navbar />);

    expect(screen.getByText('Memuat...')).toBeInTheDocument();
  });

  it('menampilkan status loading auth pada panel mobile saat menu dibuka', () => {
    mockAuthState.isLoading = true;

    render(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));

    expect(screen.getAllByText('Memuat...').length).toBeGreaterThanOrEqual(2);
  });

  it('menampilkan tombol Keluar dan memanggil logout saat sudah autentikasi', () => {
    const logoutMock = vi.fn();
    mockAuthState.isAuthenticated = true;
    mockAuthState.logout = logoutMock;

    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it('klik menu Masuk menyimpan return path', () => {
    render(<Navbar />);

    fireEvent.click(screen.getByRole('link', { name: 'Masuk' }));

    expect(mockSimpanReturnTo).toHaveBeenCalledWith('/kamus');
  });

  it('klik menu Masuk di mobile menyimpan return path', () => {
    const { container } = render(<Navbar />);

    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const mobileLoginLink = container.querySelector('.navbar-mobile-auth a');
    fireEvent.click(mobileLoginLink);

    expect(mockSimpanReturnTo).toHaveBeenCalledWith('/kamus');
  });

  it('logout dari menu mobile menutup panel dan memanggil logout', () => {
    const logoutMock = vi.fn();
    mockAuthState.isAuthenticated = true;
    mockAuthState.logout = logoutMock;

    const { container } = render(<Navbar />);
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    const mobileLogoutButton = container.querySelector('.navbar-mobile-auth button');
    fireEvent.click(mobileLogoutButton);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.navbar-mobile-panel')).not.toBeInTheDocument();
  });
});
