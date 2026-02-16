/**
 * @fileoverview Test App routing
 */

import { render, screen } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { MemoryRouter, Outlet } from 'react-router-dom';
import App from '../src/App';

const mockUseAuth = vi.fn();

vi.mock('../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../src/komponen/publik/TataLetak', () => ({
  default: () => <div data-testid="layout">Layout <Outlet /></div>,
}));
vi.mock('../src/halaman/publik/Beranda', () => ({ default: () => <div>Hal Beranda</div> }));
vi.mock('../src/halaman/publik/Kamus', () => ({ default: () => <div>Hal Kamus</div> }));
vi.mock('../src/halaman/publik/KamusDetail', () => ({ default: () => <div>Hal Kamus Detail</div> }));
vi.mock('../src/halaman/publik/Tesaurus', () => ({ default: () => <div>Hal Tesaurus</div> }));
vi.mock('../src/halaman/publik/Glosarium', () => ({ default: () => <div>Hal Glosarium</div> }));
vi.mock('../src/halaman/publik/AuthCallback', () => ({ default: () => <div>Auth Callback</div> }));
vi.mock('../src/halaman/publik/KebijakanPrivasi', () => ({ default: () => <div>Kebijakan Privasi</div> }));
vi.mock('../src/halaman/redaksi/LoginAdmin', () => ({ default: () => <div>Login Redaksi</div> }));
vi.mock('../src/halaman/redaksi/DasborAdmin', () => ({ default: () => <div>Dasbor Redaksi</div> }));
vi.mock('../src/halaman/redaksi/KamusAdmin', () => ({ default: () => <div>Kamus Redaksi</div> }));
vi.mock('../src/halaman/redaksi/TesaurusAdmin', () => ({ default: () => <div>Tesaurus Redaksi</div> }));
vi.mock('../src/halaman/redaksi/GlosariumAdmin', () => ({ default: () => <div>Glosarium Redaksi</div> }));
vi.mock('../src/halaman/redaksi/LabelAdmin', () => ({ default: () => <div>Label Redaksi</div> }));
vi.mock('../src/halaman/redaksi/PenggunaAdmin', () => ({ default: () => <div>Pengguna Redaksi</div> }));

describe('App', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      adalahAdmin: false,
      isLoading: false,
    });
  });

  it('merender route publik dalam tata letak', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Hal Beranda')).toBeInTheDocument();
  });

  it('merender auth callback route', () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Auth Callback')).toBeInTheDocument();
  });

  it('mengalihkan route redaksi ke login saat bukan admin', () => {
    render(
      <MemoryRouter initialEntries={['/redaksi']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Redaksi')).toBeInTheDocument();
  });

  it('menampilkan loading untuk route redaksi saat auth sedang dimuat', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      adalahAdmin: false,
      isLoading: true,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Memuat...')).toBeInTheDocument();
  });

  it('mengizinkan route redaksi saat user admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahAdmin: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Kamus Redaksi')).toBeInTheDocument();
  });

  it('mengizinkan route label redaksi saat user admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahAdmin: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/label']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Label Redaksi')).toBeInTheDocument();
  });

  it('merender route kebijakan privasi', () => {
    render(
      <MemoryRouter initialEntries={['/kebijakan-privasi']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Kebijakan Privasi')).toBeInTheDocument();
  });
});
