import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ArtikelAdmin, { __private } from '../../../../src/pages/redaksi/artikel/ArtikelAdmin';

const mockNavigate = vi.fn();
let mockParams = {};
let editorValue = '';
let mockAuthUser = { pid: 7, id: 7, nama: 'Ivan Lanin' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-image', () => ({ default: {} }));
vi.mock('@tiptap/extension-link', () => ({
  default: {
    configure: vi.fn((options) => ({ options })),
  },
}));
vi.mock('tiptap-markdown', () => ({
  Markdown: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/react', () => {
  let selectionEmpty = false;
  let currentLinkHref = '';
  let insertedContent = null;
  let storedMarkdown = '';
  let preserveStoredMarkdown = false;
  let forceNullEditor = false;
  const activeMarks = new Set();
  const actionCalls = new Map();
  let setContentCalls = 0;

  const catatAksi = (nama) => {
    actionCalls.set(nama, (actionCalls.get(nama) || 0) + 1);
  };

  const editor = {
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: () => catatAksi('toggleBold') }),
        toggleItalic: () => ({ run: () => catatAksi('toggleItalic') }),
        toggleHeading: ({ level }) => ({ run: () => catatAksi(`toggleHeading:${level}`) }),
        toggleBulletList: () => ({ run: () => catatAksi('toggleBulletList') }),
        toggleOrderedList: () => ({ run: () => catatAksi('toggleOrderedList') }),
        toggleBlockquote: () => ({ run: () => catatAksi('toggleBlockquote') }),
        toggleCodeBlock: () => ({ run: () => catatAksi('toggleCodeBlock') }),
        setHorizontalRule: () => ({ run: () => catatAksi('setHorizontalRule') }),
        extendMarkRange: () => ({
          setLink: ({ href }) => ({
            run: () => {
              catatAksi('setLink');
              currentLinkHref = href;
            },
          }),
          unsetLink: () => ({
            run: () => {
              catatAksi('unsetLink');
              currentLinkHref = '';
            },
          }),
        }),
        insertContent: (value) => ({
          run: () => {
            catatAksi('insertContent');
            insertedContent = value;
          },
        }),
      }),
    }),
    isActive: (name, attrs) => {
      if (name === 'link') return Boolean(currentLinkHref) || activeMarks.has('link');
      if (name === 'heading') return activeMarks.has(`heading:${attrs?.level}`);
      return activeMarks.has(name);
    },
    getAttributes: () => ({ href: currentLinkHref }),
    state: {
      selection: {
        get empty() {
          return selectionEmpty;
        },
      },
    },
    commands: {
      setContent: (value) => {
        setContentCalls += 1;
        editorValue = value || '';
        storedMarkdown = editorValue;
        preserveStoredMarkdown = false;
      },
    },
    storage: {
      markdown: {
        getMarkdown: () => storedMarkdown,
      },
    },
    __onUpdate: null,
  };

  return {
    __editorMock: {
      freezeStoredMarkdown(value) {
        preserveStoredMarkdown = true;
        storedMarkdown = value;
      },
      forceNullEditor(value) {
        forceNullEditor = Boolean(value);
      },
      getActionCount(name) {
        return actionCalls.get(name) || 0;
      },
      setActiveMarks(values = []) {
        activeMarks.clear();
        values.forEach((value) => activeMarks.add(value));
      },
      setSelectionEmpty(value) {
        selectionEmpty = Boolean(value);
      },
      getSetContentCalls() {
        return setContentCalls;
      },
      getInsertedContent() {
        return insertedContent;
      },
      reset() {
        selectionEmpty = false;
        currentLinkHref = '';
        insertedContent = null;
        storedMarkdown = '';
        preserveStoredMarkdown = false;
        forceNullEditor = false;
        activeMarks.clear();
        actionCalls.clear();
        setContentCalls = 0;
      },
    },
    useEditor: ({ content, onUpdate }) => {
      if (forceNullEditor) return null;
      editorValue = content || '';
      if (!preserveStoredMarkdown) {
        storedMarkdown = editorValue;
      }
      editor.__onUpdate = onUpdate;
      return editor;
    },
    EditorContent: ({ editor: instance }) => (
      <textarea
        aria-label="Konten editor"
        value={editorValue}
        onChange={(event) => {
          editorValue = event.target.value;
          storedMarkdown = event.target.value;
          instance.__onUpdate?.({ editor: instance });
        }}
      />
    ),
  };
});

