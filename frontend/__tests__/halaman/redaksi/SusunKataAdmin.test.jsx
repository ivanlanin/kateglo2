import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SusunKataAdmin, {
  buildPanelDataFromDetail,
  buildSelectedFromItem,
  buildSuntingDataFromItem,
  sanitizeKataSusunInput,
  buildSimpanPayload,
  resolveTanggalBuatKataHarian,
  resolveTanggalSimpan,
} from '../../../src/halaman/redaksi/SusunKataAdmin';

const mutateSimpan = vi.fn();
const mutateBuat = vi.fn();
const mockUseHarian = vi.fn();
const mockUseDetail = vi.fn();
let buatPending = false;
let paksaPesanValidasi = null;

vi.mock('../../../src/api/apiAdmin', () => ({
  useSusunKataHarianAdmin: (...args) => mockUseHarian(...args),
  useDetailSusunKataHarianAdmin: (...args) => mockUseDetail(...args),
  useSimpanSusunKataHarianAdmin: () => ({ mutate: mutateSimpan, isPending: false }),
  useBuatSusunKataHarianAdmin: () => ({ mutate: mutateBuat, isPending: buatPending }),
}));

vi.mock('../../../src/utils/formatUtils', () => ({
  formatLocalDateTime: vi.fn(() => '2026-03-02 10:00'),
}));

vi.mock('../../../src/komponen/bersama/TataLetak', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <section>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </section>
  ),
}));

vi.mock('../../../src/komponen/redaksi/PanelGeser', () => ({
  default: ({ buka, onTutup, children, judul }) => (buka ? (
    <aside>
      <h2>{judul}</h2>
      <button type="button" aria-label="Tutup panel" onClick={onTutup}>Tutup</button>
      {children}
    </aside>
  ) : null),
}));

