/**
 * @fileoverview Utilitas metadata lintas domain (kamus/tesaurus/glosarium)
 */

const META_DESKRIPSI_UMUM = 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';
const META_DESKRIPSI_KAMUS_BROWSE = 'Jelajahi kamus bahasa Indonesia berdasarkan abjad, kelas kata, bentuk, ragam, bahasa, dan bidang.';
const META_DESKRIPSI_KAMUS_UMUM = 'Telusuri entri kamus bahasa Indonesia di Kateglo.';
const META_DESKRIPSI_TESAURUS_BROWSE = 'Temukan sinonim dan antonim bahasa Indonesia di Kateglo.';
const META_DESKRIPSI_GLOSARIUM_BROWSE = 'Jelajahi glosarium istilah bidang ilmu di Kateglo.';

// =========================
// Common helpers
// =========================

export const NAMA_KATEGORI_KAMUS = {
  abjad: 'Abjad',
  bentuk: 'Bentuk',
  unsur: 'Bentuk',
  unsur_terikat: 'Bentuk',
  kelas: 'Kelas Kata',
  kelas_kata: 'Kelas Kata',
  ragam: 'Ragam',
  ekspresi: 'Ekspresi',
  bahasa: 'Asal Bahasa',
  bidang: 'Bidang',
  jenis: 'Jenis',
};

export const NAMA_KATEGORI_BROWSE_KAMUS = {
  bentuk: 'Bentuk Bebas',
  unsur: 'Bentuk Terikat',
  unsur_terikat: 'Bentuk Terikat',
};

export const KATEGORI_SLUG_NAMA = new Set(['kelas_kata', 'kelas-kata', 'kelas', 'ragam', 'bahasa', 'bidang']);

function amanDecode(teks = '') {
  try {
    return decodeURIComponent(String(teks || ''));
  } catch {
    /* c8 ignore next */
    return String(teks || '');
  }
}

function truncate(text = '', maxLen = 155) {
  if (text.length <= maxLen) return text;
  const cut = text.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.substring(0, lastSpace) : cut) + '…';
}

// =========================
// Kamus domain
// =========================

export function formatAwalKapital(teks = '') {
  return String(teks)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');
}

