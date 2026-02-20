import { fireEvent, render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KamusAdmin from '../../../src/halaman/redaksi/KamusAdmin';

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

const mockUseDaftarKamusAdmin = vi.fn();
const mockUseDetailKamusAdmin = vi.fn();
const mockUseDaftarMakna = vi.fn();
const mockUseKategoriLabelRedaksi = vi.fn();
const mockUseAutocompleteIndukKamus = vi.fn();

const mutateSimpanKamus = vi.fn();
const mutateHapusKamus = vi.fn();
const mutateSimpanMakna = vi.fn();
const mutateHapusMakna = vi.fn();
const mutateSimpanContoh = vi.fn();
const mutateHapusContoh = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarKamusAdmin: (...args) => mockUseDaftarKamusAdmin(...args),
  useDetailKamusAdmin: (...args) => mockUseDetailKamusAdmin(...args),
  useSimpanKamus: () => ({ mutate: mutateSimpanKamus, isPending: false }),
  useHapusKamus: () => ({ mutate: mutateHapusKamus, isPending: false }),
  useDaftarMakna: (...args) => mockUseDaftarMakna(...args),
  useKategoriLabelRedaksi: (...args) => mockUseKategoriLabelRedaksi(...args),
  useAutocompleteIndukKamus: (...args) => mockUseAutocompleteIndukKamus(...args),
  useSimpanMakna: () => ({ mutate: mutateSimpanMakna, isPending: false }),
  useHapusMakna: () => ({ mutate: mutateHapusMakna, isPending: false }),
  useSimpanContoh: () => ({ mutate: mutateSimpanContoh, isPending: false }),
  useHapusContoh: () => ({ mutate: mutateHapusContoh, isPending: false }),
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
    mockParams = {};
    mockNavigate.mockImplementation((path) => {
      const match = String(path || '').match(/^\/redaksi\/kamus\/(\d+)$/);
      if (match) {
        mockParams = { id: match[1] };
      }
    });
    global.confirm = vi.fn(() => true);
    mockUseAuth.mockReturnValue({
      punyaIzin: () => true,
    });

    mockUseDaftarKamusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, entri: 'anak', jenis: 'dasar', lafal: 'a·nak', aktif: 1, jenis_rujuk: 'lihat', entri_rujuk: 'ananda' }],
      },
    });

    mockUseDetailKamusAdmin.mockImplementation((id) => {
      if (!id) {
        return {
          isLoading: false,
          isError: false,
          data: null,
        };
      }
      return {
        isLoading: false,
        isError: false,
        data: {
          data: {
            id: 1,
            entri: 'anak',
            indeks: 'anak',
            jenis: 'dasar',
            lafal: 'a·nak',
            jenis_rujuk: 'lihat',
            entri_rujuk: 'ananda',
            aktif: 1,
          },
        },
      };
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

    mockUseAutocompleteIndukKamus.mockReturnValue({
      data: { data: [] },
      isLoading: false,
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

    fireEvent.click(screen.getByTitle('Buka detail kamus'));

    fireEvent.click(screen.getByText('dasar'));
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

    fireEvent.click(screen.getByText('dasar'));
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
  }, 20000);

  it('menangani state makna kosong dan fallback error simpan/hapus lema', () => {
    mockUseDaftarMakna.mockReturnValue({ isLoading: false, data: { data: [] } });
    mutateSimpanKamus.mockImplementation((_data, opts) => opts.onError?.({}));
    mutateHapusKamus.mockImplementation((_id, opts) => opts.onError?.({ response: { data: { error: 'Err hapus lema' } } }));

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('dasar'));
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

    fireEvent.click(screen.getByText('dasar'));
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
    expect(screen.getAllByRole('option', { name: 'Dasar' }).length).toBeGreaterThan(0);
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

    fireEvent.click(screen.getByText('dasar'));

    expect(screen.getAllByRole('option', { name: 'Dasar' }).length).toBeGreaterThan(0);
    const jenisRujukSelect = screen.getAllByLabelText('Jenis Rujuk')[0];
    expect(jenisRujukSelect).toBeInTheDocument();
    expect(Array.from(jenisRujukSelect.querySelectorAll('option')).some((opt) => opt.value === '')).toBe(true);
  });

  it('mengubah semua filter lanjutan tetap aman', () => {
    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    const labels = [
      'Filter ilmiah',
      'Filter kimia',
      'Filter penyingkatan',
      'Filter contoh',
      'Filter kelas kata',
      'Filter ragam',
      'Filter bidang',
      'Filter bahasa',
    ];

    labels.forEach((label) => {
      fireEvent.change(screen.getByLabelText(label), { target: { value: '' } });
    });

    expect(screen.getByRole('heading', { name: 'Kamus' })).toBeInTheDocument();
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

    fireEvent.click(screen.getByText('dasar'));
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

    fireEvent.click(screen.getByText('dasar'));
    fireEvent.click(screen.getByText('Simpan'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapusKamus).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    vi.useRealTimers();
  });

  it('mengeksekusi early-return handler lokal makna/contoh secara eksplisit', () => {
    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('dasar'));
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

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kamus', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailKamusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          entri: 'detail-anak',
          jenis: 'dasar',
          lafal: 'de·tail',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('detail-anak')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kamus', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '2' };
    mockUseDetailKamusAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kamus', { replace: true });
  });

  it('mengarahkan ke daftar saat route detail dibuka tapi tidak punya izin edit', () => {
    mockParams = { id: '2' };
    mockUseAuth.mockReturnValue({
      punyaIzin: (izin) => izin === 'tambah_entri',
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kamus', { replace: true });
  });

  it('memuat input induk dari detail route jika induk_entri tersedia', () => {
    mockParams = { id: '1' };
    mockUseDetailKamusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          entri: 'berakar',
          jenis: 'turunan',
          induk: 10,
          induk_entri: 'akar',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('akar')).toBeInTheDocument();
  });

  it('menampilkan loading dan empty state pada saran induk', () => {
    mockUseAutocompleteIndukKamus.mockImplementation(({ q }) => {
      if (q === 'akar') return { data: { data: [] }, isLoading: true };
      if (q === 'akar2') return { data: { data: [] }, isLoading: false };
      return { data: { data: [] }, isLoading: false };
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    const inputInduk = screen.getByLabelText('Induk');

    fireEvent.focus(inputInduk);
    fireEvent.change(inputInduk, { target: { value: 'akar' } });
    expect(screen.getByText('Mencari entri…')).toBeInTheDocument();

    fireEvent.change(inputInduk, { target: { value: 'akar2' } });
    expect(screen.getByText('Tidak ada hasil.')).toBeInTheDocument();
  });

  it('memilih saran induk lalu mengubah/ mengosongkan input menghapus referensi induk', () => {
    mockUseAutocompleteIndukKamus.mockImplementation(({ q }) => {
      if (q === 'akar') {
        return {
          data: {
            data: [{ id: 10, entri: 'akar', jenis: 'dasar', indeks: 'akar' }],
          },
          isLoading: false,
        };
      }
      return { data: { data: [] }, isLoading: false };
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    const inputInduk = screen.getByLabelText('Induk');
    fireEvent.focus(inputInduk);
    fireEvent.change(inputInduk, { target: { value: 'akar' } });

    fireEvent.mouseDown(screen.getByText('akar'));
    fireEvent.click(screen.getByText('akar'));
    expect(screen.getByDisplayValue('akar')).toBeInTheDocument();

    fireEvent.change(inputInduk, { target: { value: 'akar' } });
    fireEvent.blur(inputInduk);

    fireEvent.change(inputInduk, { target: { value: 'akar-baru' } });
    fireEvent.change(inputInduk, { target: { value: '' } });

    fireEvent.change(screen.getByLabelText('Entri*'), { target: { value: 'turunan baru' } });
    fireEvent.click(screen.getByText('Simpan'));

    const payload = mutateSimpanKamus.mock.calls.at(-1)[0];
    expect(payload.induk).toBeNull();
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailKamusAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText('Entri*')).not.toBeInTheDocument();
  });

  it('tidak membuka panel saat item tidak punya id', () => {
    mockUseDaftarKamusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, entri: 'tanpa-id', jenis: 'dasar', lafal: 'x', aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('dasar'));
    expect(screen.queryByDisplayValue('tanpa-id')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/kamus/null');
  });

  it('menampilkan fallback jumlah makna dan menyembunyikan aksi tambah saat tanpa izin', () => {
    mockUseDaftarKamusAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          { id: 7, entri: 'uji', jumlah_makna: 0, aktif: 1 },
          { id: 8, entri: 'uji2', jumlah_makna: 2, aktif: 1 },
        ],
      },
    });
    mockUseAuth.mockReturnValue({
      punyaIzin: (izin) => izin === 'edit_entri',
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('+ Tambah')).not.toBeInTheDocument();
  });

  it('memakai fallback daftar saran induk kosong saat respons belum ada', () => {
    mockUseAutocompleteIndukKamus.mockReturnValue({ data: undefined, isLoading: false });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.focus(screen.getByLabelText('Induk'));
    fireEvent.change(screen.getByLabelText('Induk'), { target: { value: 'akar' } });
    expect(screen.getByText('Tidak ada hasil.')).toBeInTheDocument();
  });

  it('klik tambah saat mode detail route menavigasi kembali ke daftar', () => {
    mockParams = { id: '1' };

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kamus', { replace: true });
  });

  it('tetap menavigasi saat panel sudah terbuka ketika klik baris lagi', () => {
    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('dasar'));
    expect(screen.getAllByDisplayValue('anak').length).toBeGreaterThan(0);

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('dasar'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kamus/1');
  });

  it('opsi filter jenis menghapus nilai kosong', () => {
    mockUseKategoriLabelRedaksi.mockReturnValueOnce({
      data: {
        data: {
          'bentuk-kata': [{ kode: '', nama: '' }, { kode: 'dasar', nama: 'Dasar' }],
          'jenis-rujuk': [{ kode: '', nama: '' }, { kode: 'lihat', nama: 'lihat' }],
          penyingkatan: [{ kode: 'singkatan', nama: 'Singkatan' }],
        },
      },
    });

    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    const filterJenis = screen.getByLabelText('Filter jenis');

    expect(Array.from(filterJenis.querySelectorAll('option')).filter((opt) => opt.value === '').length).toBe(1);
    expect(screen.queryByLabelText('Filter jenis rujuk')).not.toBeInTheDocument();
  });

  it('menjalankan handler cari dan menerapkan semua filter', () => {
    render(
      <MemoryRouter>
        <KamusAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Filter jenis'), { target: { value: 'dasar' } });
    fireEvent.change(screen.getByLabelText('Filter homograf'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Filter homonim'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Filter status entri'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const argsTerakhir = mockUseDaftarKamusAdmin.mock.calls.at(-1)?.[0] || {};
    expect(argsTerakhir.jenis).toBe('dasar');
    expect(argsTerakhir.jenisRujuk || '').toBe('');
    expect(argsTerakhir.punyaHomograf).toBe('1');
    expect(argsTerakhir.punyaHomonim).toBe('0');
    expect(argsTerakhir.aktif).toBe('1');
  });
});