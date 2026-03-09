import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EtimologiAdmin from '../../../src/halaman/redaksi/EtimologiAdmin';

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

const mockUseDaftar = vi.fn();
const mockUseDetail = vi.fn();
const mockUseOpsiBahasaEtimologiAdmin = vi.fn();
const mockUseAutocomplete = vi.fn();
const mockUseOpsiSumberAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarEtimologiAdmin: (...args) => mockUseDaftar(...args),
  useDetailEtimologiAdmin: (...args) => mockUseDetail(...args),
  useOpsiBahasaEtimologiAdmin: (...args) => mockUseOpsiBahasaEtimologiAdmin(...args),
  useAutocompleteEntriEtimologi: (...args) => mockUseAutocomplete(...args),
  useSimpanEtimologi: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusEtimologi: () => ({ mutate: mutateHapus, isPending: false }),
  useOpsiSumberAdmin: (...args) => mockUseOpsiSumberAdmin(...args),
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

vi.mock('../../../src/komponen/redaksi/PanelGeser', () => ({
  default: ({ buka, onTutup, judul, children }) => (
    <div data-testid="panel-geser" data-buka={String(Boolean(buka))}>
      <h2>{judul}</h2>
      <button type="button" aria-label="Tutup panel" onClick={onTutup}>✕</button>
      {children}
    </div>
  ),
}));

vi.mock('../../../src/komponen/redaksi/FormulirAdmin', () => ({
  useFormPanel: (nilaiAwal = {}) => {
    const [buka, setBuka] = useState(false);
    const [data, setData] = useState(nilaiAwal);
    const [modeTambah, setModeTambah] = useState(true);

    return {
      buka,
      data,
      modeTambah,
      bukaUntukTambah: () => {
        setData({ ...nilaiAwal });
        setModeTambah(true);
        setBuka(true);
      },
      bukaUntukSunting: (item) => {
        setData({ ...item });
        setModeTambah(false);
        setBuka(true);
      },
      tutup: () => setBuka(false),
      ubahField: (field, value) => setData((prev) => ({ ...prev, [field]: value })),
      setData,
    };
  },
  InputField: ({ label, name, value, onChange, type = 'text' }) => (
    <div>
      <label htmlFor={`field-${name}`}>{label}</label>
      <input id={`field-${name}`} type={type} value={value ?? ''} onChange={(e) => onChange(name, e.target.value)} />
    </div>
  ),
  SearchableSelectField: ({ label, name, value, onChange, options = [] }) => (
    <div>
      <label htmlFor={`field-${name}`}>{label}</label>
      <select id={`field-${name}`} aria-label={label} value={value ?? ''} onChange={(e) => onChange(name, e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  ),
  TextareaField: ({ label, name, value, onChange }) => (
    <div>
      <label htmlFor={`field-${name}`}>{label}</label>
      <textarea id={`field-${name}`} value={value ?? ''} onChange={(e) => onChange(name, e.target.value)} />
    </div>
  ),
  ToggleAktif: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange('aktif', value ? 0 : 1)}>toggle</button>
  ),
  ToggleMeragukan: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange('meragukan', value ? 0 : 1)}>toggle meragukan</button>
  ),
  FormFooter: ({ onSimpan, onBatal, onHapus }) => (
    <div>
      <button type="button" onClick={onSimpan}>Simpan</button>
      <button type="button" onClick={onBatal}>Batal</button>
      {onHapus ? <button type="button" onClick={onHapus}>Hapus</button> : null}
    </div>
  ),
  PesanForm: ({ error, sukses }) => (
    <>
      {error ? <div>{error}</div> : null}
      {sukses ? <div>{sukses}</div> : null}
    </>
  ),
}));

