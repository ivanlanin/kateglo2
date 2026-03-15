import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KandidatKataAdmin, { __private } from '../../../../src/pages/redaksi/kadi/KandidatKataAdmin';

const mockNavigate = vi.fn();
const mockParams = { id: undefined };
const mockUseAuth = vi.fn();
const mockUseDaftarKandidatKataAdmin = vi.fn();
const mockUseDetailKandidatKataAdmin = vi.fn();
const mockUseStatistikKandidatKata = vi.fn();
const mockUseDaftarAtestasi = vi.fn();
const mockUseDaftarRiwayat = vi.fn();
const mockUseSimpanKandidatKata = vi.fn();
const mockUseUbahStatusKandidatKata = vi.fn();
const mockUseHapusKandidatKata = vi.fn();
const mockUseFormPanel = vi.fn();
const mockUsePencarianAdmin = vi.fn();
const mockTataLetak = vi.fn();
const mockGetApiErrorMessage = vi.fn(() => 'Galat');
const simpanMutateAsync = vi.fn();
const ubahStatusMutateAsync = vi.fn();
const hapusMutateAsync = vi.fn();
const bukaUntukSunting = vi.fn();
const tutupPanel = vi.fn();
const ubahField = vi.fn();
const setData = vi.fn();
const kirimCari = vi.fn();
const hapusCari = vi.fn();
const setOffset = vi.fn();

let panelState;

