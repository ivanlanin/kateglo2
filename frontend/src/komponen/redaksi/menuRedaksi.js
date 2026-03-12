/**
 * @fileoverview Konfigurasi menu redaksi bersama untuk navbar dan dasbor
 */

export const kelompokMenuRedaksi = [
  {
    judul: 'Leksikon',
    items: [
      {
        path: '/redaksi/kamus',
        label: 'Kamus',
        dashboardLabel: 'Entri Kamus',
        izin: 'lihat_entri',
        statistik: { key: 'entri', label: 'Entri Kamus', warna: 'text-blue-600' },
      },
      {
        path: '/redaksi/tesaurus',
        label: 'Tesaurus',
        dashboardLabel: 'Entri Tesaurus',
        izin: 'lihat_tesaurus',
        statistik: { key: 'tesaurus', label: 'Entri Tesaurus', warna: 'text-emerald-600' },
      },
      {
        path: '/redaksi/glosarium',
        label: 'Glosarium',
        dashboardLabel: 'Entri Glosarium',
        izin: 'lihat_glosarium',
        statistik: { key: 'glosarium', label: 'Entri Glosarium', warna: 'text-amber-600' },
      },
      {
        path: '/redaksi/etimologi',
        label: 'Etimologi',
        dashboardLabel: 'Entri Etimologi',
        izin: 'kelola_etimologi',
        statistik: { key: 'etimologi', label: 'Entri Etimologi', warna: 'text-indigo-600' },
      },
    ],
  },
  {
    judul: 'Audit',
    items: [
      {
        path: '/redaksi/audit-makna',
        label: 'Makna',
        dashboardLabel: 'Audit Makna',
        izin: 'audit_makna',
        statistik: { key: 'auditMakna', label: 'Perlu Audit', warna: 'text-fuchsia-600' },
      },
      {
        path: '/redaksi/audit-tagar',
        label: 'Tagar',
        dashboardLabel: 'Audit Tagar',
        izin: 'audit_tagar',
        statistik: { key: 'auditTagar', label: 'Belum Bertagar', warna: 'text-violet-600' },
      },
    ],
  },
  {
    judul: 'Gim',
    items: [
      {
        path: '/redaksi/susun-kata-harian',
        label: 'Susun Kata Harian',
        dashboardLabel: 'Susun Kata Harian',
        izin: 'kelola_susun_kata',
        statistik: { key: 'susunKataHarian', label: 'Peserta Hari Ini', warna: 'text-lime-600' },
      },
      {
        path: '/redaksi/susun-kata-bebas',
        label: 'Susun Kata Bebas',
        dashboardLabel: 'Susun Kata Bebas',
        izin: 'kelola_susun_kata',
        statistik: { key: 'susunKataBebas', label: 'Peserta Hari Ini', warna: 'text-green-600' },
      },
    ],
  },
  {
    judul: 'Interaksi',
    items: [
      {
        path: '/redaksi/komentar',
        label: 'Komentar',
        dashboardLabel: 'Komentar',
        izin: 'kelola_komentar',
        statistik: { key: 'komentar', label: 'Total Komentar', warna: 'text-rose-600' },
      },
      {
        path: '/redaksi/pencarian',
        label: 'Pencarian',
        dashboardLabel: 'Pencarian',
        izin: 'lihat_pencarian',
        statistik: { key: 'pencarian', label: 'Kata Harian', warna: 'text-orange-600' },
      },
      {
        path: '/redaksi/pencarian-hitam',
        label: 'Pencarian Hitam',
        dashboardLabel: 'Pencarian Hitam',
        izin: 'lihat_pencarian',
        statistik: { key: 'pencarianHitam', label: 'Total Kata Diblokir', warna: 'text-stone-600' },
      },
    ],
  },
  {
    judul: 'Master',
    items: [
      {
        path: '/redaksi/bahasa',
        label: 'Bahasa',
        dashboardLabel: 'Bahasa',
        izin: 'kelola_bahasa',
        statistik: { key: 'bahasa', label: 'Total Bahasa', warna: 'text-blue-500' },
      },
      {
        path: '/redaksi/bidang',
        label: 'Bidang',
        dashboardLabel: 'Bidang',
        izin: 'kelola_bidang',
        statistik: { key: 'bidang', label: 'Total Bidang', warna: 'text-sky-600' },
      },
      {
        path: '/redaksi/sumber',
        label: 'Sumber',
        dashboardLabel: 'Sumber',
        izin: 'kelola_sumber',
        statistik: { key: 'sumber', label: 'Total Sumber', warna: 'text-teal-600' },
      },
      {
        path: '/redaksi/tagar',
        label: 'Tagar',
        dashboardLabel: 'Tagar',
        izin: 'kelola_tagar',
        statistik: { key: 'tagar', label: 'Total Tagar', warna: 'text-pink-600' },
      },
      {
        path: '/redaksi/label',
        label: 'Label',
        dashboardLabel: 'Label',
        izin: 'kelola_label',
        statistik: { key: 'label', label: 'Total Label', warna: 'text-cyan-600' },
      },
    ],
  },
  {
    judul: 'Akses',
    items: [
      {
        path: '/redaksi/peran',
        label: 'Peran',
        dashboardLabel: 'Peran',
        izin: 'kelola_peran',
        statistik: { key: 'peran', label: 'Total Peran', warna: 'text-red-600' },
      },
      {
        path: '/redaksi/izin',
        label: 'Izin',
        dashboardLabel: 'Izin',
        izin: 'kelola_peran',
        statistik: { key: 'izin', label: 'Total Izin', warna: 'text-amber-700' },
      },
      {
        path: '/redaksi/pengguna',
        label: 'Pengguna',
        dashboardLabel: 'Pengguna',
        izin: 'kelola_pengguna',
        statistik: { key: 'pengguna', label: 'Total Pengguna', warna: 'text-purple-600' },
      },
    ],
  },
];

export function filterKelompokMenuRedaksi(hasIzin) {
  return kelompokMenuRedaksi
    .map((kelompok) => ({
      ...kelompok,
      items: kelompok.items.filter((item) => hasIzin(item.izin)),
    }))
    .filter((kelompok) => kelompok.items.length > 0);
}