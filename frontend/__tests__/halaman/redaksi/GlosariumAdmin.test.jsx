import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GlosariumAdmin from '../../../src/halaman/redaksi/GlosariumAdmin';

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

const mockUseDaftarGlosariumAdmin = vi.fn();
const mockUseDetailGlosariumAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarGlosariumAdmin: (...args) => mockUseDaftarGlosariumAdmin(...args),
  useDetailGlosariumAdmin: (...args) => mockUseDetailGlosariumAdmin(...args),
  useSimpanGlosarium: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusGlosarium: () => ({ mutate: mutateHapus, isPending: false }),
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

describe('GlosariumAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftarGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, indonesia: 'air', asing: 'water', bidang: 'kimia', sumber: 'kbbi', bahasa: 'en' }],
      },
    });
    mockUseDetailGlosariumAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan validasi simpan', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Istilah Indonesia dan Asing wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Indonesia/), { target: { value: 'api' } });
    fireEvent.change(screen.getByLabelText(/Asing/), { target: { value: 'fire' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('menangani error simpan dan hapus', () => {
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({ response: { data: { error: 'Err simpan glosarium' } } }));
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({ response: { data: { error: 'Err hapus glosarium' } } }));

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('air'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan glosarium')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hapus'));
    expect(global.confirm).toHaveBeenCalled();
    expect(screen.getByText('Err hapus glosarium')).toBeInTheDocument();
  });

  it('menjalankan sukses simpan, confirm false, dan fallback error hapus', () => {
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('air'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Gagal menghapus')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('menangani response kosong dan fallback gagal menyimpan', () => {
    mockUseDaftarGlosariumAdmin.mockReturnValue({ isLoading: false, isError: false, data: undefined });
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Indonesia/), { target: { value: 'uji' } });
    fireEvent.change(screen.getByLabelText(/Asing/), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('menjalankan onSuccess hapus', () => {
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('air'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indonesia: 'detail air',
          asing: 'detail water',
          bidang: 'kimia',
          bahasa: 'en',
          sumber: 'kbbi',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('detail air')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '2' };
    mockUseDetailGlosariumAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailGlosariumAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/Indonesia/)).not.toBeInTheDocument();
  });

  it('membuka panel tanpa navigasi saat item tidak punya id', () => {
    mockUseDaftarGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, indonesia: 'tanpa-id', asing: 'no-id', bidang: 'uji', sumber: 'x', bahasa: 'en', aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(screen.getByDisplayValue('tanpa-id')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/glosarium/null');
  });

  it('menjalankan handler cari dan menerapkan filter aktif', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Filter status glosarium'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const argTerakhir = mockUseDaftarGlosariumAdmin.mock.calls.at(-1)?.[0] || {};
    expect(argTerakhir.aktif).toBe('1');
  });

  it('tidak menavigasi saat panel sudah terbuka ketika klik baris lagi', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('air'));
    expect(screen.getByDisplayValue('air')).toBeInTheDocument();

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('air'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('klik tambah saat mode detail route menavigasi kembali ke daftar', () => {
    mockParams = { id: '1' };

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });
});