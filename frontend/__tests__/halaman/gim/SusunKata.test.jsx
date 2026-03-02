import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SusunKata, { buatPetaKeyboard, parseRiwayatDariSkor } from '../../../src/halaman/gim/SusunKata';
import {
  ambilKlasemenSusunKata,
  ambilKlasemenSusunKataBebas,
  ambilBebasSusunKata,
  ambilPuzzleSusunKata,
  submitSkorSusunKata,
  submitSkorSusunKataBebas,
  validasiKataSusunKata,
} from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
  useMutation: (...args) => mockUseMutation(...args),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  ambilPuzzleSusunKata: vi.fn(),
  ambilBebasSusunKata: vi.fn(),
  validasiKataSusunKata: vi.fn(),
  submitSkorSusunKata: vi.fn(),
  submitSkorSusunKataBebas: vi.fn(),
  ambilKlasemenSusunKata: vi.fn(),
  ambilKlasemenSusunKataBebas: vi.fn(),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../src/komponen/publik/HalamanDasar', () => ({
  default: ({ children }) => <section>{children}</section>,
}));

vi.mock('../../../src/komponen/bersama/TombolMasukGoogle', () => ({
  default: ({ onClick, label }) => (
    <button type="button" onClick={onClick}>{label}</button>
  ),
}));

