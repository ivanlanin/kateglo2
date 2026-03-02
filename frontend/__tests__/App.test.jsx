/**
 * @fileoverview Test App routing
 */

import { render, screen } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { MemoryRouter, Outlet } from 'react-router-dom';
import App, { RuteIzin } from '../src/App';

const mockUseAuth = vi.fn();

vi.mock('../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../src/komponen/bersama/TataLetak', () => ({
  default: () => <div data-testid="layout">Layout <Outlet /></div>,
}));
vi.mock('../src/halaman/publik/Beranda', () => ({ default: () => <div>Hal Beranda</div> }));
vi.mock('../src/halaman/publik/Kamus', () => ({ default: () => <div>Hal Kamus</div> }));
vi.mock('../src/halaman/publik/KamusDetail', () => ({ default: () => <div>Hal Kamus Detail</div> }));
vi.mock('../src/halaman/publik/Tesaurus', () => ({ default: () => <div>Hal Tesaurus</div> }));
vi.mock('../src/halaman/gim/SusunKata', () => ({ default: () => <div>Hal Susun Kata</div> }));
vi.mock('../src/halaman/publik/Glosarium', () => ({ default: () => <div>Hal Glosarium</div> }));
vi.mock('../src/halaman/publik/AuthCallback', () => ({ default: () => <div>Auth Callback</div> }));
vi.mock('../src/halaman/publik/KebijakanPrivasi', () => ({ default: () => <div>Kebijakan Privasi</div> }));
vi.mock('../src/halaman/redaksi/LoginAdmin', () => ({ default: () => <div>Login Redaksi</div> }));
vi.mock('../src/halaman/redaksi/DasborAdmin', () => ({ default: () => <div>Dasbor Redaksi</div> }));
vi.mock('../src/halaman/redaksi/KamusAdmin', () => ({ default: () => <div>Kamus Redaksi</div> }));
vi.mock('../src/halaman/redaksi/KomentarAdmin', () => ({ default: () => <div>Komentar Redaksi</div> }));
vi.mock('../src/halaman/redaksi/TesaurusAdmin', () => ({ default: () => <div>Tesaurus Redaksi</div> }));
vi.mock('../src/halaman/redaksi/GlosariumAdmin', () => ({ default: () => <div>Glosarium Redaksi</div> }));
vi.mock('../src/halaman/redaksi/BidangGlosariumAdmin', () => ({ default: () => <div>Bidang Glosarium Redaksi</div> }));
vi.mock('../src/halaman/redaksi/SumberGlosariumAdmin', () => ({ default: () => <div>Sumber Glosarium Redaksi</div> }));
vi.mock('../src/halaman/redaksi/LabelAdmin', () => ({ default: () => <div>Label Redaksi</div> }));
vi.mock('../src/halaman/redaksi/AuditTagarAdmin', () => ({ default: () => <div>Audit Tagar Redaksi</div> }));
vi.mock('../src/halaman/redaksi/PenggunaAdmin', () => ({ default: () => <div>Pengguna Redaksi</div> }));
vi.mock('../src/halaman/redaksi/PencarianAdmin', () => ({ default: () => <div>Statistik Pencarian Redaksi</div> }));

describe('App', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      adalahRedaksi: false,
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
      adalahRedaksi: false,
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
      adalahRedaksi: true,
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
      adalahRedaksi: true,
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

  it('mengizinkan route komentar redaksi saat user admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/komentar']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Komentar Redaksi')).toBeInTheDocument();
  });

  it('mengizinkan route statistik pencarian saat user punya izin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: (izin) => izin === 'lihat_pencarian',
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/pencarian']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Statistik Pencarian Redaksi')).toBeInTheDocument();
  });

  it('mengizinkan route audit tagar saat user punya izin audit_tagar', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: (izin) => izin === 'audit_tagar',
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/audit-tagar']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Audit Tagar Redaksi')).toBeInTheDocument();
  });

  it('menampilkan loading untuk route admin saat auth sedang dimuat', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: true,
      isLoading: true,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/label']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Memuat...')).toBeInTheDocument();
  });

  it('mengalihkan route admin ke dasbor redaksi saat bukan admin', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/label']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Dasbor Redaksi')).toBeInTheDocument();
  });

  it('merender route kebijakan privasi', () => {
    render(
      <MemoryRouter initialEntries={['/kebijakan-privasi']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Kebijakan Privasi')).toBeInTheDocument();
  });

  it('merender route gim susun kata', () => {
    render(
      <MemoryRouter initialEntries={['/gim/susun-kata']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Hal Susun Kata')).toBeInTheDocument();
  });

  it('mengalihkan route izin ke login saat belum autentikasi', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      adalahRedaksi: false,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: () => false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/pengguna']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Redaksi')).toBeInTheDocument();
  });

  it('mengalihkan route izin ke login saat tidak punya akses redaksi', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: false,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: () => false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/pengguna']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Redaksi')).toBeInTheDocument();
  });

  it('RuteIzin redireksi ke dasbor saat punyaIzin mengembalikan false untuk izin wajib', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: () => false,
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/pengguna']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Dasbor Redaksi')).toBeInTheDocument();
  });

  it('RuteIzin menerima izinDibutuhkan bukan array dan memperlakukan sebagai daftar kosong', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: () => true,
    });

    render(
      <MemoryRouter>
        <RuteIzin izinDibutuhkan="kelola_label"><div>isi-izin</div></RuteIzin>
      </MemoryRouter>
    );
    expect(screen.getByText('isi-izin')).toBeInTheDocument();
  });
});
