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

vi.mock('../src/components/bersama/TataLetakPublik', () => ({
  default: () => <div data-testid="layout">Layout <Outlet /></div>,
}));
vi.mock('../src/pages/publik/Beranda', () => ({ default: () => <div>Hal Beranda</div> }));
vi.mock('../src/pages/publik/Kamus', () => ({ default: () => <div>Hal Kamus</div> }));
vi.mock('../src/pages/publik/KamusDetail', () => ({ default: () => <div>Hal Kamus Detail</div> }));
vi.mock('../src/pages/publik/Tesaurus', () => ({ default: () => <div>Hal Tesaurus</div> }));
vi.mock('../src/pages/gim/SusunKata', () => ({ default: () => <div>Hal Susun Kata</div> }));
vi.mock('../src/pages/publik/Glosarium', () => ({ default: () => <div>Hal Glosarium</div> }));
vi.mock('../src/pages/publik/alat', () => ({
  Alat: () => <div>Hal Alat</div>,
  PenganalisisTeks: () => <div>Hal Penganalisis Teks</div>,
}));
vi.mock('../src/pages/publik/AuthCallback', () => ({ default: () => <div>Auth Callback</div> }));
vi.mock('../src/pages/publik/KebijakanPrivasi', () => ({ default: () => <div>Kebijakan Privasi</div> }));
vi.mock('../src/pages/redaksi/LoginAdmin', () => ({ default: () => <div>Login Redaksi</div> }));
vi.mock('../src/pages/redaksi/DasborAdmin', () => ({ default: () => <div>Dasbor Redaksi</div> }));
vi.mock('../src/pages/redaksi/KamusAdmin', () => ({ default: () => <div>Kamus Redaksi</div> }));
vi.mock('../src/pages/redaksi/KomentarAdmin', () => ({ default: () => <div>Komentar Redaksi</div> }));
vi.mock('../src/pages/redaksi/TesaurusAdmin', () => ({ default: () => <div>Tesaurus Redaksi</div> }));
vi.mock('../src/pages/redaksi/GlosariumAdmin', () => ({ default: () => <div>Glosarium Redaksi</div> }));
vi.mock('../src/pages/redaksi/BidangGlosariumAdmin', () => ({ default: () => <div>Bidang Glosarium Redaksi</div> }));
vi.mock('../src/pages/redaksi/SumberGlosariumAdmin', () => ({ default: () => <div>Sumber Glosarium Redaksi</div> }));
vi.mock('../src/pages/redaksi/LabelAdmin', () => ({ default: () => <div>Label Redaksi</div> }));
vi.mock('../src/pages/redaksi/AuditTagarAdmin', () => ({ default: () => <div>Audit Tagar Redaksi</div> }));
vi.mock('../src/pages/redaksi/PenggunaAdmin', () => ({ default: () => <div>Pengguna Redaksi</div> }));
vi.mock('../src/pages/redaksi/PencarianAdmin', () => ({ default: () => <div>Statistik Pencarian Redaksi</div> }));
vi.mock('../src/pages/redaksi/PencarianHitamAdmin', () => ({ default: () => <div>Daftar Hitam Pencarian Redaksi</div> }));
vi.mock('../src/pages/redaksi/SusunKataHarian', () => ({ default: () => <div>Susun Kata Harian Redaksi</div> }));
vi.mock('../src/pages/redaksi/SusunKataBebas', () => ({ default: () => <div>Susun Kata Bebas Redaksi</div> }));

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
    expect(screen.getByText('Memuat …')).toBeInTheDocument();
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
    return screen.findByText('Kamus Redaksi').then((element) => {
      expect(element).toBeInTheDocument();
    });
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
    return screen.findByText('Label Redaksi').then((element) => {
      expect(element).toBeInTheDocument();
    });
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
    return screen.findByText('Komentar Redaksi').then((element) => {
      expect(element).toBeInTheDocument();
    });
  });

  it('mengizinkan route statistik pencarian saat user punya izin', async () => {
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

    expect(await screen.findByText('Statistik Pencarian Redaksi')).toBeInTheDocument();
  });

  it('mengizinkan route daftar hitam pencarian saat user punya izin', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: (izin) => izin === 'lihat_pencarian',
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/pencarian-hitam']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Daftar Hitam Pencarian Redaksi')).toBeInTheDocument();
  });

  it('mengizinkan route susun kata harian dan bebas saat user punya izin', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
      punyaIzin: (izin) => izin === 'kelola_susun_kata',
    });

    render(
      <MemoryRouter initialEntries={['/redaksi/susun-kata-harian']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Susun Kata Harian Redaksi')).toBeInTheDocument();

    render(
      <MemoryRouter initialEntries={['/redaksi/susun-kata-bebas']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Susun Kata Bebas Redaksi')).toBeInTheDocument();
  });

  it('mengizinkan route audit tagar saat user punya izin audit_tagar', async () => {
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

    expect(await screen.findByText('Audit Tagar Redaksi')).toBeInTheDocument();
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

    expect(screen.getByText('Memuat …')).toBeInTheDocument();
  });

  it('mengalihkan route admin ke dasbor redaksi saat bukan admin', async () => {
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

    expect(await screen.findByText('Dasbor Redaksi')).toBeInTheDocument();
  });

  it('merender route kebijakan privasi', () => {
    render(
      <MemoryRouter initialEntries={['/kebijakan-privasi']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Kebijakan Privasi')).toBeInTheDocument();
  });

  it('merender route alat', () => {
    render(
      <MemoryRouter initialEntries={['/alat']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Hal Alat')).toBeInTheDocument();
  });

  it('merender route alat penganalisis teks', () => {
    render(
      <MemoryRouter initialEntries={['/alat/penganalisis-teks']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Hal Penganalisis Teks')).toBeInTheDocument();
  });

  it('merender route gim susun kata', async () => {
    render(
      <MemoryRouter initialEntries={['/gim/susun-kata']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Susun Kata')).toBeInTheDocument();
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

  it('RuteIzin redireksi ke dasbor saat punyaIzin mengembalikan false untuk izin wajib', async () => {
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
    expect(await screen.findByText('Dasbor Redaksi')).toBeInTheDocument();
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
