import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Beranda from '../../../src/pages/publik/Beranda';

const mockAmbilPencarianPopuler = vi.fn();

const mockNavigate = vi.fn();

vi.mock('../../../src/api/apiPublik', () => ({
  autocomplete: vi.fn().mockResolvedValue([]),
  ambilPencarianPopuler: (...args) => mockAmbilPencarianPopuler(...args),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock('../../../src/api/apiAuth', () => ({
  buatUrlLoginGoogle: vi.fn(() => 'http://localhost:3000/auth/google'),
  simpanReturnTo: vi.fn(),
}));

vi.mock('../../../src/components/publik/KuisKata', () => ({
  default: () => null,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
}));

describe('Beranda', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockAmbilPencarianPopuler.mockReset();
    mockAmbilPencarianPopuler.mockResolvedValue({
      data: {
        kamus: 'air',
        tesaurus: 'kata',
        glosarium: 'istilah',
        makna: 'arti',
        rima: 'sajak',
      },
    });
  });

  it('menampilkan hero beranda', async () => {
    render(<Beranda />);

    await screen.findByText('Populer:');
    expect(screen.getByText('Kateglo')).toBeInTheDocument();
    expect(screen.getByText(/Kamus, tesaurus, dan glosarium bahasa Indonesia/i)).toBeInTheDocument();
    expect(screen.queryByText('Definisi dan makna kata')).not.toBeInTheDocument();
  });

  it('submit query kosong tidak menavigasi', async () => {
    render(<Beranda />);

    await screen.findByText('Populer:');
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('submit query menavigasi ke halaman kamus', async () => {
    render(<Beranda />);

    await screen.findByText('Populer:');
    fireEvent.change(screen.getByPlaceholderText('Cari kata …'), { target: { value: 'anak ibu' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Cari' }).closest('form'));

    expect(mockNavigate).toHaveBeenCalledWith('/kamus/cari/anak%20ibu');
  });

  it('menampilkan daftar frasa populer di bawah kotak cari', async () => {
    render(<Beranda />);

    expect(await screen.findByText('Populer:')).toBeInTheDocument();
    expect(mockAmbilPencarianPopuler).toHaveBeenCalledWith({
      tanggal: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(await screen.findByRole('link', { name: 'air' })).toHaveAttribute('href', '/kamus/detail/air');
    expect(screen.getByRole('link', { name: 'kata' })).toHaveAttribute('href', '/tesaurus/cari/kata');
    expect(screen.getByRole('link', { name: 'istilah' })).toHaveAttribute('href', '/glosarium/detail/istilah');
    expect(screen.getByRole('link', { name: 'arti' })).toHaveAttribute('href', '/makna/cari/arti');
    expect(screen.getByRole('link', { name: 'sajak' })).toHaveAttribute('href', '/rima/cari/sajak');
    expect(screen.getByRole('link', { name: 'air' })).not.toHaveAttribute('title');
  });

  it('memotong frasa populer lebih dari dua kata dan menyimpan judul penuh di tooltip', async () => {
    mockAmbilPencarianPopuler.mockResolvedValueOnce({
      data: {
        kamus: 'acceleration program for government financial accountability',
        tesaurus: 'kata',
        glosarium: 'istilah teknis umum',
        makna: 'arti',
        rima: 'sajak',
      },
    });

    render(<Beranda />);

    expect(await screen.findByText('Populer:')).toBeInTheDocument();

    const linkKamus = screen.getByRole('link', {
      name: 'acceleration program for government financial accountability',
    });
    expect(linkKamus).toHaveTextContent('acceleration ...');
    expect(linkKamus).toHaveAttribute('title', 'acceleration program for government financial accountability');

    const linkGlosarium = screen.getByRole('link', { name: 'istilah teknis umum' });
    expect(linkGlosarium).toHaveTextContent('istilah ...');
    expect(linkGlosarium).toHaveAttribute('title', 'istilah teknis umum');
  });

  it('menampilkan placeholder domain saat API populer gagal', async () => {
    mockAmbilPencarianPopuler.mockRejectedValueOnce(new Error('gagal'));

    render(<Beranda />);

    expect(await screen.findByText('Populer:')).toBeInTheDocument();
    expect(screen.getByText('kamus')).toBeInTheDocument();
    expect(screen.getByText('tesaurus')).toBeInTheDocument();
    expect(screen.getByText('glosarium')).toBeInTheDocument();
    expect(screen.getByText('makna')).toBeInTheDocument();
    expect(screen.getByText('rima')).toBeInTheDocument();
  });

  it('menampilkan placeholder domain saat respons sukses tanpa data populer', async () => {
    mockAmbilPencarianPopuler.mockResolvedValueOnce({});

    render(<Beranda />);

    expect(await screen.findByText('Populer:')).toBeInTheDocument();
    expect(screen.getByText('kamus')).toBeInTheDocument();
    expect(screen.getByText('tesaurus')).toBeInTheDocument();
    expect(screen.getByText('glosarium')).toBeInTheDocument();
    expect(screen.getByText('makna')).toBeInTheDocument();
    expect(screen.getByText('rima')).toBeInTheDocument();
  });
});
