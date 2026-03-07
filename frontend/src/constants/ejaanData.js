/**
 * @fileoverview Sumber data tunggal daftar isi Ejaan dan turunan utilitasnya
 */

const daftarIsiEjaan = [
  {
    judul: 'Penggunaan Huruf',
    slug: 'penggunaan-huruf',
    items: [
      { judul: 'Huruf Abjad', slug: 'huruf-abjad' },
      { judul: 'Huruf Vokal', slug: 'huruf-vokal' },
      { judul: 'Huruf Konsonan', slug: 'huruf-konsonan' },
      { judul: 'Gabungan Huruf Vokal', slug: 'gabungan-huruf-vokal' },
      { judul: 'Gabungan Huruf Konsonan', slug: 'gabungan-huruf-konsonan' },
      { judul: 'Huruf Kapital', slug: 'huruf-kapital' },
      { judul: 'Huruf Miring', slug: 'huruf-miring' },
      { judul: 'Huruf Tebal', slug: 'huruf-tebal' },
    ],
  },
  {
    judul: 'Penulisan Kata',
    slug: 'penulisan-kata',
    items: [
      { judul: 'Kata Dasar', slug: 'kata-dasar' },
      { judul: 'Kata Turunan', slug: 'kata-turunan' },
      { judul: 'Pemenggalan Kata', slug: 'pemenggalan-kata' },
      { judul: 'Kata Depan', slug: 'kata-depan' },
      { judul: 'Partikel', slug: 'partikel' },
      { judul: 'Singkatan', slug: 'singkatan' },
      { judul: 'Angka dan Bilangan', slug: 'angka-dan-bilangan' },
      { judul: 'Kata Ganti', slug: 'kata-ganti' },
      { judul: 'Kata Sandang', slug: 'kata-sandang' },
    ],
  },
  {
    judul: 'Penggunaan Tanda Baca',
    slug: 'penggunaan-tanda-baca',
    items: [
      { judul: 'Tanda Titik (.)', slug: 'tanda-titik' },
      { judul: 'Tanda Koma (,)', slug: 'tanda-koma' },
      { judul: 'Tanda Titik Koma (;)', slug: 'tanda-titik-koma' },
      { judul: 'Tanda Titik Dua (:)', slug: 'tanda-titik-dua' },
      { judul: 'Tanda Hubung (-)', slug: 'tanda-hubung' },
      { judul: 'Tanda Pisah (—)', slug: 'tanda-pisah' },
      { judul: 'Tanda Tanya (?)', slug: 'tanda-tanya' },
      { judul: 'Tanda Seru (!)', slug: 'tanda-seru' },
      { judul: "Tanda Elipsis (…)", slug: 'tanda-elipsis' },
      { judul: 'Tanda Petik ("…")', slug: 'tanda-petik' },
      { judul: "Tanda Petik Tunggal ('…')", slug: 'tanda-petik-tunggal' },
      { judul: 'Tanda Kurung ((…))', slug: 'tanda-kurung' },
      { judul: 'Tanda Kurung Siku ([…])', slug: 'tanda-kurung-siku' },
      { judul: 'Tanda Garis Miring (/)', slug: 'tanda-garis-miring' },
      { judul: "Tanda Apostrof (')", slug: 'tanda-apostrof' },
    ],
  },
  {
    judul: 'Penulisan Unsur Serapan',
    slug: 'penulisan-unsur-serapan',
    items: [
      { judul: 'Serapan Umum', slug: 'serapan-umum' },
      { judul: 'Serapan Khusus', slug: 'serapan-khusus' },
    ],
  },
];

const daftarItemEjaan = daftarIsiEjaan.flatMap((bab) =>
  bab.items.map((item) => ({
    judulBab: bab.judul,
    babSlug: bab.slug,
    judul: item.judul,
    slug: item.slug,
    dokumen: `${bab.slug}/${item.slug}.md`,
  }))
);

const petaItemEjaanBySlug = daftarItemEjaan.reduce((acc, item) => {
  acc[item.slug] = item;
  return acc;
}, {});

const daftarAutocompleteEjaan = daftarItemEjaan.map((item) => ({
  value: item.judul,
  slug: item.slug,
}));

const petaAutocompleteEjaan = daftarAutocompleteEjaan.reduce((acc, item) => {
  acc[item.slug] = item.value;
  return acc;
}, {});

function formatJudulEjaanDariSlug(slug = '') {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');
}

export {
  daftarIsiEjaan,
  daftarItemEjaan,
  petaItemEjaanBySlug,
  daftarAutocompleteEjaan,
  petaAutocompleteEjaan,
  formatJudulEjaanDariSlug,
};
