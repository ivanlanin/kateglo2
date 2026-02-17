import { fireEvent, render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KamusAdmin from '../../../src/halaman/redaksi/KamusAdmin';

const mockUseDaftarKamusAdmin = vi.fn();
const mockUseDaftarMakna = vi.fn();
const mockUseKategoriLabelRedaksi = vi.fn();

const mutateSimpanKamus = vi.fn();
const mutateHapusKamus = vi.fn();
const mutateSimpanMakna = vi.fn();
const mutateHapusMakna = vi.fn();
const mutateSimpanContoh = vi.fn();
const mutateHapusContoh = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarKamusAdmin: (...args) => mockUseDaftarKamusAdmin(...args),
  useSimpanKamus: () => ({ mutate: mutateSimpanKamus, isPending: false }),
  useHapusKamus: () => ({ mutate: mutateHapusKamus, isPending: false }),
  useDaftarMakna: (...args) => mockUseDaftarMakna(...args),
  useKategoriLabelRedaksi: (...args) => mockUseKategoriLabelRedaksi(...args),
  useSimpanMakna: () => ({ mutate: mutateSimpanMakna, isPending: false }),
  useHapusMakna: () => ({ mutate: mutateHapusMakna, isPending: false }),
  useSimpanContoh: () => ({ mutate: mutateSimpanContoh, isPending: false }),
  useHapusContoh: () => ({ mutate: mutateHapusContoh, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

function invokeReactClick(element) {
  const propsKey = Object.keys(element).find((key) => key.startsWith('__reactProps$'));
  if (!propsKey) {
    throw new Error('React props key tidak ditemukan');
  }
  element[propsKey].onClick({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
}

describe('KamusAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);

    mockUseDaftarKamusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, entri: 'anak', jenis: 'dasar', lafal: 'a·nak', aktif: 1, jenis_rujuk: 'lihat', entri_rujuk: 'ananda' }],
      },
    });

    mockUseDaftarMakna.mockReturnValue({
      isLoading: false,
      data: {
        data: [
          {
            id: 10,
            makna: 'keturunan manusia',
            kelas_kata: 'n',
            bidang: 'umum',
            ragam: 'cakap',
            bahasa: 'id',
            kiasan: false,
            urutan: 1,
            contoh: [{ id: 99, contoh: 'anak baik', makna_contoh: '', ragam: '', bidang: '' }],
          },
          {
            id: 11,
            makna: 'kiasan anak emas',
            kelas_kata: 'n',
            bidang: '',
            ragam: '',
            bahasa: '',
            kiasan: true,
            urutan: 2,
            contoh: [],
          },
        ],
      },
    });

    mockUseKategoriLabelRedaksi.mockReturnValue({
      data: {
        data: {
          'bentuk-kata': [
            { kode: 'dasar', nama: 'Dasar' },
            { kode: 'turunan', nama: 'Turunan' },
          ],
          'jenis-rujuk': [{ kode: 'lihat', nama: 'lihat' }],
          'kelas-kata': [{ kode: 'n', nama: 'nomina' }],
          ragam: [{ kode: 'cak', nama: 'cakapan' }],
          bidang: [{ kode: 'umum', nama: 'Umum' }],
          bahasa: [{ kode: 'id', nama: 'Indonesia' }],
          penyingkatan: [{ kode: 'singkatan', nama: 'Singkatan' }],
        },
      },
    });
  });

  it('validasi simpan lema dan alur simpan/hapus lema', () => {
    mutateSimpanKamus.mockImplementation((_data, opts) => opts.onSuccess?.({ data: { id: 2, entri: 'baru' } }));

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Entri wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'baru' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpanKamus).toHaveBeenCalled();

    fireEvent.click(screen.getByText('anak'));
    expect(screen.getByText('→ ananda')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hapus'));
    expect(global.confirm).toHaveBeenCalled();
    expect(mutateHapusKamus).toHaveBeenCalled();
  });

  it('mengelola makna dan contoh', () => {
    mutateSimpanMakna.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapusMakna.mockImplementation((_data, opts) => opts?.onSuccess?.());
    mutateSimpanContoh.mockImplementation((_data, opts) => opts.onSuccess?.());
    mutateHapusContoh.mockImplementation((_data, opts) => opts?.onSuccess?.());

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    expect(screen.getByRole('heading', { name: /Makna/ })).toBeInTheDocument();

    fireEvent.click(screen.getByText('keturunan manusia'));
    fireEvent.click(screen.getByText('kiasan anak emas'));
    expect(screen.getByText('kiasan')).toBeInTheDocument();
    const semuaSunting = screen.getAllByText('sunting');
    fireEvent.click(semuaSunting[0]);

    fireEvent.click(screen.getAllByText('Batal').find((btn) => btn.className.includes('text-xs')));
    fireEvent.click(semuaSunting[0]);

    fireEvent.change(screen.getByLabelText(/^Makna$/), { target: { value: '' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Simpan' })[0]);

    fireEvent.change(screen.getByLabelText(/^Makna$/), { target: { value: 'makna baru' } });
    screen.getAllByRole('button', { name: 'Simpan' }).forEach((btn) => fireEvent.click(btn));
    expect(mutateSimpanMakna).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText('+ contoh')[0]);
    const tombolSimpanKosong = screen.getAllByRole('button', { name: 'Simpan' }).find((btn) => btn.className.includes('text-xs'));
    tombolSimpanKosong.removeAttribute('disabled');
    fireEvent.click(tombolSimpanKosong);
    fireEvent.change(screen.getByLabelText('Contoh baru'), { target: { value: 'contoh tambahan' } });
    screen.getAllByRole('button', { name: 'Simpan' }).forEach((btn) => fireEvent.click(btn));
    expect(mutateSimpanContoh).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText('sunting')[1]);
    const formEditContoh = screen.getByLabelText('Contoh').closest('div').parentElement;
    fireEvent.click(within(formEditContoh).getByRole('button', { name: 'Batal' }));

    fireEvent.click(screen.getAllByText('sunting')[1]);
    const formEditContohLagi = screen.getByLabelText('Contoh').closest('div').parentElement;
    fireEvent.change(within(formEditContohLagi).getByLabelText('Ragam'), { target: { value: 'ragam edit' } });
    fireEvent.click(within(formEditContohLagi).getByRole('button', { name: 'Simpan' }));
    fireEvent.click(semuaSunting[1]);
    screen.getAllByRole('button', { name: 'Simpan' }).forEach((btn) => fireEvent.click(btn));

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getAllByText('hapus')[1]);
    expect(mutateHapusContoh).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getAllByText('hapus')[1]);
    expect(mutateHapusContoh).toHaveBeenCalled();

    const semuaHapus = screen.getAllByText('hapus');
    global.confirm = vi.fn(() => false);
    fireEvent.click(semuaHapus[0]);
    global.confirm = vi.fn(() => true);
    fireEvent.click(semuaHapus[0]);
    expect(mutateHapusMakna).toHaveBeenCalled();

    fireEvent.click(screen.getByText('+ Tambah makna'));
    const inputKelasTambah = screen.getAllByLabelText('Kelas kata').at(-1);
    fireEvent.change(inputKelasTambah, { target: { value: 'v' } });
    fireEvent.click(screen.getAllByText('Batal').find((btn) => btn.className.includes('text-xs')));
    fireEvent.click(screen.getByText('+ Tambah makna'));
    const tombolSimpanTambahKosong = screen.getAllByRole('button', { name: 'Simpan' }).find((btn) => btn.className.includes('text-xs'));
    tombolSimpanTambahKosong.removeAttribute('disabled');
    fireEvent.click(tombolSimpanTambahKosong);
    const inputMaknaBaru = screen.getAllByLabelText('Makna')[0];
    fireEvent.change(inputMaknaBaru, { target: { value: 'makna tambahan' } });
    screen.getAllByRole('button', { name: 'Simpan' }).forEach((btn) => fireEvent.click(btn));
    expect(mutateSimpanMakna).toHaveBeenCalled();

    fireEvent.click(screen.getByText('+ Tambah makna'));
    fireEvent.change(screen.getAllByLabelText('Makna')[0], { target: { value: 'makna null kelas' } });
    const kelasBaruInput = screen.getAllByLabelText('Kelas kata').at(-1);
    fireEvent.change(kelasBaruInput, { target: { value: '' } });
    const tombolSimpanNullKelas = screen.getAllByRole('button', { name: 'Simpan' }).find((btn) => btn.className.includes('text-xs'));
    fireEvent.click(tombolSimpanNullKelas);
    expect(mutateSimpanMakna).toHaveBeenLastCalledWith(
      expect.objectContaining({ kelas_kata: null }),
      expect.any(Object)
    );
  });

  it('menangani state makna kosong dan fallback error simpan/hapus lema', () => {
    mockUseDaftarMakna.mockReturnValueOnce({ isLoading: false, data: { data: [] } });
    mutateSimpanKamus.mockImplementation((_data, opts) => opts.onError?.({}));
    mutateHapusKamus.mockImplementation((_id, opts) => opts.onError?.({ response: { data: { error: 'Err hapus lema' } } }));

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    expect(screen.getByText('Belum ada makna.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Gagal menyimpan')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Err hapus lema')).toBeInTheDocument();
  });

  it('menangani fallback error hapus lema default', () => {
    mutateHapusKamus.mockImplementation((_id, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Gagal menghapus')).toBeInTheDocument();
  });

  it('menangani response kosong pada daftar utama', () => {
    mockUseDaftarKamusAdmin.mockReturnValueOnce({ isLoading: false, isError: false, data: undefined });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('menggunakan fallback kategori default saat respons kategori label tidak ada', () => {
    mockUseKategoriLabelRedaksi.mockReturnValueOnce({ data: undefined });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByRole('option', { name: 'Dasar' })).toBeInTheDocument();
  });

  it('memakai opsi fallback saat kategori label redaksi kosong/tidak lengkap', () => {
    mockUseKategoriLabelRedaksi.mockReturnValueOnce({
      data: {
        data: {
          'bentuk-kata': [],
          'jenis-rujuk': [{}],
          penyingkatan: [{}],
        },
      },
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));

    expect(screen.getByRole('option', { name: 'Dasar' })).toBeInTheDocument();
    const jenisRujukSelect = screen.getByLabelText('Jenis Rujuk');
    expect(jenisRujukSelect).toBeInTheDocument();
    expect(Array.from(jenisRujukSelect.querySelectorAll('option')).some((opt) => opt.value === '')).toBe(true);
  });

  it('menangani loading makna serta cabang validasi internal', () => {
    mockUseDaftarMakna.mockReturnValueOnce({ isLoading: true, data: undefined });
    mutateSimpanKamus.mockImplementation((_data, opts) => opts.onError?.({ response: { data: { message: 'Pesan gagal' } } }));

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'baru pesan' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Pesan gagal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('anak'));
    expect(screen.getByText('Memuat makna …')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Tambah makna'));
    const tombolSimpanKecil = screen.getAllByRole('button', { name: 'Simpan' }).find((btn) => btn.className.includes('text-xs'));
    fireEvent.click(tombolSimpanKecil);

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
  });

  it('menjalankan onSuccess simpan mode sunting dan onSuccess hapus lema', () => {
    vi.useFakeTimers();
    mutateSimpanKamus.mockImplementation((_data, opts) => opts.onSuccess?.({}));
    mutateHapusKamus.mockImplementation((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    fireEvent.click(screen.getByText('Simpan'));
    act(() => {
      vi.advanceTimersByTime(700);
    });

    fireEvent.click(screen.getByText('anak'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapusKamus).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('mengeksekusi early-return handler lokal makna/contoh secara eksplisit', () => {
    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('anak'));
    fireEvent.click(screen.getByText('keturunan manusia'));
    fireEvent.click(screen.getAllByText('sunting')[0]);

    fireEvent.change(screen.getByLabelText(/^Makna$/), { target: { value: '' } });
    const batalKecilMakna = screen.getAllByText('Batal').find((btn) => btn.className.includes('text-xs'));
    invokeReactClick(batalKecilMakna.previousSibling);
    expect(mutateSimpanMakna).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('+ Tambah makna'));
    const formTambahMakna = screen.getAllByLabelText('Kelas kata')[1].closest('div').parentElement;
    const simpanTambahMakna = within(formTambahMakna).getByRole('button', { name: 'Simpan' });
    invokeReactClick(simpanTambahMakna);
    expect(mutateSimpanMakna).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByText('+ contoh')[0]);
    const formContohBaru = screen.getByLabelText('Contoh baru').closest('div').parentElement;
    const simpanContohBaru = within(formContohBaru).getByRole('button', { name: 'Simpan' });
    invokeReactClick(simpanContohBaru);
    expect(mutateSimpanContoh).not.toHaveBeenCalled();
  });
});