/**
 * @fileoverview Halaman Pohon Kalimat — alat bantu diagram sintaksis bahasa Indonesia.
 */

import { useRef, useState } from 'react';
import { Info } from 'lucide-react';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';
import PohonKalimatDiagram, { unduPng, unduSvg } from './pohon-kalimat/PohonKalimatDiagram';
import {
  CONTOH,
  JENIS_FRASA,
  PERAN,
  buatKlausa,
  buatKlausaTersisip,
  buatKonstituen,
  buatStateMajemuk,
  buatStateTunggal,
} from './pohon-kalimat/pohonKalimatModel';

// ─── Sub-komponen builder ─────────────────────────────────────────────────────

function BarisPilihan({ label, htmlFor, children }) {
  return (
    <div className="pohon-baris-pilihan">
      <label htmlFor={htmlFor} className="sr-only">{label}</label>
      {children}
    </div>
  );
}

function BarisKonstituen({ k, onChange, onHapus, bisaHapus }) {
  return (
    <div className="pohon-konstituen-baris">
      <div className="pohon-konstituen-selects">
        <BarisPilihan label="Peran" htmlFor={`peran-${k.id}`}>
          <select
            id={`peran-${k.id}`}
            className="pohon-select"
            value={k.peran}
            onChange={(e) => onChange(k.id, 'peran', e.target.value)}
          >
            {PERAN.map((p) => (
              <option key={p.kode} value={p.kode}>{p.label}</option>
            ))}
          </select>
        </BarisPilihan>
        <BarisPilihan label="Jenis Frasa" htmlFor={`frasa-${k.id}`}>
          <select
            id={`frasa-${k.id}`}
            className="pohon-select"
            value={k.jenisFrasa}
            onChange={(e) => onChange(k.id, 'jenisFrasa', e.target.value)}
          >
            {JENIS_FRASA.map((f) => (
              <option key={f.kode} value={f.kode}>{f.label}</option>
            ))}
          </select>
        </BarisPilihan>
      </div>
      <div className="pohon-konstituen-teks-row">
        <input
          type="text"
          className="pohon-input"
          placeholder="Tulis segmen kalimat…"
          value={k.teks}
          onChange={(e) => onChange(k.id, 'teks', e.target.value)}
          aria-label="Teks segmen"
        />
        {bisaHapus && (
          <button
            type="button"
            className="pohon-btn-hapus"
            onClick={() => onHapus(k.id)}
            aria-label="Hapus konstituen"
            title="Hapus"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function BlokKlausa({ klausa, onUbahKonstituen, onTambahKonstituen, onHapusKonstituen, onUbahTersisip, onTambahTersisip, onHapusTersisip }) {
  return (
    <div className="pohon-klausa-blok">
      <p className="pohon-klausa-label">{klausa.label}</p>
      {klausa.konstituen.map((k) => (
        <BarisKonstituen
          key={k.id}
          k={k}
          onChange={onUbahKonstituen}
          onHapus={onHapusKonstituen}
          bisaHapus={klausa.konstituen.length > 1}
        />
      ))}
      <button type="button" className="pohon-btn-tambah" onClick={() => onTambahKonstituen(klausa.id)}>
        + Tambah konstituen
      </button>

      {/* Sub-klausa tersisip */}
      {klausa.klausaTersisip ? (
        <div className="pohon-tersisip-blok">
          <div className="pohon-tersisip-header">
            <span className="pohon-tersisip-label">Sub-klausa tersisip</span>
            <button type="button" className="pohon-btn-hapus-tersisip" onClick={() => onHapusTersisip(klausa.id)}>
              Hapus sub-klausa
            </button>
          </div>
          <div className="pohon-konstituen-teks-row pohon-konstituen-teks-row-spaced">
            <input
              type="text"
              className="pohon-input"
              placeholder="Konjungsi (karena, bahwa, …)"
              value={klausa.klausaTersisip.konjungsi}
              onChange={(e) => onUbahTersisip(klausa.id, 'konjungsi', e.target.value)}
              aria-label="Konjungsi sub-klausa"
            />
          </div>
          {klausa.klausaTersisip.klausa.konstituen.map((k) => (
            <BarisKonstituen
              key={k.id}
              k={k}
              onChange={(id, field, val) => onUbahTersisip(klausa.id, 'konstituen', { id, field, val })}
              onHapus={(id) => onUbahTersisip(klausa.id, 'hapusKonstituen', id)}
              bisaHapus={klausa.klausaTersisip.klausa.konstituen.length > 1}
            />
          ))}
          <button
            type="button"
            className="pohon-btn-tambah"
            onClick={() => onUbahTersisip(klausa.id, 'tambahKonstituen', null)}
          >
            + Tambah konstituen sub-klausa
          </button>
        </div>
      ) : (
        <button type="button" className="pohon-btn-tersisip" onClick={() => onTambahTersisip(klausa.id)}>
          + Tambah sub-klausa tersisip
        </button>
      )}
    </div>
  );
}

// ─── Halaman utama ────────────────────────────────────────────────────────────

function PohonKalimat() {
  const svgRef = useRef(null);
  const [state, setState] = useState(buatStateTunggal);
  const [berwarna, setBerwarna] = useState(true);
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);

  // ── Ganti jenis tunggal/majemuk ──
  const gantiJenis = (jenis) => {
    setState(jenis === 'tunggal' ? buatStateTunggal() : buatStateMajemuk());
  };

  // ── Isi contoh ──
  const isiContoh = (contoh) => {
    setState(JSON.parse(JSON.stringify(contoh.state)));
  };

  // ── Mutasi kalimat tunggal ──
  const ubahKonstituen = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      konstituen: prev.konstituen.map((k) => (k.id === id ? { ...k, [field]: value } : k)),
    }));
  };

  const tambahKonstituen = () => {
    setState((prev) => ({
      ...prev,
      konstituen: [...prev.konstituen, buatKonstituen()],
    }));
  };

  const hapusKonstituen = (id) => {
    setState((prev) => ({
      ...prev,
      konstituen: prev.konstituen.filter((k) => k.id !== id),
    }));
  };

  // ── Mutasi kalimat majemuk ──
  const ubahKonjungsi = (id, teks) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) => (s.id === id ? { ...s, teks } : s)),
    }));
  };

  const tambahKlausa = () => {
    setState((prev) => {
      const jumlahKlausa = prev.segmen.filter((s) => s.tipe === 'klausa').length;
      const label = `Kl${['₁','₂','₃','₄','₅','₆'][jumlahKlausa] ?? jumlahKlausa + 1}`;
      const novoKlausa = { tipe: 'klausa', ...buatKlausa(label) };
      const novaKonj = { tipe: 'konjungsi', id: `konj-${Date.now()}`, teks: '' };
      return { ...prev, segmen: [...prev.segmen, novaKonj, novoKlausa] };
    });
  };

  const hapusKlausa = (id) => {
    setState((prev) => {
      const idx = prev.segmen.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const segmen = [...prev.segmen];
      // Hapus juga konjungsi sebelumnya (jika ada)
      const hapusIdx = idx > 0 && segmen[idx - 1].tipe === 'konjungsi' ? idx - 1 : idx;
      segmen.splice(hapusIdx, hapusIdx === idx - 1 ? 2 : 1);
      return { ...prev, segmen };
    });
  };

  const ubahKonstituenKlausa = (klausaId, id, field, value) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) =>
        s.id === klausaId
          ? { ...s, konstituen: s.konstituen.map((k) => (k.id === id ? { ...k, [field]: value } : k)) }
          : s,
      ),
    }));
  };

  const tambahKonstituenKlausa = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) =>
        s.id === klausaId ? { ...s, konstituen: [...s.konstituen, buatKonstituen()] } : s,
      ),
    }));
  };

  const hapusKonstituenKlausa = (klausaId, id) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) =>
        s.id === klausaId ? { ...s, konstituen: s.konstituen.filter((k) => k.id !== id) } : s,
      ),
    }));
  };

  const tambahTersisip = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) =>
        s.id === klausaId ? { ...s, klausaTersisip: buatKlausaTersisip() } : s,
      ),
    }));
  };

  const hapusTersisip = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) =>
        s.id === klausaId ? { ...s, klausaTersisip: null } : s,
      ),
    }));
  };

  const ubahTersisip = (klausaId, aksi, payload) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) => {
        if (s.id !== klausaId || !s.klausaTersisip) return s;
        const t = s.klausaTersisip;
        if (aksi === 'konjungsi') return { ...s, klausaTersisip: { ...t, konjungsi: payload } };
        if (aksi === 'konstituen') {
          const { id, field, val } = payload;
          return {
            ...s,
            klausaTersisip: {
              ...t,
              klausa: {
                ...t.klausa,
                konstituen: t.klausa.konstituen.map((k) => (k.id === id ? { ...k, [field]: val } : k)),
              },
            },
          };
        }
        if (aksi === 'tambahKonstituen') {
          return {
            ...s,
            klausaTersisip: {
              ...t,
              klausa: { ...t.klausa, konstituen: [...t.klausa.konstituen, buatKonstituen()] },
            },
          };
        }
        if (aksi === 'hapusKonstituen') {
          return {
            ...s,
            klausaTersisip: {
              ...t,
              klausa: { ...t.klausa, konstituen: t.klausa.konstituen.filter((k) => k.id !== payload) },
            },
          };
        }
        return s;
      }),
    }));
  };

  const adaPohon = state.jenis === 'tunggal'
    ? state.konstituen.some((k) => k.teks.trim())
    : state.segmen.some((s) => s.tipe === 'klausa' && s.konstituen.some((k) => k.teks.trim()));

  return (
    <HalamanPublik
      judul="Pohon Kalimat"
      deskripsi="Alat bantu diagram pohon sintaksis untuk menganalisis struktur kalimat bahasa Indonesia — kalimat tunggal maupun majemuk bertingkat."
      tampilkanJudul={false}
    >
      <div className="alat-page">
        <div className="alat-heading-row">
          <h1 className="alat-page-heading">Pohon Kalimat</h1>
          <button
            type="button"
            className="alat-heading-info-button"
            aria-label={panelInfoTerbuka ? 'Kembali ke alat' : 'Lihat informasi alat'}
            onClick={() => setPanelInfoTerbuka((value) => !value)}
          >
            <Info size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {panelInfoTerbuka ? (
          <section className="alat-panel alat-info-panel">
            <KontenMarkdownStatis
              src="/halaman/alat/pohon-kalimat.md"
              className="halaman-markdown-content"
              loadingText="Memuat informasi alat ..."
              errorText="Gagal memuat informasi alat."
            />
          </section>
        ) : (
          <div className="alat-tool-layout pohon-tool-layout">
          {/* ── Panel builder ── */}
          <section className="alat-panel" aria-labelledby="pohon-input-title">
            <div className="alat-panel-header">
              <h2 id="pohon-input-title" className="alat-panel-title">Masukan</h2>
            </div>

            <div className="alat-contoh-row" aria-label="Contoh cepat pohon kalimat">
              {CONTOH.map((c, i) => (
                <button key={i} type="button" className="alat-pill-button" onClick={() => isiContoh(c)}>
                  {c.judul}
                </button>
              ))}
            </div>

            {/* Toggle jenis */}
            <div className="pohon-jenis-toggle" role="group" aria-label="Jenis kalimat">
              <button
                type="button"
                className={`pohon-jenis-btn ${state.jenis === 'tunggal' ? 'pohon-jenis-btn-active' : ''}`}
                onClick={() => gantiJenis('tunggal')}
              >
                Tunggal
              </button>
              <button
                type="button"
                className={`pohon-jenis-btn ${state.jenis === 'majemuk' ? 'pohon-jenis-btn-active' : ''}`}
                onClick={() => gantiJenis('majemuk')}
              >
                Majemuk
              </button>
            </div>

            {/* Builder tunggal */}
            {state.jenis === 'tunggal' && (
              <div className="pohon-builder-tunggal">
                {state.konstituen.map((k) => (
                  <BarisKonstituen
                    key={k.id}
                    k={k}
                    onChange={ubahKonstituen}
                    onHapus={hapusKonstituen}
                    bisaHapus={state.konstituen.length > 1}
                  />
                ))}
                <button type="button" className="pohon-btn-tambah" onClick={tambahKonstituen}>
                  + Tambah konstituen
                </button>
              </div>
            )}

            {/* Builder majemuk */}
            {state.jenis === 'majemuk' && (
              <div className="pohon-builder-majemuk">
                {state.segmen.map((seg) => {
                  if (seg.tipe === 'konjungsi') {
                    return (
                      <div key={seg.id} className="pohon-konj-baris">
                        <label className="pohon-konj-label" htmlFor={`konj-${seg.id}`}>Konjungsi</label>
                        <input
                          id={`konj-${seg.id}`}
                          type="text"
                          className="pohon-input pohon-input-konj"
                          placeholder="dan, tetapi, karena, …"
                          value={seg.teks}
                          onChange={(e) => ubahKonjungsi(seg.id, e.target.value)}
                        />
                      </div>
                    );
                  }
                  return (
                    <BlokKlausa
                      key={seg.id}
                      klausa={seg}
                      onUbahKonstituen={(id, field, val) => ubahKonstituenKlausa(seg.id, id, field, val)}
                      onTambahKonstituen={tambahKonstituenKlausa}
                      onHapusKonstituen={(id) => hapusKonstituenKlausa(seg.id, id)}
                      onTambahTersisip={tambahTersisip}
                      onHapusTersisip={hapusTersisip}
                      onUbahTersisip={ubahTersisip}
                    />
                  );
                })}
                {state.segmen.filter((s) => s.tipe === 'klausa').length < 6 && (
                  <button type="button" className="pohon-btn-tambah" onClick={tambahKlausa}>
                    + Tambah klausa
                  </button>
                )}
                {state.segmen.filter((s) => s.tipe === 'klausa').length > 2 && (
                  <button
                    type="button"
                    className="pohon-btn-hapus-klausa"
                    onClick={() => hapusKlausa(state.segmen.filter((s) => s.tipe === 'klausa').at(-1).id)}
                  >
                    − Hapus klausa terakhir
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ── Panel pohon ── */}
          <section className="alat-panel pohon-panel-hasil" aria-labelledby="pohon-output-title">
            <div className="pohon-hasil-header">
              <div className="alat-panel-header">
                <h2 id="pohon-output-title" className="alat-panel-title">Hasil</h2>
              </div>
              <div className="pohon-hasil-aksi">
                <button
                  type="button"
                  className={`pohon-warna-btn ${berwarna ? 'pohon-warna-btn-active' : ''}`}
                  onClick={() => setBerwarna((v) => !v)}
                  title={berwarna ? 'Aktif: berwarna' : 'Aktif: hitam-putih'}
                >
                  {berwarna ? 'Berwarna' : 'Hitam-Putih'}
                </button>
                {adaPohon && (
                  <>
                    <button type="button" className="alat-link-secondary pohon-ekspor-btn" onClick={() => svgRef.current && unduSvg(svgRef.current)}>
                      Unduh SVG
                    </button>
                    <button type="button" className="alat-link-secondary pohon-ekspor-btn" onClick={() => svgRef.current && unduPng(svgRef.current)}>
                      Unduh PNG
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pohon-svg-wrap">
              {adaPohon ? (
                <PohonKalimatDiagram ref={svgRef} state={state} berwarna={berwarna} />
              ) : (
                <p className="alat-empty-text pohon-empty-text">Pohon akan muncul di sini.</p>
              )}
            </div>

            <div className="alat-notes">
              <p className="alat-note-item">FN = Frasa Nominal, FV = Frasa Verbal, FAdj = Frasa Adjektival, FAdv = Frasa Adverbial, FNum = Frasa Numeralia, FPrep = Frasa Preposisional.</p>
              <p className="alat-note-item">Unduh SVG untuk hasil vektor (skala bebas). Unduh PNG untuk gambar resolusi 2×.</p>
            </div>
          </section>
          </div>
        )}
      </div>
    </HalamanPublik>
  );
}

export default PohonKalimat;
