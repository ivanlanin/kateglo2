/**
 * @fileoverview Sumber data tunggal daftar isi Gramatika dan turunan utilitasnya
 */

const daftarIsiGramatika = [
  {
    judul: 'Pendahuluan',
    slug: 'pendahuluan',
    items: [
      { judul: 'Kedudukan Bahasa Indonesia', slug: 'kedudukan-bahasa-indonesia' },
      { judul: 'Ragam Bahasa', slug: 'ragam-bahasa' },
      { judul: 'Diglosia', slug: 'diglosia' },
      { judul: 'Pembakuan Bahasa', slug: 'pembakuan-bahasa' },
      { judul: 'Bahasa Baku', slug: 'bahasa-baku' },
      { judul: 'Fungsi Bahasa Baku', slug: 'fungsi-bahasa-baku' },
      { judul: 'Bahasa yang Baik dan Benar', slug: 'bahasa-yang-baik-dan-benar' },
      {
        judul: 'Hubungan Bahasa Indonesia dengan Bahasa Daerah dan Bahasa Asing',
        slug: 'hubungan-bahasa-indonesia-dengan-bahasa-daerah-dan-bahasa-asing',
      },
    ],
  },
  {
    judul: 'Tata Bahasa',
    slug: 'tata-bahasa',
    items: [
      { judul: 'Deskripsi dan Teori', slug: 'deskripsi-dan-teori' },
      { judul: 'Pengertian Tata Bahasa', slug: 'pengertian-tata-bahasa' },
      {
        judul: 'Semantik, Pragmatik, dan Relasi Makna',
        slug: 'semantik-pragmatik-dan-relasi-makna',
      },
    ],
  },
  {
    judul: 'Bunyi Bahasa',
    slug: 'bunyi-bahasa',
    items: [
      {
        judul: 'Batasan dan Ciri Bunyi Bahasa',
        slug: 'batasan-dan-ciri-bunyi-bahasa',
      },
      { judul: 'Vokal dan Konsonan', slug: 'vokal-dan-konsonan' },
      { judul: 'Struktur Suku Kata dan Kata', slug: 'struktur-suku-kata-dan-kata' },
      { judul: 'Pemenggalan Kata', slug: 'pemenggalan-kata' },
      { judul: 'Ciri Suprasegmental', slug: 'ciri-suprasegmental' },
    ],
  },
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
  {
    judul: 'Hubungan Antarklausa',
    slug: 'hubungan-antarklausa',
    items: [
      { judul: 'Hubungan Koordinatif', slug: 'hubungan-koordinatif' },
      { judul: 'Hubungan Subordinatif', slug: 'hubungan-subordinatif' },
      { judul: 'Pelesapan', slug: 'pelesapan' },
    ],
  },
];

const daftarItemGramatika = daftarIsiGramatika.flatMap((bab) => [
  {
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: bab.judul,
    slug: bab.slug,
    dokumen: `${bab.slug}/${bab.slug}.md`,
    tipe: 'bab',
  },
  ...bab.items.map((item) => ({
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: item.judul,
    slug: item.slug,
    dokumen: `${bab.slug}/${item.slug}.md`,
    tipe: 'item',
  })),
]);

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