const mockUseDaftarArtikelAdmin = vi.fn();
const mockUseDetailArtikelAdmin = vi.fn();
const mockUseAutocompletePengguna = vi.fn();
const mutateSimpan = vi.fn();
const mutateHapus = vi.fn();
const mutateTerbitkan = vi.fn();
const mutateUnggah = vi.fn();
const promptMock = vi.fn();
const mockPunyaIzin = vi.fn((izin) => izin === 'terbitkan_artikel');
const mockUseFormPanel = vi.fn();
var actualUseFormPanel;

vi.mock('../../../../src/api/apiAdmin', () => ({
  useDaftarArtikelAdmin: (...args) => mockUseDaftarArtikelAdmin(...args),
  useDetailArtikelAdmin: (...args) => mockUseDetailArtikelAdmin(...args),
  useAutocompletePengguna: (...args) => mockUseAutocompletePengguna(...args),
  useSimpanArtikelAdmin: () => ({ mutate: mutateSimpan, isPending: false }),
  useHapusArtikelAdmin: () => ({ mutate: mutateHapus, isPending: false }),
  useTerbitkanArtikelAdmin: () => ({ mutate: mutateTerbitkan, isPending: false }),
  useUnggahGambarArtikelAdmin: () => ({ mutate: mutateUnggah, isPending: false }),
}));

vi.mock('../../../../src/context/authContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    punyaIzin: mockPunyaIzin,
  }),
}));

vi.mock('../../../../src/components/formulir/FormulirAdmin', async () => {
  const actual = await vi.importActual('../../../../src/components/formulir/FormulirAdmin');
  actualUseFormPanel = actual.useFormPanel;
  return {
    ...actual,
    useFormPanel: (...args) => mockUseFormPanel(...args),
  };
});

