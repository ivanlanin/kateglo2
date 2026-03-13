import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BahasaAdmin from '../../../src/halaman/redaksi/BahasaAdmin';

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
  useDaftarBahasaAdmin: (...args) => mockUseDaftar(...args),
  useDetailBahasaAdmin: (...args) => mockUseDetail(...args),
  useSimpanBahasa: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusBahasa: () => ({ mutate: mutateHapus, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/HalamanAdmin', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

describe('BahasaAdmin', () => {
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kode: 'Ing', nama: 'Inggris', iso2: 'en', aktif: true }],
      },
    });
    mockUseDetail.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan dapat menyimpan data', () => {
    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'Ar' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Arab' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('memvalidasi id route tidak valid dan redirect ke daftar', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/bahasa', { replace: true });
  });

  it('membuka mode sunting dari detail route lalu dapat ditutup', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'Ing', nama: 'Inggris', iso2: 'en', iso3: 'eng', keterangan: '', aktif: true } },
    });

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Ing')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/bahasa', { replace: true });
  });

  it('memakai fallback nilai kosong untuk iso dan keterangan serta toggle status boolean', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'Ing', nama: 'Inggris', iso2: null, iso3: null, keterangan: null, aktif: 0 } },
    });

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('ISO 2')).toHaveValue(''));
    expect(screen.getByLabelText('ISO 3')).toHaveValue('');
    expect(screen.getByLabelText('Keterangan')).toHaveValue('');
    expect(screen.getAllByText('Nonaktif').length).toBeGreaterThan(0);
  });

  it('menangani detail error, validasi wajib, error simpan, dan alur hapus', () => {
    mockParams = { id: '2' };
    mockUseDetail.mockReturnValue({ isLoading: false, isError: true, data: null });
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({}));
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/bahasa', { replace: true });
    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Kode/), { target: { value: 'Ing' } });
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Inggris' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('menjalankan sukses simpan dan sukses hapus', async () => {
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'Ing', nama: 'Inggris', iso2: 'en', iso3: 'eng', keterangan: '', aktif: true } },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Ing')).toBeInTheDocument());
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'Inggris Baru' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpan).toHaveBeenCalled();
    act(() => {
      vi.runAllTimers();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/bahasa', { replace: true });
    vi.useRealTimers();

    mockParams = { id: '1' };
    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Ing')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('menampilkan pesan saat hapus gagal', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'Ing', nama: 'Inggris', iso2: 'en', iso3: 'eng', keterangan: '', aktif: true } },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Ing')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Gagal menghapus')).toBeInTheDocument();
  });

  it('menjalankan cari dan klik baris daftar untuk navigasi detail', () => {
    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari bahasa …'), { target: { value: 'ing' } });
    fireEvent.click(screen.getByText('Cari'));
    fireEvent.click(screen.getByText('Inggris'));

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/bahasa/1');
  });

  it('menjalankan reset filter pencarian', () => {
    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari bahasa …'), { target: { value: 'ing' } });
    fireEvent.change(screen.getByLabelText('Filter status bahasa'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);

    const panggilanTerakhir = mockUseDaftar.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.aktif).toBe('');
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
        <BahasaAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();
    cleanup();

    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ id: 0, kode: 'X', nama: 'Tanpa ID', iso2: '', aktif: true }] },
    });
    mockParams = {};
    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Tanpa ID'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/bahasa/undefined');
    cleanup();

    mockParams = { id: '1' };
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ id: 1, kode: 'Ing', nama: 'Inggris', iso2: 'en', aktif: true }] },
    });
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'Ing', nama: 'Inggris', iso2: 'en', iso3: 'eng', keterangan: '', aktif: true } },
    });
    global.confirm = vi.fn(() => false);

    render(
      <MemoryRouter>
        <BahasaAdmin />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('Ing')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();
  });
});