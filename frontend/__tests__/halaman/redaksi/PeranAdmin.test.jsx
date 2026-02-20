import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PeranAdmin from '../../../src/halaman/redaksi/PeranAdmin';

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

const mockUseDaftarPeranAdmin = vi.fn();
const mockUseDetailPeranAdmin = vi.fn();
const mockUseDaftarIzinAdmin = vi.fn();
const mutateSimpanPeran = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarPeranAdmin: (...args) => mockUseDaftarPeranAdmin(...args),
  useDetailPeranAdmin: (...args) => mockUseDetailPeranAdmin(...args),
  useDaftarIzinAdmin: (...args) => mockUseDaftarIzinAdmin(...args),
  useSimpanPeranAdmin: () => ({ mutate: mutateSimpanPeran, isPending: false }),
}));

vi.mock('../../../src/komponen/bersama/TataLetak', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

describe('PeranAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};

    mockUseDaftarPeranAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          {
            id: 1,
            kode: 'admin',
            nama: 'Administrator',
            jumlah_pengguna: 2,
            jumlah_izin: 3,
            izin_nama: ['Kelola Pengguna', 'Kelola Peran', 'Kelola Label'],
          },
        ],
      },
    });

    mockUseDetailPeranAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
    mockUseDaftarIzinAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: [
          { id: 11, kode: 'kelola_pengguna', nama: 'Kelola Pengguna', kelompok: 'Admin' },
          { id: 12, kode: 'kelola_peran', nama: 'Kelola Peran', kelompok: 'Admin' },
          { id: 13, kode: 'lihat_statistik', nama: 'Lihat Statistik', kelompok: 'Dashboard' },
        ],
      },
    });
  });

  it('menampilkan daftar peran dan membuka panel tambah', () => {
    render(<MemoryRouter><PeranAdmin /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Peran' })).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByText('Tambah Peran')).toBeInTheDocument();
    expect(screen.getByText('Kelola Pengguna')).toBeInTheDocument();
  });

  it('validasi wajib dan simpan payload izin', () => {
    render(<MemoryRouter><PeranAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode peran wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'editor' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Nama peran wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Editor' } });
    fireEvent.change(screen.getByLabelText('Keterangan'), { target: { value: 'Dapat menyunting konten' } });

    const checkboxKelolaPengguna = screen.getByRole('checkbox', { name: /Kelola Pengguna/i });
    const checkboxLihatStatistik = screen.getByRole('checkbox', { name: /Lihat Statistik/i });
    fireEvent.click(checkboxKelolaPengguna);
    fireEvent.click(checkboxLihatStatistik);
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpanPeran).toHaveBeenCalled();
    const payload = mutateSimpanPeran.mock.calls[0][0];
    expect(payload.kode).toBe('editor');
    expect(payload.nama).toBe('Editor');
    expect(payload.izin_ids).toEqual(expect.arrayContaining([11, 13]));
  });

  it('menangani sukses dan error simpan', () => {
    vi.useFakeTimers();
    mutateSimpanPeran
      .mockImplementationOnce((_data, opts) => opts.onSuccess?.())
      .mockImplementationOnce((_data, opts) => opts.onError?.({ response: { data: { message: 'Gagal simpan peran' } } }));

    render(<MemoryRouter><PeranAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'editor' } });
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Editor' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'editor2' } });
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Editor 2' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal simpan peran')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(<MemoryRouter><PeranAdmin /></MemoryRouter>);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/peran', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailPeranAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kode: 'admin',
          nama: 'Admin Detail',
          keterangan: 'detail',
          izin_ids: [11, 12],
        },
      },
    });

    render(<MemoryRouter><PeranAdmin /></MemoryRouter>);

    expect(screen.getByDisplayValue('Admin Detail')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/peran', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '7' };
    mockUseDetailPeranAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(<MemoryRouter><PeranAdmin /></MemoryRouter>);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/peran', { replace: true });
  });

  it('menangani state loading, error, dan data kosong', () => {
    mockUseDaftarPeranAdmin
      .mockReturnValueOnce({ isLoading: true, isError: false, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: true, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: false, data: undefined });

    const { rerender } = render(<MemoryRouter><PeranAdmin /></MemoryRouter>);
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    rerender(<MemoryRouter><PeranAdmin /></MemoryRouter>);
    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument();

    rerender(<MemoryRouter><PeranAdmin /></MemoryRouter>);
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });
});