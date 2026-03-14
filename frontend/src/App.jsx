import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetakPublik from './components/bersama/TataLetakPublik';
import Beranda from './pages/publik/Beranda';
import LoginAdmin from './pages/redaksi/LoginAdmin';

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
const DasborAdmin = lazy(() => import('./pages/redaksi/DasborAdmin'));
const KamusAdmin = lazy(() => import('./pages/redaksi/KamusAdmin'));
const KomentarAdmin = lazy(() => import('./pages/redaksi/KomentarAdmin'));
const TesaurusAdmin = lazy(() => import('./pages/redaksi/TesaurusAdmin'));
const EtimologiAdmin = lazy(() => import('./pages/redaksi/EtimologiAdmin'));
const GlosariumAdmin = lazy(() => import('./pages/redaksi/GlosariumAdmin'));
const BidangAdmin = lazy(() => import('./pages/redaksi/BidangAdmin'));
const BahasaAdmin = lazy(() => import('./pages/redaksi/BahasaAdmin'));
const SumberAdmin = lazy(() => import('./pages/redaksi/SumberAdmin'));
const LabelAdmin = lazy(() => import('./pages/redaksi/LabelAdmin'));
const TagarAdmin = lazy(() => import('./pages/redaksi/TagarAdmin'));
const AuditTagarAdmin = lazy(() => import('./pages/redaksi/AuditTagarAdmin'));
const PenggunaAdmin = lazy(() => import('./pages/redaksi/PenggunaAdmin'));
const PeranAdmin = lazy(() => import('./pages/redaksi/PeranAdmin'));
const IzinAdmin = lazy(() => import('./pages/redaksi/IzinAdmin'));
const AuditMaknaAdmin = lazy(() => import('./pages/redaksi/AuditMaknaAdmin'));
const PencarianAdmin = lazy(() => import('./pages/redaksi/PencarianAdmin'));
const PencarianHitamAdmin = lazy(() => import('./pages/redaksi/PencarianHitamAdmin'));
const SusunKataHarian = lazy(() => import('./pages/redaksi/SusunKataHarian'));
const SusunKataBebas = lazy(() => import('./pages/redaksi/SusunKataBebas'));
const KandidatKataAdmin = lazy(() => import('./pages/redaksi/kadi/KandidatKataAdmin'));

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
      <Route path="/redaksi" element={bungkusLazy(<RuteRedaksi><DasborAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/kamus" element={bungkusLazy(<RuteRedaksi><KamusAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/kamus/:id" element={bungkusLazy(<RuteRedaksi><KamusAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/komentar" element={bungkusLazy(<RuteRedaksi><KomentarAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/komentar/:id" element={bungkusLazy(<RuteRedaksi><KomentarAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/audit-makna" element={bungkusLazy(<RuteIzin izinDibutuhkan={['audit_makna']}><AuditMaknaAdmin /></RuteIzin>)} />
      <Route path="/redaksi/pencarian" element={bungkusLazy(<RuteIzin izinDibutuhkan={['lihat_pencarian']}><PencarianAdmin /></RuteIzin>)} />
      <Route path="/redaksi/pencarian-hitam" element={bungkusLazy(<RuteIzin izinDibutuhkan={['lihat_pencarian']}><PencarianHitamAdmin /></RuteIzin>)} />
      <Route path="/redaksi/susun-kata-harian" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_susun_kata']}><SusunKataHarian /></RuteIzin>)} />
      <Route path="/redaksi/susun-kata-bebas" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_susun_kata']}><SusunKataBebas /></RuteIzin>)} />
      <Route path="/redaksi/tesaurus" element={bungkusLazy(<RuteRedaksi><TesaurusAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/tesaurus/:id" element={bungkusLazy(<RuteRedaksi><TesaurusAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/etimologi" element={bungkusLazy(<RuteRedaksi><EtimologiAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/etimologi/:id" element={bungkusLazy(<RuteRedaksi><EtimologiAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/glosarium" element={bungkusLazy(<RuteRedaksi><GlosariumAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/bidang" element={bungkusLazy(<RuteRedaksi><BidangAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/bidang/:id" element={bungkusLazy(<RuteRedaksi><BidangAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/bahasa" element={bungkusLazy(<RuteRedaksi><BahasaAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/bahasa/:id" element={bungkusLazy(<RuteRedaksi><BahasaAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/sumber" element={bungkusLazy(<RuteRedaksi><SumberAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/sumber/:id" element={bungkusLazy(<RuteRedaksi><SumberAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/glosarium/:id" element={bungkusLazy(<RuteRedaksi><GlosariumAdmin /></RuteRedaksi>)} />
      <Route path="/redaksi/label" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_label']}><LabelAdmin /></RuteIzin>)} />
      <Route path="/redaksi/label/:id" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_label']}><LabelAdmin /></RuteIzin>)} />
      <Route path="/redaksi/tagar" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_tagar']}><TagarAdmin /></RuteIzin>)} />
      <Route path="/redaksi/tagar/:id" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_tagar']}><TagarAdmin /></RuteIzin>)} />
      <Route path="/redaksi/audit-tagar" element={bungkusLazy(<RuteIzin izinDibutuhkan={['audit_tagar']}><AuditTagarAdmin /></RuteIzin>)} />
      <Route path="/redaksi/peran" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_peran']}><PeranAdmin /></RuteIzin>)} />
      <Route path="/redaksi/peran/:id" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_peran']}><PeranAdmin /></RuteIzin>)} />
      <Route path="/redaksi/izin" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_peran']}><IzinAdmin /></RuteIzin>)} />
      <Route path="/redaksi/izin/:id" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_peran']}><IzinAdmin /></RuteIzin>)} />
      <Route path="/redaksi/pengguna" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_pengguna']}><PenggunaAdmin /></RuteIzin>)} />
      <Route path="/redaksi/pengguna/:id" element={bungkusLazy(<RuteIzin izinDibutuhkan={['kelola_pengguna']}><PenggunaAdmin /></RuteIzin>)} />
      {/* KADI */}
      <Route path="/redaksi/kandidat-kata" element={bungkusLazy(<RuteIzin izinDibutuhkan={['lihat_kandidat']}><KandidatKataAdmin /></RuteIzin>)} />
      <Route path="/redaksi/kandidat-kata/:id" element={bungkusLazy(<RuteIzin izinDibutuhkan={['lihat_kandidat']}><KandidatKataAdmin /></RuteIzin>)} />
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
