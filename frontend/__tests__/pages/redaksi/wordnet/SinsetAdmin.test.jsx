import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SinsetAdmin, { __private } from '../../../../src/pages/redaksi/wordnet/SinsetAdmin';

const mockNavigate = vi.fn();
const mockParams = { id: undefined };
const mockUseDaftarSinsetAdmin = vi.fn();
const mockUseDetailSinsetAdmin = vi.fn();
const mockUseAutocompleteLemaSinset = vi.fn();
const mockUseKandidatMaknaSinset = vi.fn();
const mockUseSimpanSinset = vi.fn();
const mockUseSimpanPemetaanLema = vi.fn();
const mockUseTambahLemaSinset = vi.fn();
const mockUseStatistikSinsetAdmin = vi.fn();
const mockUseFormPanel = vi.fn();
const mockUsePencarianAdmin = vi.fn();
const mockGetApiErrorMessage = vi.fn((error, fallback) => error?.message || fallback);
const mockPotongTeks = vi.fn((value, max = 40) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}` : text;
});

const mutateSinset = vi.fn();
const mutatePemetaan = vi.fn();
const mutateTambahLema = vi.fn();
const setCari = vi.fn();
const kirimCari = vi.fn();
const hapusCari = vi.fn();
const setOffset = vi.fn();

let panelState;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

vi.mock('../../../../src/api/apiAdmin', () => ({
  useDaftarSinsetAdmin: (...args) => mockUseDaftarSinsetAdmin(...args),
  useDetailSinsetAdmin: (...args) => mockUseDetailSinsetAdmin(...args),
  useAutocompleteLemaSinset: (...args) => mockUseAutocompleteLemaSinset(...args),
  useKandidatMaknaSinset: (...args) => mockUseKandidatMaknaSinset(...args),
  useSimpanSinset: (...args) => mockUseSimpanSinset(...args),
  useSimpanPemetaanLema: (...args) => mockUseSimpanPemetaanLema(...args),
  useTambahLemaSinset: (...args) => mockUseTambahLemaSinset(...args),
  useStatistikSinsetAdmin: (...args) => mockUseStatistikSinsetAdmin(...args),
}));

vi.mock('../../../../src/components/tampilan/HalamanAdmin', () => ({
  default: ({ judul, children }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

vi.mock('../../../../src/components/formulir/FilterCariAdmin', () => ({
  default: ({ nilai, onChange, onCari, onHapus, filters }) => (
    <div>
      <input aria-label="Cari sinset" value={nilai} onChange={(event) => onChange(event.target.value)} />
      {filters.map((filter) => (
        <label key={filter.key}>
          {filter.ariaLabel}
          <select
            aria-label={filter.ariaLabel}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      ))}
      <button type="button" onClick={onCari}>Cari</button>
      <button type="button" onClick={onHapus}>Reset</button>
    </div>
  ),
}));

vi.mock('../../../../src/components/data/TabelAdmin', () => ({
  default: ({ data, kolom, onKlikBaris, onNavigateCursor, isLoading, isError }) => (
    <div>
      <div>loading:{String(isLoading)}</div>
      <div>error:{String(isError)}</div>
      <button type="button" onClick={() => onNavigateCursor('next-cursor')}>Cursor</button>
      {data.map((item) => (
        <div key={item.id}>
          <button type="button" onClick={() => onKlikBaris(item)}>Buka {item.id}</button>
          {kolom.map((kolomItem) => (
            <div key={`${item.id}-${kolomItem.key}`}>
              {kolomItem.render ? kolomItem.render(item) : item[kolomItem.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../../../src/components/panel/PanelGeser', () => ({
  default: ({ buka, children, judul, onTutup }) => (
    buka ? (
      <div role="dialog" aria-label={judul}>
        <button type="button" onClick={onTutup}>Tutup Panel</button>
        {children}
      </div>
    ) : null
  ),
}));

vi.mock('../../../../src/components/formulir/FormulirAdmin', () => ({
  useFormPanel: (...args) => mockUseFormPanel(...args),
  TextareaField: ({ label, name, value, onChange }) => (
    <label>
      {label}
      <textarea aria-label={label} value={value} onChange={(event) => onChange(name, event.target.value)} />
    </label>
  ),
  SelectField: ({ label, name, value, onChange, options }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={(event) => onChange(name, event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  ),
  FormFooter: ({ onSimpan, onBatal, isPending }) => (
    <div>
      <button type="button" onClick={onSimpan}>Simpan</button>
      <button type="button" onClick={onBatal}>Batal</button>
      <span>{String(isPending)}</span>
    </div>
  ),
  PesanForm: ({ error, sukses }) => (
    <div>
      {error ? <div>{error}</div> : null}
      {sukses ? <div>{sukses}</div> : null}
    </div>
  ),
}));

vi.mock('../../../../src/hooks/usePencarianAdmin', () => ({
  default: (...args) => mockUsePencarianAdmin(...args),
}));

vi.mock('../../../../src/utils/adminUtils', () => ({
  getApiErrorMessage: (...args) => mockGetApiErrorMessage(...args),
  potongTeks: (...args) => mockPotongTeks(...args),
}));

function buatDetailSinset() {
  return {
    id: 'syn-1',
    kelas_kata: 'n',
    ili_id: 'ili-001',
    lema_en: ['water'],
    definisi_en: 'liquid',
    contoh_en: ['drink water'],
    definisi_id: 'cairan',
    contoh_id: [11, 12],
    status: 'tinjau',
    catatan: 'periksa lagi',
    lema: [
      { id: 4, lema: 'air', terverifikasi: true, makna_id: 9, makna_teks: 'zat cair jernih' },
    ],
    relasiKeluar: [{ id: 1, tipe_publik: 'hipernim', sinset_tujuan: 'syn-2', tujuan_lema_id: 'zat' }],
    relasiMasuk: [{ id: 2, tipe_publik: 'hiponim', sinset_asal: 'syn-3', asal_lema_id: 'air-minum' }],
  };
}

describe('SinsetAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.id = undefined;

    panelState = {
      buka: false,
      data: {},
      bukaUntukSunting: vi.fn((item) => {
        panelState.buka = true;
        panelState.data = item;
      }),
      tutup: vi.fn(() => {
        panelState.buka = false;
      }),
      ubahField: vi.fn((name, value) => {
        panelState.data = { ...panelState.data, [name]: value };
      }),
    };

    mockUseFormPanel.mockImplementation(() => panelState);
    mockUsePencarianAdmin.mockReturnValue({
      cari: 'awal',
      setCari,
      q: 'awal',
      offset: 0,
      setOffset,
      kirimCari,
      hapusCari,
      limit: 50,
      currentPage: 1,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });

    mockUseDaftarSinsetAdmin.mockReturnValue({
      data: {
        data: [
          {
            id: 'syn-1',
            kelas_kata: 'n',
            lema_id: 'air',
            lema_en: ['water', 'aqua'],
            definisi_en: 'liquid',
            status: 'tinjau',
            jumlah_lema: 2,
            lema_terpetakan: 1,
          },
        ],
        total: 1,
        pageInfo: {},
      },
      isLoading: false,
      isError: false,
    });
    mockUseDetailSinsetAdmin.mockReturnValue({ data: null, isLoading: false });
    mockUseAutocompleteLemaSinset.mockReturnValue({ data: { data: [] }, isLoading: false });
    mockUseKandidatMaknaSinset.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
    mockUseStatistikSinsetAdmin.mockReturnValue({
      data: {
        data: {
          sinset: { total: 10, draf: 3, tinjau: 4, terverifikasi: 3 },
          lema: { total: 5, terpetakan: 2, terverifikasi: 1 },
          relasi: 7,
        },
      },
    });
    mockUseSimpanSinset.mockReturnValue({ mutate: mutateSinset, isPending: false });
    mockUseSimpanPemetaanLema.mockReturnValue({ mutate: mutatePemetaan, isPending: false });
    mockUseTambahLemaSinset.mockReturnValue({ mutate: mutateTambahLema, isPending: false });
  });

  it('subkomponen private menutup fallback status, statistik, kandidat, dan relasi', () => {
    const onPetakan = vi.fn();
    const { rerender } = render(<__private.LencanaStatusSinset status="asing" />);
    expect(screen.getByText('asing').className).toContain('bg-gray-100');

    rerender(<__private.StatistikRingkas stats={{
      sinset: { total: 10, draf: 3, tinjau: 4, terverifikasi: 3 },
      lema: { total: 5, terpetakan: 2, terverifikasi: 1 },
      relasi: 7,
    }} />);
    expect(screen.getByText('Total Sinset')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    rerender(<__private.DaftarRelasi relasiKeluar={[]} relasiMasuk={[]} />);
    expect(screen.getByText('Relasi (0)')).toBeInTheDocument();
    expect(screen.queryByText('Keluar:')).not.toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({ data: null, isLoading: true, isError: false, error: null });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    expect(screen.getByText('Memuat kandidat…')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({ data: null, isLoading: false, isError: true, error: new Error('server gagal') });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    expect(screen.getByText('server gagal')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({ data: null, isLoading: false, isError: false, error: null });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    expect(screen.getByText('Tidak ditemukan.')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({
      data: {
        data: {
          kelas_kata_sinset: 'n',
          kelas_kata_db: 'n',
          entri_id: 4,
          kandidat: [],
          semuaMakna: [],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    expect(screen.getByText('Tidak ada makna cocok kelas kata.')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({
      data: {
        data: {
          kelas_kata_sinset: 'n',
          kelas_kata_db: 'n',
          entri_id: 4,
          kandidat: [{ id: 9, polisem: 1, kelas_kata: 'n', makna: 'zat cair', contoh: 'air bening' }],
          semuaMakna: [
            { id: 9, polisem: 1, kelas_kata: 'n', makna: 'zat cair' },
            { id: 10, polisem: 2, kelas_kata: 'n', makna: 'wilayah perairan' },
          ],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Pilih' })[0]);
    expect(onPetakan).toHaveBeenCalledWith(9);
    expect(screen.getByText('Semua makna entri (2)')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({
      data: {
        data: {
          kelas_kata_sinset: 'x',
          kelas_kata_db: 'x',
          entri_id: null,
          kandidat: [{ id: 11, polisem: 2, kelas_kata: 'x', makna: '', contoh: '' }],
          semuaMakna: [{ id: 11, polisem: 2, kelas_kata: 'x', makna: '' }],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    expect(screen.getByText(/entri #—/)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValueOnce({
      data: {
        data: {
          kelas_kata_sinset: 'n',
          kelas_kata_db: 'n',
          entri_id: 4,
          kandidat: [{ id: 12, polisem: 1, kelas_kata: 'n', makna: 'air', contoh: '' }],
          semuaMakna: [
            { id: 12, polisem: 1, kelas_kata: 'n', makna: 'air' },
            { id: 13, polisem: 2, kelas_kata: 'n', makna: '' },
          ],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    rerender(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    expect(screen.getByText('#13 (polisem 2, n) —')).toBeInTheDocument();
  });

  it('renderer kolom private menutup fallback tabel dan warna pemetaan', () => {
    const kelasView = render(__private.kolom[1].render({ kelas_kata: 'x' }));
    expect(kelasView.container).toHaveTextContent('x');
    kelasView.unmount();

    const lemaIdView = render(__private.kolom[2].render({ lema_id: '' }));
    expect(lemaIdView.container).toHaveTextContent('—');
    lemaIdView.unmount();

    const lemaEnView = render(__private.kolom[3].render({ lema_en: null }));
    expect(lemaEnView.container.textContent).toBe('');
    lemaEnView.unmount();

    const lemaEnTerisiView = render(__private.kolom[3].render({ lema_en: ['water', 'aqua', 'fluid', 'extra'] }));
    expect(lemaEnTerisiView.container).toHaveTextContent('water, aqua, fluid');
    lemaEnTerisiView.unmount();

    const definisiView = render(__private.kolom[4].render({ definisi_en: '' }));
    expect(definisiView.container).toHaveTextContent('—');
    definisiView.unmount();

    const kosongView = render(__private.kolom[6].render({ jumlah_lema: 0, lema_terpetakan: 0 }));
    expect(kosongView.container).toHaveTextContent('—');
    kosongView.unmount();

    const penuhView = render(__private.kolom[6].render({ jumlah_lema: 2, lema_terpetakan: 2 }));
    expect(penuhView.container.firstChild.className).toContain('text-green-600');
    expect(penuhView.container).toHaveTextContent('2/2');
    penuhView.unmount();

    const sebagianView = render(__private.kolom[6].render({ jumlah_lema: 3, lema_terpetakan: 1 }));
    expect(sebagianView.container.firstChild.className).toContain('text-amber-600');
    expect(sebagianView.container).toHaveTextContent('1/3');
    sebagianView.unmount();

    const belumView = render(__private.kolom[6].render({ jumlah_lema: 3, lema_terpetakan: 0 }));
    expect(belumView.container.firstChild.className).toContain('text-gray-400');
    expect(belumView.container).toHaveTextContent('0/3');
  });

  it('detail panel dan daftar lema menutup fallback field kosong serta mode pending', () => {
    const onChange = vi.fn();
    const onSimpan = vi.fn();
    const onBatal = vi.fn();
    const setLemaAktif = vi.fn();

    render(
      <__private.DetailSinsetPanel
        data={{ id: 'syn-2', kelas_kata: 'x', ili_id: '', lema_en: [], definisi_en: '', contoh_en: [], definisi_id: '', status: 'draf', catatan: '', lema: [], relasiKeluar: [], relasiMasuk: [] }}
        onChange={onChange}
        onSimpan={onSimpan}
        onBatal={onBatal}
        isPending={true}
        lemaAktif={null}
        setLemaAktif={setLemaAktif}
        simpanLema={{ mutate: mutatePemetaan, isPending: false }}
        tambahLema={{ mutate: mutateTambahLema, isPending: true }}
      />
    );

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.queryByText('Contoh EN:')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument();
    expect(screen.getByText('Menambahkan…')).toBeInTheDocument();
    expect(screen.getByText('Tidak ada lema Indonesia.')).toBeInTheDocument();
  });

  it('subkomponen lema menangani validasi tambah, pilih saran, sukses/error pemetaan, dan daftar kosong', () => {
    const setLemaAktif = vi.fn();
    const daftarView = render(
      <__private.DaftarLema
        lema={[]}
        lemaAktif={null}
        setLemaAktif={setLemaAktif}
        sinsetId="syn-1"
        simpanLema={{ mutate: mutatePemetaan, isPending: false }}
        tambahLema={{ mutate: mutateTambahLema, isPending: false }}
      />
    );
    expect(screen.getByText('Tidak ada lema Indonesia.')).toBeInTheDocument();
    daftarView.unmount();

    mockUseAutocompleteLemaSinset.mockReturnValue({ data: { data: [] }, isLoading: true });
    const loadingView = render(
      <__private.TambahLemaForm sinsetId="syn-1" tambahLema={{ mutate: mutateTambahLema, isPending: false }} />
    );
    fireEvent.focus(screen.getByPlaceholderText('Cari entri kamus …'));
    fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air' } });
    expect(screen.getByText('Mencari entri …')).toBeInTheDocument();
    loadingView.unmount();

    mockUseAutocompleteLemaSinset.mockReturnValue({ data: { data: [] }, isLoading: false });
    const emptyView = render(
      <__private.TambahLemaForm sinsetId="syn-1" tambahLema={{ mutate: mutateTambahLema, isPending: false }} />
    );
    fireEvent.focus(screen.getByPlaceholderText('Cari entri kamus …'));
    fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air' } });
    expect(screen.getByText('Tidak ada entri cocok')).toBeInTheDocument();
    emptyView.unmount();

    mockUseAutocompleteLemaSinset.mockReturnValue({
      data: { data: [{ id: 7, entri: 'air', indeks: '1', jenis: 'dasar' }] },
      isLoading: false,
    });
    mutateTambahLema.mockImplementation((_payload, options) => options.onSuccess());

    const { rerender } = render(
      <__private.TambahLemaForm sinsetId="syn-1" tambahLema={{ mutate: mutateTambahLema, isPending: false }} />
    );

    expect(screen.getByRole('button', { name: 'Tambah lema' })).toBeDisabled();

    fireEvent.focus(screen.getByPlaceholderText('Cari entri kamus …'));
    fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air' } });
    const tombolSaran = screen.getByRole('button', { name: /air/i });
    fireEvent.mouseDown(tombolSaran);
    fireEvent.click(tombolSaran);
    expect(screen.getByRole('button', { name: 'Tambah lema' })).toBeEnabled();
  fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air baru' } });
  expect(screen.getByRole('button', { name: 'Tambah lema' })).toBeDisabled();

  fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air' } });
  fireEvent.click(screen.getByRole('button', { name: /air/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Tambah lema' }));
    expect(mutateTambahLema).toHaveBeenCalledWith({ sinsetId: 'syn-1', entri_id: 7 }, expect.any(Object));
    expect(screen.getByText('Lema ditambahkan.')).toBeInTheDocument();

    mutateTambahLema.mockImplementationOnce((_payload, options) => options.onError(new Error('gagal tambah')));
    fireEvent.focus(screen.getByPlaceholderText('Cari entri kamus …'));
    fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air' } });
    fireEvent.click(screen.getByRole('button', { name: /air/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Tambah lema' }));
    expect(screen.getByText('gagal tambah')).toBeInTheDocument();

    mockUseKandidatMaknaSinset.mockReturnValue({
      data: {
        data: {
          kelas_kata_sinset: 'n',
          kelas_kata_db: 'n',
          entri_id: 4,
          kandidat: [{ id: 9, polisem: 1, kelas_kata: 'n', makna: 'zat cair', contoh: 'air bening' }],
          semuaMakna: [{ id: 9, polisem: 1, kelas_kata: 'n', makna: 'zat cair' }],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mutatePemetaan.mockImplementationOnce((_payload, options) => options.onSuccess());
    rerender(
      <__private.ItemLema
        lema={{ id: 4, lema: 'air', terverifikasi: true, makna_id: 9, makna_teks: 'zat cair jernih' }}
        aktif={true}
        onPilih={() => setLemaAktif(4)}
        sinsetId="syn-1"
        simpanLema={{ mutate: mutatePemetaan, isPending: false }}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Pilih' })[0]);
    expect(screen.getByText('Terpetakan!')).toBeInTheDocument();

    mutatePemetaan.mockImplementationOnce((_payload, options) => options.onError(new Error('gagal petakan')));
    fireEvent.click(screen.getAllByRole('button', { name: 'Pilih' })[0]);
    expect(screen.getByText('gagal petakan')).toBeInTheDocument();
  });

  it('subkomponen lema menutup handler blur, toggle pilih, dan pilih makna detail', async () => {
    mockUseAutocompleteLemaSinset.mockReturnValue({
      data: { data: [{ id: 7, entri: 'air', indeks: '1', jenis: 'dasar' }] },
      isLoading: false,
    });

    const setLemaAktif = vi.fn();
    const daftarView = render(
      <__private.DaftarLema
        lema={[{ id: 4, lema: 'air', terverifikasi: false, makna_id: null, makna_teks: '' }]}
        lemaAktif={null}
        setLemaAktif={setLemaAktif}
        sinsetId="syn-1"
        simpanLema={{ mutate: mutatePemetaan, isPending: false }}
        tambahLema={{ mutate: mutateTambahLema, isPending: false }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'pilih makna' }));
    expect(setLemaAktif).toHaveBeenCalledWith(4);

    daftarView.unmount();

    render(
      <__private.DaftarLema
        lema={[{ id: 4, lema: 'air', terverifikasi: false, makna_id: null, makna_teks: '' }]}
        lemaAktif={4}
        setLemaAktif={setLemaAktif}
        sinsetId="syn-1"
        simpanLema={{ mutate: mutatePemetaan, isPending: false }}
        tambahLema={{ mutate: mutateTambahLema, isPending: false }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'tutup' }));
    expect(setLemaAktif).toHaveBeenCalledWith(null);

    const inputCari = screen.getByPlaceholderText('Cari entri kamus …');
    fireEvent.focus(inputCari);
    fireEvent.change(inputCari, { target: { value: 'air' } });
    expect(screen.getByRole('button', { name: /air/i })).toBeInTheDocument();

    fireEvent.blur(inputCari);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /air/i })).not.toBeInTheDocument();
    });

    mockUseKandidatMaknaSinset.mockReturnValue({
      data: {
        data: {
          kelas_kata_sinset: 'n',
          kelas_kata_db: 'n',
          entri_id: 4,
          kandidat: [{ id: 9, polisem: 1, kelas_kata: 'n', makna: 'zat cair', contoh: '' }],
          semuaMakna: [
            { id: 9, polisem: 1, kelas_kata: 'n', makna: 'zat cair' },
            { id: 10, polisem: 2, kelas_kata: 'n', makna: 'wilayah perairan' },
          ],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const onPetakan = vi.fn();
    render(<__private.PanelKandidatMakna sinsetId="syn-1" lemaId={4} onPetakan={onPetakan} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Pilih' }).at(-1));
    expect(onPetakan).toHaveBeenCalledWith(10);
  });

  it('form tambah lema memakai fallback daftar saran kosong saat respons tanpa data', () => {
    mockUseAutocompleteLemaSinset.mockReturnValue({ data: null, isLoading: false });

    render(
      <__private.TambahLemaForm sinsetId="syn-1" tambahLema={{ mutate: mutateTambahLema, isPending: false }} />
    );

    fireEvent.focus(screen.getByPlaceholderText('Cari entri kamus …'));
    fireEvent.change(screen.getByPlaceholderText('Cari entri kamus …'), { target: { value: 'air' } });

    expect(screen.getByText('Tidak ada entri cocok')).toBeInTheDocument();
  });

  it('halaman utama tanpa id path tidak membuka detail route dan mereset flag tutup-path', () => {
    render(<SinsetAdmin />);

    expect(panelState.bukaUntukSunting).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/sinset', { replace: true });
  });

  it('halaman utama menormalisasi detail kosong dan payload simpan menjadi null saat perlu', () => {
    mockParams.id = 'syn-2';
    panelState.buka = true;
    panelState.data = { id: 'syn-2', definisi_id: '', contoh_id: [], status: 'draf', catatan: '' };
    mockUseDetailSinsetAdmin.mockReturnValue({
      data: {
        data: {
          id: 'syn-2',
          definisi_id: '',
          contoh_id: null,
          status: '',
          catatan: '',
        },
      },
      isLoading: false,
    });
    mutateSinset.mockImplementation((_payload, options) => options.onError(new Error('gagal simpan')));

    render(<SinsetAdmin />);

    expect(panelState.bukaUntukSunting).toHaveBeenCalledWith(expect.objectContaining({
      definisi_id: '',
      contoh_id: [],
      status: 'draf',
      catatan: '',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(mutateSinset).toHaveBeenCalledWith({
      id: 'syn-2',
      definisi_id: null,
      contoh_id: [],
      status: 'draf',
      catatan: null,
    }, expect.any(Object));
    expect(screen.getByText('gagal simpan')).toBeInTheDocument();
  });

  it('halaman utama menangani filter, detail route, simpan, navigasi, dan tutup panel', () => {
    const detail = buatDetailSinset();
    mockParams.id = 'syn-1';
    panelState.buka = true;
    panelState.data = detail;
    mockUseDetailSinsetAdmin.mockReturnValue({ data: { data: detail }, isLoading: false });
    mutateSinset.mockImplementation((_payload, options) => options.onSuccess());

    render(<SinsetAdmin />);

    expect(panelState.bukaUntukSunting).toHaveBeenCalledWith({
      ...detail,
      definisi_id: 'cairan',
      contoh_id: [11, 12],
      status: 'tinjau',
      catatan: 'periksa lagi',
    });

    fireEvent.change(screen.getByLabelText('Filter status sinset'), { target: { value: 'tinjau' } });
    fireEvent.change(screen.getByLabelText('Filter kelas kata'), { target: { value: 'n' } });
    fireEvent.change(screen.getByLabelText('Filter pemetaan'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Filter akar atau nonakar'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    expect(kirimCari).toHaveBeenCalledWith('awal');
    expect(mockUseDaftarSinsetAdmin).toHaveBeenLastCalledWith(expect.objectContaining({
      q: 'awal',
      status: 'tinjau',
      kelas_kata: 'n',
      ada_pemetaan: '1',
      akar: '0',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(hapusCari).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cursor' }));
    expect(setOffset).toHaveBeenCalledWith('next-cursor');

    fireEvent.click(screen.getByRole('button', { name: 'Buka syn-1' }));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/sinset/syn-1');

    fireEvent.change(screen.getByLabelText('Definisi Indonesia'), { target: { value: 'arti baru' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'terverifikasi' } });
    fireEvent.change(screen.getByLabelText('Catatan Redaksi'), { target: { value: 'catatan baru' } });
    expect(panelState.ubahField).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(mutateSinset).toHaveBeenCalledWith({
      id: 'syn-1',
      definisi_id: 'arti baru',
      contoh_id: [11, 12],
      status: 'terverifikasi',
      catatan: 'catatan baru',
    }, expect.any(Object));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(panelState.tutup).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/sinset', { replace: true });
  });

  it('halaman menutup cabang fallback daftar kosong, detail tanpa id, item tanpa id, dan guard menutup path', async () => {
    mockParams.id = 'syn-x';
    mockUseDaftarSinsetAdmin.mockReturnValue({ data: null, isLoading: false, isError: false });
    mockUseStatistikSinsetAdmin.mockReturnValue({ data: null });
    mockUseDetailSinsetAdmin.mockReturnValue({ data: { data: {} }, isLoading: false });

    const view = render(<SinsetAdmin />);
    expect(screen.queryByText('Total Sinset')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    mockUseDaftarSinsetAdmin.mockReturnValue({
      data: {
        data: [{ id: '', kelas_kata: 'n', lema_id: '', lema_en: [], definisi_en: '', status: 'draf', jumlah_lema: 0, lema_terpetakan: 0 }],
        total: 0,
        pageInfo: {},
      },
      isLoading: false,
      isError: false,
    });
    mockUseDetailSinsetAdmin.mockReturnValue({ data: { data: buatDetailSinset() }, isLoading: false });
    view.rerender(<SinsetAdmin />);

    fireEvent.click(screen.getByRole('button', { name: 'Buka' }));
    expect(mockNavigate).not.toHaveBeenCalled();

    mockUseDaftarSinsetAdmin.mockReturnValue({
      data: {
        data: [{ id: 'syn-1', kelas_kata: 'n', lema_id: 'air', lema_en: ['water'], definisi_en: 'liquid', status: 'tinjau', jumlah_lema: 1, lema_terpetakan: 1 }],
        total: 1,
        pageInfo: {},
      },
      isLoading: false,
      isError: false,
    });
    view.rerender(<SinsetAdmin />);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sinset: syn-1' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tutup Panel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/sinset', { replace: true });

    mockUseDetailSinsetAdmin.mockReturnValue({ data: { data: buatDetailSinset() }, isLoading: true });
    view.rerender(<SinsetAdmin />);
  });
});