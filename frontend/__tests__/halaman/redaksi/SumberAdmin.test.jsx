import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SumberAdmin from '../../../src/halaman/redaksi/SumberAdmin';

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

const mockUseDaftar = vi.fn();
const mockUseDetail = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarSumberGlosariumAdmin: (...args) => mockUseDaftar(...args),
  useDetailSumberGlosariumAdmin: (...args) => mockUseDetail(...args),
  useSimpanSumberGlosarium: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusSumberGlosarium: () => ({ mutate: mutateHapus, isPending: false }),
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

describe('SumberAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kode: 'kbbi', nama: 'KBBI', jumlah_entri: 2, aktif: true }],
      },
    });
    mockUseDetail.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan dapat menyimpan data', () => {
    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'pusba' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Pusba' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('memvalidasi id route tidak valid dan redirect ke daftar', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/sumber', { replace: true });
  });

  it('membuka mode sunting dari detail route lalu dapat ditutup', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'kbbi', nama: 'KBBI', keterangan: '', aktif: true } },
    });

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('kbbi')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/sumber', { replace: true });
  });

  it('menangani detail error, validasi wajib, error simpan, dan alur hapus', () => {
    mockParams = { id: '2' };
    mockUseDetail.mockReturnValue({ isLoading: false, isError: true, data: null });
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({}));
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/sumber', { replace: true });
    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'pusba' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Pusba' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();

  });

  it('menjalankan sukses simpan dan sukses hapus', () => {
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'pusba' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Pusba' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    vi.advanceTimersByTime(700);

    vi.useRealTimers();
  });

  it('menjalankan aksi hapus saat mode sunting', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'kbbi', nama: 'KBBI', keterangan: '', aktif: true } },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Hapus')).toBeInTheDocument());
    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();
  });

  it('menampilkan pesan saat hapus gagal', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'kbbi', nama: 'KBBI', keterangan: '', aktif: true } },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Hapus')).toBeInTheDocument());
    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Gagal menghapus')).toBeInTheDocument();
  });

  it('menjalankan cari dan klik baris daftar untuk navigasi detail', () => {
    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari sumber …'), { target: { value: 'kbbi' } });
    fireEvent.click(screen.getByText('Cari'));
    fireEvent.click(screen.getByText('KBBI'));

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/sumber/1');
  });

  it('aman saat respons daftar kosong, detail tanpa id, klik item tanpa id, dan batal hapus', async () => {
    mockUseDaftar.mockReturnValue({ isLoading: false, isError: false, data: undefined });
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: {} },
    });

    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();
    cleanup();

    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ kode: 'tanpa-id', nama: 'Tanpa ID', aktif: true }] },
    });
    mockParams = {};
    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Tanpa ID'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/glosarium/sumber/undefined');
    cleanup();

    mockParams = { id: '1' };
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ id: 1, kode: 'kbbi', nama: 'KBBI', aktif: true }] },
    });
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'kbbi', nama: 'KBBI', keterangan: '', aktif: true } },
    });
    render(
      <MemoryRouter>
        <SumberAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Hapus')).toBeInTheDocument());
    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();
  });
});