vi.mock('../../../src/komponen/redaksi/KomponenAdmin', () => ({
  BarisFilterCariAdmin: ({ nilai, onChange, onCari, onHapus, placeholder, filters = [] }) => (
    <div>
      <input aria-label="Filter tanggal" placeholder={placeholder} value={nilai} onChange={(e) => onChange(e.target.value)} />
      {filters.map((item) => (
        <select
          key={item.key}
          aria-label={item.ariaLabel}
          value={item.value}
          onChange={(e) => item.onChange(e.target.value)}
        >
          {item.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ))}
      <button type="button" onClick={onCari}>Cari</button>
      <button type="button" onClick={onHapus}>✕</button>
    </div>
  ),
  TabelAdmin: ({ data = [], onKlikBaris, kolom = [], onOffset }) => {
    const barisPertama = data[0] || {};
    kolom.forEach((item) => {
      if (typeof item.render === 'function') item.render(barisPertama);
    });
    if (typeof onOffset === 'function') onOffset(0);

    return (
      <div>
        <button type="button" onClick={() => onKlikBaris()}>Buka kosong</button>
        {data.map((item, idx) => (
          <button key={`${item.id}-${idx}`} type="button" onClick={() => onKlikBaris(item)}>
            {String(item.kata || `row-${idx}`)}
          </button>
        ))}
      </div>
    );
  },
  TombolAksiAdmin: ({ onClick, label }) => <button type="button" onClick={onClick}>{label}</button>,
  validateRequiredFields: (data, fields) => {
    if (paksaPesanValidasi !== null) return paksaPesanValidasi;
    const itemKosong = fields.find((field) => !String(data?.[field.name] || '').trim());
    return itemKosong ? `${itemKosong.label} wajib diisi` : '';
  },
  getApiErrorMessage: (error, fallback) => error?.message || fallback,
}));

vi.mock('../../../src/komponen/redaksi/FormulirAdmin', async () => {
  const React = await vi.importActual('react');
  const useFormPanel = (nilaiAwal) => {
    const [buka, setBuka] = React.useState(false);
    const [data, setData] = React.useState(nilaiAwal);

    return {
      buka,
      data,
      setData,
      ubahField: (name, value) => setData((prev) => ({ ...prev, [name]: value })),
      bukaUntukTambah: () => {
        setBuka(true);
        setData(nilaiAwal);
      },
      bukaUntukSunting: (payload) => {
        setBuka(true);
        setData(payload);
      },
      tutup: () => setBuka(false),
    };
  };

  const InputField = ({ label, name, value, onChange }) => (
    <label>
      {label}
      <input aria-label={label} name={name} value={value} onChange={(e) => onChange(name, e.target.value)} />
    </label>
  );

  const TextareaField = ({ label, name, value, onChange }) => (
    <label>
      {label}
      <textarea aria-label={label} name={name} value={value} onChange={(e) => onChange(name, e.target.value)} />
    </label>
  );

  const PesanForm = ({ error = '', sukses = '' }) => (
    <div>
      {error ? <p>{error}</p> : null}
      {sukses ? <p>{sukses}</p> : null}
    </div>
  );

  const FormFooter = ({ onSimpan, onBatal }) => (
    <div>
      <button type="button" onClick={onSimpan}>Simpan</button>
      <button type="button" onClick={onBatal}>Batal</button>
    </div>
  );

  return {
    useFormPanel,
    InputField,
    TextareaField,
    PesanForm,
    FormFooter,
  };
});

describe('SusunKataAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buatPending = false;
    paksaPesanValidasi = null;

    const detailDefaultResponse = {
      data: {
        data: {
          tanggal: '2026-03-02',
          panjang: 5,
          kata: 'kartu',
          keterangan: 'catatan',
          peserta: [{ pengguna_id: 7, nama: 'Ivan', skor: 9, detik: 30, percobaan: 2, created_at: '2026-03-02T10:00:00Z' }],
        },
      },
    };
    const detailKosongResponse = {
      data: {
        data: null,
      },
    };

    mockUseHarian.mockReturnValue({
      data: {
        data: [{ id: 1, tanggal: '2026-03-02', panjang: 5, kata: 'kartu', jumlahPeserta: 1 }],
      },
      isLoading: false,
      isError: false,
    });

    mockUseDetail.mockImplementation(({ tanggal, panjang } = {}) => {
      if (tanggal === '2026-03-02' && String(panjang) === '5') {
        return detailDefaultResponse;
      }

      return detailKosongResponse;
    });

    mutateSimpan.mockImplementation((_payload, opts) => opts?.onSuccess?.());
    mutateBuat.mockImplementation((_payload, opts) => opts?.onSuccess?.());
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <SusunKataAdmin />
      </MemoryRouter>
    );
  }

  it('menampilkan data, membuka panel dari baris, dan menampilkan daftar peserta', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'kartu' }));

    expect(await screen.findByRole('heading', { name: 'Sunting Susun Kata' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal')).toHaveValue('2026-03-02');
    expect(screen.getByLabelText('Panjang')).toHaveValue('5');
    expect(screen.getByLabelText('Kata')).toHaveValue('kartu');
    expect(screen.getByText('Daftar Peserta (1)')).toBeInTheDocument();
    expect(screen.getByText('Ivan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tutup panel' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Sunting Susun Kata' })).not.toBeInTheDocument());
  });

  it('validasi simpan menangani field wajib dan panjang kata', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Buka kosong' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(await screen.findByText('Kata wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kata'), { target: { value: 'abcd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(await screen.findByText('Kata harus 5 huruf')).toBeInTheDocument();
  });

  it('simpan sukses memperbarui filter dan pesan sukses, serta sanitasi kata non-huruf', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Buka kosong' }));
    fireEvent.change(screen.getByLabelText('Tanggal'), { target: { value: '2026-03-03' } });
    fireEvent.change(screen.getByLabelText('Panjang'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Kata'), { target: { value: 'K@R-TU1' } });
    fireEvent.change(screen.getByLabelText('Keterangan'), { target: { value: '  catatan baru  ' } });

    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(mutateSimpan).toHaveBeenCalledWith(
      {
        tanggal: '2026-03-03',
        panjang: 4,
        kata: 'krtu',
        keterangan: 'catatan baru',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(await screen.findByText('Kata harian berhasil disimpan.')).toBeInTheDocument();
  });

  it('simpan error menampilkan pesan gagal', async () => {
    mutateSimpan.mockImplementationOnce((_payload, opts) => opts?.onError?.({ message: 'Simpan gagal' }));

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Buka kosong' }));
    fireEvent.change(screen.getByLabelText('Kata'), { target: { value: 'kartu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Simpan gagal')).toBeInTheDocument();
  });

  it('cari dan reset filter memperbarui parameter query', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Filter tanggal'), { target: { value: '2026-03-10' } });
    fireEvent.change(screen.getByLabelText('Filter panjang kata harian'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(mockUseHarian).toHaveBeenLastCalledWith({ tanggal: '2026-03-10', panjang: '7' });

    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    expect(mockUseHarian).toHaveBeenLastCalledWith({ tanggal: '', panjang: '' });
  });

  it('buat kata harian menampilkan sukses lalu error', async () => {
    mutateBuat.mockImplementationOnce((_payload, opts) => opts?.onSuccess?.());
    mutateBuat.mockImplementationOnce((_payload, opts) => opts?.onError?.({ message: 'Buat gagal' }));

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Buat Kata Harian' }));
    expect(await screen.findByText('Kata harian berhasil dibuat.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Buat Kata Harian' }));
    expect(await screen.findByText('Buat gagal')).toBeInTheDocument();
  });

  it('menampilkan fallback peserta kosong saat detail tidak memiliki peserta', async () => {
    const detailTanpaPesertaResponse = {
      data: {
        data: {
          tanggal: '2026-03-02',
          panjang: 5,
          kata: 'kartu',
          peserta: null,
        },
      },
    };
    const detailKosongResponse = {
      data: {
        data: null,
      },
    };

    mockUseDetail.mockImplementation(({ tanggal, panjang } = {}) => {
      if (tanggal === '2026-03-02' && String(panjang) === '5') {
        return detailTanpaPesertaResponse;
      }

      return detailKosongResponse;
    });

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'kartu' }));

    expect(await screen.findByText('Daftar Peserta (0)')).toBeInTheDocument();
    expect(screen.getByText('Belum ada peserta untuk kata harian ini.')).toBeInTheDocument();
  });

  it('menangani data tabel/detail kosong dan fallback field saat panel sunting dibuka', async () => {
    mockUseHarian.mockReturnValue({
      data: {
        data: [{ id: 2, tanggal: '2026-03-11', panjang: 6 }],
      },
      isLoading: false,
      isError: false,
    });

    const detailFallbackResponse = {
      data: {
        data: {
          tanggal: '',
          panjang: '',
          kata: null,
          keterangan: null,
          peserta: [],
        },
      },
    };
    const detailKosongResponse = { data: { data: null } };

    mockUseDetail.mockImplementation(({ tanggal, panjang } = {}) => {
      if (tanggal === '2026-03-11' && String(panjang) === '6') {
        return detailFallbackResponse;
      }

      return detailKosongResponse;
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'row-0' }));

    expect(await screen.findByRole('heading', { name: 'Sunting Susun Kata' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tanggal')).toHaveValue('2026-03-11');
    expect(screen.getByLabelText('Panjang')).toHaveValue('6');
    expect(screen.getByLabelText('Kata')).toHaveValue('');
  });

  it('menggunakan fallback data tabel kosong saat respons harian bukan array', () => {
    mockUseHarian.mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(screen.getByRole('button', { name: 'Buka kosong' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'row-0' })).not.toBeInTheDocument();
  });

  it('reset lalu cari mengirim filter kosong, dan tombol aksi menampilkan status pending', () => {
    buatPending = true;
    renderPage();

    expect(screen.getByRole('button', { name: 'Membuat …' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    expect(mockUseHarian).toHaveBeenLastCalledWith({
      tanggal: '',
      panjang: '',
    });
  });

  it('menampilkan pesan sukses di luar panel saat buat kata harian berhasil', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Buat Kata Harian' }));

    expect(await screen.findByText('Kata harian berhasil dibuat.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sunting Susun Kata' })).not.toBeInTheDocument();
  });

  it('simpan memakai fallback tanggalQuery saat tanggal form kosong dan validasi dipaksa lolos', async () => {
    const sekarang = new Date();
    const tanggalHariIni = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}-${String(sekarang.getDate()).padStart(2, '0')}`;

    paksaPesanValidasi = '';
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Buka kosong' }));
    fireEvent.change(screen.getByLabelText('Tanggal'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Panjang'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Kata'), { target: { value: 'abcde' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(mutateSimpan).toHaveBeenCalledWith(
      {
        tanggal: '',
        panjang: 5,
        kata: 'abcde',
        keterangan: '',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );

    await screen.findByText('Kata harian berhasil disimpan.');
    expect(mockUseHarian).toHaveBeenLastCalledWith({
      tanggal: tanggalHariIni,
      panjang: 5,
    });
  });

  it('jalur tambah memakai fallback tanggalHariIni setelah reset, lalu buat harian memakai tanggal fallback yang sama', async () => {
    const sekarang = new Date();
    const hariIni = `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}-${String(sekarang.getDate()).padStart(2, '0')}`;

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buka kosong' }));

    expect(screen.getByLabelText('Tanggal')).toHaveValue(hariIni);

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buat Kata Harian' }));

    expect(mutateBuat).toHaveBeenCalledWith(
      {
        tanggal: hariIni,
        panjang: '',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    expect(await screen.findByText('Kata harian berhasil dibuat.')).toBeInTheDocument();
  });

  it('jalur sunting item menjalankan setSelected+bukaUntukSunting dan sanitasi input kata non-huruf', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'kartu' }));
    expect(await screen.findByRole('heading', { name: 'Sunting Susun Kata' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kata'), { target: { value: 'A!B@c#1' } });
    expect(screen.getByLabelText('Kata')).toHaveValue('abc');
  });

  it('helper buildPanelDataFromDetail dan buildSelectedFromItem mengembalikan fallback yang benar', () => {
    expect(
      buildPanelDataFromDetail(
        { tanggal: '', panjang: '', kata: null, keterangan: null },
        '2026-03-10',
        '7',
        '2026-03-11'
      )
    ).toEqual({
      tanggal: '2026-03-10',
      panjang: '7',
      kata: '',
      keterangan: '',
    });

    expect(buildSelectedFromItem({ tanggal: '2026-03-09', panjang: 6 })).toEqual({
      tanggal: '2026-03-09',
      panjang: '6',
    });
    expect(buildSelectedFromItem({})).toEqual({ tanggal: '', panjang: '' });

    expect(
      buildPanelDataFromDetail(
        { tanggal: '2026-03-01', panjang: 8, kata: 'uji', keterangan: 'cat' },
        '2026-03-10',
        '7',
        '2026-03-11'
      )
    ).toEqual({
      tanggal: '2026-03-01',
      panjang: '8',
      kata: 'uji',
      keterangan: 'cat',
    });

    expect(
      buildPanelDataFromDetail(
        { tanggal: '', panjang: '', kata: '', keterangan: '' },
        '',
        '',
        '2026-03-11'
      )
    ).toEqual({
      tanggal: '2026-03-11',
      panjang: '5',
      kata: '',
      keterangan: '',
    });

    expect(buildSuntingDataFromItem({ tanggal: '2026-03-09', panjang: 6, kata: null, keterangan: null })).toEqual({
      tanggal: '2026-03-09',
      panjang: '6',
      kata: '',
      keterangan: '',
    });
  });

  it('helper sanitize/build payload/resolve tanggal menghasilkan normalisasi yang benar', () => {
    expect(sanitizeKataSusunInput('A!B@c#1')).toBe('abc');
    expect(sanitizeKataSusunInput()).toBe('');

    expect(buildSimpanPayload({ tanggal: ' 2026-03-12 ', panjang: '', kata: '  Kartu ', keterangan: '  cat  ' })).toEqual({
      payload: {
        tanggal: '2026-03-12',
        panjang: 5,
        kata: 'kartu',
        keterangan: 'cat',
      },
      panjangAman: 5,
      kataAman: 'kartu',
    });

    expect(buildSimpanPayload()).toEqual({
      payload: {
        tanggal: '',
        panjang: 5,
        kata: '',
        keterangan: '',
      },
      panjangAman: 5,
      kataAman: '',
    });

    expect(resolveTanggalBuatKataHarian('2026-03-13', '2026-03-14')).toBe('2026-03-13');
    expect(resolveTanggalBuatKataHarian('', '2026-03-14')).toBe('2026-03-14');

    expect(resolveTanggalSimpan(' 2026-03-15 ', '2026-03-02')).toBe('2026-03-15');
    expect(resolveTanggalSimpan('  ', '2026-03-02')).toBe('2026-03-02');
    expect(resolveTanggalSimpan(undefined, '2026-03-02')).toBe('2026-03-02');
  });
});
