/**
 * @fileoverview Sumber data tunggal daftar isi Gramatika dan turunan utilitasnya
 */

const daftarIsiGramatika = [
  {
    judul: 'Adverbia',
    slug: 'adverbia',
    items: [
      { judul: 'Batasan dan Ciri Adverbia', slug: 'batasan-dan-ciri' },
      { judul: 'Makna Adverbia', slug: 'makna-adverbia' },
      { judul: 'Posisi Adverbia', slug: 'posisi-adverbia' },
      { judul: 'Bentuk Adverbia', slug: 'bentuk-adverbia' },
      { judul: 'Adverbial dan Kelas Kata Lain', slug: 'adverbial-dan-kelas-kata-lain' },
    ],
  },
  {
    judul: 'Kata Tugas',
    slug: 'kata-tugas',
    items: [
      { judul: 'Batasan dan Ciri', slug: 'batasan-dan-ciri' },
      { judul: 'Preposisi', slug: 'preposisi' },
      { judul: 'Konjungsi', slug: 'konjungsi' },
      { judul: 'Interjeksi', slug: 'interjeksi' },
      { judul: 'Artikula', slug: 'artikula' },
      { judul: 'Partikel Penegas', slug: 'partikel-penegas' },
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
