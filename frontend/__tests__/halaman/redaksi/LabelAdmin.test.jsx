import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LabelAdmin from '../../../src/halaman/redaksi/LabelAdmin';

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

const mockUseDaftarLabelAdmin = vi.fn();
const mockUseDetailLabelAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarLabelAdmin: (...args) => mockUseDaftarLabelAdmin(...args),
  useDetailLabelAdmin: (...args) => mockUseDetailLabelAdmin(...args),
  useSimpanLabel: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusLabel: () => ({ mutate: mutateHapus, isPending: false }),
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

describe('LabelAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftarLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kategori: 'ragam', kode: 'cak', nama: 'cakapan', urutan: 1, keterangan: 'ragam lisan' }],
      },
    });
    mockUseDetailLabelAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan validasi wajib saat simpan', () => {
    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('cakapan')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kategori wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kategori*'), { target: { value: 'bahasa' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Kode wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'ark' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'arkais' } });
    fireEvent.change(screen.getByLabelText('Urutan'), { target: { value: '2' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('menangani error simpan dengan pesan backend dan fallback default', () => {
    mutateSimpan
      .mockImplementationOnce((_data, opts) => opts.onError?.({ response: { data: { message: 'Err simpan label' } } }))
      .mockImplementationOnce((_data, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Kategori*'), { target: { value: 'bahasa' } });
    fireEvent.change(screen.getByLabelText('Kode*'), { target: { value: 'ark' } });
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'arkais' } });
    fireEvent.change(screen.getByLabelText('Urutan'), { target: { value: '2' } });

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan label')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('menjalankan sukses simpan, cabang confirm false, dan sukses hapus', () => {
    mockParams = { id: '1' };
    mockUseDetailLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kategori: 'ragam',
          kode: 'cak',
          nama: 'cakapan',
          urutan: 1,
          keterangan: 'ragam lisan',
          aktif: 1,
        },
      },
    });
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'cakapan baru' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('menangani error hapus dengan pesan backend dan fallback default', () => {
    mockParams = { id: '1' };
    mockUseDetailLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kategori: 'ragam',
          kode: 'cak',
          nama: 'cakapan',
          urutan: 1,
          keterangan: 'ragam lisan',
          aktif: 1,
        },
      },
    });
    mutateHapus
      .mockImplementationOnce((_id, opts) => opts.onError?.({ response: { data: { message: 'Err hapus label' } } }))
      .mockImplementationOnce((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Err hapus label')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Gagal menghapus')).toBeInTheDocument();
  });

  it('menangani state loading, error, dan data kosong', () => {
    mockUseDaftarLabelAdmin
      .mockReturnValueOnce({ isLoading: true, isError: false, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: true, data: undefined })
      .mockReturnValueOnce({ isLoading: false, isError: false, data: undefined });

    const { rerender } = render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/label', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kategori: 'ragam',
          kode: 'cak',
          nama: 'detail label',
          urutan: 1,
          keterangan: 'detail',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('detail label')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/label', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '2' };
    mockUseDetailLabelAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/label', { replace: true });
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailLabelAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText('Nama*')).not.toBeInTheDocument();
  });

  it('tidak membuka panel saat item tidak punya id', () => {
    mockUseDaftarLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, kategori: 'uji', kode: 'x', nama: 'tanpa-id', urutan: 1, keterangan: '', aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(screen.queryByDisplayValue('tanpa-id')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/label/null');
  });

  it('menjalankan handler cari dan menerapkan filter aktif', () => {
    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Filter status label'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const argTerakhir = mockUseDaftarLabelAdmin.mock.calls.at(-1)?.[0] || {};
    expect(argTerakhir.aktif).toBe('1');
  });

  it('tetap menavigasi saat panel sudah terbuka ketika klik baris lagi', () => {
    mockParams = { id: '1' };
    mockUseDetailLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          kategori: 'ragam',
          kode: 'cak',
          nama: 'cakapan',
          urutan: 1,
          keterangan: 'ragam lisan',
          aktif: 1,
        },
      },
    });
    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('cakapan')).toBeInTheDocument();

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('cakapan'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/label/1');
  });

  it('klik tambah saat mode detail route menavigasi kembali ke daftar', () => {
    mockParams = { id: '1' };

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/label', { replace: true });
  });
});
