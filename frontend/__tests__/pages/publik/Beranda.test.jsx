import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Beranda from '../../../src/pages/publik/Beranda';

const mockAmbilPencarianPopuler = vi.fn();
const mockAmbilKataHariIni = vi.fn();

const mockNavigate = vi.fn();

vi.mock('../../../src/api/apiPublik', () => ({
  autocomplete: vi.fn().mockResolvedValue([]),
  ambilPencarianPopuler: (...args) => mockAmbilPencarianPopuler(...args),
  ambilKataHariIni: (...args) => mockAmbilKataHariIni(...args),
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

vi.mock('../../../src/components/gim/KuisKata', () => ({
  default: () => <div data-testid="kuis-kata" />,
}));

vi.mock('../../../src/components/tombol/TombolLafal', () => ({
  default: ({ kata, size }) => <div data-testid="tombol-lafal" data-kata={kata} data-size={size || 'default'} />,
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
    mockAmbilKataHariIni.mockReset();
    mockAmbilPencarianPopuler.mockResolvedValue({
      data: {
        kamus: 'air',
        tesaurus: 'kata',
        glosarium: 'istilah',
        makna: 'arti',
        rima: 'sajak',
      },
    });
    mockAmbilKataHariIni.mockResolvedValue({
      tanggal: '2026-03-31',
      indeks: 'aktif',
      entri: 'aktif (2)',
      homonim: 2,
      url: '/kamus/detail/aktif',
      kelas_kata: 'a',
      makna: 'giat dalam bekerja',
      contoh: 'Ia sangat aktif di kelas.',
      daftar_makna: [
        { makna: 'giat dalam bekerja', contoh: 'Ia sangat aktif di kelas.' },
        { makna: 'terlibat penuh', contoh: 'Warga aktif bergotong royong.' },
      ],
      etimologi: { bahasa: 'Arab', kata_asal: 'faal' },
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
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
    expect(mockAmbilKataHariIni).toHaveBeenCalledWith();
  });

  it('menampilkan kartu Kata Hari Ini saat API berhasil', async () => {
    render(<Beranda />);

    expect(await screen.findByText(/aktif/i, { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('2', { selector: 'sup' })).toBeInTheDocument();
    expect(screen.getByText('Kata Hari Ini')).toBeInTheDocument();
    expect(screen.getByText('Kuis Kata')).toBeInTheDocument();
    expect(screen.getByTestId('tombol-lafal')).toHaveAttribute('data-kata', 'aktif (2)');
    expect(screen.getByTestId('tombol-lafal')).toHaveAttribute('data-size', 'large');
    expect(screen.queryByText('Lima soal singkat lintas kamus, tesaurus, glosarium, makna, dan rima.')).not.toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element?.classList.contains('beranda-sorotan-body')
      && element.textContent?.includes('(1) giat dalam bekerja: Ia sangat aktif di kelas.; (2) terlibat penuh: Warga aktif bergotong royong.')
    ))).toBeInTheDocument();
    expect(screen.getAllByText(/Ia sangat aktif di kelas\.|Warga aktif bergotong royong\./i)[0].className).toContain('kamus-detail-def-sample');
    expect(screen.getByText('Etimologi:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('faal')).toContainHTML('<em>faal</em>');
    expect(screen.getByRole('link', { name: /lihat entri/i })).toHaveAttribute('href', '/kamus/detail/aktif');
    expect(screen.queryByRole('link', { name: 'Buka kuis' })).not.toBeInTheDocument();
    expect(screen.getByTestId('kuis-kata')).toBeInTheDocument();
  });

  it('menampilkan placeholder Kata Hari Ini sebelum data selesai dimuat', () => {
    mockAmbilKataHariIni.mockImplementationOnce(() => new Promise(() => {}));

    render(<Beranda />);

    expect(screen.getByLabelText('Kata Hari Ini')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Lihat Entri')).toHaveAttribute('aria-hidden', 'true');
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

  it('tetap menampilkan kartu Kata Hari Ini saat API gagal', async () => {
    mockAmbilKataHariIni.mockRejectedValueOnce(new Error('gagal'));

    render(<Beranda />);

    expect(await screen.findByText('Populer:')).toBeInTheDocument();
    expect(screen.getByText('Kata Hari Ini')).toBeInTheDocument();
    expect(screen.getByText('Data kata hari ini belum tersedia.')).toBeInTheDocument();
    expect(screen.getByText('Kuis Kata')).toBeInTheDocument();
    expect(screen.getByTestId('kuis-kata')).toBeInTheDocument();
  });
});
