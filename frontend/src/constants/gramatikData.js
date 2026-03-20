/**
 * @fileoverview Sumber data tunggal daftar isi Gramatika dan turunan utilitasnya
 */

const daftarIsiGramatika = [
  {
    judul: 'Nomina',
    slug: 'nomina',
    items: [
      { judul: 'Batasan dan Ciri Nomina', slug: 'batasan-dan-ciri-nomina' },
      { judul: 'Makna Nomina', slug: 'makna-nomina' },
      { judul: 'Acuan Nomina', slug: 'acuan-nomina' },
      { judul: 'Fungsi Nomina', slug: 'fungsi-nomina' },
      { judul: 'Jenis Nomina', slug: 'jenis-nomina' },
      { judul: 'Frasa Nominal', slug: 'frasa-nominal' },
    ],
  },
  {
    judul: 'Verba',
    slug: 'verba',
    items: [
      { judul: 'Batasan dan Ciri Verba', slug: 'batasan-dan-ciri-verba' },
      { judul: 'Fitur Semantis Verba', slug: 'fitur-semantis-verba' },
      { judul: 'Perilaku Sintaktis Verba', slug: 'perilaku-sintaktis-verba' },
      { judul: 'Bentuk Verba', slug: 'bentuk-verba' },
      { judul: 'Verba Transitif', slug: 'verba-transitif' },
      { judul: 'Verba Taktransitif', slug: 'verba-taktransitif' },
      { judul: 'Verba Hasil Reduplikasi', slug: 'verba-reduplikasi' },
      { judul: 'Verba Majemuk', slug: 'verba-majemuk' },
      { judul: 'Frasa Verbal', slug: 'frasa-verbal' },
    ],
  },
  {
    judul: 'Adjektiva',
    slug: 'adjektiva',
    items: [
      { judul: 'Batasan dan Ciri Adjektiva', slug: 'batasan-dan-ciri-adjektiva' },
      { judul: 'Makna Adjektiva', slug: 'makna-adjektiva' },
      { judul: 'Fungsi Adjektiva', slug: 'fungsi-adjektiva' },
      { judul: 'Pertarafan Adjektiva', slug: 'pertarafan-adjektiva' },
      { judul: 'Bentuk Adjektiva', slug: 'bentuk-adjektiva' },
      { judul: 'Frasa Adjektival', slug: 'frasa-adjektival' },
      { judul: 'Adjektiva dan Kelas Kata Lain', slug: 'adjektiva-dan-kelas-kata-lain' },
    ],
  },
  {
    judul: 'Adverbia',
    slug: 'adverbia',
    items: [
      { judul: 'Batasan dan Ciri Adverbia', slug: 'batasan-dan-ciri-adverbia' },
      { judul: 'Makna Adverbia', slug: 'makna-adverbia' },
      { judul: 'Posisi Adverbia', slug: 'posisi-adverbia' },
      { judul: 'Bentuk Adverbia', slug: 'bentuk-adverbia' },
      { judul: 'Bentuk Adverbial', slug: 'bentuk-adverbial' },
      { judul: 'Adverbia dan Kelas Kata Lain', slug: 'adverbia-dan-kelas-kata-lain' },
    ],
  },
  {
    judul: 'Pronomina',
    slug: 'pronomina',
    items: [
      { judul: 'Batasan dan Ciri Pronomina', slug: 'batasan-dan-ciri-pronomina' },
      { judul: 'Jenis Pronomina', slug: 'jenis-pronomina' },
      { judul: 'Frasa Pronominal', slug: 'frasa-pronominal' },
    ],
  },
  {
    judul: 'Numeralia',
    slug: 'numeralia',
    items: [
      { judul: 'Batasan dan Ciri Numeralia', slug: 'batasan-dan-ciri-numeralia' },
      { judul: 'Numeralia Pokok', slug: 'numeralia-pokok' },
      { judul: 'Numeralia Tingkat', slug: 'numeralia-tingkat' },
      { judul: 'Frasa Numeral', slug: 'frasa-numeral' },
    ],
  },
  {
    judul: 'Kata Tugas',
    slug: 'kata-tugas',
    items: [
      { judul: 'Batasan dan Ciri Kata Tugas', slug: 'batasan-dan-ciri-kata-tugas' },
      { judul: 'Preposisi', slug: 'preposisi' },
      { judul: 'Konjungsi', slug: 'konjungsi' },
      { judul: 'Interjeksi', slug: 'interjeksi' },
      { judul: 'Artikula', slug: 'artikula' },
      { judul: 'Partikel Penegas', slug: 'partikel-penegas' },
    ],
  },
  {
    judul: 'Kalimat',
    slug: 'kalimat',
    items: [
      { judul: 'Batasan dan Ciri Kalimat', slug: 'batasan-dan-ciri-kalimat' },
      { judul: 'Unsur Kalimat', slug: 'unsur-kalimat' },
      { judul: 'Kategori, Fungsi, dan Peran', slug: 'kategori-fungsi-dan-peran' },
      { judul: 'Kalimat Dasar', slug: 'kalimat-dasar' },
      { judul: 'Jenis Kalimat', slug: 'jenis-kalimat' },
      { judul: 'Pengingkaran', slug: 'pengingkaran' },
    ],
  },
];

const daftarItemGramatika = daftarIsiGramatika.flatMap((bab) =>
  bab.items.map((item) => ({
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: item.judul,
    slug: item.slug,
    dokumen: `${bab.slug}/${item.slug}.md`,
  }))
);

const petaItemGramatikaBySlug = daftarItemGramatika.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

function formatJudulGramatikaDariSlug(slug = '') {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');
}

export {
  daftarIsiGramatika,
  daftarItemGramatika,
  petaItemGramatikaBySlug,
  formatJudulGramatikaDariSlug,
};
