import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KataHariIniAdmin from '../../../../src/pages/redaksi/leksikon/KataHariIniAdmin';

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

const mockUseDaftarKataHariIniAdmin = vi.fn();
const mockUseDetailKataHariIniAdmin = vi.fn();
const mockUseAutocompleteEntriKataHariIniAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();

vi.mock('../../../../src/api/apiAdmin', () => ({
  useDaftarKataHariIniAdmin: (...args) => mockUseDaftarKataHariIniAdmin(...args),
  useDetailKataHariIniAdmin: (...args) => mockUseDetailKataHariIniAdmin(...args),
  useAutocompleteEntriKataHariIniAdmin: (...args) => mockUseAutocompleteEntriKataHariIniAdmin(...args),
  useSimpanKataHariIniAdmin: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusKataHariIniAdmin: () => ({ mutate: mutateHapus, isPending: false }),
}));

vi.mock('../../../../src/components/tampilan/HalamanAdmin', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

describe('KataHariIniAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseDaftarKataHariIniAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, tanggal: '2026-03-31', indeks: 'aktif', entri: 'aktif', sumber: 'admin', catatan: 'pilihan redaksi', updated_at: '2026-03-31 10:00:00.000' }],
      },
    });
    mockUseDetailKataHariIniAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
    mockUseAutocompleteEntriKataHariIniAdmin.mockReturnValue({
      data: { data: [{ id: 7, entri: 'aktif', indeks: 'aktif' }] },
      isLoading: false,
    });
  });

  it('menampilkan daftar, validasi simpan, dan alur sukses/error simpan', () => {
    mutateSimpan
      .mockImplementationOnce((_payload, opts) => opts.onError?.({ response: { data: { message: 'Err simpan kata' } } }))
      .mockImplementationOnce((_payload, opts) => opts.onSuccess?.());

    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByText('aktif')).toHaveLength(2);

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Entri wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'aktif' } });
    fireEvent.click(screen.getByRole('button', { name: /aktif/i }));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan kata')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Arsip Kata Hari Ini tersimpan.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('menangani detail route, hapus, reset filter, dan guard id', () => {
    mockParams = { id: '1' };
    mockUseDetailKataHariIniAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          tanggal: '2026-03-31',
          entri_id: 7,
          indeks: 'aktif',
          entri: 'aktif',
          sumber: 'admin',
          catatan: 'pilihan redaksi',
        },
      },
    });

    render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Entri*')).toHaveValue('aktif');

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    mutateHapus.mockImplementationOnce((_id, opts) => opts.onError?.({ response: { data: { message: 'Err hapus kata' } } }));
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Err hapus kata')).toBeInTheDocument();

    mutateHapus.mockImplementationOnce((_id, opts) => opts.onSuccess?.());
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalledWith(1, expect.any(Object));

    fireEvent.change(screen.getByPlaceholderText('Cari arsip kata …'), { target: { value: 'aktif' } });
    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);

    const panggilanTerakhir = mockUseDaftarKataHariIniAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.sumber).toBe('');
  });

  it('mengarahkan ke daftar saat id invalid atau detail error', () => {
    mockParams = { id: 'abc' };
    render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kata-hari-ini', { replace: true });

    mockParams = { id: '5' };
    mockUseDetailKataHariIniAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });
    render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kata-hari-ini', { replace: true });
  });
});