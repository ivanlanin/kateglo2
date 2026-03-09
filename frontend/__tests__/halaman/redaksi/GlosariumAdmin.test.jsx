import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GlosariumAdmin from '../../../src/halaman/redaksi/GlosariumAdmin';

const mockNavigate = vi.fn();
let mockParams = {};

function pilihOpsi(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

const mockUseDaftarGlosariumAdmin = vi.fn();
const mockUseDetailGlosariumAdmin = vi.fn();
const mockUseOpsiBidangAdmin = vi.fn();
const mockUseOpsiBahasaGlosariumAdmin = vi.fn();
const mockUseOpsiSumberAdmin = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarGlosariumAdmin: (...args) => mockUseDaftarGlosariumAdmin(...args),
  useDetailGlosariumAdmin: (...args) => mockUseDetailGlosariumAdmin(...args),
  useOpsiBidangAdmin: (...args) => mockUseOpsiBidangAdmin(...args),
  useOpsiBahasaGlosariumAdmin: (...args) => mockUseOpsiBahasaGlosariumAdmin(...args),
  useOpsiSumberAdmin: (...args) => mockUseOpsiSumberAdmin(...args),
  useSimpanGlosarium: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusGlosarium: () => ({ mutate: mutateHapus, isPending: false }),
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
  InputField: ({ label, name, value, onChange }) => (
    <div>
      <label htmlFor={`field-${name}`}>{label}</label>
      <input id={`field-${name}`} value={value ?? ''} onChange={(e) => onChange(name, e.target.value)} />
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
  ToggleAktif: ({ value, onChange }) => (
    <button type="button" onClick={() => onChange('aktif', value ? 0 : 1)}>toggle</button>
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

describe('GlosariumAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    mockNavigate.mockImplementation((path) => {
      const match = String(path || '').match(/^\/redaksi\/glosarium\/(\d+)$/);
      if (match) {
        mockParams = { id: match[1] };
      }
    });
    global.confirm = vi.fn(() => true);
    mockUseAuth.mockReturnValue({
      punyaIzin: () => true,
    });
    mockUseDaftarGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 1, indonesia: 'air', asing: 'water', bidang_id: 1, bidang: 'Kimia', bahasa_id: 10, bahasa: 'Inggris', sumber_id: 1, sumber: 'KBBI' }],
      },
    });
    mockUseOpsiBidangAdmin.mockReturnValue({
      data: {
        data: [{ id: 1, kode: 'kimia', nama: 'Kimia' }],
      },
      isLoading: false,
      isError: false,
    });
    mockUseOpsiBahasaGlosariumAdmin.mockReturnValue({
      data: {
        data: [{ id: 10, kode: 'Ing', nama: 'Inggris', iso2: 'en' }],
      },
      isLoading: false,
      isError: false,
    });
    mockUseOpsiSumberAdmin.mockReturnValue({
      data: {
        data: [{ id: 1, kode: 'kbbi', nama: 'KBBI' }],
      },
      isLoading: false,
      isError: false,
    });
    mockUseDetailGlosariumAdmin.mockImplementation((id) => {
      if (!id) return { isLoading: false, isError: false, data: null };
      return {
        isLoading: false,
        isError: false,
        data: {
          data: {
            id: 1,
            indonesia: 'air',
            asing: 'water',
            bidang_id: 1,
            bidang: 'Kimia',
            bahasa_id: 10,
            bahasa: 'Inggris',
            sumber_id: 1,
            sumber: 'KBBI',
            aktif: 1,
          },
        },
      };
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
    expect(screen.getByText('Istilah Asing dan Indonesia wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Indonesia/), { target: { value: 'api' } });
    fireEvent.change(screen.getByLabelText(/Asing/), { target: { value: 'fire' } });
    pilihOpsi('Bidang', '1');
    pilihOpsi('Sumber', '1');
    pilihOpsi('Bahasa', '10');
    fireEvent.click(screen.getByText('Simpan'));
    expect(mutateSimpan).toHaveBeenCalled();
  });

  it('memvalidasi bidang, bahasa, dan sumber wajib dipilih', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText(/Indonesia/), { target: { value: 'api' } });
    fireEvent.change(screen.getByLabelText(/Asing/), { target: { value: 'fire' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Bidang wajib dipilih')).toBeInTheDocument();

    pilihOpsi('Bidang', '1');
    pilihOpsi('Bahasa', '');
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Bahasa wajib dipilih')).toBeInTheDocument();

    pilihOpsi('Bahasa', '10');
    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Sumber wajib dipilih')).toBeInTheDocument();
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
    pilihOpsi('Bidang', '1');
    pilihOpsi('Sumber', '1');
    pilihOpsi('Bahasa', '10');
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
    pilihOpsi('Bidang', '1');
    pilihOpsi('Sumber', '1');
    pilihOpsi('Bahasa', '10');
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
    pilihOpsi('Bidang', '1');
    pilihOpsi('Sumber', '1');
    pilihOpsi('Bahasa', '10');
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

  it('menjalankan reset semua filter glosarium', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari istilah …'), { target: { value: 'air' } });
    pilihOpsi('Filter bidang glosarium', '1');
    pilihOpsi('Filter bahasa glosarium', '10');
    pilihOpsi('Filter sumber glosarium', '1');
    fireEvent.change(screen.getByLabelText('Filter status glosarium'), { target: { value: '1' } });
    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);

    const panggilanTerakhir = mockUseDaftarGlosariumAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.bidangId).toBe('');
    expect(panggilanTerakhir.bahasaId).toBe('');
    expect(panggilanTerakhir.sumberId).toBe('');
    expect(panggilanTerakhir.aktif).toBe('');
  });

  it('tetap aman saat opsi bidang/sumber dari API kosong', () => {
    mockUseOpsiBidangAdmin.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockUseOpsiBahasaGlosariumAdmin.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockUseOpsiSumberAdmin.mockReturnValue({ data: undefined, isLoading: false, isError: false });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByLabelText(/Bidang/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bahasa/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sumber/)).toBeInTheDocument();
  });

  it('mengarahkan ke daftar saat id route tidak valid', () => {
    mockParams = { id: 'abc' };

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('membuka panel dari detail route valid dan menutup ke daftar', () => {
    mockParams = { id: '1' };
    mockUseDetailGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          indonesia: 'detail air',
          asing: 'detail water',
          bidang_id: 1,
          bidang: 'Kimia',
          bahasa_id: 10,
          bahasa: 'Inggris',
          sumber_id: 1,
          sumber: 'KBBI',
          aktif: 1,
        },
      },
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('detail air')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('mengarahkan ke daftar saat detail route gagal dimuat', () => {
    mockParams = { id: '2' };
    mockUseDetailGlosariumAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('mengarahkan ke daftar saat route detail dibuka tapi tidak punya izin edit', () => {
    mockParams = { id: '5' };
    mockUseAuth.mockReturnValue({
      punyaIzin: (izin) => izin === 'tambah_glosarium',
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('mengabaikan detail route saat payload detail tidak memiliki id', () => {
    mockParams = { id: '3' };
    mockUseDetailGlosariumAdmin.mockReturnValue({ isLoading: false, isError: false, data: { data: {} } });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/Indonesia/)).not.toBeInTheDocument();
  });

  it('tidak membuka panel saat item tidak punya id', () => {
    mockUseDaftarGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: null, indonesia: 'tanpa-id', asing: 'no-id', bidang_id: 1, bidang: 'Uji', bahasa_id: 10, bahasa: 'Inggris', sumber_id: 1, sumber: 'X', aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('tanpa-id'));
    expect(screen.queryByDisplayValue('tanpa-id')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/glosarium/null');
  });

  it('menjalankan handler cari dan menerapkan filter aktif', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Filter bidang glosarium')).toHaveDisplayValue('—Bidang—');
    expect(screen.getByLabelText('Filter bahasa glosarium')).toHaveDisplayValue('—Bahasa—');
    expect(screen.getByLabelText('Filter sumber glosarium')).toHaveDisplayValue('—Sumber—');
    expect(screen.getByLabelText('Filter status glosarium')).toHaveDisplayValue('—Status—');

    fireEvent.change(screen.getByLabelText('Filter status glosarium'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Cari'));

    const argTerakhir = mockUseDaftarGlosariumAdmin.mock.calls.at(-1)?.[0] || {};
    expect(argTerakhir.aktif).toBe('1');
  });

  it('tetap menavigasi saat panel sudah terbuka ketika klik baris lagi', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('air'));
    expect(screen.getByDisplayValue('air')).toBeInTheDocument();

    mockNavigate.mockClear();
    fireEvent.click(screen.getByText('air'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium/1');
  });

  it('klik tambah saat mode detail route menavigasi kembali ke daftar', () => {
    mockParams = { id: '1' };

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/glosarium', { replace: true });
  });

  it('menyembunyikan aksi tambah dan hapus saat izin terkait tidak ada', () => {
    mockParams = { id: '1' };
    mockUseAuth.mockReturnValue({
      punyaIzin: (izin) => izin === 'edit_glosarium',
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByText('+ Tambah')).not.toBeInTheDocument();
    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();
  });

  it('klik tautan asing tidak memicu bukaSuntingDariDaftar', () => {
    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: 'water' }));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/glosarium/1');
  });

  it('menampilkan tanda pisah saat kolom asing kosong', () => {
    mockUseDaftarGlosariumAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 2, indonesia: 'api', asing: '', bidang_id: 1, bidang: 'Kimia', bahasa_id: 10, bahasa: 'Inggris', sumber_id: 1, sumber: 'KBBI', aktif: 1 }],
      },
    });

    render(
      <MemoryRouter>
        <GlosariumAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'api' })).not.toBeInTheDocument();
  });
});