vi.mock('../../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

vi.mock('../../../../src/api/apiKadi', () => ({
  useDaftarKandidatKataAdmin: (...args) => mockUseDaftarKandidatKataAdmin(...args),
  useDetailKandidatKataAdmin: (...args) => mockUseDetailKandidatKataAdmin(...args),
  useSimpanKandidatKata: (...args) => mockUseSimpanKandidatKata(...args),
  useUbahStatusKandidatKata: (...args) => mockUseUbahStatusKandidatKata(...args),
  useHapusKandidatKata: (...args) => mockUseHapusKandidatKata(...args),
  useStatistikKandidatKata: (...args) => mockUseStatistikKandidatKata(...args),
  useDaftarAtestasi: (...args) => mockUseDaftarAtestasi(...args),
  useDaftarRiwayat: (...args) => mockUseDaftarRiwayat(...args),
}));

vi.mock('../../../../src/components/redaksi/HalamanAdmin', () => ({
  default: (props) => {
    mockTataLetak(props);
    return (
      <div data-testid="tata-letak-admin">
        <div data-testid="tata-letak-mode">admin</div>
        <div data-testid="tata-letak-judul">{props.judul}</div>
        {props.children}
      </div>
    );
  },
}));

vi.mock('../../../../src/components/redaksi/KomponenAdmin', () => ({
  BarisFilterCariAdmin: ({ nilai, onChange, onCari, onHapus, filters }) => (
    <div>
      <input aria-label="Cari kandidat" value={nilai} onChange={(event) => onChange(event.target.value)} />
      {filters.map((filter) => (
        <label key={filter.key}>
          {filter.ariaLabel}
          <select aria-label={filter.ariaLabel} value={filter.value} onChange={(event) => filter.onChange(event.target.value)}>
            {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ))}
      <button type="button" onClick={onCari}>Cari</button>
      <button type="button" onClick={onHapus}>Reset</button>
    </div>
  ),
  TabelAdmin: ({ data, kolom, onKlikBaris, onNavigateCursor, isLoading, isError }) => (
    <div>
      <div>loading:{String(isLoading)}</div>
      <div>error:{String(isError)}</div>
      <button type="button" onClick={() => onNavigateCursor('next-cursor')}>Navigasi</button>
      {data.map((item) => (
        <div key={item.id}>
          <button type="button" onClick={() => onKlikBaris(item)}>{item.kata}</button>
          {kolom.map((kolomItem) => (
            <div key={`${item.id}-${kolomItem.key}`}>
              {kolomItem.render ? kolomItem.render(item) : item[kolomItem.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  getApiErrorMessage: (...args) => mockGetApiErrorMessage(...args),
  usePencarianAdmin: (...args) => mockUsePencarianAdmin(...args),
}));

vi.mock('../../../../src/components/redaksi/PanelGeser', () => ({
  default: ({ buka, children, judul, onTutup }) => (buka ? (
    <div role="dialog" aria-label={judul}>
      <button type="button" onClick={onTutup}>Tutup</button>
      {children}
    </div>
  ) : null),
}));

vi.mock('../../../../src/components/redaksi/FormulirAdmin', () => ({
  useFormPanel: (...args) => mockUseFormPanel(...args),
  InputField: ({ label, name, value, onChange }) => (
    <label>
      {label}
      <input aria-label={label} value={value} onChange={(event) => onChange(name, event.target.value)} />
    </label>
  ),
  SelectField: ({ label, name, value, onChange, options }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={(event) => onChange(name, event.target.value)}>
        <option value="">Pilih</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  ),
  TextareaField: ({ label, name, value, onChange }) => (
    <label>
      {label}
      <textarea aria-label={label} value={value} onChange={(event) => onChange(name, event.target.value)} />
    </label>
  ),
  FormFooter: ({ onSimpan, onBatal }) => (
    <div>
      <button type="button" onClick={onSimpan}>Simpan</button>
      <button type="button" onClick={onBatal}>Batal</button>
    </div>
  ),
  PesanForm: ({ error, sukses }) => (
    <div>
      {error ? <div>{error}</div> : null}
      {sukses ? <div>{sukses}</div> : null}
    </div>
  ),
}));

describe('KandidatKataAdmin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockParams.id = undefined;
    mockUseAuth.mockReturnValue({
      punyaIzin: () => true,
    });

    mockUsePencarianAdmin.mockReturnValue({
      cari: '',
      setCari: vi.fn(),
      q: '',
      limit: 50,
      offset: 0,
      currentPage: 1,
      setOffset,
      kirimCari,
      hapusCari,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });

    panelState = {
      buka: false,
      modeTambah: false,
      data: {},
      bukaUntukSunting,
      tutup: tutupPanel,
      ubahField,
      setData,
    };
    mockUseFormPanel.mockImplementation(() => panelState);

    mockUseSimpanKandidatKata.mockReturnValue({ mutateAsync: simpanMutateAsync, isPending: false });
    mockUseUbahStatusKandidatKata.mockReturnValue({ mutateAsync: ubahStatusMutateAsync, isPending: false });
    mockUseHapusKandidatKata.mockReturnValue({ mutateAsync: hapusMutateAsync, isPending: false });

    mockUseStatistikKandidatKata.mockReturnValue({
      data: {
        data: [
          { status: 'menunggu', jumlah: 3 },
          { status: 'ditinjau', jumlah: 1 },
        ],
      },
    });

    mockUseDaftarKandidatKataAdmin.mockReturnValue({
      data: {
        data: [
          { id: 12, kata: 'swafoto', status: 'menunggu', jumlah_atestasi: 2, jenis: 'kata-dasar', sumber_scraper: 'wikipedia' },
        ],
        total: 1,
        pageInfo: {
          hasPrev: false,
          hasNext: false,
          prevCursor: null,
          nextCursor: null,
        },
      },
      isLoading: false,
      isError: false,
    });

    mockUseDetailKandidatKataAdmin.mockReturnValue({ data: null });
    mockUseDaftarAtestasi.mockReturnValue({ data: { data: [] }, isLoading: false });
    mockUseDaftarRiwayat.mockReturnValue({ data: { data: [] }, isLoading: false });
    mockTataLetak.mockReset();
    global.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('helper dan subkomponen kandidat menutup fallback loading, empty, dan status tak dikenal', () => {
    const { container, rerender } = render(<__private.BarStatistik stats={null} />);
    expect(container.textContent).toBe('');

    expect(__private.formatTanggal('')).toBe('-');
    expect(__private.formatTanggal('invalid-date')).toBe('invalid-date');

    rerender(<__private.BadgeStatusKandidat status="" />);
    expect(container.textContent).toContain('-');

    rerender(<__private.BarStatistik stats={{ data: [{ status: 'asing', jumlah: 0 }] }} />);
    expect(screen.getByText('Total: 0')).toBeInTheDocument();

    rerender(<__private.BarStatistik stats={{ data: [{ status: 'asing', jumlah: 2 }] }} />);
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
    expect(screen.getByText('asing: 2').className).toContain('bg-gray-100');

    expect(__private.shouldBukaDetailPanel({
      sedangMenutupDariPath: false,
      idDariPath: 12,
      isLoading: false,
      isError: false,
      detailId: 12,
      idEditTerbuka: null,
    })).toBe(true);
    expect(__private.shouldBukaDetailPanel({
      sedangMenutupDariPath: true,
      idDariPath: 12,
      isLoading: false,
      isError: false,
      detailId: 12,
      idEditTerbuka: null,
    })).toBe(false);

    expect(__private.shouldSinkronkanPanel({
      detailData: { id: 12 },
      panelBuka: true,
      modeTambah: false,
      idDariPath: 12,
      panelDataId: 9,
    })).toBe(true);
    expect(__private.shouldSinkronkanPanel({
      detailData: { id: 12 },
      panelBuka: true,
      modeTambah: false,
      idDariPath: 12,
      panelDataId: 12,
    })).toBe(false);

    mockUseDaftarAtestasi.mockReturnValue({ data: null, isLoading: true });
    rerender(<__private.DaftarAtestasi kandidatId={1} />);
    expect(screen.getByText('Memuat atestasi...')).toBeInTheDocument();

    mockUseDaftarAtestasi.mockReturnValue({ data: null, isLoading: false });
    rerender(<__private.DaftarAtestasi kandidatId={1} />);
    expect(screen.getByText('Belum ada atestasi.')).toBeInTheDocument();

    mockUseDaftarRiwayat.mockReturnValue({ data: null, isLoading: true });
    rerender(<__private.DaftarRiwayat kandidatId={1} />);
    expect(screen.getByText('Memuat riwayat...')).toBeInTheDocument();

    mockUseDaftarRiwayat.mockReturnValue({ data: null, isLoading: false });
    rerender(<__private.DaftarRiwayat kandidatId={1} />);
    expect(screen.getByText('Belum ada riwayat.')).toBeInTheDocument();

    mockUseDaftarRiwayat.mockReturnValue({
      data: { data: [{ id: 1, status_baru: 'asing', redaktur_nama: '', catatan: '', created_at: '2026-03-02' }] },
      isLoading: false,
    });
    rerender(<__private.DaftarRiwayat kandidatId={1} />);
    expect(screen.getByText('Sistem')).toBeInTheDocument();

    const onUbahStatus = vi.fn();
    rerender(<__private.TombolAksiStatus kandidat={{ status: 'disetujui' }} onUbahStatus={onUbahStatus} isLoading={false} />);
    expect(container.textContent).toBe('');

    rerender(<__private.TombolAksiStatus kandidat={{ status: 'asing' }} onUbahStatus={onUbahStatus} isLoading={false} />);
    expect(container.textContent).toBe('');

    rerender(<__private.TombolAksiStatus kandidat={{ status: 'ditolak' }} onUbahStatus={onUbahStatus} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tinjau Ulang' }));
    expect(onUbahStatus).toHaveBeenCalledWith('ditinjau');
  });

  it('menutup fallback respons daftar null tanpa merusak halaman', () => {
    mockUseDaftarKandidatKataAdmin.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<KandidatKataAdmin />);

    expect(screen.getByText('loading:false')).toBeInTheDocument();
    expect(screen.getByText('error:false')).toBeInTheDocument();
    expect(screen.queryByText('swafoto')).not.toBeInTheDocument();
  });

  it('merender daftar kandidat, statistik, filter, dan navigasi baris', () => {
    render(<KandidatKataAdmin />);

    expect(screen.getByTestId('tata-letak-mode')).toHaveTextContent('admin');
    expect(screen.getByTestId('tata-letak-judul')).toHaveTextContent('Kandidat Kata — KADI');
    expect(screen.getByText('Total: 4')).toBeInTheDocument();
    expect(screen.getAllByText('swafoto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('menunggu').length).toBeGreaterThan(0);
    expect(screen.getByText('wikipedia')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Cari kandidat'), { target: { value: 'swafoto' } });
    fireEvent.change(screen.getByLabelText('Filter status kandidat'), { target: { value: 'ditinjau' } });
    fireEvent.change(screen.getByLabelText('Filter jenis kandidat'), { target: { value: 'kata-dasar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    fireEvent.click(screen.getByRole('button', { name: 'Navigasi' }));
    fireEvent.click(screen.getByRole('button', { name: 'swafoto' }));

    expect(kirimCari).toHaveBeenCalledWith('');
    expect(hapusCari).toHaveBeenCalledTimes(1);
    expect(setOffset).toHaveBeenCalledWith('next-cursor');
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kandidat-kata/12');
    expect(mockTataLetak).toHaveBeenCalled();
  });

  it('menutup statistik kosong dan tanggal invalid memakai fallback', () => {
    mockUseStatistikKandidatKata.mockReturnValue({ data: null });
    mockUseDaftarKandidatKataAdmin.mockReturnValue({
      data: {
        data: [{ id: 13, kata: 'uji', status: '', jumlah_atestasi: 0, jenis: '', sumber_scraper: '', created_at: 'invalid-date' }],
        total: 1,
        pageInfo: {},
      },
      isLoading: false,
      isError: false,
    });

    render(<KandidatKataAdmin />);

    expect(screen.queryByText('Total: 4')).not.toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('menutup guard daftar kosong, item tanpa id, dan aksi panel tanpa id', async () => {
    panelState.buka = true;
    panelState.data = {
      kata: 'tanpa-id',
      status: 'menunggu',
      jenis: 'kata-dasar',
      kelas_kata: '',
      definisi_awal: '',
      ragam: '',
      bahasa_campur: '',
      catatan_redaksi: '',
    };
    mockUseDaftarKandidatKataAdmin.mockReturnValue({
      data: {
        data: [{ id: null, kata: 'tanpa-id', status: 'menunggu', jumlah_atestasi: 0, jenis: 'kata-dasar', sumber_scraper: '' }],
        total: 0,
        pageInfo: {},
      },
      isLoading: false,
      isError: false,
    });

    render(<KandidatKataAdmin />);

    fireEvent.click(screen.getByRole('button', { name: 'tanpa-id' }));
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tinjau' }));
    });

    expect(ubahStatusMutateAsync).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Hapus Kandidat' })).not.toBeInTheDocument();
    expect(hapusMutateAsync).not.toHaveBeenCalled();
  });

  it('menangani route id tidak valid dan detail yang gagal dimuat', () => {
    mockParams.id = 'abc';

    render(<KandidatKataAdmin />);

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kandidat-kata', { replace: true });

    vi.clearAllMocks();
    mockParams.id = '12';
    mockUseDetailKandidatKataAdmin.mockReturnValue({
      isLoading: false,
      isError: true,
      data: null,
    });

    render(<KandidatKataAdmin />);
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kandidat-kata', { replace: true });
  });

  it('membuka panel dari detail route, sinkronisasi detail, dan memuat tab atestasi/riwayat', () => {
    mockParams.id = '12';
    panelState.buka = true;
    panelState.data = {
      id: 9,
      kata: 'swafoto',
      status: 'menunggu',
      jenis: 'kata-dasar',
      kelas_kata: 'n',
      definisi_awal: 'potret diri',
      ragam: 'cak',
      bahasa_campur: 'en',
      catatan_redaksi: 'uji',
    };
    mockUseDetailKandidatKataAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 12,
          kata: 'swafoto',
          status: 'menunggu',
        },
      },
    });
    mockUseDaftarAtestasi.mockReturnValue({
      isLoading: false,
      data: { data: [{ id: 1, kutipan: 'contoh kutipan', sumber_nama: 'Korpus', sumber_tipe: 'web', tanggal_terbit: '2026-03-01', sumber_url: 'https://contoh.test' }] },
    });
    mockUseDaftarRiwayat.mockReturnValue({
      isLoading: false,
      data: { data: [{ id: 4, status_baru: 'ditinjau', redaktur_nama: 'Admin', catatan: 'cek', created_at: '2026-03-02' }] },
    });

    render(<KandidatKataAdmin />);

    expect(bukaUntukSunting).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    expect(setData).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    expect(screen.getByRole('dialog', { name: 'swafoto' })).toBeInTheDocument();
    expect(screen.getByText(/contoh kutipan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Riwayat' }));
    expect(screen.getByText('Riwayat Kurasi')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atestasi' }));
    expect(screen.getByText(/contoh kutipan/i)).toBeInTheDocument();
  });

  it('tidak menyinkronkan ulang data panel bila detail route sama dengan data aktif', () => {
    mockParams.id = '12';
    panelState.buka = true;
    panelState.modeTambah = false;
    panelState.data = { id: 12, kata: 'swafoto', status: 'menunggu' };
    mockUseDetailKandidatKataAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: { id: 12, kata: 'swafoto', status: 'menunggu' } },
    });

    render(<KandidatKataAdmin />);

    expect(setData).not.toHaveBeenCalled();
  });

  it('menjalankan validasi simpan, ubah status, hapus, dan tutup panel', async () => {
    panelState.buka = true;
    panelState.data = {
      id: 12,
      kata: '',
      status: 'menunggu',
      jenis: 'kata-dasar',
      kelas_kata: '',
      definisi_awal: '',
      ragam: '',
      bahasa_campur: '',
      catatan_redaksi: '',
    };
    simpanMutateAsync.mockResolvedValue({ ok: true });
    ubahStatusMutateAsync.mockResolvedValue({ ok: true });
    hapusMutateAsync.mockRejectedValueOnce(new Error('hapus gagal')).mockResolvedValueOnce({ ok: true });

    render(<KandidatKataAdmin />);

    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(screen.getAllByText('Kata wajib diisi').length).toBeGreaterThan(0);

    panelState.data.kata = 'swafoto';
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tinjau' }));
    });
    expect(ubahStatusMutateAsync).toHaveBeenCalledWith({ id: 12, status: 'ditinjau' });
    expect(ubahField).toHaveBeenCalledWith('status', 'ditinjau');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    });
    expect(simpanMutateAsync).toHaveBeenCalledWith(panelState.data);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(tutupPanel).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hapus Kandidat' }));
    });
    expect(hapusMutateAsync).toHaveBeenCalledWith(12);
    expect(mockGetApiErrorMessage).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hapus Kandidat' }));
    });
    expect(hapusMutateAsync).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(tutupPanel).toHaveBeenCalled();
  });

  it('menutup cabang error ubah status, guard hapus, dan simpan sukses dari route detail', async () => {
    mockParams.id = '12';
    panelState.buka = true;
    panelState.data = {
      id: 12,
      kata: 'swafoto',
      status: 'menunggu',
      jenis: 'kata-dasar',
      kelas_kata: '',
      definisi_awal: '',
      ragam: '',
      bahasa_campur: '',
      catatan_redaksi: '',
    };
    ubahStatusMutateAsync.mockRejectedValueOnce(new Error('status gagal'));
    simpanMutateAsync.mockRejectedValueOnce(new Error('simpan gagal')).mockResolvedValueOnce({ ok: true });
    global.confirm = vi.fn(() => false);

    render(<KandidatKataAdmin />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Tinjau' }));
    });
    expect(mockGetApiErrorMessage).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hapus Kandidat' }));
    });
    expect(hapusMutateAsync).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    });
    expect(mockGetApiErrorMessage).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/kandidat-kata', { replace: true });
  });
});