/**
 * @fileoverview Test App routing
 */

import { render, screen } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import App, { RuteIzin, RutePublikTerkendali } from '../src/App';

const mockUseAuth = vi.fn();

vi.mock('../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../src/components/tampilan/TataLetakPublik', () => ({
  default: () => <div data-testid="layout">Layout <Outlet /></div>,
}));
vi.mock('../src/pages/publik/Beranda', () => ({
  default: () => <div>Hal Beranda</div>,
}));
vi.mock('../src/pages/auth', () => ({
  AuthCallback: () => <div>Auth Callback</div>,
  LoginAdmin: () => <div>Login Redaksi</div>,
}));
vi.mock('../src/pages/publik/kamus', () => ({
  Kamus: () => <div>Hal Kamus</div>,
  KamusAcak: () => <div>Hal Kamus Acak</div>,
  KamusDetail: () => <div>Hal Kamus Detail</div>,
  Tesaurus: () => <div>Hal Tesaurus</div>,
  Makna: () => <div>Hal Makna</div>,
  Rima: () => <div>Hal Rima</div>,
  Ejaan: () => <div>Hal Ejaan</div>,
  Gramatika: () => <div>Hal Gramatika</div>,
}));
vi.mock('../src/pages/publik/gim/GimIndex', () => ({ default: () => <div>Hal Gim</div> }));
vi.mock('../src/pages/publik/gim/KuisKata', () => ({ default: () => <div>Hal Kuis Kata</div> }));
vi.mock('../src/pages/publik/gim/SusunKata', () => ({ default: () => <div>Hal Susun Kata</div> }));
vi.mock('../src/pages/publik/glosarium', () => ({
  Glosarium: () => <div>Hal Glosarium</div>,
  GlosariumDetail: () => <div>Hal Glosarium Detail</div>,
}));
vi.mock('../src/pages/publik/alat', () => ({
  Alat: () => <div>Hal Alat</div>,
  PenghitungHuruf: () => <div>Hal Penghitung Huruf</div>,
  PenganalisisTeks: () => <div>Hal Penganalisis Teks</div>,
  PohonKalimat: () => <div>Hal Pohon Kalimat</div>,
}));
vi.mock('../src/pages/publik/gim', () => ({
  GimIndex: () => <div>Hal Gim</div>,
  KuisKata: () => <div>Hal Kuis Kata</div>,
  SusunKata: () => <div>Hal Susun Kata</div>,
}));
vi.mock('../src/pages/publik/informasi', () => ({
  Ihwal: () => <div>Ihwal Kateglo</div>,
  Privasi: () => <div>Kebijakan Privasi</div>,
  Sumber: () => <div>Hal Sumber</div>,
}));
vi.mock('../src/pages/redaksi/Dasbor', () => ({ default: () => <div>Dasbor Redaksi</div> }));
vi.mock('../src/pages/redaksi/leksikon/KamusAdmin', () => ({ default: () => <div>Kamus Redaksi</div> }));
vi.mock('../src/pages/redaksi/interaksi/KomentarAdmin', () => ({ default: () => <div>Komentar Redaksi</div> }));
vi.mock('../src/pages/redaksi/leksikon/TesaurusAdmin', () => ({ default: () => <div>Tesaurus Redaksi</div> }));
vi.mock('../src/pages/redaksi/leksikon/GlosariumAdmin', () => ({ default: () => <div>Glosarium Redaksi</div> }));
vi.mock('../src/pages/redaksi/BidangGlosariumAdmin', () => ({ default: () => <div>Bidang Glosarium Redaksi</div> }));
vi.mock('../src/pages/redaksi/SumberGlosariumAdmin', () => ({ default: () => <div>Sumber Glosarium Redaksi</div> }));
vi.mock('../src/pages/redaksi/master/LabelAdmin', () => ({ default: () => <div>Label Redaksi</div> }));
vi.mock('../src/pages/redaksi/audit/AuditTagarAdmin', () => ({ default: () => <div>Audit Tagar Redaksi</div> }));
vi.mock('../src/pages/redaksi/akses/PenggunaAdmin', () => ({ default: () => <div>Pengguna Redaksi</div> }));
vi.mock('../src/pages/redaksi/interaksi/PencarianAdmin', () => ({ default: () => <div>Statistik Pencarian Redaksi</div> }));
vi.mock('../src/pages/redaksi/interaksi/PencarianHitamAdmin', () => ({ default: () => <div>Daftar Hitam Pencarian Redaksi</div> }));
vi.mock('../src/pages/redaksi/gim/SusunKataHarianAdmin', () => ({ default: () => <div>Susun Kata Harian Redaksi</div> }));
vi.mock('../src/pages/redaksi/gim/SusunKataBebasAdmin', () => ({ default: () => <div>Susun Kata Bebas Redaksi</div> }));

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

  it('merender route kamus acak dalam tata letak', async () => {
    render(
      <MemoryRouter initialEntries={['/kamus/acak']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(await screen.findByText('Hal Kamus Acak')).toBeInTheDocument();
  });

  it('merender auth callback route', async () => {
    render(
      <MemoryRouter initialEntries={['/auth/callback']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Auth Callback')).toBeInTheDocument();
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

  it('merender route kebijakan privasi', async () => {
    render(
      <MemoryRouter initialEntries={['/privasi']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Kebijakan Privasi')).toBeInTheDocument();
  });

  it('merender route alat', async () => {
    render(
      <MemoryRouter initialEntries={['/alat']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Alat')).toBeInTheDocument();
  });

  it('merender route alat penganalisis teks', async () => {
    render(
      <MemoryRouter initialEntries={['/alat/penganalisis-teks']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Penganalisis Teks')).toBeInTheDocument();
  });

  it('merender route alat penghitung huruf', async () => {
    render(
      <MemoryRouter initialEntries={['/alat/penghitung-huruf']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Penghitung Huruf')).toBeInTheDocument();
  });

  it('merender route alat pohon kalimat', async () => {
    render(
      <MemoryRouter initialEntries={['/alat/pohon-kalimat']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Pohon Kalimat')).toBeInTheDocument();
  });

  it('merender route indeks gim', async () => {
    render(
      <MemoryRouter initialEntries={['/gim']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Gim')).toBeInTheDocument();
  });

  it('merender route gim susun kata', async () => {
    render(
      <MemoryRouter initialEntries={['/gim/susun-kata']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Susun Kata')).toBeInTheDocument();
  });

  it('merender route kuis kata', async () => {
    render(
      <MemoryRouter initialEntries={['/gim/kuis-kata']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText('Hal Kuis Kata')).toBeInTheDocument();
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

  it('RutePublikTerkendali mengalihkan pengguna biasa ke route fallback', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: false,
      adalahAdmin: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/alat/internal']}>
        <Routes>
          <Route
            path="/alat/internal"
            element={<RutePublikTerkendali redirectTo="/alat"><div>Konten internal</div></RutePublikTerkendali>}
          />
          <Route path="/alat" element={<div>Daftar alat</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Daftar alat')).toBeInTheDocument();
  });

  it('RutePublikTerkendali mengizinkan redaksi melihat route internal', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      adalahRedaksi: true,
      adalahAdmin: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/alat/internal']}>
        <Routes>
          <Route
            path="/alat/internal"
            element={<RutePublikTerkendali redirectTo="/alat"><div>Konten internal</div></RutePublikTerkendali>}
          />
          <Route path="/alat" element={<div>Daftar alat</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Konten internal')).toBeInTheDocument();
  });
});
