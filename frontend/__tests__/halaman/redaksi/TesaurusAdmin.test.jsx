import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TesaurusAdmin from '../../../src/halaman/redaksi/TesaurusAdmin';

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

const mockUseDaftarTesaurusAdmin = vi.fn();
const mockUseDetailTesaurusAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarTesaurusAdmin: (...args) => mockUseDaftarTesaurusAdmin(...args),
  useDetailTesaurusAdmin: (...args) => mockUseDetailTesaurusAdmin(...args),
  useSimpanTesaurus: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusTesaurus: () => ({ mutate: mutateHapus, isPending: false }),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: (...args) => mockUseAuth(...args),
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

describe('TesaurusAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseAuth.mockReturnValue({
      punyaIzin: () => true,
    });
    mockUseDaftarTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, indeks: 'anak', sinonim: 'buah hati', antonim: 'orang tua' }],
      },
    });
    mockUseDetailTesaurusAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
  });

  it('menampilkan daftar dan validasi simpan', () => {
    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Indeks wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Indeks/), { target: { value: 'baru' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('menangani hapus dan error simpan/hapus', () => {
    mockParams = { id: '1' };
    mockUseDetailTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'anak',
          sinonim: 'buah hati',
          antonim: 'orang tua',
          aktif: 1,
        },
      },
    });
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({ response: { data: { error: 'Err simpan' } } }));
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({ response: { data: { error: 'Err hapus' } } }));

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hapus'));
    expect(global.confirm).toHaveBeenCalled();
    expect(screen.getByText('Err hapus')).toBeInTheDocument();
  });

  it('menjalankan onSuccess dan fallback error default', () => {
    mockParams = { id: '1' };
    mockUseDetailTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'anak',
          sinonim: 'buah hati',
          antonim: 'orang tua',
          aktif: 1,
        },
      },
    });
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

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
    mockUseDaftarTesaurusAdmin.mockReturnValue({ isLoading: false, isError: false, data: undefined });
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Indeks/), { target: { value: 'uji' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();
  });

  it('menjalankan onSuccess hapus', () => {
    mockParams = { id: '1' };
    mockUseDetailTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'anak',
          sinonim: 'buah hati',
          antonim: 'orang tua',
          aktif: 1,
        },
      },
    });
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tesaurus', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'detail indeks',
          sinonim: 'sinonim',
          antonim: 'antonim',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('detail indeks')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tesaurus', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '2' };
    mockUseDetailTesaurusAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tesaurus', { replace: true });
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailTesaurusAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/Indeks/)).not.toBeInTheDocument();
  });

  it('tidak membuka panel saat item tidak punya id', () => {
    mockUseDaftarTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, indeks: 'tanpa-id', sinonim: 'x', antonim: 'y', aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(screen.queryByDisplayValue('tanpa-id')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/tesaurus/null');
  });

  it('menjalankan handler cari dan menerapkan filter aktif', () => {
    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Filter status tesaurus'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const argTerakhir = mockUseDaftarTesaurusAdmin.mock.calls.at(-1)?.[0] || {};
    expect(argTerakhir.aktif).toBe('1');
  });

  it('tetap menavigasi saat panel sudah terbuka ketika klik baris lagi', () => {
    mockParams = { id: '1' };
    mockUseDetailTesaurusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'anak',
          sinonim: 'buah hati',
          antonim: 'orang tua',
          aktif: 1,
        },
      },
    });
    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('anak')).toBeInTheDocument();

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('anak'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tesaurus/1');
  });

  it('klik tambah saat mode detail route menavigasi kembali ke daftar', () => {
    mockParams = { id: '1' };

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/tesaurus', { replace: true });
  });
});