describe('SusunKata', () => {
  const loginDenganGoogle = vi.fn();
  let puzzleData;
  let klasemenData;

  function renderSusunKata() {
    return render(
      <MemoryRouter>
        <SusunKata />
      </MemoryRouter>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    loginDenganGoogle.mockReset();
    puzzleData = {
      panjang: 5,
      target: 'kartu',
      arti: 'lembar kecil sebagai penanda identitas',
      kamus: ['kartu', 'karya', 'katun'],
      total: 3,
      sudahMainHariIni: false,
      hasilHariIni: null,
    };
    klasemenData = { data: [] };
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loginDenganGoogle,
    });

    ambilPuzzleSusunKata.mockResolvedValue({
      panjang: 5,
      target: 'kartu',
      arti: 'lembar kecil sebagai penanda identitas',
      kamus: ['kartu', 'karya', 'katun'],
      total: 3,
    });
    validasiKataSusunKata.mockResolvedValue({ valid: false });
    submitSkorSusunKata.mockResolvedValue({ success: true });
    ambilBebasSusunKata.mockResolvedValue({ success: true, panjang: 5, target: 'kartu', kamus: ['kartu'] });
    submitSkorSusunKataBebas.mockResolvedValue({ success: true });
    ambilKlasemenSusunKata.mockResolvedValue({ success: true, data: [] });
    ambilKlasemenSusunKataBebas.mockResolvedValue({ success: true, data: [] });

    mockUseMutation.mockReturnValue({
      mutate: vi.fn((_payload, options) => options?.onSettled?.()),
      isPending: false,
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();

      if (options?.queryKey?.[0] === 'gim-susun-kata-klasemen') {
        return {
          data: klasemenData,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
        };
      }

      return {
        data: puzzleData,
        isLoading: false,
        isFetching: false,
        isError: false,
        error: null,
      };
    });
  });

  it('merender heading dan keyboard indikator', () => {
    renderSusunKata();

    expect(screen.getByRole('heading', { name: 'Susun Kata' })).toBeInTheDocument();
    expect(screen.getByLabelText('Keyboard indikator huruf')).toBeInTheDocument();
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('Hapus')).toBeInTheDocument();
    expect(ambilPuzzleSusunKata).toHaveBeenCalledWith({ panjang: 5 });
  });

  it('mengetik lewat keyboard mengisi kotak lalu enter memvalidasi tebakan', () => {
    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.keyDown(window, { key: 't' });
    fireEvent.keyDown(window, { key: 'u' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Selamat! 🥳')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mau lihat arti\s*kartu\s*di kamus/i })).toHaveAttribute('href', '/kamus/detail/kartu');
    expect(screen.getAllByText('K').some((el) => el.className.includes('susun-kata-key-benar'))).toBe(true);
    expect(screen.getAllByText('A').some((el) => el.className.includes('susun-kata-key-benar'))).toBe(true);
  });

  it('menampilkan pesan saat panjang huruf belum sesuai', () => {
    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Masukkan tepat 5 huruf.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /tutup/i }));
    expect(screen.queryByText('Masukkan tepat 5 huruf.')).not.toBeInTheDocument();
  });

  it('tidak meneruskan kombinasi tombol seperti Ctrl+R ke kotak gim', () => {
    renderSusunKata();

    fireEvent.keyDown(window, { key: 'r', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Masukkan tepat 5 huruf.')).toBeInTheDocument();
  });

  it('mode belum login menampilkan deskripsi dan tombol masuk', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loginDenganGoogle,
    });

    renderSusunKata();

    expect(screen.getByRole('heading', { name: 'Susun Kata' })).toBeInTheDocument();
    expect(screen.getByText(/Susun Kata adalah gim menyusun huruf untuk membentuk kata bahasa Indonesia/i)).toBeInTheDocument();
    expect(screen.getByText('Hijau')).toBeInTheDocument();
    expect(screen.getByText(/Huruf dan tempatnya benar/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Masuk untuk Bermain' }));
    expect(loginDenganGoogle).toHaveBeenCalledWith('/gim/susun-kata/harian');
    expect(ambilPuzzleSusunKata).not.toHaveBeenCalled();
  });

  it('kibor layar bisa diklik untuk mengisi kata', () => {
    renderSusunKata();

    fireEvent.click(screen.getByRole('button', { name: 'Z' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    fireEvent.click(screen.getByRole('button', { name: 'K' }));
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    fireEvent.click(screen.getByRole('button', { name: 'R' }));
    fireEvent.click(screen.getByRole('button', { name: 'T' }));
    fireEvent.click(screen.getByRole('button', { name: 'U' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    expect(screen.getByText('Selamat! 🥳')).toBeInTheDocument();
  });

  it('memakai fallback validasi backend saat kata tidak ada di kamus payload', async () => {
    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 't' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByText('Kata tidak ada di kamus Susun Kata.');
    expect(validasiKataSusunKata).toHaveBeenCalledWith('katar', { panjang: 5 });
  });

  it('menangani error validasi backend, tombol info, dan panel klasemen kosong', async () => {
    validasiKataSusunKata.mockRejectedValueOnce(new Error('jaringan'));

    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 't' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByText('Kata tidak ada di kamus Susun Kata.');

    fireEvent.click(screen.getByRole('button', { name: 'Lihat petunjuk gim' }));
    expect(screen.getByText(/Huruf benar, tetapi tempatnya salah/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke papan permainan' }));

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    expect(screen.getByText('Belum ada skor hari ini.')).toBeInTheDocument();
  });

  it('menampilkan klasemen saat data ada serta jalur kalah mengirim skor', async () => {
    const mutate = vi.fn((_payload, options) => options?.onSettled?.());
    mockUseMutation.mockReturnValue({ mutate, isPending: false });

    puzzleData = {
      ...puzzleData,
      target: 'kartu',
      kamus: ['karya', 'katun', 'karet', 'kasur', 'kabar', 'kabin'],
      hasilHariIni: { tebakan: 'karya;katun;karet;kasur;kabar' },
    };
    klasemenData = {
      data: [
        { pengguna_id: 10, nama: 'Ivan', skor: 30, detik: 12 },
      ],
    };

    renderSusunKata();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Ivan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke papan permainan' }));

    for (const huruf of ['k', 'a', 'b', 'i', 'n']) {
      fireEvent.keyDown(window, { key: huruf });
    }
    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByText('Kesempatan habis. Jawabannya KARTU.');
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ menang: false, percobaan: 6, tebakan: 'karya;katun;karet;kasur;kabar;kabin' }),
      expect.objectContaining({ onSettled: expect.any(Function) })
    );
  });

  it('Backspace menghapus huruf aktif sebelum submit', () => {
    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'Backspace' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Masukkan tepat 5 huruf.')).toBeInTheDocument();
  });

  it('mode loading menampilkan feedback menyiapkan gim', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'gim-susun-kata-klasemen') {
        return { data: undefined, isLoading: false, isFetching: false, isError: false, error: null };
      }
      return { data: null, isLoading: true, isFetching: false, isError: false, error: null };
    });

    renderSusunKata();

    expect(screen.getByText('Menyiapkan gim ...')).toBeInTheDocument();
  });

  it('submit diabaikan saat target kosong dan saat game sudah selesai', () => {
    const mutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate, isPending: false });

    puzzleData = {
      ...puzzleData,
      target: '',
      kamus: [],
      hasilHariIni: { tebakan: 'kartu' },
      sudahMainHariIni: true,
    };

    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));

    expect(mutate).not.toHaveBeenCalled();
    expect(validasiKataSusunKata).not.toHaveBeenCalled();
  });

  it('memakai fallback kamus kosong dan klasemen undefined', () => {
    puzzleData = {
      ...puzzleData,
      kamus: null,
      hasilHariIni: { tebakan: 'AA;1; abc ;defghijkl' },
    };
    klasemenData = undefined;

    renderSusunKata();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    expect(screen.getByText('Belum ada skor hari ini.')).toBeInTheDocument();
  });

  it('target kosong tapi belum selesai tetap men-trigger early return submit tanpa validasi', () => {
    const mutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate, isPending: false });
    puzzleData = {
      ...puzzleData,
      target: '',
      sudahMainHariIni: false,
      kamus: [null, 'kartu'],
    };

    renderSusunKata();

    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(validasiKataSusunKata).not.toHaveBeenCalled();
  });

  it('helper buatPetaKeyboard dan parseRiwayatDariSkor menutup edge case', () => {
    const peta = buatPetaKeyboard(['ab'], 'abc');
    expect(peta.a).toBe('benar');
    expect(peta.b).toBe('benar');

    expect(parseRiwayatDariSkor('abcde;ABCDE;ab12c;abc', 0)).toEqual(['abcde', 'abcde']);
  });
});
