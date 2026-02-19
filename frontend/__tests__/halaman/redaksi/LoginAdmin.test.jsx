import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginAdmin from '../../../src/halaman/redaksi/LoginAdmin';

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { authError: 'Akses ditolak' } }),
  };
});

describe('LoginAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan loading state', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, adalahRedaksi: false, isLoading: true, loginDenganGoogle: vi.fn() });

    render(
      <MemoryRouter>
        <LoginAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Memeriksa sesi...')).toBeInTheDocument();
  });

  it('menampilkan error dan memanggil login google', () => {
    const loginDenganGoogle = vi.fn();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, adalahRedaksi: false, isLoading: false, loginDenganGoogle });

    render(
      <MemoryRouter>
        <LoginAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Akses ditolak')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Masuk dengan Google'));
    expect(loginDenganGoogle).toHaveBeenCalledWith('/redaksi');
  });

  it('navigasi otomatis saat user admin', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, adalahRedaksi: true, isLoading: false, loginDenganGoogle: vi.fn() });

    render(
      <MemoryRouter>
        <LoginAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi', { replace: true });
  });

  it('menampilkan pesan akun tidak punya akses redaksi', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, adalahRedaksi: false, isLoading: false, loginDenganGoogle: vi.fn() });

    render(
      <MemoryRouter>
        <LoginAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Akun Anda tidak memiliki akses redaksi.')).toBeInTheDocument();
  });
});