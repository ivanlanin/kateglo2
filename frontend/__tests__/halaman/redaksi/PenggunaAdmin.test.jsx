import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PenggunaAdmin from '../../../src/halaman/redaksi/PenggunaAdmin';

const mockNavigate = vi.fn();
let mockParams = {};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

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
    mockParams = {};
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
    expect(screen.getByLabelText('Filter status pengguna')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Peran/i)).not.toBeInTheDocument();
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

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/pengguna', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutupnya kembali ke daftar', () => {
    mockParams = { id: '7' };
    mockUseDetailPengguna.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: { id: 7, nama: 'Budi Detail', surel: 'budi@example.com', peran_kode: 'admin', aktif: 1 },
      },
    });

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    expect(screen.getByDisplayValue('Budi Detail')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/pengguna', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '9' };
    mockUseDetailPengguna.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/pengguna', { replace: true });
  });

  it('membuka panel tanpa navigasi saat item tidak punya id', () => {
    mockUseDaftarPengguna.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, nama: 'Tanpa ID', surel: 'tanpa-id@example.com', peran_kode: 'editor', aktif: 1, login_terakhir: null, foto: '' }],
      },
    });

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Tanpa ID'));
    expect(screen.getByDisplayValue('Tanpa ID')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/pengguna/null');
  });

  it('menjalankan handler cari dan menerapkan filter aktif', () => {
    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Filter status pengguna'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const panggilanTerakhir = mockUseDaftarPengguna.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.aktif).toBe('1');
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '11' };
    mockUseDetailPengguna.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    expect(screen.queryByLabelText('Nama')).not.toBeInTheDocument();
  });

  it('tidak menavigasi saat panel sudah terbuka ketika klik baris pengguna lagi', () => {
    render(<MemoryRouter><PenggunaAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Budi'));
    expect(screen.getByDisplayValue('Budi')).toBeInTheDocument();

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('Sari'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});