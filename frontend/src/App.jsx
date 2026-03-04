import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetak from './komponen/bersama/TataLetak';
import Beranda from './halaman/publik/Beranda';
import Kamus from './halaman/publik/Kamus';
import KamusDetail from './halaman/publik/KamusDetail';
import Tesaurus from './halaman/publik/Tesaurus';
import Glosarium from './halaman/publik/Glosarium';
import GlosariumDetail from './halaman/publik/GlosariumDetail';
import Makna from './halaman/publik/Makna';
import Rima from './halaman/publik/Rima';
import Ejaan from './halaman/publik/Ejaan';
import SusunKata from './halaman/gim/SusunKata';
import AuthCallback from './halaman/publik/AuthCallback';
import KebijakanPrivasi from './halaman/publik/KebijakanPrivasi';
import Sumber from './halaman/publik/Sumber';
import LoginAdmin from './halaman/redaksi/LoginAdmin';
import DasborAdmin from './halaman/redaksi/DasborAdmin';
import KamusAdmin from './halaman/redaksi/KamusAdmin';
import KomentarAdmin from './halaman/redaksi/KomentarAdmin';
import TesaurusAdmin from './halaman/redaksi/TesaurusAdmin';
import EtimologiAdmin from './halaman/redaksi/EtimologiAdmin';
import GlosariumAdmin from './halaman/redaksi/GlosariumAdmin';
import BidangAdmin from './halaman/redaksi/BidangAdmin';
import SumberAdmin from './halaman/redaksi/SumberAdmin';
import LabelAdmin from './halaman/redaksi/LabelAdmin';
import TagarAdmin from './halaman/redaksi/TagarAdmin';
import AuditTagarAdmin from './halaman/redaksi/AuditTagarAdmin';
import PenggunaAdmin from './halaman/redaksi/PenggunaAdmin';
import PeranAdmin from './halaman/redaksi/PeranAdmin';
import IzinAdmin from './halaman/redaksi/IzinAdmin';
import AuditMaknaAdmin from './halaman/redaksi/AuditMaknaAdmin';
import PencarianAdmin from './halaman/redaksi/PencarianAdmin';
import SusunKataHarian from './halaman/redaksi/SusunKataHarian';
import SusunKataBebas from './halaman/redaksi/SusunKataBebas';

function RuteRedaksi({ children }) {
  const { isAuthenticated, adalahRedaksi, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
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
        <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
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
      <Route path="/redaksi" element={<RuteRedaksi><DasborAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/kamus" element={<RuteRedaksi><KamusAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/kamus/:id" element={<RuteRedaksi><KamusAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/komentar" element={<RuteRedaksi><KomentarAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/komentar/:id" element={<RuteRedaksi><KomentarAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/audit-makna" element={<RuteIzin izinDibutuhkan={['audit_makna']}><AuditMaknaAdmin /></RuteIzin>} />
      <Route path="/redaksi/pencarian" element={<RuteIzin izinDibutuhkan={['lihat_pencarian']}><PencarianAdmin /></RuteIzin>} />
      <Route path="/redaksi/susun-kata-harian" element={<RuteIzin izinDibutuhkan={['kelola_susun_kata']}><SusunKataHarian /></RuteIzin>} />
      <Route path="/redaksi/susun-kata-bebas" element={<RuteIzin izinDibutuhkan={['kelola_susun_kata']}><SusunKataBebas /></RuteIzin>} />
      <Route path="/redaksi/tesaurus" element={<RuteRedaksi><TesaurusAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/tesaurus/:id" element={<RuteRedaksi><TesaurusAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/etimologi" element={<RuteRedaksi><EtimologiAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/etimologi/:id" element={<RuteRedaksi><EtimologiAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/glosarium" element={<RuteRedaksi><GlosariumAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/bidang" element={<RuteRedaksi><BidangAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/bidang/:id" element={<RuteRedaksi><BidangAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/sumber" element={<RuteRedaksi><SumberAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/sumber/:id" element={<RuteRedaksi><SumberAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/glosarium/:id" element={<RuteRedaksi><GlosariumAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/label" element={<RuteIzin izinDibutuhkan={['kelola_label']}><LabelAdmin /></RuteIzin>} />
      <Route path="/redaksi/label/:id" element={<RuteIzin izinDibutuhkan={['kelola_label']}><LabelAdmin /></RuteIzin>} />
      <Route path="/redaksi/tagar" element={<RuteIzin izinDibutuhkan={['kelola_tagar']}><TagarAdmin /></RuteIzin>} />
      <Route path="/redaksi/tagar/:id" element={<RuteIzin izinDibutuhkan={['kelola_tagar']}><TagarAdmin /></RuteIzin>} />
      <Route path="/redaksi/audit-tagar" element={<RuteIzin izinDibutuhkan={['audit_tagar']}><AuditTagarAdmin /></RuteIzin>} />
      <Route path="/redaksi/peran" element={<RuteIzin izinDibutuhkan={['kelola_peran']}><PeranAdmin /></RuteIzin>} />
      <Route path="/redaksi/peran/:id" element={<RuteIzin izinDibutuhkan={['kelola_peran']}><PeranAdmin /></RuteIzin>} />
      <Route path="/redaksi/izin" element={<RuteIzin izinDibutuhkan={['kelola_peran']}><IzinAdmin /></RuteIzin>} />
      <Route path="/redaksi/izin/:id" element={<RuteIzin izinDibutuhkan={['kelola_peran']}><IzinAdmin /></RuteIzin>} />
      <Route path="/redaksi/pengguna" element={<RuteIzin izinDibutuhkan={['kelola_pengguna']}><PenggunaAdmin /></RuteIzin>} />
      <Route path="/redaksi/pengguna/:id" element={<RuteIzin izinDibutuhkan={['kelola_pengguna']}><PenggunaAdmin /></RuteIzin>} />
      {/* Public routes */}
      <Route element={<TataLetak />}>
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
        <Route path="/gim/susun-kata/:mode" element={<SusunKata />} />
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
