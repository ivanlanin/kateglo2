import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TagarAdmin from '../../../src/halaman/redaksi/TagarAdmin';

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

const mockUseDaftarTagarAdmin = vi.fn();
const mockUseDetailTagarAdmin = vi.fn();
const mockUseKategoriTagarAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarTagarAdmin: (...args) => mockUseDaftarTagarAdmin(...args),
  useDetailTagarAdmin: (...args) => mockUseDetailTagarAdmin(...args),
  useKategoriTagarAdmin: (...args) => mockUseKategoriTagarAdmin(...args),
  useSimpanTagar: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusTagar: () => ({ mutate: mutateHapus, isPending: false }),
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

describe('TagarAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftarTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kode: 'me', nama: 'me-', kategori: 'prefiks', urutan: 1, aktif: 1, deskripsi: 'prefiks me', jumlah_entri: 12 }],
      },
    });
    mockUseDetailTagarAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
    mockUseKategoriTagarAdmin.mockReturnValue({ data: { data: ['prefiks', 'sufiks'] } });
  });

  it('menampilkan daftar, validasi simpan, dan alur sukses/error simpan', () => {
    mutateSimpan
      .mockImplementationOnce((_payload, opts) => opts.onError?.({ response: { data: { message: 'Err simpan tagar' } } }))
      .mockImplementationOnce((_payload, opts) => opts.onSuccess?.());

    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('me-')).toBeInTheDocument();

    fireEvent.click(screen.getByText('me-'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tagar/1');

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'ber-' } });
    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'ber' } });
    fireEvent.change(screen.getByLabelText('Kategori'), { target: { value: 'prefiks' } });

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan tagar')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('menangani detail route, hapus, reset filter, dan guard id', () => {
    mockParams = { id: '1' };
    mockUseDetailTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kode: 'me',
          nama: 'me-',
          kategori: 'prefiks',
          urutan: 1,
          aktif: 1,
          deskripsi: 'prefiks me',
        },
      },
    });

    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('me-')).toBeInTheDocument();

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    mutateHapus.mockImplementationOnce((_id, opts) => opts.onError?.({ response: { data: { message: 'Err hapus tagar' } } }));
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Err hapus tagar')).toBeInTheDocument();

    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('Cari tagar …'), { target: { value: 'pref' } });
    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);

    const panggilanTerakhir = mockUseDaftarTagarAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.kategori).toBe('');
    expect(panggilanTerakhir.aktif).toBe('');
  });

  it('mengarahkan ke daftar saat id invalid atau detail error', () => {
    mockParams = { id: 'abc' };
    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tagar', { replace: true });

    mockParams = { id: '5' };
    mockUseDetailTagarAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });
    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tagar', { replace: true });
  });

  it('menjalankan cari, tambah dari mode route-id, klik baris tanpa id, dan error hapus', () => {
    mockParams = { id: '1' };
    mockUseDaftarTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ kode: 'x', nama: 'tanpa-id', kategori: 'prefiks', urutan: 1, aktif: 1, deskripsi: '' }],
      },
    });
    mockUseDetailTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 1, kode: 'me', nama: 'me-', kategori: 'prefiks', urutan: 1, aktif: 1, deskripsi: '' } },
    });

    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari tagar …'), { target: { value: 'tanpa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    const panggilanCari = mockUseDaftarTagarAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanCari.q).toBe('tanpa');

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tagar', { replace: true });

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/tagar/undefined');
  });

  it('tetap aman saat data daftar/kategori kosong dan detail masih loading', () => {
    mockParams = { id: '2' };
    mockUseDaftarTagarAdmin.mockReturnValue({ isLoading: false, isError: false, data: undefined });
    mockUseKategoriTagarAdmin.mockReturnValue({ data: undefined });
    mockUseDetailTagarAdmin.mockReturnValue({ isLoading: true, isError: false, data: undefined });

    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/tagar', { replace: true });
  });

  it('tetap aman saat detail route valid tapi payload detail kosong', () => {
    mockParams = { id: '3' };
    mockUseDetailTagarAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });

    render(
      <MemoryRouter>
        <TagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Tagar')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/tagar', { replace: true });
  });
});
