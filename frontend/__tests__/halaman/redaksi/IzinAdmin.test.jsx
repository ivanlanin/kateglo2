import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import IzinAdmin from '../../../src/halaman/redaksi/IzinAdmin';

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

const mockUseDaftarIzinKelolaAdmin = vi.fn();
const mockUseDetailIzinAdmin = vi.fn();
const mockUseDaftarPeranUntukIzinAdmin = vi.fn();
const mutateSimpanIzin = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarIzinKelolaAdmin: (...args) => mockUseDaftarIzinKelolaAdmin(...args),
  useDetailIzinAdmin: (...args) => mockUseDetailIzinAdmin(...args),
  useDaftarPeranUntukIzinAdmin: (...args) => mockUseDaftarPeranUntukIzinAdmin(...args),
  useSimpanIzinAdmin: () => ({ mutate: mutateSimpanIzin, isPending: false }),
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

describe('IzinAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};

    mockUseDaftarIzinKelolaAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          {
            id: 1,
            kode: 'kelola_pengguna',
            nama: 'Kelola Pengguna',
            kelompok: 'Admin',
            jumlah_peran: 2,
            peran_nama: ['Administrator', 'Editor'],
          },
        ],
      },
    });

    mockUseDetailIzinAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
    mockUseDaftarPeranUntukIzinAdmin.mockReturnValue({
      isLoading: false,
      data: {
        data: [
          { id: 21, kode: 'admin', nama: 'Administrator' },
          { id: 22, kode: 'editor', nama: 'Editor' },
          { id: 23, kode: 'reviewer', nama: 'Reviewer' },
        ],
      },
    });
  });

  it('menampilkan daftar izin dan membuka panel tambah', () => {
    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Izin' })).toBeInTheDocument();
    expect(screen.getByText('Kelola Pengguna')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByText('Tambah Izin')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('validasi wajib dan simpan payload peran', () => {
    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode izin wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'lihat_dashboard' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Nama izin wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Lihat Dashboard' } });
    fireEvent.change(screen.getByLabelText('Kelompok'), { target: { value: 'Dashboard' } });

    const checkboxAdmin = screen.getByRole('checkbox', { name: /Administrator/i });
    const checkboxReviewer = screen.getByRole('checkbox', { name: /Reviewer/i });
    fireEvent.click(checkboxAdmin);
    fireEvent.click(checkboxReviewer);
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpanIzin).toHaveBeenCalled();
    const payload = mutateSimpanIzin.mock.calls[0][0];
    expect(payload.kode).toBe('lihat_dashboard');
    expect(payload.nama).toBe('Lihat Dashboard');
    expect(payload.peran_ids).toEqual(expect.arrayContaining([21, 23]));
  });

  it('menangani sukses dan error simpan', () => {
    vi.useFakeTimers();
    mutateSimpanIzin
      .mockImplementationOnce((_data, opts) => opts.onSuccess?.())
      .mockImplementationOnce((_data, opts) => opts.onError?.({ response: { data: { message: 'Gagal simpan izin' } } }));

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'lihat_dashboard' } });
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Lihat Dashboard' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'lihat_dashboard_2' } });
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Lihat Dashboard 2' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal simpan izin')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/izin', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailIzinAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kode: 'kelola_pengguna',
          nama: 'Kelola Pengguna Detail',
          kelompok: 'Admin',
          peran_ids: [21, 22],
        },
      },
    });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    expect(screen.getByDisplayValue('Kelola Pengguna Detail')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/izin', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '7' };
    mockUseDetailIzinAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/izin', { replace: true });
  });

  it('tidak membuka panel saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailIzinAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    expect(screen.queryByLabelText('Kode*')).not.toBeInTheDocument();
  });

  it('tidak membuka panel saat item daftar tidak punya id', () => {
    mockUseDaftarIzinKelolaAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, kode: 'tanpa-id', nama: 'Tanpa ID', kelompok: '', jumlah_peran: 0, peran_nama: [] }],
      },
    });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('Tanpa ID'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('klik tambah saat mode detail route menavigasi kembali ke daftar', () => {
    mockParams = { id: '1' };

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/izin', { replace: true });
  });

  it('klik baris valid menavigasi ke detail izin', () => {
    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Kelola Pengguna'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/izin/1');
  });

  it('toggle peran dapat menambah lalu menghapus pilihan', () => {
    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));

    const checkboxAdmin = screen.getByRole('checkbox', { name: /Administrator/i });
    fireEvent.click(checkboxAdmin);
    fireEvent.click(checkboxAdmin);

    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'izin_x' } });
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'Izin X' } });
    fireEvent.click(screen.getByText('Simpan'));

    const payload = mutateSimpanIzin.mock.calls.at(-1)[0];
    expect(payload.peran_ids).toEqual([]);
  });

  it('menampilkan state memuat daftar peran', () => {
    mockUseDaftarPeranUntukIzinAdmin.mockReturnValue({ isLoading: true, data: undefined });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByText('Memuat daftar peran …')).toBeInTheDocument();
  });

  it('simpan memakai fallback peran_ids kosong saat nilai bukan array', () => {
    mockParams = { id: '1' };
    mockUseDetailIzinAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kode: 'kelola_pengguna',
          nama: 'Kelola Pengguna',
          kelompok: 'Admin',
          peran_ids: null,
        },
      },
    });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByText('Simpan'));
    const payload = mutateSimpanIzin.mock.calls.at(-1)[0];
    expect(payload.peran_ids).toEqual([]);
  });

  it('toggle peran tetap aman saat peran_ids awal bukan array', () => {
    mockParams = { id: '1' };
    mockUseDetailIzinAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kode: 'kelola_pengguna',
          nama: 'Kelola Pengguna',
          kelompok: 'Admin',
          peran_ids: null,
        },
      },
    });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    fireEvent.click(screen.getByRole('checkbox', { name: /Administrator/i }));
    fireEvent.click(screen.getByText('Simpan'));

    const payload = mutateSimpanIzin.mock.calls.at(-1)[0];
    expect(payload.peran_ids).toEqual([21]);
  });

  it('menangani state loading, error, dan data kosong', () => {
    mockUseDaftarIzinKelolaAdmin
      .mockReturnValueOnce({ isLoading: true, isError: false, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: true, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: false, data: undefined });

    const { rerender } = render(<MemoryRouter><IzinAdmin /></MemoryRouter>);
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    rerender(<MemoryRouter><IzinAdmin /></MemoryRouter>);
    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument();

    rerender(<MemoryRouter><IzinAdmin /></MemoryRouter>);
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('menampilkan fallback kolom saat nilai null/kosong', () => {
    mockUseDaftarIzinKelolaAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          {
            id: 9,
            kode: 'izin_uji',
            nama: 'Izin Uji',
            kelompok: '',
            jumlah_peran: null,
            peran_nama: null,
          },
        ],
      },
    });

    render(<MemoryRouter><IzinAdmin /></MemoryRouter>);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
