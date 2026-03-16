import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetakPublik from './components/bersama/TataLetakPublik';
import Beranda from './pages/publik/Beranda';
import { LoginAdmin } from './pages/redaksi/inti';
import { ruteHalamanRedaksi } from './pages/redaksi/ruteRedaksi';

const AuthCallback = lazy(() => import('./pages/publik/AuthCallback'));
const Kamus = lazy(() => import('./pages/publik/Kamus'));
const KamusDetail = lazy(() => import('./pages/publik/KamusDetail'));
const Tesaurus = lazy(() => import('./pages/publik/Tesaurus'));
const Glosarium = lazy(() => import('./pages/publik/Glosarium'));
const GlosariumDetail = lazy(() => import('./pages/publik/GlosariumDetail'));
const Makna = lazy(() => import('./pages/publik/Makna'));
const Rima = lazy(() => import('./pages/publik/Rima'));
const Ejaan = lazy(() => import('./pages/publik/Ejaan'));
const Alat = lazy(() => import('./pages/publik/alat').then((module) => ({ default: module.Alat })));
const PenghitungHuruf = lazy(() => import('./pages/publik/alat').then((module) => ({ default: module.PenghitungHuruf })));
const PenganalisisTeks = lazy(() => import('./pages/publik/alat').then((module) => ({ default: module.PenganalisisTeks })));
const KebijakanPrivasi = lazy(() => import('./pages/publik/KebijakanPrivasi'));
const Sumber = lazy(() => import('./pages/publik/Sumber'));
const GimIndex = lazy(() => import('./pages/publik/gim/GimIndex'));
const KuisKataPage = lazy(() => import('./pages/publik/gim/KuisKata'));
const SusunKata = lazy(() => import('./pages/publik/gim/SusunKata'));

function FallbackRoute() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
      <p className="text-gray-600 dark:text-gray-400">Memuat …</p>
    </div>
  );
}

function bungkusLazy(element) {
  return <Suspense fallback={<FallbackRoute />}>{element}</Suspense>;
}

function renderRuteRedaksi(Component, izinDibutuhkan = []) {
  const element = izinDibutuhkan.length
    ? <RuteIzin izinDibutuhkan={izinDibutuhkan}><Component /></RuteIzin>
    : <RuteRedaksi><Component /></RuteRedaksi>;

  return bungkusLazy(element);
}

function RuteRedaksi({ children }) {
  const { isAuthenticated, adalahRedaksi, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <p className="text-gray-600 dark:text-gray-400">Memuat …</p>
      </div>
    );
  }

  if (!isAuthenticated || !adalahRedaksi) {
    return <Navigate to="/redaksi/login" replace />;
  }

  return children;
}

function RuteIzin({ children, izinDibutuhkan = [] }) {
  const { isAuthenticated, adalahRedaksi, adalahAdmin, punyaIzin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <p className="text-gray-600 dark:text-gray-400">Memuat …</p>
      </div>
    );
  }

  if (!isAuthenticated || !adalahRedaksi) {
    return <Navigate to="/redaksi/login" replace />;
  }

  const daftarIzin = Array.isArray(izinDibutuhkan)
    ? izinDibutuhkan.filter(Boolean)
    : [];
  const lolosIzin = daftarIzin.length === 0
    || Boolean(adalahAdmin)
    || (typeof punyaIzin === 'function' && daftarIzin.every((kodeIzin) => punyaIzin(kodeIzin)));

  if (!lolosIzin) {
    return <Navigate to="/redaksi" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={bungkusLazy(<AuthCallback />)} />
      {/* Redaksi routes — tanpa TataLetak */}
      <Route path="/redaksi/login" element={<LoginAdmin />} />
      {ruteHalamanRedaksi.map(({ path, Component, izinDibutuhkan = [] }) => (
        <Route key={path} path={path} element={renderRuteRedaksi(Component, izinDibutuhkan)} />
      ))}
      {/* Public routes */}
      <Route element={<TataLetakPublik />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/kamus" element={bungkusLazy(<Kamus />)} />
        <Route path="/kamus/cari/:kata" element={bungkusLazy(<Kamus />)} />
        <Route path="/kamus/kelas/:kelas" element={bungkusLazy(<Kamus />)} />
        <Route path="/kamus/tagar/:tagar" element={bungkusLazy(<Kamus />)} />
        <Route path="/kamus/:kategori/:kode" element={bungkusLazy(<Kamus />)} />
        <Route path="/kamus/detail/:indeks" element={bungkusLazy(<KamusDetail />)} />
        <Route path="/makna" element={bungkusLazy(<Makna />)} />
        <Route path="/makna/cari/:kata" element={bungkusLazy(<Makna />)} />
        <Route path="/rima" element={bungkusLazy(<Rima />)} />
        <Route path="/rima/cari/:kata" element={bungkusLazy(<Rima />)} />
        <Route path="/ejaan" element={bungkusLazy(<Ejaan />)} />
        <Route path="/ejaan/:slug" element={bungkusLazy(<Ejaan />)} />
        <Route path="/alat" element={bungkusLazy(<Alat />)} />
        <Route path="/alat/penghitung-huruf" element={bungkusLazy(<PenghitungHuruf />)} />
        <Route path="/alat/penganalisis-teks" element={bungkusLazy(<PenganalisisTeks />)} />
        <Route path="/gim" element={bungkusLazy(<GimIndex />)} />
        <Route path="/gim/kuis-kata" element={bungkusLazy(<KuisKataPage />)} />
        <Route path="/gim/susun-kata" element={<Navigate to="/gim/susun-kata/harian" replace />} />
        <Route path="/gim/susun-kata/:mode" element={bungkusLazy(<SusunKata />)} />
        <Route path="/tesaurus" element={bungkusLazy(<Tesaurus />)} />
        <Route path="/tesaurus/cari/:kata" element={bungkusLazy(<Tesaurus />)} />
        <Route path="/glosarium" element={bungkusLazy(<Glosarium />)} />
        <Route path="/glosarium/cari/:kata" element={bungkusLazy(<Glosarium />)} />
        <Route path="/glosarium/detail/:asing" element={bungkusLazy(<GlosariumDetail />)} />
        <Route path="/glosarium/bidang/:bidang" element={bungkusLazy(<Glosarium />)} />
        <Route path="/glosarium/sumber/:sumber" element={bungkusLazy(<Glosarium />)} />
        <Route path="/kebijakan-privasi" element={bungkusLazy(<KebijakanPrivasi />)} />
        <Route path="/sumber" element={bungkusLazy(<Sumber />)} />
      </Route>
    </Routes>
  );
}

export default App;
export { RuteIzin };
