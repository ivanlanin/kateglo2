import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Beranda from '../../src/halaman/Beranda';

const mockNavigate = vi.fn();

vi.mock('../../src/api/apiPublik', () => ({
  autocomplete: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/context/authContext', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock('../../src/api/apiAuth', () => ({
  buatUrlLoginGoogle: vi.fn(() => 'http://localhost:3000/auth/google'),
  simpanReturnTo: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

describe('Beranda', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('menampilkan hero dan menu kanan atas', () => {
    render(<Beranda />);

    expect(screen.getByText('Kateglo')).toBeInTheDocument();
    expect(screen.getByText(/Kamus, tesaurus, dan glosarium bahasa Indonesia/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kamus/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tesaurus/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Glosarium/i })).toBeInTheDocument();
    expect(screen.queryByText('Definisi dan makna kata')).not.toBeInTheDocument();
  });

  it('submit query kosong tidak menavigasi', () => {
    render(<Beranda />);

    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submit query menavigasi ke halaman kamus', () => {
    render(<Beranda />);

    fireEvent.change(screen.getByPlaceholderText('Cari kata …'), { target: { value: 'anak ibu' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/anak%20ibu');
  });
});