vi.mock('../../../../src/components/tampilan/HalamanAdmin', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

vi.mock('../../../../src/components/tombol/TombolAksiAdmin', () => ({
  default: ({ onClick }) => <button onClick={onClick}>+ Tambah</button>,
}));

vi.mock('../../../../src/components/formulir/FilterCariAdmin', () => ({
  default: ({ nilai, onChange, onCari, onHapus, filters = [] }) => (
    <div>
      <input aria-label="Cari artikel" value={nilai} onChange={(event) => onChange(event.target.value)} />
      {filters.map((filter) => (
        <select
          key={filter.key}
          aria-label={filter.ariaLabel}
          value={filter.value}
          onChange={(event) => filter.onChange(event.target.value)}
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ))}
      <button onClick={onCari}>Cari</button>
      <button onClick={onHapus}>Reset</button>
    </div>
  ),
}));

vi.mock('../../../../src/components/data/TabelAdmin', () => ({
  default: ({ kolom, data, onKlikBaris }) => (
    <table>
      <thead>
        <tr>
          {kolom.map((item) => <th key={item.key}>{item.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} onClick={() => onKlikBaris?.(row)}>
            {kolom.map((item, index) => (
              <td key={`${row.id}-${item.key}-${index}`}>
                {item.render ? item.render(row) : row[item.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock('../../../../src/components/panel/PanelGeser', () => ({
  default: ({ buka, children, judul }) => (buka ? <section><h2>{judul}</h2>{children}</section> : null),
}));

describe('ArtikelAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T10:45:00'));
    mockParams = {};
    editorValue = '';
    mockAuthUser = { pid: 7, id: 7, nama: 'Ivan Lanin' };
    global.confirm = vi.fn(() => true);
    global.prompt = promptMock;
    mockPunyaIzin.mockImplementation((izin) => izin === 'terbitkan_artikel');
    mockUseFormPanel.mockImplementation((...args) => actualUseFormPanel(...args));
    mockUseDaftarArtikelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{
          id: 1,
          judul: 'Asal Kata Merdeka',
          slug: 'asal-kata-merdeka',
          penulis_nama: 'Ivan Lanin',
          topik: ['asal-kata', 'kata-baru'],
          diterbitkan: true,
          diterbitkan_pada: '2026-04-03 09:00:00',
        }],
      },
    });
    mockUseDetailArtikelAdmin.mockReturnValue({ isLoading: false, isError: false, data: null });
    mockUseAutocompletePengguna.mockReturnValue({
      data: {
        data: [
          { id: 7, nama: 'Ivan Lanin', surel: 'ivan@example.com' },
          { id: 8, nama: 'Editor Kateglo', surel: 'editor@example.com' },
        ],
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('menampilkan kolom daftar sesuai urutan baru dan nama penulis', () => {
    mockUseDaftarArtikelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{
          id: 1,
          judul: 'Asal *Kata* Merdeka',
          slug: 'asal-kata-merdeka',
          penulis_nama: 'Ivan Lanin',
          topik: ['linguistik', 'etimologi'],
          diterbitkan: true,
          diterbitkan_pada: '2026-04-03 09:00:00',
        }],
      },
    });

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Terbit', 'Judul', 'Penulis', 'Topik', 'Status']);
    expect(screen.getByText('Ivan Lanin')).toBeInTheDocument();
    expect(screen.getByText('linguistik, etimologi')).toBeInTheDocument();
    expect(screen.getByText('Kata', { selector: 'em' })).toBeInTheDocument();
    const tautan = screen.getByRole('link', { name: 'Asal Kata Merdeka' });
    expect(tautan).toHaveAttribute('href', '/artikel/asal-kata-merdeka');
    const eventKlik = new MouseEvent('click', { bubbles: true, cancelable: true });
    eventKlik.stopPropagation = vi.fn();
    fireEvent(tautan, eventKlik);
    expect(eventKlik.stopPropagation).toHaveBeenCalled();
    expect(screen.getAllByText('Terbit').length).toBeGreaterThan(0);
  });

  it('menyimpan multi-topik valid dari form admin', () => {
    mutateSimpan.mockImplementation((_payload, options) => options.onSuccess?.());

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByText('Tambah Artikel')).toBeInTheDocument();
    expect(screen.queryByText('Slug')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Penulis' })).toHaveTextContent('Ivan Lanin');
    expect(screen.getByLabelText('Terbit')).toHaveValue('2026-04-04T10:45');
    expect(screen.getByRole('button', { name: 'Status artikel' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Judul*'), { target: { value: 'Topik Ganda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Status artikel' }));
    expect(global.confirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Input topik artikel'), { target: { value: 'linguistik' } });
    fireEvent.keyDown(screen.getByLabelText('Input topik artikel'), { key: 'Enter' });
    fireEvent.change(screen.getByLabelText('Input topik artikel'), { target: { value: 'etimologi' } });
    fireEvent.keyDown(screen.getByLabelText('Input topik artikel'), { key: 'Enter' });

    fireEvent.change(screen.getByLabelText('Konten editor'), { target: { value: 'Isi artikel uji' } });
    fireEvent.click(screen.getByText('Simpan'));

    const payload = mutateSimpan.mock.calls.at(-1)?.[0];
    expect(payload).toBeTruthy();
    expect(payload.penulis_id).toBe(7);
    expect(payload.diterbitkan).toBe(true);
    expect(payload.diterbitkan_pada).toBe('2026-04-04T10:45:00');
    expect(payload.topik).toEqual(['linguistik', 'etimologi']);
    expect(mutateTerbitkan).not.toHaveBeenCalled();
  });

  it('menggunakan filter status draf ke hook daftar', () => {
    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Filter status artikel'), { target: { value: 'draf' } });
    fireEvent.click(screen.getByText('Cari'));

    const panggilanTerakhir = mockUseDaftarArtikelAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.status).toBe('draf');
  });

  it('menampilkan fallback daftar untuk artikel tanpa slug, penulis, topik, tanggal, dan status terbit', () => {
    mockUseDaftarArtikelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{
          id: 2,
          judul: 'Artikel tanpa slug',
          slug: '',
          penulis_nama: '',
          penulis: '',
          topik: null,
          diterbitkan: false,
          diterbitkan_pada: null,
        }],
      },
    });

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Artikel tanpa slug')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Artikel tanpa slug' })).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draf').length).toBeGreaterThan(0);
  });

  it('menyamakan tanggal terbit daftar dan formulir saat backend mengirim ISO UTC', () => {
    mockParams = { id: '1' };
    mockUseDaftarArtikelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{
          id: 1,
          judul: 'Efektivitas atau efektifitas?',
          slug: 'efektivitas-atau-efektifitas',
          penulis_nama: 'Ivan Lanin',
          topik: ['kata baku'],
          diterbitkan: true,
          diterbitkan_pada: '2026-04-04T23:44:00.000Z',
        }],
      },
    });
    mockUseDetailArtikelAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: {
          id: 1,
          judul: 'Efektivitas atau efektifitas?',
          slug: 'efektivitas-atau-efektifitas',
          konten: 'Isi artikel.',
          penulis_id: 7,
          penyunting_id: null,
          topik: ['kata baku'],
          diterbitkan: true,
          diterbitkan_pada: '2026-04-04T23:44:00.000Z',
        },
      },
    });

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('04 Apr 2026 23.44')).toBeInTheDocument();
    expect(screen.getByLabelText('Terbit')).toHaveValue('2026-04-04T23:44');
  });

  it('helper private menormalkan tautan artikel', () => {
    expect(__private.resolvePenggunaIdAktif({ pid: 7, id: 9 })).toBe(7);
    expect(__private.resolvePenggunaIdAktif({ id: 9 })).toBe(9);
    expect(__private.resolvePenggunaIdAktif(null)).toBeNull();
    expect(__private.parseOptionalNumericValue('8')).toBe(8);
    expect(__private.parseOptionalNumericValue('')).toBeNull();
    expect(__private.normalizeTanggalTerbitFieldValue('2026-04-05T06:30')).toBe('2026-04-05T06:30:00');
    expect(__private.normalizeTanggalTerbitFieldValue('')).toBeNull();
    expect(__private.resolveNilaiDiterbitkan({ diterbitkan: false }, true)).toBe(false);
    expect(__private.resolveNilaiDiterbitkan({}, true)).toBe(true);
    expect(__private.buildKontenGambarMarkdown('', 'https://img.test/gambar.png')).toBe('\n\n![gambar](https://img.test/gambar.png)\n');
    expect(__private.buildKontenGambarMarkdown('isi', 'https://img.test/gambar.png')).toBe('isi\n\n![gambar](https://img.test/gambar.png)\n');
    expect(__private.normalizeTopikArtikel(' bahasa ')).toEqual(['bahasa']);
    expect(__private.normalizeTopikArtikel([' bahasa ', '', 'Bahasa'])).toEqual(['bahasa']);
    expect(__private.isInternalArticleHref()).toBe(false);
    expect(__private.isInternalArticleHref('/gramatika/inversi')).toBe(true);
    expect(__private.isInternalArticleHref('https://kateglo.org')).toBe(false);
    expect(__private.normalizeArtikelHref('')).toBe('');
    expect(__private.normalizeArtikelHref('#bagian-1')).toBe('#bagian-1');
    expect(__private.normalizeArtikelHref('mailto:redaksi@kateglo.org')).toBe('mailto:redaksi@kateglo.org');
    expect(__private.normalizeArtikelHref(' contoh.org/halaman ')).toBe('https://contoh.org/halaman');
    expect(__private.normalizeArtikelHref('teks biasa')).toBe('teks biasa');
    expect(__private.normalizeArtikelHref('/gramatika/inversi')).toBe('/gramatika/inversi');

    const ekstensi = __private.buildArtikelLinkExtension();
    expect(ekstensi.options.isAllowedUri('', { defaultValidate: () => false })).toBe(false);
    expect(ekstensi.options.isAllowedUri('/internal', { defaultValidate: () => false })).toBe(true);
    expect(ekstensi.options.isAllowedUri('#lokal', { defaultValidate: () => false })).toBe(true);
    expect(ekstensi.options.isAllowedUri('https://contoh.org', { defaultValidate: () => true })).toBe(true);
    expect(ekstensi.options.isAllowedUri('ftp://contoh.org', { defaultValidate: () => false })).toBe(false);
  });

  it('merender helper editor/topik/status untuk cabang UI yang tersisa', async () => {
    const { __editorMock } = await import('@tiptap/react');
    __editorMock.reset();
    __editorMock.forceNullEditor(true);

    const { rerender } = render(<__private.EditorArtikel value="isi" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Konten editor')).not.toBeInTheDocument();

    __editorMock.forceNullEditor(false);
    __editorMock.setActiveMarks([
      'bold',
      'italic',
      'heading:2',
      'heading:3',
      'bulletList',
      'orderedList',
      'blockquote',
      'codeBlock',
      'link',
    ]);
    rerender(<__private.EditorArtikel value="isi" onChange={vi.fn()} />);

    expect(screen.getByTitle('Tebal')).toHaveClass('aktif');
    expect(screen.getByTitle('Miring')).toHaveClass('aktif');
    expect(screen.getByTitle('Judul 2')).toHaveClass('aktif');
    expect(screen.getByTitle('Judul 3')).toHaveClass('aktif');
    expect(screen.getByTitle('Daftar butir')).toHaveClass('aktif');
    expect(screen.getByTitle('Daftar bernomor')).toHaveClass('aktif');
    expect(screen.getByTitle('Kutipan')).toHaveClass('aktif');
    expect(screen.getByTitle('Blok kode')).toHaveClass('aktif');
    expect(screen.getByTitle('Sisipkan atau ubah tautan')).toHaveClass('aktif');
    expect(screen.queryByText('Gambar')).not.toBeInTheDocument();

    promptMock.mockReturnValueOnce('/uji');
    promptMock.mockReturnValueOnce('   ');
    __editorMock.setSelectionEmpty(true);
    fireEvent.click(screen.getByTitle('Sisipkan atau ubah tautan'));

    promptMock.mockReturnValueOnce('/uji');
    promptMock.mockReturnValueOnce('');
    fireEvent.click(screen.getByTitle('Sisipkan atau ubah tautan'));

    promptMock.mockReturnValueOnce('/uji');
    promptMock.mockReturnValueOnce(null);
    fireEvent.click(screen.getByTitle('Sisipkan atau ubah tautan'));

    const onChangeTopik = vi.fn();
    rerender(<__private.InputTopik topik={['bahasa']} onChange={onChangeTopik} />);
    fireEvent.blur(screen.getByLabelText('Input topik artikel'));
    expect(onChangeTopik).not.toHaveBeenCalled();

    const onToggle = vi.fn();
    rerender(<__private.StatusArtikelField data={{ diterbitkan: false }} modeTambah={false} bolehTerbitkan={true} isPending={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Status artikel' }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('menyisipkan tautan internal dari toolbar editor saat tidak ada seleksi', async () => {
    const { __editorMock } = await import('@tiptap/react');
    __editorMock.reset();
    __editorMock.setSelectionEmpty(true);
    promptMock
      .mockReturnValueOnce('/gramatika/inversi')
      .mockReturnValueOnce('halaman Gramatika');

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(promptMock).toHaveBeenNthCalledWith(1, 'Masukkan URL tautan. Gunakan /... untuk tautan internal.', '');
    expect(promptMock).toHaveBeenNthCalledWith(2, 'Masukkan teks tautan.', '');
    expect(__editorMock.getInsertedContent()).toEqual({
      type: 'text',
      text: 'halaman Gramatika',
      marks: [{ type: 'link', attrs: { href: '/gramatika/inversi' } }],
    });
  });

  it('menjalankan aksi toolbar editor dan sinkronisasi ulang konten saat nilai berubah', async () => {
    const { __editorMock } = await import('@tiptap/react');
    __editorMock.reset();

    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        judul: 'Toolbar',
        konten: 'Konten awal',
        topik: [],
        penulis_id: 7,
        penyunting_id: null,
        diterbitkan: false,
        diterbitkan_pada: '2026-04-04T10:45:00',
      },
      modeTambah: true,
      bukaUntukTambah: vi.fn(),
      bukaUntukSunting: vi.fn(),
      tutup: vi.fn(),
      ubahField: vi.fn(),
      setData: vi.fn(),
    });

    const hasil = render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Tebal'));
    fireEvent.click(screen.getByTitle('Miring'));
    fireEvent.click(screen.getByTitle('Judul 2'));
    fireEvent.click(screen.getByTitle('Judul 3'));
    fireEvent.click(screen.getByTitle('Daftar butir'));
    fireEvent.click(screen.getByTitle('Daftar bernomor'));
    fireEvent.click(screen.getByTitle('Kutipan'));
    fireEvent.click(screen.getByTitle('Blok kode'));
    fireEvent.click(screen.getByTitle('Garis pembatas'));

    expect(__editorMock.getActionCount('toggleBold')).toBe(1);
    expect(__editorMock.getActionCount('toggleItalic')).toBe(1);
    expect(__editorMock.getActionCount('toggleHeading:2')).toBe(1);
    expect(__editorMock.getActionCount('toggleHeading:3')).toBe(1);
    expect(__editorMock.getActionCount('toggleBulletList')).toBe(1);
    expect(__editorMock.getActionCount('toggleOrderedList')).toBe(1);
    expect(__editorMock.getActionCount('toggleBlockquote')).toBe(1);
    expect(__editorMock.getActionCount('toggleCodeBlock')).toBe(1);
    expect(__editorMock.getActionCount('setHorizontalRule')).toBe(1);

    __editorMock.freezeStoredMarkdown('Konten lama');
    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        judul: 'Toolbar',
        konten: 'Konten baru',
        topik: [],
        penulis_id: 7,
        penyunting_id: null,
        diterbitkan: false,
        diterbitkan_pada: '2026-04-04T10:45:00',
      },
      modeTambah: true,
      bukaUntukTambah: vi.fn(),
      bukaUntukSunting: vi.fn(),
      tutup: vi.fn(),
      ubahField: vi.fn(),
      setData: vi.fn(),
    });

    hasil.rerender(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(__editorMock.getSetContentCalls()).toBe(1);

    __editorMock.freezeStoredMarkdown('Konten lain');
    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        judul: 'Toolbar',
        konten: '',
        topik: [],
        penulis_id: 7,
        penyunting_id: null,
        diterbitkan: false,
        diterbitkan_pada: '2026-04-04T10:45:00',
      },
      modeTambah: true,
      bukaUntukTambah: vi.fn(),
      bukaUntukSunting: vi.fn(),
      tutup: vi.fn(),
      ubahField: vi.fn(),
      setData: vi.fn(),
    });

    hasil.rerender(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(__editorMock.getSetContentCalls()).toBe(2);
  });

  it('menangani guard route, reset filter, klik baris, dan validasi detail tidak ditemukan', () => {
    mockParams = { id: 'abc' };
    const { rerender } = render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/artikel', { replace: true });

    mockParams = {};
    rerender(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Cari artikel'), { target: { value: 'merdeka' } });
    fireEvent.change(screen.getByLabelText('Filter status artikel'), { target: { value: 'draf' } });
    fireEvent.click(screen.getByText('Reset'));
    let panggilanTerakhir = mockUseDaftarArtikelAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.status).toBe('');

    fireEvent.click(screen.getByText('03 Apr 2026 09.00'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/artikel/1');

    mockUseDaftarArtikelAdmin.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: { total: 1, data: [{ id: null, judul: 'Tanpa id', diterbitkan: false, topik: [], penulis_nama: '', slug: '' }] },
    });
    rerender(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Tanpa id'));
    expect(mockNavigate).not.toHaveBeenCalledWith('/redaksi/artikel/null');

    mockParams = { id: '2' };
    mockUseDetailArtikelAdmin.mockReturnValue({ isLoading: false, isError: true, data: null });
    rerender(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/artikel', { replace: true });
  });

  it('menangani lifecycle panel dari route edit', () => {
    const tutupPanelSpy = vi.fn();
    const bukaTambahSpy = vi.fn();
    mockParams = { id: '1' };
    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        id: 1,
        judul: 'Artikel Uji',
        konten: 'Konten awal',
        topik: ['bahasa'],
        penulis_id: 7,
        penyunting_id: 8,
        diterbitkan: false,
        diterbitkan_pada: '2026-04-04T10:45:00',
      },
      modeTambah: false,
      bukaUntukTambah: bukaTambahSpy,
      bukaUntukSunting: vi.fn(),
      tutup: tutupPanelSpy,
      ubahField: vi.fn(),
      setData: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Sunting Artikel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Tambah'));
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/artikel', { replace: true });
    expect(bukaTambahSpy).toHaveBeenCalledWith(expect.objectContaining({ penulis_id: 7 }));

    fireEvent.click(screen.getByText('Batal'));
    expect(tutupPanelSpy).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/redaksi/artikel', { replace: true });
  });

  it('menangani alur edit route: simpan error, hapus, terbitkan, dan unggah gambar', () => {
    const ubahFieldSpy = vi.fn();
    const tutupPanelSpy = vi.fn();
    mockParams = { id: '1' };
    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        id: 1,
        judul: 'Artikel Uji',
        slug: 'artikel-uji',
        konten: 'Konten awal',
        topik: ['bahasa', 'Bahasa'],
        penulis_id: 7,
        penyunting_id: 8,
        diterbitkan: false,
        diterbitkan_pada: '2026-04-04T10:45:00',
      },
      modeTambah: false,
      bukaUntukTambah: vi.fn(),
      bukaUntukSunting: vi.fn(),
      tutup: tutupPanelSpy,
      ubahField: ubahFieldSpy,
      setData: vi.fn(),
    });
    mutateSimpan.mockImplementationOnce((_payload, options) => options.onError?.({ response: { data: { message: 'Err simpan artikel' } } }));
    mutateHapus
      .mockImplementationOnce((_id, options) => options.onError?.({ response: { data: { message: 'Err hapus artikel' } } }))
      .mockImplementationOnce((_id, options) => options.onSuccess?.());
    mutateTerbitkan
      .mockImplementationOnce((_payload, options) => options.onError?.({ response: { data: { message: 'Err terbit artikel' } } }))
      .mockImplementationOnce((_payload, options) => options.onSuccess?.({ data: { diterbitkan: true, diterbitkan_pada: '2026-04-04T12:00:00.000Z' } }));
    mutateUnggah
      .mockImplementationOnce((_file, options) => options.onError?.({ response: { data: { message: 'Err unggah gambar' } } }))
      .mockImplementationOnce((_file, options) => options.onSuccess?.({ data: { url: 'https://img.kateglo.test/gambar.png' } }))
      .mockImplementationOnce((_file, options) => options.onSuccess?.({ data: {} }));

    const { container } = render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Sunting Artikel')).toBeInTheDocument();
    expect(screen.getByLabelText('Judul*')).toHaveValue('Artikel Uji');

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Err simpan artikel')).toBeInTheDocument();

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).not.toHaveBeenCalled();

    global.confirm = vi.fn(() => true);
    fireEvent.click(screen.getByText('Hapus'));
    expect(screen.getByText('Err hapus artikel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hapus'));
    expect(mutateHapus).toHaveBeenCalledWith(1, expect.any(Object));

    fireEvent.change(screen.getByLabelText('Terbit'), { target: { value: '2026-04-05T06:30' } });
    expect(ubahFieldSpy).toHaveBeenCalledWith('diterbitkan_pada', '2026-04-05T06:30:00');

    fireEvent.click(screen.getByRole('button', { name: 'Status artikel' }));
    expect(screen.getByText('Err terbit artikel')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Status artikel' }));
    expect(screen.getByText('Artikel diterbitkan.')).toBeInTheDocument();
    expect(ubahFieldSpy).toHaveBeenCalledWith('diterbitkan', true);
    expect(ubahFieldSpy).toHaveBeenCalledWith('diterbitkan_pada', '2026-04-04T12:00:00');

    const inputFile = container.querySelector('input[type="file"]');
    expect(inputFile).not.toBeNull();
    fireEvent.change(inputFile, { target: { files: [] } });
    expect(mutateUnggah).not.toHaveBeenCalled();

    const file = new File(['img'], 'gambar.png', { type: 'image/png' });
    fireEvent.change(inputFile, { target: { files: [file] } });
    expect(screen.getByText('Err unggah gambar')).toBeInTheDocument();
    fireEvent.change(inputFile, { target: { files: [file] } });
    expect(ubahFieldSpy).toHaveBeenCalledWith('konten', expect.stringContaining('![gambar](https://img.kateglo.test/gambar.png)'));
    fireEvent.change(inputFile, { target: { files: [file] } });
    expect(ubahFieldSpy).not.toHaveBeenCalledWith('konten', expect.stringContaining('undefined'));

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(tutupPanelSpy).toHaveBeenCalled();
  });

  it('mengubah artikel terbit menjadi draf untuk record yang sudah tersimpan', () => {
    const ubahFieldSpy = vi.fn();
    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        id: 9,
        judul: 'Artikel terbit',
        konten: 'Isi',
        topik: [],
        penulis_id: 7,
        penyunting_id: null,
        diterbitkan: true,
        diterbitkan_pada: '2026-04-04T10:45:00',
      },
      modeTambah: false,
      bukaUntukTambah: vi.fn(),
      bukaUntukSunting: vi.fn(),
      tutup: vi.fn(),
      ubahField: ubahFieldSpy,
      setData: vi.fn(),
    });
    mutateTerbitkan.mockImplementationOnce((_payload, options) => options.onSuccess?.({ data: { diterbitkan: false, diterbitkan_pada: null } }));

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Status artikel' }));
    expect(ubahFieldSpy).toHaveBeenCalledWith('diterbitkan', false);
    expect(ubahFieldSpy).toHaveBeenCalledWith('diterbitkan_pada', '2026-04-04T10:45:00');
    expect(screen.getByText('Artikel dijadikan draf.')).toBeInTheDocument();
  });

  it('menggunakan fallback data pengguna dan opsi kosong saat data daftar/autocomplete belum tersedia', () => {
    mockAuthUser = { id: 9, nama: 'Editor Saja' };
    mockUseDaftarArtikelAdmin.mockReturnValue({ isLoading: false, isError: false, data: undefined });
    mockUseAutocompletePengguna.mockReturnValue({ data: undefined });

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+ Tambah'));
    expect(screen.getByRole('button', { name: 'Penulis' })).toHaveTextContent('Pilih penulis…');
  });

  it('menampilkan validasi wajib sebelum submit saat data panel belum lengkap', () => {
    mockUseFormPanel.mockReturnValue({
      buka: true,
      data: {
        judul: '',
        konten: '',
        topik: null,
        penulis_id: null,
        penyunting_id: null,
        diterbitkan: false,
        diterbitkan_pada: null,
      },
      modeTambah: true,
      bukaUntukTambah: vi.fn(),
      bukaUntukSunting: vi.fn(),
      tutup: vi.fn(),
      ubahField: vi.fn(),
      setData: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simpan'));
    expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument();
    expect(mutateSimpan).not.toHaveBeenCalled();
  });

  it('menangani detail parsial, toggle status tanpa izin, dan cabang toolbar tautan lain', async () => {
    const { __editorMock } = await import('@tiptap/react');
    __editorMock.reset();

    mockPunyaIzin.mockReturnValue(false);
    mockParams = { id: '1' };
    mockUseDetailArtikelAdmin
      .mockReturnValueOnce({ isLoading: false, isError: false, data: { data: { judul: 'Tanpa ID' } } })
      .mockReturnValueOnce({
        isLoading: false,
        isError: false,
        data: {
          data: {
            id: 1,
            judul: 'Artikel Draft',
            slug: '',
            konten: 'Konten draft',
            topik: [],
            penulis_id: 7,
            penyunting_id: null,
            diterbitkan: false,
            diterbitkan_pada: null,
          },
        },
      });

    const { rerender } = render(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(screen.queryByText('Sunting Artikel')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ArtikelAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Status hanya dapat diubah oleh pengguna dengan izin penerbitan.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Status artikel' }));
    expect(mutateTerbitkan).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByRole('button', { name: 'Penulis' }));
    fireEvent.click(screen.getByText('Editor Kateglo'));
    fireEvent.click(screen.getByRole('button', { name: 'Penyunting' }));
    fireEvent.click(screen.getAllByText('— Tidak ada —').at(-1));

    fireEvent.click(screen.getByText('+ Tambah'));
    fireEvent.change(screen.getByLabelText('Input topik artikel'), { target: { value: 'bahasa' } });
    fireEvent.keyDown(screen.getByLabelText('Input topik artikel'), { key: ',' });
    expect(screen.getByRole('button', { name: 'Hapus topik bahasa' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Input topik artikel'), { target: { value: 'Bahasa' } });
    fireEvent.keyDown(screen.getByLabelText('Input topik artikel'), { key: ',' });
    expect(screen.getByLabelText('Input topik artikel')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Hapus topik bahasa' }));
    expect(screen.queryByRole('button', { name: 'Hapus topik bahasa' })).not.toBeInTheDocument();

    promptMock.mockReturnValueOnce('');
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    promptMock.mockReturnValueOnce(null);
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    __editorMock.setSelectionEmpty(false);
    promptMock.mockReturnValueOnce('contoh.org');
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(promptMock).toHaveBeenCalled();
  });
});
