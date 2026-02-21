import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BidangAdmin from '../../../src/halaman/redaksi/BidangAdmin';

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
  useDaftarBidangAdmin: (...args) => mockUseDaftar(...args),
  useDetailBidangAdmin: (...args) => mockUseDetail(...args),
  useSimpanBidangGlosarium: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusBidangGlosarium: () => ({ mutate: mutateHapus, isPending: false }),
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

describe('BidangAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kode: 'kimia', nama: 'Kimia', jumlah_entri: 2, aktif: true }],
      },
    });
    mockUseDetail.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan dapat menyimpan data', () => {
    render(
      <MemoryRouter>
        <BidangAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'hukum' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Hukum' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('memvalidasi id route tidak valid dan redirect ke daftar', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <BidangAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/bidang', { replace: true });
  });

  it('membuka mode sunting dari detail route lalu dapat ditutup', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'kim', nama: 'Kimia', keterangan: '', aktif: true } },
    });

    render(
      <MemoryRouter>
        <BidangAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('kim')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/bidang', { replace: true });
  });

  it('menangani detail error, validasi wajib, error simpan, dan alur hapus', () => {
    mockParams = { id: '2' };
    mockUseDetail.mockReturnValue({ isLoading: false, isError: true, data: null });
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({}));
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <BidangAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/bidang', { replace: true });
    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'kim' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Kimia' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();

  });

  it('menjalankan sukses simpan dan sukses hapus', () => {
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <BidangAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'fis' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Fisika' } });
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
      data: { data: { id: 1, kode: 'kimia', nama: 'Kimia', keterangan: '', aktif: true } },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <BidangAdmin />
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
      data: { data: { id: 1, kode: 'kimia', nama: 'Kimia', keterangan: '', aktif: true } },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <BidangAdmin />
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
        <BidangAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari bidang …'), { target: { value: 'kim' } });
    fireEvent.click(screen.getByText('Cari'));
    fireEvent.click(screen.getByText('Kimia'));

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/bidang/1');
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
        <BidangAdmin />
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
        <BidangAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Tanpa ID'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/glosarium/bidang/undefined');
    cleanup();

    mockParams = { id: '1' };
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ id: 1, kode: 'kimia', nama: 'Kimia', aktif: true }] },
    });
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'kimia', nama: 'Kimia', keterangan: '', aktif: true } },
    });
    render(
      <MemoryRouter>
        <BidangAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Hapus')).toBeInTheDocument());
    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();
  });
});
