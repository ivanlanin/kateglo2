import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GlosariumAdmin from '../../../src/halaman/redaksi/GlosariumAdmin';

const mockUseDaftarGlosariumAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarGlosariumAdmin: (...args) => mockUseDaftarGlosariumAdmin(...args),
  useSimpanGlosarium: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusGlosarium: () => ({ mutate: mutateHapus, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('GlosariumAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
    mockUseDaftarGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, indonesia: 'air', asing: 'water', bidang: 'kimia', sumber: 'kbbi', bahasa: 'en' }],
      },
    });
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
});