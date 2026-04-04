/**
 * @fileoverview Halaman redaksi untuk manajemen artikel editorial
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import {
  useDaftarArtikelAdmin,
  useDetailArtikelAdmin,
  useSimpanArtikelAdmin,
  useHapusArtikelAdmin,
  useTerbitkanArtikelAdmin,
  useUnggahGambarArtikelAdmin,
  useAutocompletePengguna,
} from '../../../api/apiAdmin';
import { useAuth } from '../../../context/authContext';
import HalamanAdmin from '../../../components/tampilan/HalamanAdmin';
import FilterCariAdmin from '../../../components/formulir/FilterCariAdmin';
import TabelAdmin from '../../../components/data/TabelAdmin';
import TombolAksiAdmin from '../../../components/tombol/TombolAksiAdmin';
import PanelGeser from '../../../components/panel/PanelGeser';
import {
  useFormPanel,
  FormFooter,
  InputField,
  SearchableSelectField,
  PesanForm,
} from '../../../components/formulir/FormulirAdmin';
import usePencarianAdmin from '../../../hooks/usePencarianAdmin';
import { getApiErrorMessage, potongTeks, validateRequiredFields } from '../../../utils/adminUtils';
import { formatLocalDateTime } from '../../../utils/formatUtils';
import { parsePositiveIntegerParam } from '../../../utils/paramUtils';

const nilaiAwal = {
  judul: '',
  konten: '',
  topik: [],
  penulis_id: null,
  penyunting_id: null,
  diterbitkan: false,
  diterbitkan_pada: null,
};

const opsiFilterStatus = [
  { value: '', label: '—Status—' },
  { value: 'diterbitkan', label: 'Diterbitkan' },
  { value: 'draf', label: 'Draf' },
];

const kolom = [
  {
    key: 'judul',
    label: 'Judul',
    render: (item) => <span className="font-medium text-gray-900 dark:text-gray-100">{potongTeks(item.judul, 60)}</span>,
  },
  {
    key: 'topik',
    label: 'Topik',
    render: (item) =>
      item.topik?.length > 0 ? (
        <span className="text-gray-600 dark:text-gray-400">{item.topik.join(', ')}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">—</span>
      ),
  },
  {
    key: 'penulis_nama',
    label: 'Penulis',
    render: (item) => <span className="text-gray-700 dark:text-gray-300">{item.penulis_nama || '—'}</span>,
  },
  {
    key: 'diterbitkan',
    label: 'Status',
    render: (item) => (
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs ${
          item.diterbitkan
            ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {item.diterbitkan ? 'Diterbitkan' : 'Draf'}
      </span>
    ),
  },
  {
    key: 'updated_at',
    label: 'Diperbarui',
    render: (item) => formatLocalDateTime(item.updated_at, { fallback: '—' }),
  },
];

// ─── Editor Tiptap ───────────────────────────────────────────────────────────

function EditorArtikel({ value, onChange, onUnggahGambar }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Markdown.configure({ transformCopiedText: true }),
    ],
    content: value || '',
    onUpdate({ editor: e }) {
      onChange('konten', e.storage.markdown.getMarkdown());
    },
  });

  // Sync external value changes (e.g. when switching articles)
  const prevValue = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value !== prevValue.current) {
      prevValue.current = value;
      const current = editor.storage.markdown.getMarkdown();
      if (current !== value) {
        editor.commands.setContent(value || '');
      }
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Konten<span className="text-red-500 ml-0.5">*</span></label>
      <div className="editor-toolbar">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'aktif' : ''} title="Tebal"><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'aktif' : ''} title="Miring"><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'aktif' : ''} title="Judul 2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'aktif' : ''} title="Judul 3">H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'aktif' : ''} title="Daftar butir">UL</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'aktif' : ''} title="Daftar bernomor">OL</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'aktif' : ''} title="Kutipan">&ldquo;&rdquo;</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'aktif' : ''} title="Blok kode">&lt;/&gt;</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis pembatas">&#8212;</button>
        {onUnggahGambar && (
          <label className="editor-toolbar-btn" title="Sisipkan gambar">
            Gambar
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onUnggahGambar} />
          </label>
        )}
      </div>
      <div className="editor-tiptap-wrapper">
        <EditorContent editor={editor} className="editor-tiptap-content" />
      </div>
    </div>
  );
}

// ─── Input Topik ─────────────────────────────────────────────────────────────

function InputTopik({ topik, onChange }) {
  const [inputVal, setInputVal] = useState('');

  const tambahTopik = () => {
    const val = inputVal.trim();
    if (!val) return;
    if (topik.includes(val)) {
      setInputVal('');
      return;
    }
    onChange('topik', [...topik, val]);
    setInputVal('');
  };

  const hapusTopik = (t) => {
    onChange('topik', topik.filter((x) => x !== t));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      tambahTopik();
    }
  };

  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Topik</label>
      <div className="flex flex-wrap gap-1 mb-2">
        {topik.map((t) => (
          <span key={t} className="badge-topik-admin">
            {t}
            <button type="button" onClick={() => hapusTopik(t)} className="ml-1 text-gray-500 hover:text-red-500" aria-label={`Hapus topik ${t}`}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik topik lalu Enter"
          className="form-admin-input flex-1"
        />
        <button type="button" onClick={tambahTopik} className="form-admin-btn-batal px-3">Tambah</button>
      </div>
    </div>
  );
}

// ─── Halaman Utama ───────────────────────────────────────────────────────────

function ArtikelAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { punyaIzin } = useAuth();
  const bolehTerbitkan = punyaIzin('terbitkan_artikel');

  const {
    cari, setCari, q, offset, setOffset,
    kirimCari, hapusCari, limit, currentPage,
    cursor, direction, lastPage,
  } = usePencarianAdmin(50);

  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);
  const [filterStatusDraft, setFilterStatusDraft] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const { data: resp, isLoading, isError } = useDaftarArtikelAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    status: filterStatus,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailArtikelAdmin(idDariPath);
  const { data: penggunaResp } = useAutocompletePengguna();
  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanArtikelAdmin();
  const hapus = useHapusArtikelAdmin();
  const terbitkan = useTerbitkanArtikelAdmin();
  const unggahGambar = useUnggahGambarArtikelAdmin();

  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const opsiPengguna = (penggunaResp?.data || []).map((p) => ({
    value: String(p.id),
    label: `${p.nama} (${p.surel})`,
  }));

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID artikel tidak valid.', sukses: '' });
    navigate('/redaksi/artikel', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting({
      ...detail,
      topik: Array.isArray(detail.topik) ? detail.topik : [],
    });
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Artikel tidak ditemukan.', sukses: '' });
    navigate('/redaksi/artikel', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/artikel', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/artikel', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    if (!item?.id) return;
    navigate(`/redaksi/artikel/${item.id}`);
  };

  const handleCari = () => {
    setFilterStatus(filterStatusDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterStatusDraft('');
    setFilterStatus('');
    hapusCari();
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'judul', label: 'Judul' },
      { name: 'konten', label: 'Konten' },
      { name: 'penulis_id', label: 'Penulis' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }
    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Artikel tersimpan.' });
        setTimeout(() => tutupPanel(), 600);
      },
      onError: (error) => {
        setPesan({ error: getApiErrorMessage(error, 'Gagal menyimpan artikel.'), sukses: '' });
      },
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus artikel ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (error) => {
        setPesan({ error: getApiErrorMessage(error, 'Gagal menghapus artikel.'), sukses: '' });
      },
    });
  };

  const handleTerbitkan = (diterbitkanBaru) => {
    if (!panel.data.id) return;
    const konfirmasi = diterbitkanBaru
      ? 'Terbitkan artikel ini ke publik?'
      : 'Tarik artikel ini dari publik (jadikan draf)?';
    if (!confirm(konfirmasi)) return;
    terbitkan.mutate({ id: panel.data.id, diterbitkan: diterbitkanBaru }, {
      onSuccess: (res) => {
        panel.ubahField('diterbitkan', res.data?.diterbitkan ?? diterbitkanBaru);
        panel.ubahField('diterbitkan_pada', res.data?.diterbitkan_pada ?? panel.data.diterbitkan_pada);
        setPesan({ error: '', sukses: diterbitkanBaru ? 'Artikel diterbitkan.' : 'Artikel dijadikan draf.' });
      },
      onError: (error) => {
        setPesan({ error: getApiErrorMessage(error, 'Gagal mengubah status terbit.'), sukses: '' });
      },
    });
  };

  const handleUnggahGambar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    unggahGambar.mutate(file, {
      onSuccess: (res) => {
        const url = res.data?.url;
        if (url) {
          panel.ubahField('konten', `${panel.data.konten || ''}\n\n![gambar](${url})\n`);
        }
      },
      onError: (error) => {
        setPesan({ error: getApiErrorMessage(error, 'Gagal mengunggah gambar.'), sukses: '' });
      },
    });
    e.target.value = '';
  };

  const judulPanel = panel.modeTambah ? 'Tambah Artikel' : 'Sunting Artikel';

  return (
    <HalamanAdmin judul="Artikel" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <FilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari judul artikel …"
        filters={[
          {
            key: 'status',
            value: filterStatusDraft,
            onChange: setFilterStatusDraft,
            options: opsiFilterStatus,
            ariaLabel: 'Filter status artikel',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={judulPanel} lebar="lebar">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />

        {!panel.modeTambah && panel.data.slug && (
          <div className="form-admin-group">
            <label className="form-admin-label">Slug</label>
            <p className="form-admin-input bg-gray-50 dark:bg-dark-bg text-gray-500 dark:text-gray-400 select-all">
              {panel.data.slug}
            </p>
          </div>
        )}

        <InputField
          label="Judul"
          name="judul"
          value={panel.data.judul}
          onChange={panel.ubahField}
          required
        />

        <SearchableSelectField
          label="Penulis"
          name="penulis_id"
          value={String(panel.data.penulis_id ?? '')}
          onChange={(name, val) => panel.ubahField(name, val ? Number(val) : null)}
          options={opsiPengguna}
          placeholder="Pilih penulis…"
          searchPlaceholder="Ketik nama atau surel…"
          required
        />

        <SearchableSelectField
          label="Penyunting"
          name="penyunting_id"
          value={String(panel.data.penyunting_id ?? '')}
          onChange={(name, val) => panel.ubahField(name, val ? Number(val) : null)}
          options={[{ value: '', label: '— Tidak ada —' }, ...opsiPengguna]}
          placeholder="Pilih penyunting…"
          searchPlaceholder="Ketik nama atau surel…"
        />

        <InputTopik
          topik={panel.data.topik || []}
          onChange={panel.ubahField}
        />

        <EditorArtikel
          value={panel.data.konten}
          onChange={panel.ubahField}
          onUnggahGambar={handleUnggahGambar}
        />

        {!panel.modeTambah && bolehTerbitkan && (
          <div className="form-admin-group">
            <label className="form-admin-label">Diterbitkan</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleTerbitkan(!panel.data.diterbitkan)}
                disabled={terbitkan.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  panel.data.diterbitkan ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    panel.data.diterbitkan ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {panel.data.diterbitkan ? 'Diterbitkan' : 'Draf'}
              </span>
            </div>
          </div>
        )}

        {!panel.modeTambah && (
          <div className="form-admin-group">
            <label className="form-admin-label">Diterbitkan pada</label>
            <input
              type="datetime-local"
              value={panel.data.diterbitkan_pada ? panel.data.diterbitkan_pada.slice(0, 16) : ''}
              onChange={(e) => panel.ubahField('diterbitkan_pada', e.target.value ? `${e.target.value}:00` : null)}
              className="form-admin-input"
            />
          </div>
        )}

        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          onHapus={!panel.modeTambah ? handleHapus : undefined}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </HalamanAdmin>
  );
}

export default ArtikelAdmin;
