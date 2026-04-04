import { createElement, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { aksesRuteInteraktif, katalogAlat, katalogGim } from '../../constants/katalogFitur';
import Beranda from './Beranda';

function buatLazyNamedExport(loader, exportName) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })));
}

const Kamus = buatLazyNamedExport(() => import('./kamus'), 'Kamus');
const KamusAcak = buatLazyNamedExport(() => import('./kamus'), 'KamusAcak');
const KamusDetail = buatLazyNamedExport(() => import('./kamus'), 'KamusDetail');
const Tesaurus = buatLazyNamedExport(() => import('./kamus'), 'Tesaurus');
const Makna = buatLazyNamedExport(() => import('./kamus'), 'Makna');
const Rima = buatLazyNamedExport(() => import('./kamus'), 'Rima');
const Ejaan = buatLazyNamedExport(() => import('./kamus'), 'Ejaan');
const Gramatika = buatLazyNamedExport(() => import('./kamus'), 'Gramatika');
const Glosarium = buatLazyNamedExport(() => import('./glosarium'), 'Glosarium');
const GlosariumDetail = buatLazyNamedExport(() => import('./glosarium'), 'GlosariumDetail');
const Alat = buatLazyNamedExport(() => import('./alat'), 'Alat');
const KorpusLeipzig = buatLazyNamedExport(() => import('./alat'), 'KorpusLeipzig');
const PenghitungHuruf = buatLazyNamedExport(() => import('./alat'), 'PenghitungHuruf');
const AnalisisTeks = buatLazyNamedExport(() => import('./alat'), 'AnalisisTeks');
const PohonKalimat = buatLazyNamedExport(() => import('./alat'), 'PohonKalimat');
const GimIndex = buatLazyNamedExport(() => import('./gim'), 'GimIndex');
const KuisKata = buatLazyNamedExport(() => import('./gim'), 'KuisKata');
const SusunKata = buatLazyNamedExport(() => import('./gim'), 'SusunKata');
const Artikel = buatLazyNamedExport(() => import('./artikel'), 'Artikel');
const ArtikelDetail = buatLazyNamedExport(() => import('./artikel'), 'ArtikelDetail');
const Ihwal = buatLazyNamedExport(() => import('./informasi'), 'Ihwal');
const Privasi = buatLazyNamedExport(() => import('./informasi'), 'Privasi');
const Sumber = buatLazyNamedExport(() => import('./informasi'), 'Sumber');

const komponenAlat = {
  'analisis-korpus': KorpusLeipzig,
  'penghitung-huruf': PenghitungHuruf,
  'analisis-teks': AnalisisTeks,
  'pohon-kalimat': PohonKalimat,
};

const komponenGim = {
  'kuis-kata': KuisKata,
  'susun-kata': SusunKata,
};

const ruteAlatInteraktif = katalogAlat.filter((item) => item.slug !== 'analisis-korpus').map((item) => ({
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
  { path: '/kamus/acak', Component: KamusAcak },
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
  { path: '/alat/penganalisis-teks', element: createElement(Navigate, { to: '/alat/analisis-teks', replace: true }) },
  {
    path: '/alat/analisis-korpus',
    Component: KorpusLeipzig,
    aksesPublik: 'publik',
    redirectTo: '/alat',
  },
  {
    path: '/alat/analisis-korpus/:kata',
    Component: KorpusLeipzig,
    aksesPublik: 'publik',
    redirectTo: '/alat',
  },
  {
    path: '/alat/korpus-leipzig',
    Component: KorpusLeipzig,
    aksesPublik: 'publik',
    redirectTo: '/alat',
  },
  {
    path: '/alat/korpus-leipzig/:kata',
    Component: KorpusLeipzig,
    aksesPublik: 'publik',
    redirectTo: '/alat',
  },
  {
    path: '/alat/korpus-leipzig/:kata/:korpus',
    Component: KorpusLeipzig,
    aksesPublik: 'publik',
    redirectTo: '/alat',
  },
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
  { path: '/artikel', Component: Artikel },
  { path: '/artikel/:slug', Component: ArtikelDetail },
  { path: '/ihwal', Component: Ihwal },
  { path: '/privasi', Component: Privasi },
  { path: '/kebijakan-privasi', Component: Privasi },
  { path: '/sumber', Component: Sumber },
];
