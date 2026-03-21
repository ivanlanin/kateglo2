/**
 * @fileoverview Sumber data tunggal daftar isi Gramatika dan turunan utilitasnya
 */

const daftarIsiGramatika = [
  {
    judul: 'Pendahuluan',
    slug: 'pendahuluan',
    items: [
      { judul: 'Kedudukan Bahasa Indonesia', slug: 'kedudukan-bahasa-indonesia' },
      {
        judul: 'Ragam Bahasa',
        slug: 'ragam-bahasa',
        turunan: [
          {
            judul: 'Ragam Menurut Golongan Penutur',
            slug: 'ragam-menurut-golongan-penutur',
          },
          {
            judul: 'Ragam Menurut Jenis Pemakaian',
            slug: 'ragam-menurut-jenis-pemakaian',
          },
        ],
      },
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
      {
        judul: 'Pengertian Tata Bahasa',
        slug: 'pengertian-tata-bahasa',
        turunan: [
          { judul: 'Fonologi', slug: 'fonologi' },
          { judul: 'Morfologi', slug: 'morfologi' },
          { judul: 'Sintaksis', slug: 'sintaksis' },
        ],
      },
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
        turunan: [
          { judul: 'Vokal', slug: 'vokal' },
          { judul: 'Konsonan', slug: 'konsonan' },
          { judul: 'Diftong', slug: 'diftong' },
          { judul: 'Gugus Konsonan', slug: 'gugus-konsonan' },
          { judul: 'Fonem dan Grafem', slug: 'fonem-dan-grafem' },
          { judul: 'Fonem Segmental dan Suprasegmental', slug: 'fonem-segmental-dan-suprasegmental' },
          { judul: 'Suku Kata', slug: 'suku-kata' },
        ],
      },
      {
        judul: 'Vokal dan Konsonan',
        slug: 'vokal-dan-konsonan',
        turunan: [
          { judul: 'Vokal dan Alofon Vokal', slug: 'vokal-dan-alofon-vokal' },
          { judul: 'Diftong dan Deret Vokal', slug: 'diftong-dan-deret-vokal' },
          { judul: 'Cara Penulisan Vokal', slug: 'cara-penulisan-vokal' },
          { judul: 'Konsonan dan Alofon Konsonan', slug: 'konsonan-dan-alofon-konsonan' },
          { judul: 'Gugus dan Deret Konsonan', slug: 'gugus-dan-deret-konsonan' },
        ],
      },
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
      {
        judul: 'Jenis Nomina',
        slug: 'jenis-nomina',
        turunan: [
          { judul: 'Nomina Berdasarkan Acuannya', slug: 'nomina-berdasarkan-acuannya' },
          { judul: 'Nomina Berdasarkan Bentuk Morfologisnya', slug: 'nomina-berdasarkan-bentuk-morfologisnya' },
        ],
      },
      {
        judul: 'Frasa Nominal',
        slug: 'frasa-nominal',
        turunan: [
          { judul: 'Frasa Nominal', slug: 'frasa-nominal-umum' },
          { judul: 'Frasa Nominal Vokatif', slug: 'frasa-nominal-vokatif' },
        ],
      },
    ],
  },
  {
    judul: 'Verba',
    slug: 'verba',
    items: [
      { judul: 'Batasan dan Ciri Verba', slug: 'batasan-dan-ciri-verba' },
      { judul: 'Fitur Semantis Verba', slug: 'fitur-semantis-verba' },
      { judul: 'Perilaku Sintaktis Verba', slug: 'perilaku-sintaktis-verba' },
      {
        judul: 'Bentuk Verba',
        slug: 'bentuk-verba',
        turunan: [
          { judul: 'Verba Dasar', slug: 'verba-dasar' },
          { judul: 'Verba Turunan', slug: 'verba-turunan' },
          { judul: 'Morfofonemik dalam Pengafiksan Verba', slug: 'morfofonemik-dalam-pengafiksan-verba' },
        ],
      },
      {
        judul: 'Verba Transitif',
        slug: 'verba-transitif',
        turunan: [
          { judul: 'Penurunan Melalui Konversi', slug: 'penurunan-melalui-konversi' },
          { judul: 'Penurunan Verba Transitif Melalui Pengafiksan', slug: 'penurunan-verba-transitif-melalui-pengafiksan' },
        ],
      },
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
      {
        judul: 'Jenis Pronomina',
        slug: 'jenis-pronomina',
        turunan: [
          { judul: 'Pronomina Persona', slug: 'pronomina-persona' },
          { judul: 'Pronomina Penunjuk', slug: 'pronomina-penunjuk' },
          { judul: 'Pronomina Tanya', slug: 'pronomina-tanya' },
          { judul: 'Pronomina Taktentu', slug: 'pronomina-taktentu' },
          { judul: 'Pronomina Jumlah', slug: 'pronomina-jumlah' },
        ],
      },
      { judul: 'Frasa Pronominal', slug: 'frasa-pronominal' },
    ],
  },
  {
    judul: 'Numeralia',
    slug: 'numeralia',
    items: [
      { judul: 'Batasan dan Ciri Numeralia', slug: 'batasan-dan-ciri-numeralia' },
      { judul: 'Jenis Numeralia', slug: 'jenis-numeralia' },
      { judul: 'Frasa Numeral', slug: 'frasa-numeral' },
    ],
  },
  {
    judul: 'Kata Tugas',
    slug: 'kata-tugas',
    items: [
      { judul: 'Batasan dan Ciri Kata Tugas', slug: 'batasan-dan-ciri-kata-tugas' },
      {
        judul: 'Preposisi',
        slug: 'preposisi',
        turunan: [
          { judul: 'Bentuk Preposisi', slug: 'bentuk-preposisi' },
          { judul: 'Peran Semantis Preposisi', slug: 'peran-semantis-preposisi' },
          { judul: 'Peran Sintaktis Preposisi', slug: 'peran-sintaktis-preposisi' },
        ],
      },
      {
        judul: 'Konjungsi',
        slug: 'konjungsi',
        turunan: [
          { judul: 'Konjungsi Koordinatif', slug: 'konjungsi-koordinatif' },
          { judul: 'Konjungsi Korelatif', slug: 'konjungsi-korelatif' },
          { judul: 'Konjungsi Subordinatif', slug: 'konjungsi-subordinatif' },
          { judul: 'Konjungsi Antarkalimat', slug: 'konjungsi-antarkalimat' },
          { judul: 'Simpulan', slug: 'simpulan' },
        ],
      },
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
      {
        judul: 'Kategori, Fungsi, dan Peran',
        slug: 'kategori-fungsi-dan-peran',
        turunan: [
          { judul: 'Kategori', slug: 'kategori' },
          {
            judul: 'Fungsi Sintaktis',
            slug: 'fungsi-sintaktis',
            turunan: [
              { judul: 'Predikat', slug: 'predikat' },
              { judul: 'Subjek', slug: 'subjek' },
              { judul: 'Objek', slug: 'objek' },
              { judul: 'Pelengkap', slug: 'pelengkap' },
              { judul: 'Keterangan', slug: 'keterangan' },
            ],
          },
          { judul: 'Peran', slug: 'peran' },
        ],
      },
      { judul: 'Kalimat Dasar', slug: 'kalimat-dasar' },
      {
        judul: 'Jenis Kalimat',
        slug: 'jenis-kalimat',
        turunan: [
          { judul: 'Kalimat Berdasarkan Jumlah Klausanya', slug: 'kalimat-berdasarkan-jumlah-klausanya' },
          { judul: 'Kalimat Berdasarkan Predikat', slug: 'kalimat-berdasarkan-predikat' },
          { judul: 'Kalimat Berdasarkan Klasifikasi Sintaktis', slug: 'kalimat-berdasarkan-klasifikasi-sintaktis' },
          { judul: 'Kalimat Berdasarkan Kelengkapan Unsur', slug: 'kalimat-berdasarkan-kelengkapan-unsur' },
          { judul: 'Kalimat dan Kemasan Informasi', slug: 'kalimat-dan-kemasan-informasi' },
        ],
      },
      { judul: 'Pengingkaran', slug: 'pengingkaran' },
    ],
  },
  {
    judul: 'Hubungan Antarklausa',
    slug: 'hubungan-antarklausa',
    items: [
      {
        judul: 'Hubungan Koordinatif',
        slug: 'hubungan-koordinatif',
        turunan: [
          { judul: 'Ciri-Ciri Sintaktis Hubungan Koordinatif', slug: 'ciri-ciri-sintaktis-hubungan-koordinatif' },
          { judul: 'Ciri-Ciri Semantis Hubungan Koordinatif', slug: 'ciri-ciri-semantis-hubungan-koordinatif' },
          { judul: 'Hubungan Semantis Antarklausa dalam Kalimat Majemuk', slug: 'hubungan-semantis-antarklausa-dalam-kalimat-majemuk' },
        ],
      },
      {
        judul: 'Hubungan Subordinatif',
        slug: 'hubungan-subordinatif',
        turunan: [
          { judul: 'Ciri-Ciri Sintaktis Hubungan Subordinatif', slug: 'ciri-ciri-sintaktis-hubungan-subordinatif' },
          { judul: 'Ciri-Ciri Semantis Hubungan Subordinatif', slug: 'ciri-ciri-semantis-hubungan-subordinatif' },
          { judul: 'Hubungan Semantis Antarklausa dalam Kalimat Kompleks', slug: 'hubungan-semantis-antarklausa-dalam-kalimat-kompleks' },
          { judul: 'Hubungan Optatif', slug: 'hubungan-optatif' },
        ],
      },
      { judul: 'Pelesapan', slug: 'pelesapan' },
    ],
  },
];

function flattenItemGramatika(bab, item, visibleParent = null) {
  const currentItem = {
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: item.judul,
    slug: item.slug,
    dokumen: `${bab.slug}/${item.slug}.md`,
    tipe: visibleParent ? 'subitem' : 'item',
    ...(visibleParent ? {
      parentSlug: visibleParent.slug,
      parentJudul: visibleParent.judul,
    } : {}),
  };

  return [
    currentItem,
    ...((item.turunan || []).flatMap((turunan) => flattenItemGramatika(bab, turunan, visibleParent || item))),
  ];
}

const daftarItemGramatika = daftarIsiGramatika.flatMap((bab) => [
  {
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: bab.judul,
    slug: bab.slug,
    dokumen: `${bab.slug}/${bab.slug}.md`,
    tipe: 'bab',
  },
  ...bab.items.flatMap((item) => flattenItemGramatika(bab, item)),
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
