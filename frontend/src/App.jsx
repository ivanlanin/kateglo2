import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetakPublik from './komponen/bersama/TataLetakPublik';
import Beranda from './halaman/publik/Beranda';
import Kamus from './halaman/publik/Kamus';
import KamusDetail from './halaman/publik/KamusDetail';
import Tesaurus from './halaman/publik/Tesaurus';
import Glosarium from './halaman/publik/Glosarium';
import GlosariumDetail from './halaman/publik/GlosariumDetail';
import Makna from './halaman/publik/Makna';
import Rima from './halaman/publik/Rima';
import Ejaan from './halaman/publik/Ejaan';
import AuthCallback from './halaman/publik/AuthCallback';
import KebijakanPrivasi from './halaman/publik/KebijakanPrivasi';
import Sumber from './halaman/publik/Sumber';
import LoginAdmin from './halaman/redaksi/LoginAdmin';

const SusunKata = lazy(() => import('./halaman/gim/SusunKata'));
const DasborAdmin = lazy(() => import('./halaman/redaksi/DasborAdmin'));
const KamusAdmin = lazy(() => import('./halaman/redaksi/KamusAdmin'));
const KomentarAdmin = lazy(() => import('./halaman/redaksi/KomentarAdmin'));
const TesaurusAdmin = lazy(() => import('./halaman/redaksi/TesaurusAdmin'));
const EtimologiAdmin = lazy(() => import('./halaman/redaksi/EtimologiAdmin'));
const GlosariumAdmin = lazy(() => import('./halaman/redaksi/GlosariumAdmin'));
const BidangAdmin = lazy(() => import('./halaman/redaksi/BidangAdmin'));
const BahasaAdmin = lazy(() => import('./halaman/redaksi/BahasaAdmin'));
const SumberAdmin = lazy(() => import('./halaman/redaksi/SumberAdmin'));
const LabelAdmin = lazy(() => import('./halaman/redaksi/LabelAdmin'));
const TagarAdmin = lazy(() => import('./halaman/redaksi/TagarAdmin'));
const AuditTagarAdmin = lazy(() => import('./halaman/redaksi/AuditTagarAdmin'));
const PenggunaAdmin = lazy(() => import('./halaman/redaksi/PenggunaAdmin'));
const PeranAdmin = lazy(() => import('./halaman/redaksi/PeranAdmin'));
const IzinAdmin = lazy(() => import('./halaman/redaksi/IzinAdmin'));
const AuditMaknaAdmin = lazy(() => import('./halaman/redaksi/AuditMaknaAdmin'));
const PencarianAdmin = lazy(() => import('./halaman/redaksi/PencarianAdmin'));
const PencarianHitamAdmin = lazy(() => import('./halaman/redaksi/PencarianHitamAdmin'));
const SusunKataHarian = lazy(() => import('./halaman/redaksi/SusunKataHarian'));
const SusunKataBebas = lazy(() => import('./halaman/redaksi/SusunKataBebas'));
const KandidatKataAdmin = lazy(() => import('./halaman/kadi/KandidatKataAdmin'));

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
      <Route path="/auth/callback" element={<AuthCallback />} />
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
        <Route path="/kamus" element={<Kamus />} />
        <Route path="/kamus/cari/:kata" element={<Kamus />} />
        <Route path="/kamus/kelas/:kelas" element={<Kamus />} />
        <Route path="/kamus/tagar/:tagar" element={<Kamus />} />
        <Route path="/kamus/:kategori/:kode" element={<Kamus />} />
        <Route path="/kamus/detail/:indeks" element={<KamusDetail />} />
        <Route path="/makna" element={<Makna />} />
        <Route path="/makna/cari/:kata" element={<Makna />} />
        <Route path="/rima" element={<Rima />} />
        <Route path="/rima/cari/:kata" element={<Rima />} />
        <Route path="/ejaan" element={<Ejaan />} />
        <Route path="/ejaan/:slug" element={<Ejaan />} />
        <Route path="/gim/susun-kata" element={<Navigate to="/gim/susun-kata/harian" replace />} />
        <Route path="/gim/susun-kata/:mode" element={bungkusLazy(<SusunKata />)} />
        <Route path="/tesaurus" element={<Tesaurus />} />
        <Route path="/tesaurus/cari/:kata" element={<Tesaurus />} />
        <Route path="/glosarium" element={<Glosarium />} />
        <Route path="/glosarium/cari/:kata" element={<Glosarium />} />
        <Route path="/glosarium/detail/:asing" element={<GlosariumDetail />} />
        <Route path="/glosarium/bidang/:bidang" element={<Glosarium />} />
        <Route path="/glosarium/sumber/:sumber" element={<Glosarium />} />
        <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />
        <Route path="/sumber" element={<Sumber />} />
      </Route>
    </Routes>
  );
}

export default App;
export { RuteIzin };
