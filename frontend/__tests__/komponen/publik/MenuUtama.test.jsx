import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MenuUtama, { menuItems } from '../../../src/komponen/publik/MenuUtama';

let mockLocation = { pathname: '/kamus', search: '' };
const mockLogout = vi.fn();
const mockUseAuth = vi.fn();
const mockSimpanReturnTo = vi.fn();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => mockLocation,
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

vi.mock('../../../src/api/apiAuth', () => ({
  buatUrlLoginGoogle: vi.fn(() => '/auth/google'),
  simpanReturnTo: (...args) => mockSimpanReturnTo(...args),
}));

describe('MenuUtama', () => {
  const originalItems = [...menuItems];

  beforeEach(() => {
    mockLocation = { pathname: '/kamus', search: '' };
    mockLogout.mockReset();
    mockSimpanReturnTo.mockReset();
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      adalahRedaksi: false,
      logout: mockLogout,
    });

    menuItems.length = 0;
    menuItems.push(...originalItems);
  });

  it('menandai link aktif untuk path yang sama atau turunan', () => {
    mockLocation = { pathname: '/kamus/detail/kata', search: '' };

    render(<MenuUtama />);

    expect(screen.getByRole('link', { name: 'Kamus' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tesaurus' })).not.toHaveAttribute('aria-current');
  });

  it('menampilkan status memuat saat autentikasi loading', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      adalahRedaksi: false,
      logout: mockLogout,
    });

    render(<MenuUtama loadingClassName="loading" />);

    expect(screen.getByText('Memuat...')).toBeInTheDocument();
  });

  it('menangani klik logout saat user sudah login', () => {
    const onItemClick = vi.fn();
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      adalahRedaksi: false,
      logout: mockLogout,
    });

    render(<MenuUtama onItemClick={onItemClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));
    expect(mockLogout).toHaveBeenCalled();
    expect(onItemClick).toHaveBeenCalled();
  });

  it('menangani klik login dan menyimpan returnTo', () => {
    const onItemClick = vi.fn();
    mockLocation = { pathname: '/glosarium', search: '?q=kimia' };

    render(<MenuUtama onItemClick={onItemClick} />);

    const loginLink = screen.getByRole('link', { name: 'Masuk' });
    expect(loginLink).toHaveAttribute('href', '/auth/google');
    fireEvent.click(loginLink);

    expect(mockSimpanReturnTo).toHaveBeenCalledWith('/glosarium?q=kimia');
    expect(onItemClick).toHaveBeenCalled();
  });

  it('tetap aman saat memakai onItemClick bawaan', () => {
    mockLocation = { pathname: '/kamus', search: '' };

    render(<MenuUtama />);

    fireEvent.click(screen.getByRole('link', { name: 'Masuk' }));
    expect(mockSimpanReturnTo).toHaveBeenCalledWith('/kamus');
  });

  it('menyaring item adminSaja berdasarkan status redaksi', () => {
    menuItems.push({ path: '/rahasia', label: 'Rahasia', adminSaja: true });

    render(<MenuUtama />);
    expect(screen.queryByRole('link', { name: 'Rahasia' })).not.toBeInTheDocument();

    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      adalahRedaksi: true,
      logout: mockLogout,
    });

    render(<MenuUtama />);
    expect(screen.getByRole('link', { name: 'Rahasia' })).toBeInTheDocument();
  });
});
