import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SusunKata, { buatPetaKeyboard, parseRiwayatDariSkor } from '../../../../src/pages/publik/gim/SusunKata';
import {
  ambilKlasemenSusunKata,
  ambilKlasemenSusunKataBebas,
  ambilBebasSusunKata,
  ambilPuzzleSusunKata,
  simpanProgresSusunKata,
  submitSkorSusunKata,
  submitSkorSusunKataBebas,
  validasiKataSusunKata,
} from '../../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
  useMutation: (...args) => mockUseMutation(...args),
}));

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilPuzzleSusunKata: vi.fn(),
  ambilBebasSusunKata: vi.fn(),
  validasiKataSusunKata: vi.fn(),
  simpanProgresSusunKata: vi.fn(),
  submitSkorSusunKata: vi.fn(),
  submitSkorSusunKataBebas: vi.fn(),
  ambilKlasemenSusunKata: vi.fn(),
  ambilKlasemenSusunKataBebas: vi.fn(),
}));

vi.mock('../../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../../src/components/tampilan/HalamanPublik', () => ({
  default: ({ children }) => <section>{children}</section>,
}));

vi.mock('../../../../src/components/tombol/TombolMasuk', () => ({
  default: ({ onClick, label }) => (
    <button type="button" onClick={onClick}>{label}</button>
  ),
}));

describe('SusunKata', () => {
  const loginDenganGoogle = vi.fn();
  let puzzleData;
  let klasemenData;

  function renderSusunKata(initialPath = '/gim/susun-kata/harian') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/gim/susun-kata/:mode" element={<SusunKata />} />
          <Route path="/gim/susun-kata" element={<SusunKata />} />
        </Routes>
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
    simpanProgresSusunKata.mockResolvedValue({ success: true });
    submitSkorSusunKata.mockResolvedValue({ success: true });
    ambilBebasSusunKata.mockResolvedValue({ success: true, panjang: 5, target: 'kartu', kamus: ['kartu'] });
    submitSkorSusunKataBebas.mockResolvedValue({ success: true });
    ambilKlasemenSusunKata.mockResolvedValue({ success: true, data: [] });
    ambilKlasemenSusunKataBebas.mockResolvedValue({ success: true, data: [] });

    mockUseMutation.mockImplementation((config) => ({
      mutate: vi.fn((payload, options) => {
        config?.mutationFn?.(payload);
        options?.onSettled?.();
      }),
      isPending: false,
    }));

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

    expect(screen.getByText('Menyiapkan gim …')).toBeInTheDocument();
  });

  it('mode harian menyimpan progres saat tebakan valid tetapi permainan belum selesai', async () => {
    validasiKataSusunKata.mockResolvedValueOnce({ valid: true });

    renderSusunKata('/gim/susun-kata/harian');

    for (const huruf of ['k', 'a', 'r', 'y', 'a']) {
      fireEvent.keyDown(window, { key: huruf });
    }
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => {
      expect(simpanProgresSusunKata).toHaveBeenCalledWith({ panjang: 5, tebakan: 'karya' });
    });
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

  it('mode bebas menang mengirim payload skor dengan kata, menampilkan tautan kamus, dan bisa mulai sesi baru', async () => {
    const mutate = vi.fn((_payload, options) => options?.onSettled?.());
    mockUseMutation.mockReturnValue({ mutate, isPending: false });

    renderSusunKata('/gim/susun-kata/bebas');

    for (const huruf of ['k', 'a', 'r', 't', 'u']) {
      fireEvent.keyDown(window, { key: huruf });
    }
    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByText('Selamat! 🥳');
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ kata: 'kartu', menang: true }),
      expect.objectContaining({ onSettled: expect.any(Function) })
    );
    expect(screen.getByRole('link', { name: /Mau lihat arti\s*kartu\s*di kamus/i })).toHaveAttribute('href', '/kamus/detail/kartu');

    fireEvent.click(screen.getByRole('link', { name: 'mulai sesi baru' }));
  });

  it('mode bebas mengeksekusi mutationFn submit skor bebas', async () => {
    renderSusunKata('/gim/susun-kata/bebas');

    for (const huruf of ['k', 'a', 'r', 't', 'u']) {
      fireEvent.keyDown(window, { key: huruf });
    }
    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByText('Selamat! 🥳');
    expect(submitSkorSusunKataBebas).toHaveBeenCalledWith(expect.objectContaining({ kata: 'kartu' }));
  });

  it('mode bebas menampilkan format klasemen bebas, jalur kalah menyertakan kata, dan tab mode menutup cabang klik', async () => {
    const mutate = vi.fn((_payload, options) => options?.onSettled?.());
    mockUseMutation.mockReturnValue({ mutate, isPending: false });

    puzzleData = {
      ...puzzleData,
      target: 'kartu',
      kamus: ['karya', 'katun', 'karet', 'kasur', 'kabar', 'kabin'],
      hasilHariIni: { tebakan: 'karya;katun;karet;kasur;kabar' },
      progresHariIni: { tebakan: 'karya;katun', mulai_at: '2026-01-01T00:00:00Z' },
    };
    klasemenData = {
      data: [{ pengguna_id: 3, nama: 'Ani', rata_poin: 12.3, rata_detik: 45.6, total_main: 7 }],
    };

    renderSusunKata('/gim/susun-kata/bebas');

    fireEvent.click(screen.getByRole('tab', { name: 'Harian' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Bebas' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Bebas' }));

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Ani')).toBeInTheDocument();
    expect(screen.getByText('12,3 poin; 45,6 detik; 7x main')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke papan permainan' }));

    for (const huruf of ['k', 'a', 'b', 'i', 'n']) {
      fireEvent.keyDown(window, { key: huruf });
    }
    fireEvent.keyDown(window, { key: 'Enter' });

    await screen.findByText('Kesempatan habis. Jawabannya KARTU.');
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ kata: 'kartu', menang: false, percobaan: 6 }),
      expect.objectContaining({ onSettled: expect.any(Function) })
    );
  });

  it('mode bebas klasemen memakai fallback angka nol dan pesan kosong khusus mode bebas', () => {
    klasemenData = {
      data: [{ pengguna_id: 9, nama: 'Kosong', rata_poin: 'x', rata_detik: null, total_main: undefined }],
    };

    renderSusunKata('/gim/susun-kata/bebas');

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    expect(screen.getByText('0,0 poin; 0,0 detik; 0x main')).toBeInTheDocument();

    klasemenData = { data: [] };
    renderSusunKata('/gim/susun-kata/bebas');
    fireEvent.click(screen.getAllByRole('button', { name: 'Lihat klasemen harian' }).at(-1));
    expect(screen.getByText('Belum ada pemenang mode bebas.')).toBeInTheDocument();
  });

  it('helper buatPetaKeyboard dan parseRiwayatDariSkor menutup edge case', () => {
    const peta = buatPetaKeyboard(['ab'], 'abc');
    expect(peta.a).toBe('benar');
    expect(peta.b).toBe('benar');
    expect(buatPetaKeyboard(['a'], 'ab').a).toBe('benar');

    expect(parseRiwayatDariSkor('abcde;ABCDE;ab12c;abc', 0)).toEqual(['abcde', 'abcde']);
  });
});
