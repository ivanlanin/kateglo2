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
        turunan: [
          { judul: 'Kondisi Kebenaran dan Perikutan', slug: 'kondisi-kebenaran-dan-perikutan' },
          { judul: 'Aspek Takberkondisi Benar Makna Kalimat', slug: 'aspek-takberkondisi-benar-makna-kalimat' },
          { judul: 'Pragmatik dan Implikatur Percakapan', slug: 'pragmatik-dan-implikatur-percakapan' },
          { judul: 'Pengacuan dan Deiksis', slug: 'pengacuan-dan-deiksis' },
        ],
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
      {
        judul: 'Ciri Suprasegmental',
        slug: 'ciri-suprasegmental',
        turunan: [
          { judul: 'Tekanan dan Aksen', slug: 'tekanan-dan-aksen' },
          { judul: 'Intonasi dan Ritme', slug: 'intonasi-dan-ritme' },
        ],
      },
    ],
  },
  {
    judul: 'Nomina',
    slug: 'nomina',
    items: [
      { judul: 'Batasan dan Ciri Nomina', slug: 'batasan-dan-ciri-nomina' },
      { judul: 'Perilaku Semantis Nomina', slug: 'perilaku-semantis-nomina' },
      { judul: 'Perilaku Sintaksis Nomina', slug: 'perilaku-sintaksis-nomina' },
      {
        judul: 'Jenis Nomina',
        slug: 'jenis-nomina',
        turunan: [
          { judul: 'Nomina Berdasarkan Acuannya', slug: 'nomina-berdasarkan-acuannya' },
          { judul: 'Nomina Berdasarkan Bentuk Morfologisnya', slug: 'nomina-berdasarkan-bentuk-morfologisnya' },
        ],
      },
      { judul: 'Frasa Nominal', slug: 'frasa-nominal' },
      { judul: 'Konsep Tunggal, Jamak, dan Generik', slug: 'konsep-tunggal-jamak-dan-generik' },
    ],
  },
  {
    judul: 'Verba',
    slug: 'verba',
    items: [
      { judul: 'Batasan dan Ciri Verba', slug: 'batasan-dan-ciri-verba' },
      { judul: 'Fitur Semantis Verba', slug: 'fitur-semantis-verba' },
      {
        judul: 'Perilaku Sintaktis Verba',
        slug: 'perilaku-sintaktis-verba',
        turunan: [
          { judul: 'Verba Transitif Berobjek', slug: 'verba-transitif-berobjek' },
          { judul: 'Verba Transitif Berobjek dan Berpelengkap', slug: 'verba-transitif-berobjek-dan-berpelengkap' },
          { judul: 'Verba Semitransitif', slug: 'verba-semitransitif' },
          { judul: 'Verba Taktransitif Takberpelengkap', slug: 'verba-taktransitif-takberpelengkap' },
          { judul: 'Verba Taktransitif Berpelengkap', slug: 'verba-taktransitif-berpelengkap' },
          { judul: 'Verba Taktransitif Berpelengkap Nomina dengan Preposisi Tetap', slug: 'verba-taktransitif-berpelengkap-nomina-dengan-preposisi-tetap' },
        ],
      },
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
          { judul: 'Penurunan Verba Transitif dengan Konversi', slug: 'penurunan-verba-transitif-dengan-konversi' },
          { judul: 'Penurunan Verba Transitif dengan Pengafiksan', slug: 'penurunan-verba-transitif-dengan-pengafiksan' },
        ],
      },
      {
        judul: 'Verba Taktransitif',
        slug: 'verba-taktransitif',
        turunan: [
          { judul: 'Penurunan Verba Taktransitif dengan Pengafiksan', slug: 'penurunan-verba-taktransitif-dengan-pengafiksan' },
          { judul: 'Penurunan Verba Taktransitif dengan Reduplikasi', slug: 'penurunan-verba-taktransitif-dengan-reduplikasi' },
        ],
      },
      { judul: 'Verba Hasil Reduplikasi', slug: 'verba-reduplikasi' },
      {
        judul: 'Verba Majemuk',
        slug: 'verba-majemuk',
        turunan: [
          { judul: 'Verba Majemuk Dasar', slug: 'verba-majemuk-dasar' },
          { judul: 'Verba Majemuk Berafiks', slug: 'verba-majemuk-berafiks' },
          { judul: 'Verba Majemuk Berulang', slug: 'verba-majemuk-berulang' },
          { judul: 'Verba Majemuk Subordinatif dan Koordinatif', slug: 'verba-majemuk-subordinatif-dan-koordinatif' },
          { judul: 'Verba Majemuk Idiom', slug: 'verba-majemuk-idiom' },
        ],
      },
      {
        judul: 'Frasa Verbal',
        slug: 'frasa-verbal',
        turunan: [
          { judul: 'Batasan Frasa Verbal', slug: 'batasan-frasa-verbal' },
          { judul: 'Jenis Frasa Verbal', slug: 'jenis-frasa-verbal' },
          { judul: 'Fungsi Verba dan Frasa Verbal', slug: 'fungsi-verba-dan-frasa-verbal' },
        ],
      },
    ],
  },
  {
    judul: 'Adjektiva',
    slug: 'adjektiva',
    items: [
      { judul: 'Batasan dan Ciri Adjektiva', slug: 'batasan-dan-ciri-adjektiva' },
      { judul: 'Makna Adjektiva', slug: 'makna-adjektiva' },
      { judul: 'Fungsi Adjektiva', slug: 'fungsi-adjektiva' },
      {
        judul: 'Pertarafan Adjektiva',
        slug: 'pertarafan-adjektiva',
        turunan: [
          { judul: 'Tingkat Kualitas', slug: 'tingkat-kualitas' },
          { judul: 'Tingkat Pembandingan', slug: 'tingkat-pembandingan' },
        ],
      },
      {
        judul: 'Bentuk Adjektiva',
        slug: 'bentuk-adjektiva',
        turunan: [
          { judul: 'Adjektiva Dasar', slug: 'adjektiva-dasar' },
          { judul: 'Adjektiva Turunan', slug: 'adjektiva-turunan' },
        ],
      },
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
      {
        judul: 'Posisi Adverbia',
        slug: 'posisi-adverbia',
        turunan: [
          { judul: 'Adverbia Sebelum Kata yang Diterangkan', slug: 'adverbia-sebelum-kata-yang-diterangkan' },
          { judul: 'Adverbia Sesudah Kata yang Diterangkan', slug: 'adverbia-sesudah-kata-yang-diterangkan' },
          { judul: 'Adverbia Sebelum atau Sesudah Kata yang Diterangkan', slug: 'adverbia-sebelum-atau-sesudah-kata-yang-diterangkan' },
          { judul: 'Adverbia Sebelum dan Sesudah Kata yang Diterangkan', slug: 'adverbia-sebelum-dan-sesudah-kata-yang-diterangkan' },
          { judul: 'Adverbia Pembuka Wacana', slug: 'adverbia-pembuka-wacana' },
          { judul: 'Adverbia Intraklausal dan Ekstraklausal', slug: 'adverbia-intraklausal-dan-ekstraklausal' },
        ],
      },
      {
        judul: 'Bentuk Adverbia',
        slug: 'bentuk-adverbia',
        turunan: [
          { judul: 'Adverbia Tunggal', slug: 'adverbia-tunggal' },
          { judul: 'Adverbia Gabungan', slug: 'adverbia-gabungan' },
        ],
      },
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
      {
        judul: 'Unsur Kalimat',
        slug: 'unsur-kalimat',
        turunan: [
          { judul: 'Kalimat, Klausa, dan Frasa', slug: 'kalimat-klausa-dan-frasa' },
          { judul: 'Unsur Wajib dan Unsur Takwajib', slug: 'unsur-wajib-dan-unsur-takwajib' },
          { judul: 'Keserasian Antarunsur', slug: 'keserasian-antarunsur' },
        ],
      },
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
      {
        judul: 'Kalimat Dasar',
        slug: 'kalimat-dasar',
        turunan: [
          { judul: 'Batasan Kalimat Dasar', slug: 'batasan-kalimat-dasar' },
          { judul: 'Perluasan Kalimat Dasar', slug: 'perluasan-kalimat-dasar' },
        ],
      },
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
