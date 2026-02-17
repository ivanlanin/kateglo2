import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LabelAdmin from '../../../src/halaman/redaksi/LabelAdmin';

const mockUseDaftarLabelAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarLabelAdmin: (...args) => mockUseDaftarLabelAdmin(...args),
  useSimpanLabel: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusLabel: () => ({ mutate: mutateHapus, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('LabelAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
    mockUseDaftarLabelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, kategori: 'ragam', kode: 'cak', nama: 'cakapan', urutan: 1, keterangan: 'ragam lisan' }],
      },
    });
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
    vi.useFakeTimers();
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('cakapan'));
    fireEvent.change(screen.getByLabelText('Nama*'), { target: { value: 'cakapan baru' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByText('cakapan'));
    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('menangani error hapus dengan pesan backend dan fallback default', () => {
    mutateHapus
      .mockImplementationOnce((_id, opts) => opts.onError?.({ response: { data: { message: 'Err hapus label' } } }))
      .mockImplementationOnce((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <LabelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('cakapan'));
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
});
