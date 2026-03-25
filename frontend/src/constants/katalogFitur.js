/**
 * @fileoverview Katalog alat dan gim interaktif beserta konfigurasi visibilitas publiknya.
 */

export const katalogAlat = [
  {
    slug: 'penganalisis-teks',
    judul: 'Penganalisis Teks',
    deskripsi: 'Hitung jumlah paragraf, kalimat, dan kata dari teks bahasa Indonesia secara cepat.',
    href: '/alat/penganalisis-teks',
    routePath: '/alat/penganalisis-teks',
    tampilPublik: true,
  },
  {
    slug: 'penghitung-huruf',
    judul: 'Penghitung Huruf',
    deskripsi: 'Hitung frekuensi huruf a-z, tampilkan tabel persentase, dan lihat grafik batang distribusinya.',
    href: '/alat/penghitung-huruf',
    routePath: '/alat/penghitung-huruf',
    tampilPublik: true,
  },
  {
    slug: 'pohon-kalimat',
    judul: 'Pohon Kalimat',
    deskripsi: 'Buat diagram pohon sintaksis kalimat bahasa Indonesia — tunggal, majemuk, dan bertingkat.',
    href: '/alat/pohon-kalimat',
    routePath: '/alat/pohon-kalimat',
    tampilPublik: false,
  },
];

export const katalogGim = [
  {
    slug: 'kuis-kata',
    judul: 'Kuis Kata',
    deskripsi: 'Jawab soal pilihan ganda dari kamus, tesaurus, glosarium, makna, dan rima dalam satu ronde cepat.',
    href: '/gim/kuis-kata',
    routePath: '/gim/kuis-kata',
    tampilPublik: true,
  },
  {
    slug: 'susun-kata',
    judul: 'Susun Kata',
    deskripsi: 'Tebak kata bahasa Indonesia dalam enam percobaan dengan mode harian dan bebas.',
    href: '/gim/susun-kata/harian',
    routePath: '/gim/susun-kata/:mode',
    tampilPublik: true,
  },
];

export function filterItemInteraktif(items, adalahAdmin = false) {
  return items.filter((item) => item.tampilPublik !== false || adalahAdmin);
}

export function ambilDaftarAlat(adalahAdmin = false) {
  return filterItemInteraktif(katalogAlat, adalahAdmin);
}

export function ambilDaftarGim(adalahAdmin = false) {
  return filterItemInteraktif(katalogGim, adalahAdmin);
}

export function aksesRuteInteraktif(item) {
  return item?.tampilPublik === false ? 'admin' : 'publik';
}