export function normalisasiSlugNama(teks = '') {
  return String(teks || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatLabelDariSlug(teks = '') {
  const normalized = String(amanDecode(teks))
    .trim()
    .replace(/[-_]+/g, ' ');
  return formatAwalKapital(normalized);
}

export function tentukanSlugLabel(kategoriLabel, label = {}) {
  const kategoriNormal = String(kategoriLabel || '').trim().toLowerCase();
  const kandidatNama = String(label?.nama || '').trim();
  const kandidatKode = String(label?.kode || '').trim();

  if (KATEGORI_SLUG_NAMA.has(kategoriNormal) && kandidatNama) {
    return normalisasiSlugNama(kandidatNama);
  }

  return normalisasiSlugNama(kandidatKode || kandidatNama);
}

export function tentukanNamaKategoriDariPath(kategori = '', kode = '') {
  const kategoriPath = String(kategori || '').trim().toLowerCase();
  const kodePath = String(kode || '').trim().toLowerCase();

  if (kategoriPath === 'kelas' || kategoriPath === 'kelas_kata' || kategoriPath === 'kelas-kata') {
    return NAMA_KATEGORI_KAMUS.kelas;
  }

  if (kategoriPath === 'bentuk') {
    const kodeBentukTerikat = ['terikat', 'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik', 'prakategorial'];
    return kodeBentukTerikat.includes(kodePath) ? NAMA_KATEGORI_KAMUS.unsur_terikat : NAMA_KATEGORI_KAMUS.bentuk;
  }

  return NAMA_KATEGORI_KAMUS[kategoriPath] || formatLabelDariSlug(kategoriPath);
}

export function buildMetaBrowseKamus() {
  return {
    judul: 'Kamus',
    deskripsi: META_DESKRIPSI_KAMUS_BROWSE,
  };
}

export function buildMetaPencarianKamus(kata = '') {
  const kataAman = amanDecode(kata).trim();
  if (!kataAman) {
    return {
      judul: 'Kamus',
      deskripsi: META_DESKRIPSI_KAMUS_UMUM,
    };
  }

  return {
    judul: `Hasil Pencarian “${kataAman}”`,
    deskripsi: `Hasil pencarian kamus untuk kata ${kataAman} di Kateglo.`,
  };
}

export function buildMetaKategoriKamus({ kategori = '', kode = '', labelNama = '' } = {}) {
  const namaKategori = tentukanNamaKategoriDariPath(kategori, kode);
  const sumberLabel = String(labelNama || '').trim() || formatLabelDariSlug(kode);
  const namaLabel = formatAwalKapital(sumberLabel);
  const judul = `${namaKategori} ${namaLabel}`.trim();

  return {
    judul,
    deskripsi: `Daftar entri kamus untuk kategori ${namaKategori.toLowerCase()} ${namaLabel} di Kateglo.`,
    namaKategori,
    namaLabel,
  };
}

function ekstrakMaknaDetailKamus(data = {}) {
  if (Array.isArray(data?.semuaMakna)) {
    return data.semuaMakna;
  }

  if (Array.isArray(data?.entri)) {
    return data.entri.flatMap((item) => Array.isArray(item?.makna) ? item.makna : []);
  }

  if (Array.isArray(data?.makna)) {
    return data.makna;
  }

  return [];
}

export function buildDeskripsiDetailKamus(indeks, data = {}) {
  const indeksAman = String(indeks || '').trim();
  const baseLabel = indeksAman || String(data?.indeks || data?.entri || '').trim();
  if (!baseLabel) {
    return META_DESKRIPSI_KAMUS_UMUM;
  }

  const parts = [baseLabel];
  if (data?.lafal) parts[0] += ` ${data.lafal}`;

  const maknaList = ekstrakMaknaDetailKamus(data);
  if (maknaList.length === 0) {
    return `Lihat detail entri kamus “${baseLabel}” di Kateglo.`;
  }

  if (maknaList.length === 1) {
    const m = maknaList[0];
    const kelasPrefix = m?.kelas_kata ? `(${m.kelas_kata}) ` : '';
    return truncate(`${parts[0]}: ${kelasPrefix}${m?.makna || ''}`, 155);
  }

  const formattedMakna = maknaList.slice(0, 4).map((m, i) => {
    const kelasPrefix = m?.kelas_kata ? `(${m.kelas_kata}) ` : '';
    /* c8 ignore next */
    return `(${i + 1}) ${kelasPrefix}${m?.makna || ''}`;
  });

  return truncate(`${parts[0]}: ${formattedMakna.join('; ')}`, 155);
}

export function buildMetaDetailKamus(indeks = '', data = null) {
  const indeksAman = amanDecode(indeks).trim();

  if (!indeksAman) {
    return {
      judul: 'Kamus',
      deskripsi: META_DESKRIPSI_KAMUS_UMUM,
    };
  }

  return {
    judul: `${indeksAman} — Kamus`,
    deskripsi: buildDeskripsiDetailKamus(indeksAman, data || {}),
  };
}

// =========================
// Tesaurus domain
// =========================

export function buildMetaBrowseTesaurus() {
  return {
    judul: 'Tesaurus',
    deskripsi: META_DESKRIPSI_TESAURUS_BROWSE,
  };
}

export function buildDeskripsiPencarianTesaurus(kata = '', data = {}) {
  const kataAman = amanDecode(kata).trim();
  if (!kataAman) return META_DESKRIPSI_TESAURUS_BROWSE;

  const parts = [];
  if (data.sinonim?.length) {
    parts.push(`Sinonim: ${data.sinonim.slice(0, 5).join(', ')}`);
  }
  if (data.antonim?.length) {
    parts.push(`Antonim: ${data.antonim.slice(0, 5).join(', ')}`);
  }
  if (parts.length === 0) {
    return `Hasil pencarian tesaurus untuk “${kataAman}” di Kateglo.`;
  }
  return truncate(`${kataAman} — ${parts.join('. ')}.`, 155);
}

export function buildMetaPencarianTesaurus(kata = '', data = null) {
  const kataAman = amanDecode(kata).trim();
  if (!kataAman) {
    return buildMetaBrowseTesaurus();
  }

  return {
    judul: `Hasil Pencarian “${kataAman}”`,
    deskripsi: buildDeskripsiPencarianTesaurus(kataAman, data || {}),
  };
}

// =========================
// Glosarium domain
// =========================

export function buildMetaBrowseGlosarium() {
  return {
    judul: 'Glosarium',
    deskripsi: META_DESKRIPSI_GLOSARIUM_BROWSE,
  };
}

export function buildDeskripsiPencarianGlosarium(kata = '', data = {}) {
  const kataAman = amanDecode(kata).trim();
  if (!kataAman || !data.total) {
    return `Hasil pencarian glosarium untuk “${kataAman || kata}” di Kateglo.`;
  }

  let desc = `${data.total} hasil glosarium untuk “${kataAman}”.`;
  if (data.contoh?.length) {
    const contohList = data.contoh.map((c) => `${c.indonesia} (${c.asing})`).join(', ');
    desc += ` Contoh: ${truncate(contohList, 100)}.`;
  }
  return truncate(desc, 155);
}

export function buildMetaPencarianGlosarium(kata = '', data = null) {
  const kataAman = amanDecode(kata).trim();
  if (!kataAman) {
    return buildMetaBrowseGlosarium();
  }

  return {
    judul: `Hasil Pencarian “${kataAman}”`,
    deskripsi: buildDeskripsiPencarianGlosarium(kataAman, data || {}),
  };
}

export function buildMetaBidangGlosarium(bidang = '', data = null) {
  const bidangAman = amanDecode(bidang).trim();
  if (!bidangAman) {
    return buildMetaBrowseGlosarium();
  }

  let deskripsi = `Glosarium bidang ${bidangAman} di Kateglo.`;
  if (data?.total > 0) {
    deskripsi = `${data.total} istilah bidang ${bidangAman}.`;
    if (data.contoh?.length) {
      const contohList = data.contoh.map((c) => `${c.indonesia} (${c.asing})`).join(', ');
      deskripsi += ` Contoh: ${truncate(contohList, 100)}.`;
    }
  }

  return {
    judul: `Bidang ${bidangAman}`,
    deskripsi,
  };
}

export function buildMetaSumberGlosarium(sumber = '', data = null) {
  const sumberAman = amanDecode(sumber).trim();
  if (!sumberAman) {
    return buildMetaBrowseGlosarium();
  }

  let deskripsi = `Glosarium dari sumber ${sumberAman} di Kateglo.`;
  if (data?.total > 0) {
    deskripsi = `${data.total} istilah dari sumber ${sumberAman}.`;
    if (data.contoh?.length) {
      const contohList = data.contoh.map((c) => `${c.indonesia} (${c.asing})`).join(', ');
      deskripsi += ` Contoh: ${truncate(contohList, 100)}.`;
    }
  }

  return {
    judul: `Sumber ${sumberAman}`,
    deskripsi,
  };
}

export const kamusMetaUtils = {
  NAMA_KATEGORI_KAMUS,
  NAMA_KATEGORI_BROWSE_KAMUS,
  KATEGORI_SLUG_NAMA,
  formatAwalKapital,
  normalisasiSlugNama,
  formatLabelDariSlug,
  tentukanSlugLabel,
  tentukanNamaKategoriDariPath,
  buildMetaBrowseKamus,
  buildMetaPencarianKamus,
  buildMetaKategoriKamus,
  buildDeskripsiDetailKamus,
  buildMetaDetailKamus,
};

export const tesaurusMetaUtils = {
  deskripsiDefault: META_DESKRIPSI_UMUM,
  buildMetaBrowseTesaurus,
  buildDeskripsiPencarianTesaurus,
  buildMetaPencarianTesaurus,
};

export const glosariumMetaUtils = {
  deskripsiDefault: META_DESKRIPSI_UMUM,
  buildMetaBrowseGlosarium,
  buildDeskripsiPencarianGlosarium,
  buildMetaPencarianGlosarium,
  buildMetaBidangGlosarium,
  buildMetaSumberGlosarium,
};

export const metaUtils = {
  kamus: kamusMetaUtils,
  tesaurus: tesaurusMetaUtils,
  glosarium: glosariumMetaUtils,
};