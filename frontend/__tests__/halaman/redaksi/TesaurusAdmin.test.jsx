import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TesaurusAdmin from '../../../src/halaman/redaksi/TesaurusAdmin';

const mockUseDaftarTesaurusAdmin = vi.fn();
const mockUseDetailTesaurusAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarTesaurusAdmin: (...args) => mockUseDaftarTesaurusAdmin(...args),
  useDetailTesaurusAdmin: (...args) => mockUseDetailTesaurusAdmin(...args),
  useSimpanTesaurus: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusTesaurus: () => ({ mutate: mutateHapus, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('TesaurusAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
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
    mutateSimpan.mockImplementation((_data, opts) => opts.onError?.({ response: { data: { error: 'Err simpan' } } }));
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({ response: { data: { error: 'Err hapus' } } }));

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hapus'));
    expect(global.confirm).toHaveBeenCalled();
    expect(screen.getByText('Err hapus')).toBeInTheDocument();
  });

  it('menjalankan onSuccess dan fallback error default', () => {
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
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
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <TesaurusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();
  });
});