describe('EtimologiAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    global.confirm = vi.fn(() => true);
    mockUseAuth.mockReturnValue({
      punyaIzin: () => true,
    });
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 3,
        data: [
          { id: 1, indeks: 'asal', homonim: 1, lafal: 'a.sal', bahasa: 'id', entri_teks: 'asal', entri_indeks: 'asal', aktif: true, sumber_isi: 'isi panjang' },
          { id: 3, indeks: 'akar', homonim: 2, lafal: 'a.kar', bahasa: 'id', entri_teks: 'akar', entri_indeks: '', aktif: true, sumber_isi: 'isi' },
          { id: 2, indeks: 'serapan', homonim: null, lafal: '', bahasa: '', entri_teks: '', entri_indeks: '', aktif: false, sumber_isi: '' },
        ],
      },
    });
    mockUseDetail.mockReturnValue({ isLoading: false, isError: false, data: null });
    mockUseAutocomplete.mockReturnValue({ isLoading: false, data: { data: [] } });
    mockUseOpsiBahasaEtimologiAdmin.mockReturnValue({
      data: { data: [{ id: 10, kode: 'Ing', nama: 'Inggris' }, { id: 11, kode: 'Ar', nama: 'Arab' }] },
      isLoading: false,
      isError: false,
    });
    mockUseOpsiSumberAdmin.mockReturnValue({ data: { data: [{ id: 1, nama: 'LWIM' }] } });
  });

  it('menampilkan daftar, dapat cari, klik baris, dan validasi simpan', async () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Etimologi')).toBeInTheDocument();
    expect(screen.getAllByText('asal').length).toBeGreaterThan(0);
    expect(screen.getAllByText('akar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Cari etimologi …'), { target: { value: 'asal' } });
    fireEvent.click(screen.getByText('Cari'));
    fireEvent.click(screen.getAllByText('asal')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/etimologi/1');

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Indeks wajib diisi')).toBeInTheDocument();

    fireEvent.change(document.getElementById('field-indeks'), { target: { value: 'asal-usul' } });
    fireEvent.change(document.getElementById('field-bahasa_id'), { target: { value: '10' } });
    fireEvent.change(document.getElementById('field-sumber_id'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpan).toHaveBeenCalledWith(expect.objectContaining({ bahasa_id: 10 }), expect.any(Object));
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/etimologi', { replace: true });
  });

  it('membuka mode detail, menangani autocomplete, serta sukses simpan menutup panel', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'asal',
          sumber_id: 1,
          homonim: null,
          sumber: 'LWIM',
          entri_id: 22,
          entri_teks: 'asal',
          aktif: true,
        },
      },
    });
    mockUseAutocomplete.mockReturnValue({
      isLoading: false,
      data: { data: [{ id: 22, entri: 'asal', indeks: 'asal', homonim: 1 }] },
    });

    const timeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      fn();
      return 0;
    });
    mutateSimpan.mockImplementation((_data, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByDisplayValue('asal').length).toBeGreaterThan(0);
  expect(document.getElementById('field-homonim').value).toBe('');

    const inputEntri = document.getElementById('field-entri-autocomplete');
    fireEvent.focus(inputEntri);
    fireEvent.mouseDown(screen.getByRole('button', { name: /homonim: 1/i }));
    fireEvent.click(screen.getByText('homonim: 1'));

    fireEvent.change(inputEntri, { target: { value: 'berbeda' } });
    fireEvent.blur(inputEntri);
    fireEvent.change(document.getElementById('field-sumber_id'), { target: { value: '1' } });

    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpan).toHaveBeenCalledWith(
      expect.objectContaining({
        indeks: 'asal',
        entri_id: '',
        entri_teks: '',
      }),
      expect.any(Object)
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/etimologi', { replace: true });
    timeoutSpy.mockRestore();
  });

  it('menangani loading/empty/list pada saran entri', () => {
    mockUseAutocomplete.mockReturnValue({ isLoading: true, data: { data: [] } });

    const { rerender } = render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.focus(screen.getByLabelText('Entri'));
    expect(screen.getByText('Mencari entri …')).toBeInTheDocument();

    mockUseAutocomplete.mockReturnValue({ isLoading: false, data: { data: [] } });
    rerender(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.focus(screen.getByLabelText('Entri'));
    expect(screen.getByText('Tidak ada entri cocok')).toBeInTheDocument();

    mockUseAutocomplete.mockReturnValue({
      isLoading: false,
      data: { data: [{ id: 99, entri: 'uji', indeks: 'uji', homonim: null }] },
    });
    rerender(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.focus(screen.getByLabelText('Entri'));
    expect(screen.getByText('homonim: —')).toBeInTheDocument();
  });

  it('tetap aman saat daftar sumber admin kosong', () => {
    mockUseOpsiSumberAdmin.mockReturnValue({ data: undefined });

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByLabelText('Sumber')).toBeInTheDocument();
  });

  it('menangani detail error dengan redirect ke daftar', () => {
    mockParams = { id: '2' };
    mockUseDetail.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/etimologi', { replace: true });
  });

  it('menangani alur hapus batal/sukses/error', async () => {
    mockParams = { id: '1' };
    mockUseDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indeks: 'asal',
          sumber: 'LWIM',
          entri_id: 22,
          entri_teks: 'asal',
          aktif: true,
        },
      },
    });

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Hapus')).toBeInTheDocument();

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    mutateHapus.mockImplementationOnce((_id, opts) => opts.onSuccess?.());
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalled();

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(document.getElementById('field-indeks'), { target: { value: 'uji' } });

    mutateHapus.mockImplementationOnce((_id, opts) => opts.onError?.({}));
    fireEvent.click(screen.getByText('Simpan'));
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Gagal menghapus etimologi')).toBeInTheDocument();
  });

  it('route detail tanpa izin kelola diarahkan ke daftar dan tombol tambah tidak tampil', () => {
    mockParams = { id: '5' };
    mockUseAuth.mockReturnValue({
      punyaIzin: () => false,
    });

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/etimologi', { replace: true });
    expect(screen.queryByText('+ Tambah')).not.toBeInTheDocument();
  });

  it('aman saat respons daftar/saran undefined dan detail tanpa id', () => {
    mockParams = { id: '3' };
    mockUseDaftar.mockReturnValue({ isLoading: false, isError: false, data: undefined });
    mockUseAutocomplete.mockReturnValue({ isLoading: false, data: undefined });
    mockUseDetail.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Etimologi')).toBeInTheDocument();
  });

  it('klik baris tanpa id tidak menavigasi dan input entri kosong membersihkan tautan', () => {
    mockUseDaftar.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, indeks: 'tanpa-id', homonim: null, lafal: '', bahasa: '', entri_teks: '', entri_indeks: '', aktif: false, sumber_isi: '' }],
      },
    });

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/etimologi/null');

    fireEvent.click(screen.getByText('+ Tambah'));
    const inputEntri = document.getElementById('field-entri-autocomplete');
    fireEvent.change(inputEntri, { target: { value: '   ' } });
    fireEvent.change(document.getElementById('field-indeks'), { target: { value: 'uji' } });
    fireEvent.change(document.getElementById('field-sumber_id'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpan).toHaveBeenCalledWith(
      expect.objectContaining({ entri_id: '', entri_teks: '' }),
      expect.any(Object)
    );
  });

  it('menampilkan fallback error saat simpan gagal', () => {
    mutateSimpan.mockImplementationOnce((_data, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(document.getElementById('field-indeks'), { target: { value: 'uji' } });
    fireEvent.change(document.getElementById('field-sumber_id'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText('Gagal menyimpan etimologi')).toBeInTheDocument();
  });

  it('menerapkan filter bahasa saat tombol Cari ditekan', () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    mockUseDaftar.mockClear();

    fireEvent.change(screen.getByLabelText('Filter bahasa'), { target: { value: '10' } });
    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ bahasa: '', bahasaId: '' }));

    fireEvent.click(screen.getByText('Cari'));

    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ bahasa: '', bahasaId: '10' }));
  });

  it('menerapkan filter bahasa kosong saat pilih opsi —Kosong— dan Cari', () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    mockUseDaftar.mockClear();
    fireEvent.change(screen.getByLabelText('Filter bahasa'), { target: { value: '__KOSONG__' } });
    fireEvent.click(screen.getByText('Cari'));

    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ bahasa: '__KOSONG__', bahasaId: '' }));
  });

  it('menerapkan filter sumber saat tombol Cari ditekan', () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    mockUseDaftar.mockClear();
    fireEvent.change(screen.getByLabelText('Filter sumber etimologi'), { target: { value: '1' } });
    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ sumberId: '' }));

    fireEvent.click(screen.getByText('Cari'));
    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ sumberId: '1' }));
  });

  it('menerapkan filter status saat tombol Cari ditekan', () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    mockUseDaftar.mockClear();
    fireEvent.change(screen.getByLabelText('Filter status etimologi'), { target: { value: '1' } });
    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ aktif: '' }));

    fireEvent.click(screen.getByText('Cari'));
    expect(mockUseDaftar).toHaveBeenLastCalledWith(expect.objectContaining({ aktif: '1' }));
  });

  it('klik tautan entri tidak memicu bukaSuntingDariDaftar', () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: 'asal' }));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/etimologi/1');
  });

  it('mereset semua filter etimologi saat tombol ✕ ditekan', () => {
    render(
      <MemoryRouter>
        <EtimologiAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari etimologi …'), { target: { value: 'asal' } });
    fireEvent.change(screen.getByLabelText('Filter bahasa'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Filter sumber etimologi'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Filter status etimologi'), { target: { value: '1' } });

    mockUseDaftar.mockClear();
    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);

    const argTerakhir = mockUseDaftar.mock.calls.at(-1)?.[0] || {};
    expect(argTerakhir.q).toBe('');
    expect(argTerakhir.bahasa).toBe('');
    expect(argTerakhir.bahasaId).toBe('');
    expect(argTerakhir.sumberId).toBe('');
    expect(argTerakhir.aktif).toBe('');
  });
});
