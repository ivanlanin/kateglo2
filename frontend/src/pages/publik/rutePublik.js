import { createElement, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { aksesRuteInteraktif, katalogAlat, katalogGim } from '../../constants/katalogFitur';
import Beranda from './Beranda';

function buatLazyNamedExport(loader, exportName) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}

const Kamus = buatLazyNamedExport(() => import('./kamus'), 'Kamus');
const KamusDetail = buatLazyNamedExport(() => import('./kamus'), 'KamusDetail');
const Tesaurus = buatLazyNamedExport(() => import('./kamus'), 'Tesaurus');
const Makna = buatLazyNamedExport(() => import('./kamus'), 'Makna');
const Rima = buatLazyNamedExport(() => import('./kamus'), 'Rima');
const Ejaan = buatLazyNamedExport(() => import('./kamus'), 'Ejaan');
const Gramatika = buatLazyNamedExport(() => import('./kamus'), 'Gramatika');
const Glosarium = buatLazyNamedExport(() => import('./glosarium'), 'Glosarium');
const GlosariumDetail = buatLazyNamedExport(() => import('./glosarium'), 'GlosariumDetail');
const Alat = buatLazyNamedExport(() => import('./alat'), 'Alat');
const PenghitungHuruf = buatLazyNamedExport(() => import('./alat'), 'PenghitungHuruf');
const PenganalisisTeks = buatLazyNamedExport(() => import('./alat'), 'PenganalisisTeks');
const PohonKalimat = buatLazyNamedExport(() => import('./alat'), 'PohonKalimat');
const GimIndex = buatLazyNamedExport(() => import('./gim'), 'GimIndex');
const KuisKata = buatLazyNamedExport(() => import('./gim'), 'KuisKata');
const SusunKata = buatLazyNamedExport(() => import('./gim'), 'SusunKata');
const KebijakanPrivasi = buatLazyNamedExport(() => import('./informasi'), 'KebijakanPrivasi');
const Sumber = buatLazyNamedExport(() => import('./informasi'), 'Sumber');

const komponenAlat = {
  'penghitung-huruf': PenghitungHuruf,
  'penganalisis-teks': PenganalisisTeks,
  'pohon-kalimat': PohonKalimat,
};

const komponenGim = {
  'kuis-kata': KuisKata,
  'susun-kata': SusunKata,
};

const ruteAlatInteraktif = katalogAlat.map((item) => ({
  path: item.routePath,
  Component: komponenAlat[item.slug],
  aksesPublik: aksesRuteInteraktif(item),
  redirectTo: '/alat',
}));

const ruteGimInteraktif = katalogGim.map((item) => ({
  path: item.routePath,
  Component: komponenGim[item.slug],
  aksesPublik: aksesRuteInteraktif(item),
  redirectTo: '/gim',
}));

export const ruteHalamanPublik = [
  { path: '/', Component: Beranda },
  { path: '/kamus', Component: Kamus },
  { path: '/kamus/cari/:kata', Component: Kamus },
  { path: '/kamus/kelas/:kelas', Component: Kamus },
  { path: '/kamus/tagar/:tagar', Component: Kamus },
  { path: '/kamus/:kategori/:kode', Component: Kamus },
  { path: '/kamus/detail/:indeks', Component: KamusDetail },
  { path: '/makna', Component: Makna },
  { path: '/makna/cari/:kata', Component: Makna },
  { path: '/rima', Component: Rima },
  { path: '/rima/cari/:kata', Component: Rima },
  { path: '/ejaan', Component: Ejaan },
  { path: '/ejaan/:slug', Component: Ejaan },
  { path: '/gramatika', Component: Gramatika },
  { path: '/gramatika/:slug', Component: Gramatika },
  { path: '/alat', Component: Alat },
  ...ruteAlatInteraktif,
  { path: '/gim', Component: GimIndex },
  { path: '/gim/susun-kata', element: createElement(Navigate, { to: '/gim/susun-kata/harian', replace: true }) },
  ...ruteGimInteraktif,
  { path: '/tesaurus', Component: Tesaurus },
  { path: '/tesaurus/cari/:kata', Component: Tesaurus },
  { path: '/glosarium', Component: Glosarium },
  { path: '/glosarium/cari/:kata', Component: Glosarium },
  { path: '/glosarium/detail/:asing', Component: GlosariumDetail },
  { path: '/glosarium/bidang/:bidang', Component: Glosarium },
  { path: '/glosarium/sumber/:sumber', Component: Glosarium },
  { path: '/kebijakan-privasi', Component: KebijakanPrivasi },
  { path: '/sumber', Component: Sumber },
];
