import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NavbarAdmin from '../../../src/components/navigasi/NavbarAdmin';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/redaksi/kamus', search: '' };
const mockLogout = vi.fn();
const mockPunyaIzin = vi.fn();
const mockAuthState = {
  logout: mockLogout,
  punyaIzin: mockPunyaIzin,
  user: { name: 'Admin Satu', izin: ['kamus.lihat'], picture: null },
};

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, onClick, ...props }) => (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../../../src/constants/menuRedaksi', () => ({
  filterKelompokMenuRedaksi: (hasIzin) => [
    {
      judul: 'Leksikon',
      items: [
        ...(hasIzin('kamus.lihat') ? [{ path: '/redaksi/kamus', label: 'Kamus' }] : []),
        ...(hasIzin('artikel.lihat') ? [{ path: '/redaksi/artikel', label: 'Artikel' }] : []),
      ],
    },
  ].filter((kelompok) => kelompok.items.length > 0),
}));

describe('NavbarAdmin', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
    mockPunyaIzin.mockReset();
    mockPunyaIzin.mockImplementation((izin) => izin === 'kamus.lihat');
    mockLocation.pathname = '/redaksi/kamus';
    mockAuthState.logout = mockLogout;
    mockAuthState.punyaIzin = mockPunyaIzin;
    mockAuthState.user = { name: 'Admin Satu', izin: ['kamus.lihat'], picture: null };
  });

  afterEach(() => {
    mockLocation.pathname = '/redaksi/kamus';
  });

  it('menampilkan inisial dua kata, menu aktif, dan menutup drawer lewat link serta backdrop', async () => {
    const { container } = render(<NavbarAdmin />);

    expect(screen.getByText('AS')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Buka menu redaksi'));

    const linkKamus = screen.getByRole('link', { name: 'Kamus' });
    expect(linkKamus).toHaveClass('navbar-menu-link-active');

    fireEvent.click(linkKamus);
    await waitFor(() => {
      expect(container.querySelector('[aria-hidden="false"]')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Buka menu redaksi'));
    fireEvent.click(screen.getByLabelText('Tutup menu redaksi'));
    await waitFor(() => {
      expect(container.querySelector('[aria-hidden="false"]')).not.toBeInTheDocument();
    });
  });

  it('memakai fallback izin dari user, menampilkan inisial satu kata, gambar avatar, dan tombol tutup panel', async () => {
    mockAuthState.punyaIzin = undefined;
    mockAuthState.user = {
      name: 'Admin',
      izin: ['artikel.lihat'],
      picture: 'https://contoh.test/avatar.png',
    };
    mockLocation.pathname = '/redaksi/artikel/1';

    const { container } = render(<NavbarAdmin />);

    expect(screen.getByText('A')).toBeInTheDocument();
    expect(container.querySelector('img.navbar-avatar-img')).toHaveAttribute('src', 'https://contoh.test/avatar.png');

    fireEvent.click(screen.getByLabelText('Buka menu redaksi'));
    expect(screen.getByRole('link', { name: 'Artikel' })).toHaveClass('navbar-menu-link-active');
    expect(screen.queryByRole('link', { name: 'Kamus' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Tutup panel menu'));
    await waitFor(() => {
      expect(container.querySelector('[aria-hidden="false"]')).not.toBeInTheDocument();
    });
  });

  it('menutup dropdown avatar saat klik luar dan saat lokasi berubah', async () => {
    const { rerender, container } = render(<NavbarAdmin />);

    fireEvent.click(screen.getByRole('button', { name: 'Admin Satu' }));
    expect(screen.getByText('Kateglo')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(container.querySelector('.navbar-dropdown-panel-open')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Admin Satu' }));
    expect(container.querySelector('.navbar-dropdown-panel-open')).toBeInTheDocument();

    mockLocation.pathname = '/redaksi/artikel';
    rerender(<NavbarAdmin />);

    await waitFor(() => {
      expect(container.querySelector('.navbar-dropdown-panel-open')).not.toBeInTheDocument();
    });
  });

  it('memakai label profil kosong dan logout menavigasi ke beranda', () => {
    mockAuthState.user = { name: '', izin: ['kamus.lihat'], picture: null };

    render(<NavbarAdmin />);

    fireEvent.click(screen.getByRole('button', { name: 'Profil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});