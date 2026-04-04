/**
 * @fileoverview Halaman redaksi untuk manajemen artikel editorial
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
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
import TeksMarkdownInline from '../../../components/tampilan/TeksMarkdownInline';
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
import { formatWallClockDateTime, normalizeLocalDateTimeValue } from '../../../utils/formatUtils';
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

function buatTimestampLokalSekarang() {
  const sekarang = new Date();
  const pad2 = (nilai) => String(nilai).padStart(2, '0');

  return `${sekarang.getFullYear()}-${pad2(sekarang.getMonth() + 1)}-${pad2(sekarang.getDate())}T${pad2(sekarang.getHours())}:${pad2(sekarang.getMinutes())}:00`;
}

function buatNilaiAwalArtikel(penggunaId = null) {
  return {
    ...nilaiAwal,
    penulis_id: penggunaId,
    diterbitkan_pada: buatTimestampLokalSekarang(),
  };
}

function normalizeTopikArtikel(topik) {
  const daftar = Array.isArray(topik) ? topik : (topik ? [topik] : []);
  const unikValid = [];
  const seen = new Set();

  daftar.forEach((nilai) => {
    const bersih = String(nilai || '').trim().replace(/\s+/g, ' ');
    if (!bersih) return;
    const key = bersih.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unikValid.push(bersih);
  });

  return unikValid;
}

function isInternalArticleHref(href = '') {
  return String(href || '').trim().startsWith('/');
}

function normalizeArtikelHref(href = '') {
  const trimmed = String(href || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  if (/^(?:https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(?:[/?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function buildArtikelLinkExtension() {
  return LinkExtension.configure({
    openOnClick: false,
    autolink: false,
    linkOnPaste: true,
    HTMLAttributes: {
      rel: 'noopener noreferrer',
    },
    isAllowedUri: (url, ctx) => {
      if (isInternalArticleHref(url)) return true;
      if (String(url || '').startsWith('#')) return true;
      return ctx.defaultValidate(url);
    },
  });
}

const opsiFilterStatus = [
  { value: '', label: '—Status—' },
  { value: 'diterbitkan', label: 'Terbit' },
  { value: 'draf', label: 'Draf' },
];

const kolom = [
  {
    key: 'diterbitkan_pada',
    label: 'Terbit',
    render: (item) => <span className="text-gray-700 dark:text-gray-300">{formatWallClockDateTime(item.diterbitkan_pada, { fallback: '—' })}</span>,
  },
  {
    key: 'judul',
    label: 'Judul',
    render: (item) => {
      const judul = potongTeks(item.judul, 60);
      if (!item.slug) {
        return <TeksMarkdownInline className="text-gray-900 dark:text-gray-100" text={judul} />;
      }

      return (
        <Link
          to={`/artikel/${item.slug}`}
          onClick={(event) => event.stopPropagation()}
          className="text-sky-700 hover:underline dark:text-sky-300"
        >
          <TeksMarkdownInline className="text-inherit" text={judul} />
        </Link>
      );
    },
  },
  {
    key: 'penulis_nama',
    label: 'Penulis',
    render: (item) => <span className="text-gray-700 dark:text-gray-300">{item.penulis_nama || item.penulis || '—'}</span>,
  },
  {
    key: 'topik',
    label: 'Topik',
    render: (item) => {
      const topik = normalizeTopikArtikel(item.topik);
      return topik.length > 0 ? (
        <span className="text-gray-600 dark:text-gray-400">{topik.join(', ')}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">—</span>
      );
    },
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
        {item.diterbitkan ? 'Terbit' : 'Draf'}
      </span>
    ),
  },
];

function EditorArtikel({ value, onChange, onUnggahGambar }) {
  const editor = useEditor({
    extensions: [StarterKit, Image, buildArtikelLinkExtension(), Markdown.configure({ transformCopiedText: true })],
    content: value || '',
    onUpdate({ editor: editorInstance }) {
      onChange('konten', editorInstance.storage.markdown.getMarkdown());
    },
  });

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

  const aktifLink = editor.isActive('link');

  const handleLinkAction = () => {
    const currentHref = editor.getAttributes('link')?.href || '';
    const inputHref = window.prompt('Masukkan URL tautan. Gunakan /... untuk tautan internal.', currentHref);
    if (inputHref === null) return;

    const href = normalizeArtikelHref(inputHref);
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    const selectionEmpty = Boolean(editor.state?.selection?.empty);
    if (selectionEmpty) {
      const labelTautan = window.prompt('Masukkan teks tautan.', '');
      if (labelTautan === null) return;

      const text = String(labelTautan || '').trim();
      if (!text) return;

      editor.chain().focus().insertContent({
        type: 'text',
        text,
        marks: [{ type: 'link', attrs: { href } }],
      }).run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Konten<span className="ml-0.5 text-red-500">*</span></label>
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
        <button type="button" onClick={handleLinkAction} className={aktifLink ? 'aktif' : ''} title="Sisipkan atau ubah tautan">Link</button>
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

export const __private = {
  isInternalArticleHref,
  normalizeArtikelHref,
  buildArtikelLinkExtension,
};

function InputTopik({ topik, onChange }) {
  const topikTerpilih = normalizeTopikArtikel(topik);
  const [queryInput, setQueryInput] = useState('');

  const tambahTopik = () => {
    const nilai = String(queryInput || '').trim().replace(/\s+/g, ' ');
    if (!nilai) return;
    const sudahAda = topikTerpilih.some((item) => item.toLowerCase() === nilai.toLowerCase());
    if (sudahAda) {
      setQueryInput('');
      return;
    }
    onChange('topik', [...topikTerpilih, nilai]);
    setQueryInput('');
  };

  const hapusTopik = (nilai) => {
    onChange('topik', topikTerpilih.filter((item) => item !== nilai));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      tambahTopik();
    }
  };

  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Topik</label>
      <div className="artikel-admin-topik-input-wrap">
        {topikTerpilih.map((nilai) => (
          <span key={nilai} className="artikel-admin-topik-chip">
            {nilai}
            <button
              type="button"
              onClick={() => hapusTopik(nilai)}
              className="opacity-60 hover:opacity-100"
              aria-label={`Hapus topik ${nilai}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          aria-label="Input topik artikel"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={tambahTopik}
          placeholder={topikTerpilih.length === 0 ? 'Tambah topik …' : ''}
          className="artikel-admin-topik-input"
        />
      </div>
      <p className="artikel-admin-status-bantuan">Tekan Enter atau koma untuk menambahkan topik.</p>
    </div>
  );
}

function StatusArtikelField({ data, modeTambah, bolehTerbitkan, isPending, onToggle }) {
  const bisaUbah = bolehTerbitkan;

  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Status</label>
      <button
        type="button"
        aria-label="Status artikel"
        onClick={() => bisaUbah && onToggle(!data.diterbitkan)}
        disabled={!bisaUbah || isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          data.diterbitkan ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            data.diterbitkan ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
        {data.diterbitkan ? 'Terbit' : 'Draf'}
      </span>
      {!modeTambah && !bolehTerbitkan && <p className="artikel-admin-status-bantuan">Status hanya dapat diubah oleh pengguna dengan izin penerbitan.</p>}
    </div>
  );
}

function ArtikelAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { punyaIzin, user } = useAuth();
  const bolehTerbitkan = punyaIzin('terbitkan_artikel');
  const penggunaIdAktif = Number(user?.pid || user?.id || 0) || null;

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
    label: p.nama,
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
      topik: normalizeTopikArtikel(detail.topik),
      diterbitkan_pada: normalizeLocalDateTimeValue(detail.diterbitkan_pada),
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
    panel.bukaUntukTambah(buatNilaiAwalArtikel(penggunaIdAktif));
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
    simpan.mutate({
      ...panel.data,
      topik: normalizeTopikArtikel(panel.data.topik),
      diterbitkan_pada: normalizeLocalDateTimeValue(panel.data.diterbitkan_pada),
    }, {
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
    if (!panel.data.id) {
      panel.ubahField('diterbitkan', diterbitkanBaru);
      return;
    }

    terbitkan.mutate({ id: panel.data.id, diterbitkan: diterbitkanBaru }, {
      onSuccess: (res) => {
        panel.ubahField('diterbitkan', res.data?.diterbitkan ?? diterbitkanBaru);
        panel.ubahField(
          'diterbitkan_pada',
          normalizeLocalDateTimeValue(res.data?.diterbitkan_pada) ?? panel.data.diterbitkan_pada
        );
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

        <InputField
          label="Judul"
          name="judul"
          value={panel.data.judul}
          onChange={panel.ubahField}
          required
        />

        <div className="artikel-admin-grid-dua-kolom">
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
        </div>

        <InputTopik topik={panel.data.topik || []} onChange={panel.ubahField} />

        <div className="artikel-admin-grid-dua-kolom">
          <div className="form-admin-group">
            <label htmlFor="field-diterbitkan-pada-artikel" className="form-admin-label">Terbit</label>
            <input
              id="field-diterbitkan-pada-artikel"
              type="datetime-local"
              value={panel.data.diterbitkan_pada ? panel.data.diterbitkan_pada.slice(0, 16) : ''}
              onChange={(e) => panel.ubahField('diterbitkan_pada', e.target.value ? `${e.target.value}:00` : null)}
              className="form-admin-input"
            />
          </div>

          <StatusArtikelField
            data={panel.data}
            modeTambah={panel.modeTambah}
            bolehTerbitkan={bolehTerbitkan}
            isPending={terbitkan.isPending}
            onToggle={handleTerbitkan}
          />
        </div>

        <EditorArtikel
          value={panel.data.konten}
          onChange={panel.ubahField}
          onUnggahGambar={handleUnggahGambar}
        />

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
