import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PenggunaAdmin from '../../../src/halaman/redaksi/PenggunaAdmin';

const mockUseDaftarPengguna = vi.fn();
const mockUseDetailPengguna = vi.fn();
const mockUseDaftarPeran = vi.fn();
const mutateSimpanPengguna = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarPengguna: (...args) => mockUseDaftarPengguna(...args),
  useDetailPengguna: (...args) => mockUseDetailPengguna(...args),
  useDaftarPeran: (...args) => mockUseDaftarPeran(...args),
  useSimpanPengguna: () => ({ mutate: mutateSimpanPengguna, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

describe('PenggunaAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDaftarPeran.mockReturnValue({
      data: { data: [{ id: 1, kode: 'admin', nama: 'Admin' }, { id: 2, kode: 'editor', nama: 'Editor' }] },
    });
    mockUseDaftarPengguna.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 2,
        data: [
          { id: 7, nama: 'Budi', surel: 'budi@example.com', peran_kode: 'admin', aktif: 1, login_terakhir: null, foto: '' },
          { id: 8, nama: 'Sari', surel: 'sari@example.com', peran_kode: 'editor', aktif: 0, login_terakhir: '2026-02-16T10:00:00.000Z', foto: 'https://img.test/f.jpg' },
          { id: 9, nama: 'Tamu', surel: 'tamu@example.com', peran_kode: 'unknown', aktif: 1, login_terakhir: null, foto: '' },
        ],
      },
    });
    mockUseDetailPengguna.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar pengguna tanpa edit peran di tabel', () => {
    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Pengguna' })).toBeInTheDocument();
    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.getByText('Sari')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('membuka panel sunting dan simpan pengguna', () => {
    vi.useFakeTimers();
    mutateSimpanPengguna.mockImplementation((_data, opts) => opts.onSuccess?.());
    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Budi'));
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Budi Baru' } });
    fireEvent.change(screen.getByLabelText(/Peran/), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpanPengguna).toHaveBeenCalled();
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('menampilkan error saat simpan gagal', () => {
    mutateSimpanPengguna.mockImplementation((_data, opts) => opts.onError?.({ response: { data: { error: 'Gagal simpan pengguna' } } }));
    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Sari'));
    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText('Gagal simpan pengguna')).toBeInTheDocument();
  });

  it('menggunakan fallback pesan gagal menyimpan default', () => {
    mutateSimpanPengguna.mockImplementation((_data, opts) => opts.onError?.({}));
    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Tamu'));
    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('menangani response pengguna/peran kosong dan fallback inisial', () => {
    mockUseDaftarPeran.mockReturnValue({ data: undefined });
    mockUseDaftarPengguna.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ id: 10, nama: '', surel: '', peran_kode: '', aktif: 1, login_terakhir: null, foto: '' }] },
    });

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('menangani response pengguna undefined', () => {
    mockUseDaftarPeran.mockReturnValue({ data: undefined });
    mockUseDaftarPengguna.mockReturnValue({ isLoading: false, isError: false, data: undefined });

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });
});