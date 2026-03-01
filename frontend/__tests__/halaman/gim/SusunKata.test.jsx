import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SusunKata from '../../../src/halaman/gim/SusunKata';
import {
  ambilKlasemenSusunKata,
  ambilPuzzleSusunKata,
  submitSkorSusunKata,
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
  validasiKataSusunKata: vi.fn(),
  submitSkorSusunKata: vi.fn(),
  ambilKlasemenSusunKata: vi.fn(),
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
    ambilKlasemenSusunKata.mockResolvedValue({ success: true, data: [] });

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          panjang: 5,
          target: 'kartu',
          arti: 'lembar kecil sebagai penanda identitas',
          kamus: ['kartu', 'karya', 'katun'],
          total: 3,
        },
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
    expect(screen.getByText(/Kata KARTU berarti 'lembar kecil sebagai penanda identitas'\./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'entri kata itu di kamus' })).toHaveAttribute('href', '/kamus/detail/kartu');
    expect(screen.getAllByText('K').some((el) => el.className.includes('susun-kata-key-benar'))).toBe(true);
    expect(screen.getAllByText('A').some((el) => el.className.includes('susun-kata-key-benar'))).toBe(true);
  });

  it('menampilkan pesan saat panjang huruf belum sesuai', () => {
    renderSusunKata();

    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByText('Masukkan tepat 5 huruf.')).toBeInTheDocument();
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
    expect(screen.getByText(/Susun Kata adalah gim menyusun lima huruf/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Masuk untuk Bermain' }));
    expect(loginDenganGoogle).toHaveBeenCalledWith('/gim/susun-kata');
    expect(ambilPuzzleSusunKata).not.toHaveBeenCalled();
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
});
