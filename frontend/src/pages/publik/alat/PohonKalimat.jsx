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
  TIPE_KLAUSA,
  buatKlausa,
  buatKlausaAnak,
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

/** Editor mini untuk klausaAnak di dalam konstituen (1 level dalam). */
function BlokKlausaAnak({ klausa, onChange, onUbahKonstituen, onTambahKonstituen, onHapusKonstituen }) {
  return (
    <div className="pohon-klausa-anak-blok">
      <div className="pohon-klausa-meta">
        <BarisPilihan label="Label klausa anak" htmlFor={`ka-label-${klausa.id}`}>
          <select
            id={`ka-label-${klausa.id}`}
            className="pohon-select pohon-select-sm"
            value={klausa.label}
            onChange={(e) => onChange('label', e.target.value)}
          >
            {TIPE_KLAUSA.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </BarisPilihan>
        <label className="pohon-segitiga-toggle">
          <input
            type="checkbox"
            checked={klausa.segitiga}
            onChange={() => onChange('segitiga', !klausa.segitiga)}
            aria-label="Tampilkan sebagai segitiga"
          />
          <span>Segitiga</span>
        </label>
      </div>

      {klausa.segitiga ? (
        <input
          type="text"
          className="pohon-input"
          placeholder="Isi klausa (ditampilkan di dasar segitiga)…"
          value={klausa.teksSegitiga}
          onChange={(e) => onChange('teksSegitiga', e.target.value)}
          aria-label="Teks segitiga klausa anak"
        />
      ) : (
        <>
          {klausa.konstituen.map((k) => (
            <div key={k.id} className="pohon-konstituen-baris pohon-konstituen-baris-sm">
              <div className="pohon-konstituen-selects">
                <BarisPilihan label="Peran" htmlFor={`ka-peran-${k.id}`}>
                  <select
                    id={`ka-peran-${k.id}`}
                    className="pohon-select"
                    value={k.peran}
                    onChange={(e) => onUbahKonstituen(k.id, 'peran', e.target.value)}
                  >
                    {PERAN.map((p) => (
                      <option key={p.kode} value={p.kode}>{p.kode} — {p.label}</option>
                    ))}
                  </select>
                </BarisPilihan>
                {k.peran !== 'Konj' && (
                  <BarisPilihan label="Jenis Frasa" htmlFor={`ka-frasa-${k.id}`}>
                    <select
                      id={`ka-frasa-${k.id}`}
                      className="pohon-select"
                      value={k.jenisFrasa}
                      onChange={(e) => onUbahKonstituen(k.id, 'jenisFrasa', e.target.value)}
                    >
                      {JENIS_FRASA.map((f) => (
                        <option key={f.kode} value={f.kode}>{f.kode}</option>
                      ))}
                    </select>
                  </BarisPilihan>
                )}
              </div>
              <div className="pohon-konstituen-teks-row">
                <input
                  type="text"
                  className="pohon-input"
                  placeholder="Teks segmen…"
                  value={k.teks}
                  onChange={(e) => onUbahKonstituen(k.id, 'teks', e.target.value)}
                  aria-label="Teks segmen klausa anak"
                />
                {klausa.konstituen.length > 1 && (
                  <button
                    type="button"
                    className="pohon-btn-hapus"
                    onClick={() => onHapusKonstituen(k.id)}
                    aria-label="Hapus konstituen"
                    title="Hapus"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="pohon-btn-tambah" onClick={onTambahKonstituen}>
            + Tambah konstituen
          </button>
        </>
      )}
    </div>
  );
}

function BarisKonstituen({
  k,
  onChange,
  onHapus,
  bisaHapus,
  onToggleRealisasi,
  onKlausaAnakChange,
  onKlausaAnakUbahKonstituen,
  onKlausaAnakTambahKonstituen,
  onKlausaAnakHapusKonstituen,
}) {
  const isKlausa = k.realisasi === 'klausa';

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
              <option key={p.kode} value={p.kode}>{p.kode} — {p.label}</option>
            ))}
          </select>
        </BarisPilihan>
        <div className="pohon-realisasi-toggle" role="group" aria-label="Realisasi konstituen">
          <button
            type="button"
            className={`pohon-realisasi-btn ${!isKlausa ? 'pohon-realisasi-btn-active' : ''}`}
            onClick={() => isKlausa && onToggleRealisasi(k.id)}
          >
            Frasa
          </button>
          <button
            type="button"
            className={`pohon-realisasi-btn ${isKlausa ? 'pohon-realisasi-btn-active' : ''}`}
            onClick={() => !isKlausa && onToggleRealisasi(k.id)}
          >
            Klausa
          </button>
        </div>
      </div>

      {isKlausa ? (
        k.klausaAnak && (
          <BlokKlausaAnak
            klausa={k.klausaAnak}
            onChange={(field, val) => onKlausaAnakChange(k.id, field, val)}
            onUbahKonstituen={(subId, field, val) => onKlausaAnakUbahKonstituen(k.id, subId, field, val)}
            onTambahKonstituen={() => onKlausaAnakTambahKonstituen(k.id)}
            onHapusKonstituen={(subId) => onKlausaAnakHapusKonstituen(k.id, subId)}
          />
        )
      ) : (
        <div className="pohon-konstituen-frasa">
          {k.peran !== 'Konj' && (
            <BarisPilihan label="Jenis Frasa" htmlFor={`frasa-${k.id}`}>
              <select
                id={`frasa-${k.id}`}
                className="pohon-select"
                value={k.jenisFrasa}
                onChange={(e) => onChange(k.id, 'jenisFrasa', e.target.value)}
              >
                {JENIS_FRASA.map((f) => (
                  <option key={f.kode} value={f.kode}>{f.kode} — {f.label}</option>
                ))}
              </select>
            </BarisPilihan>
          )}
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
      )}

      {isKlausa && bisaHapus && (
        <div className="pohon-konstituen-teks-row">
          <span className="pohon-konstituen-realisasi-label">
            Konstituen ini direalisasikan oleh klausa.
          </span>
          <button
            type="button"
            className="pohon-btn-hapus"
            onClick={() => onHapus(k.id)}
            aria-label="Hapus konstituen"
            title="Hapus"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function BlokKlausa({
  klausa,
  onUbahKonstituen,
  onTambahKonstituen,
  onHapusKonstituen,
  onUbahTersisip,
  onTambahTersisip,
  onHapusTersisip,
  onUbahLabel,
  onToggleSegitiga,
  onUbahTeksSegitiga,
  onToggleRealisasiKonstituen,
  onKlausaAnakChange,
  onKlausaAnakUbahKonstituen,
  onKlausaAnakTambahKonstituen,
  onKlausaAnakHapusKonstituen,
}) {
  return (
    <div className="pohon-klausa-blok">
      {/* Header: label + segitiga */}
      <div className="pohon-klausa-meta">
        <BarisPilihan label="Label klausa" htmlFor={`klausa-label-${klausa.id}`}>
          <select
            id={`klausa-label-${klausa.id}`}
            className="pohon-select pohon-select-sm"
            value={klausa.label}
            onChange={(e) => onUbahLabel(klausa.id, e.target.value)}
          >
            {TIPE_KLAUSA.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            {/* Jika label saat ini tidak termasuk TIPE_KLAUSA (mis. Kl₁) tetap tampilkan */}
            {!TIPE_KLAUSA.includes(klausa.label) && (
              <option value={klausa.label}>{klausa.label}</option>
            )}
          </select>
        </BarisPilihan>
        <label className="pohon-segitiga-toggle">
          <input
            type="checkbox"
            checked={klausa.segitiga}
            onChange={() => onToggleSegitiga(klausa.id)}
            aria-label={`Tampilkan ${klausa.label} sebagai segitiga`}
          />
          <span>Segitiga</span>
        </label>
      </div>

      {klausa.segitiga ? (
        <input
          type="text"
          className="pohon-input"
          placeholder="Isi klausa (ditampilkan di dasar segitiga)…"
          value={klausa.teksSegitiga}
          onChange={(e) => onUbahTeksSegitiga(klausa.id, e.target.value)}
          aria-label="Teks segitiga klausa"
        />
      ) : (
        <>
          {klausa.konstituen.map((k) => (
            <BarisKonstituen
              key={k.id}
              k={k}
              onChange={onUbahKonstituen}
              onHapus={onHapusKonstituen}
              bisaHapus={klausa.konstituen.length > 1}
              onToggleRealisasi={onToggleRealisasiKonstituen}
              onKlausaAnakChange={onKlausaAnakChange}
              onKlausaAnakUbahKonstituen={onKlausaAnakUbahKonstituen}
              onKlausaAnakTambahKonstituen={onKlausaAnakTambahKonstituen}
              onKlausaAnakHapusKonstituen={onKlausaAnakHapusKonstituen}
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
                  onToggleRealisasi={() => {}}
                  onKlausaAnakChange={() => {}}
                  onKlausaAnakUbahKonstituen={() => {}}
                  onKlausaAnakTambahKonstituen={() => {}}
                  onKlausaAnakHapusKonstituen={() => {}}
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
        </>
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

  const isiContoh = (contoh) => {
    setState(JSON.parse(JSON.stringify(contoh.state)));
  };

  // ── Helper update nested ──
  function updateKlausaAnak(konstituen, id, updater) {
    return konstituen.map((k) => (k.id !== id ? k : { ...k, klausaAnak: updater(k.klausaAnak) }));
  }

  function updateSegmenKlausa(segmen, klausaId, updater) {
    return segmen.map((s) => (s.id !== klausaId || s.tipe !== 'klausa' ? s : updater(s)));
  }

  function updateKlausaAnakDalamSegmen(segmen, klausaId, konstituenId, updater) {
    return updateSegmenKlausa(segmen, klausaId, (kl) => ({
      ...kl,
      konstituen: updateKlausaAnak(kl.konstituen, konstituenId, updater),
    }));
  }

  // ── Mutasi tunggal ──
  const toggleKlausaUtama = () => setState((prev) => ({ ...prev, klausaUtama: !prev.klausaUtama }));

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

  const toggleRealisasiKonstituen = (id) => {
    setState((prev) => ({
      ...prev,
      konstituen: prev.konstituen.map((k) => {
        if (k.id !== id) return k;
        return k.realisasi === 'klausa'
          ? { ...k, realisasi: 'frasa', klausaAnak: null }
          : { ...k, realisasi: 'klausa', klausaAnak: buatKlausaAnak() };
      }),
    }));
  };

  const ubahKlausaAnakProp = (konstituenId, field, val) => {
    setState((prev) => ({
      ...prev,
      konstituen: updateKlausaAnak(prev.konstituen, konstituenId, (ka) => ({ ...ka, [field]: val })),
    }));
  };

  const ubahKonstituenKlausaAnak = (konstituenId, subId, field, val) => {
    setState((prev) => ({
      ...prev,
      konstituen: updateKlausaAnak(prev.konstituen, konstituenId, (ka) => ({
        ...ka,
        konstituen: ka.konstituen.map((sk) => (sk.id === subId ? { ...sk, [field]: val } : sk)),
      })),
    }));
  };

  const tambahKonstituenKlausaAnak = (konstituenId) => {
    setState((prev) => ({
      ...prev,
      konstituen: updateKlausaAnak(prev.konstituen, konstituenId, (ka) => ({
        ...ka,
        konstituen: [...ka.konstituen, buatKonstituen()],
      })),
    }));
  };

  const hapusKonstituenKlausaAnak = (konstituenId, subId) => {
    setState((prev) => ({
      ...prev,
      konstituen: updateKlausaAnak(prev.konstituen, konstituenId, (ka) => ({
        ...ka,
        konstituen: ka.konstituen.filter((sk) => sk.id !== subId),
      })),
    }));
  };

  // ── Mutasi majemuk ──
  const ubahKonjungsi = (id, teks) => {
    setState((prev) => ({
      ...prev,
      segmen: prev.segmen.map((s) => (s.id === id ? { ...s, teks } : s)),
    }));
  };

  const tambahKlausa = () => {
    setState((prev) => {
      const jumlahKlausa = prev.segmen.filter((s) => s.tipe === 'klausa').length;
      const label = `Kl${['₁', '₂', '₃', '₄', '₅', '₆'][jumlahKlausa] ?? jumlahKlausa + 1}`;
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
      const hapusIdx = idx > 0 && segmen[idx - 1].tipe === 'konjungsi' ? idx - 1 : idx;
      segmen.splice(hapusIdx, hapusIdx === idx - 1 ? 2 : 1);
      return { ...prev, segmen };
    });
  };

  const ubahKonstituenKlausa = (klausaId, id, field, value) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({
        ...kl,
        konstituen: kl.konstituen.map((k) => (k.id === id ? { ...k, [field]: value } : k)),
      })),
    }));
  };

  const tambahKonstituenKlausa = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({
        ...kl,
        konstituen: [...kl.konstituen, buatKonstituen()],
      })),
    }));
  };

  const hapusKonstituenKlausa = (klausaId, id) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({
        ...kl,
        konstituen: kl.konstituen.filter((k) => k.id !== id),
      })),
    }));
  };

  const ubahLabelKlausa = (klausaId, label) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({ ...kl, label })),
    }));
  };

  const toggleSegitigaKlausa = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({ ...kl, segitiga: !kl.segitiga })),
    }));
  };

  const ubahTeksSegitigaKlausa = (klausaId, teks) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({ ...kl, teksSegitiga: teks })),
    }));
  };

  const toggleRealisasiKonstituenKlausa = (klausaId, konstituenId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({
        ...kl,
        konstituen: kl.konstituen.map((k) => {
          if (k.id !== konstituenId) return k;
          return k.realisasi === 'klausa'
            ? { ...k, realisasi: 'frasa', klausaAnak: null }
            : { ...k, realisasi: 'klausa', klausaAnak: buatKlausaAnak() };
        }),
      })),
    }));
  };

  const ubahKlausaAnakPropMajemuk = (klausaId, konstituenId, field, val) => {
    setState((prev) => ({
      ...prev,
      segmen: updateKlausaAnakDalamSegmen(prev.segmen, klausaId, konstituenId, (ka) => ({
        ...ka,
        [field]: val,
      })),
    }));
  };

  const ubahKonstituenKlausaAnakMajemuk = (klausaId, konstituenId, subId, field, val) => {
    setState((prev) => ({
      ...prev,
      segmen: updateKlausaAnakDalamSegmen(prev.segmen, klausaId, konstituenId, (ka) => ({
        ...ka,
        konstituen: ka.konstituen.map((sk) => (sk.id === subId ? { ...sk, [field]: val } : sk)),
      })),
    }));
  };

  const tambahKonstituenKlausaAnakMajemuk = (klausaId, konstituenId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateKlausaAnakDalamSegmen(prev.segmen, klausaId, konstituenId, (ka) => ({
        ...ka,
        konstituen: [...ka.konstituen, buatKonstituen()],
      })),
    }));
  };

  const hapusKonstituenKlausaAnakMajemuk = (klausaId, konstituenId, subId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateKlausaAnakDalamSegmen(prev.segmen, klausaId, konstituenId, (ka) => ({
        ...ka,
        konstituen: ka.konstituen.filter((sk) => sk.id !== subId),
      })),
    }));
  };

  const tambahTersisip = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({
        ...kl,
        klausaTersisip: buatKlausaTersisip(),
      })),
    }));
  };

  const hapusTersisip = (klausaId) => {
    setState((prev) => ({
      ...prev,
      segmen: updateSegmenKlausa(prev.segmen, klausaId, (kl) => ({ ...kl, klausaTersisip: null })),
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
    ? state.konstituen.some((k) => k.teks.trim() || k.realisasi === 'klausa')
    : state.segmen.some((s) => s.tipe === 'klausa' && (
        s.segitiga ? s.teksSegitiga.trim() : s.konstituen.some((k) => k.teks.trim() || k.realisasi === 'klausa')
      ));

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
                <label className="pohon-klausa-utama-toggle">
                  <input
                    type="checkbox"
                    checked={state.klausaUtama}
                    onChange={toggleKlausaUtama}
                    aria-label="Tampilkan Klausa Utama"
                  />
                  <span>Tampilkan node Klausa Utama</span>
                </label>
                {state.konstituen.map((k) => (
                  <BarisKonstituen
                    key={k.id}
                    k={k}
                    onChange={ubahKonstituen}
                    onHapus={hapusKonstituen}
                    bisaHapus={state.konstituen.length > 1}
                    onToggleRealisasi={toggleRealisasiKonstituen}
                    onKlausaAnakChange={ubahKlausaAnakProp}
                    onKlausaAnakUbahKonstituen={ubahKonstituenKlausaAnak}
                    onKlausaAnakTambahKonstituen={tambahKonstituenKlausaAnak}
                    onKlausaAnakHapusKonstituen={hapusKonstituenKlausaAnak}
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
                      onUbahLabel={ubahLabelKlausa}
                      onToggleSegitiga={toggleSegitigaKlausa}
                      onUbahTeksSegitiga={ubahTeksSegitigaKlausa}
                      onToggleRealisasiKonstituen={(kId) => toggleRealisasiKonstituenKlausa(seg.id, kId)}
                      onKlausaAnakChange={(kId, field, val) => ubahKlausaAnakPropMajemuk(seg.id, kId, field, val)}
                      onKlausaAnakUbahKonstituen={(kId, subId, field, val) => ubahKonstituenKlausaAnakMajemuk(seg.id, kId, subId, field, val)}
                      onKlausaAnakTambahKonstituen={(kId) => tambahKonstituenKlausaAnakMajemuk(seg.id, kId)}
                      onKlausaAnakHapusKonstituen={(kId, subId) => hapusKonstituenKlausaAnakMajemuk(seg.id, kId, subId)}
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
              <p className="alat-note-item">Keterangan singkatan ditampilkan langsung di dalam bagan. Unduh SVG untuk hasil vektor (skala bebas). Unduh PNG untuk gambar resolusi 2×.</p>
            </div>
          </section>
          </div>
        )}
      </div>
    </HalamanPublik>
  );
}

export default PohonKalimat;
