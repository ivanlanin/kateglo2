import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
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

  it('menutup edit dari path saat tambah diklik dan membuka sunting saat baris tabel dipilih', () => {
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

    const { rerender } = render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kata-hari-ini', { replace: true });

    mockParams = {};
    rerender(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('2026-03-31'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kata-hari-ini/1');
  });

  it('menerapkan filter cari, mengosongkan entri terpilih saat input berubah, serta menampilkan status saran loading dan kosong', () => {
    mockUseAutocompleteEntriKataHariIniAdmin.mockReturnValue({
      data: { data: [] },
      isLoading: true,
    });

    const { rerender } = render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari arsip kata …'), { target: { value: 'otomatis' } });
    fireEvent.change(screen.getByLabelText('Filter sumber kata hari ini'), { target: { value: 'auto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    let panggilanTerakhir = mockUseDaftarKataHariIniAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('otomatis');
    expect(panggilanTerakhir.sumber).toBe('auto');

    fireEvent.click(screen.getByText('+ Tambah'));
    const inputEntri = screen.getByLabelText('Entri*');
    fireEvent.focus(inputEntri);
    expect(screen.getByText('Mencari entri …')).toBeInTheDocument();

    mockUseAutocompleteEntriKataHariIniAdmin.mockReturnValue({
      data: { data: [{ id: 7, entri: 'aktif', indeks: 'aktif' }] },
      isLoading: false,
    });
    rerender(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'aktif' } });
    fireEvent.click(screen.getByRole('button', { name: /aktif/i }));
    expect(screen.getByText('Indeks terpilih: aktif')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'baru' } });
    expect(screen.queryByText('Indeks terpilih: aktif')).not.toBeInTheDocument();

    mockUseAutocompleteEntriKataHariIniAdmin.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
    rerender(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );
    fireEvent.focus(screen.getByLabelText('Entri*'));
    expect(screen.getByText('Tidak ada entri cocok')).toBeInTheDocument();
  });

  it('menampilkan badge otomatis dan fallback daftar/saran saat respons kosong', () => {
    mockUseDaftarKataHariIniAdmin.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 2, tanggal: '2026-04-01', indeks: 'otomatis', entri: 'otomatis', sumber: 'auto', catatan: '', updated_at: null }],
      },
    }).mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: null,
    });
    mockUseAutocompleteEntriKataHariIniAdmin.mockReturnValue({ data: null, isLoading: false });

    const { rerender } = render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Otomatis').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    rerender(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.focus(screen.getByLabelText('Entri*'));
    expect(screen.getByText('Tidak ada entri cocok')).toBeInTheDocument();
  });

  it('mengabaikan detail tanpa id, memakai fallback entri kosong, dan tidak menavigasi saat baris tanpa id dipilih', () => {
    mockParams = { id: '1' };
    mockUseDetailKataHariIniAdmin
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: { data: { tanggal: '2026-03-31' } },
      })
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: { data: { id: 1, tanggal: '2026-03-31', entri_id: 7, indeks: '', entri: undefined, sumber: 'admin', catatan: undefined } },
      });
    mockUseDaftarKataHariIniAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ tanggal: '2026-04-02', entri: 'tanpa-id', indeks: 'tanpa-id', sumber: 'admin', catatan: '' }],
      },
    });

    const { rerender } = render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText('Entri*')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Entri*')).toHaveValue('');
    expect(screen.getByLabelText('Catatan')).toHaveValue('');

    mockParams = {};
    rerender(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('2026-04-02'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/kata-hari-ini/undefined');
  });

  it('memilih saran tanpa indeks menyimpan entri tetapi membiarkan indeks kosong', () => {
    mockUseAutocompleteEntriKataHariIniAdmin.mockReturnValue({
      data: { data: [{ id: 8, entri: 'baru' }] },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'baru' } });
    fireEvent.click(screen.getByRole('button', { name: /baru/i }));

    expect(screen.getByLabelText('Entri*')).toHaveValue('baru');
    expect(screen.queryByText(/Indeks terpilih:/i)).not.toBeInTheDocument();
  });

  it('menutup daftar saran pada blur tertunda dan mencegah default saat mousedown item saran', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <KataHariIniAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    const inputEntri = screen.getByLabelText('Entri*');
    fireEvent.change(inputEntri, { target: { value: 'aktif' } });

    const tombolSaran = screen.getByRole('button', { name: /aktif/i });
    const mouseDownEvent = createEvent.mouseDown(tombolSaran);
    mouseDownEvent.preventDefault = vi.fn();
    fireEvent(tombolSaran, mouseDownEvent);
    expect(mouseDownEvent.preventDefault).toHaveBeenCalled();

    fireEvent.blur(inputEntri);
    act(() => {
      vi.advanceTimersByTime(130);
    });

    expect(screen.queryByRole('button', { name: /aktif/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});