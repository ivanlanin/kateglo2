import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ArtikelAdmin from '../../../../src/pages/redaksi/artikel/ArtikelAdmin';

const mockNavigate = vi.fn();
let mockParams = {};
let editorValue = '';

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
vi.mock('tiptap-markdown', () => ({
  Markdown: {
    configure: vi.fn(() => ({})),
  },
}));

vi.mock('@tiptap/react', () => {
  const editor = {
    chain: () => ({
      focus: () => ({
        toggleBold: () => ({ run: vi.fn() }),
        toggleItalic: () => ({ run: vi.fn() }),
        toggleHeading: () => ({ run: vi.fn() }),
        toggleBulletList: () => ({ run: vi.fn() }),
        toggleOrderedList: () => ({ run: vi.fn() }),
        toggleBlockquote: () => ({ run: vi.fn() }),
        toggleCodeBlock: () => ({ run: vi.fn() }),
        setHorizontalRule: () => ({ run: vi.fn() }),
      }),
    }),
    isActive: () => false,
    commands: {
      setContent: (value) => {
        editorValue = value || '';
      },
    },
    storage: {
      markdown: {
        getMarkdown: () => editorValue,
      },
    },
    __onUpdate: null,
  };

  return {
    useEditor: ({ content, onUpdate }) => {
      editorValue = content || '';
      editor.__onUpdate = onUpdate;
      return editor;
    },
    EditorContent: ({ editor: instance }) => (
      <textarea
        aria-label="Konten editor"
        value={editorValue}
        onChange={(event) => {
          editorValue = event.target.value;
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
    user: { pid: 7, id: 7, nama: 'Ivan Lanin' },
    punyaIzin: (izin) => izin === 'terbitkan_artikel',
  }),
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
    global.confirm = vi.fn(() => true);
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
    expect(screen.getByRole('link', { name: 'Asal Kata Merdeka' })).toHaveAttribute('href', '/artikel/asal-kata-merdeka');
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
});
