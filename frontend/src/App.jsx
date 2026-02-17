import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetak from './komponen/publik/TataLetak';
import Beranda from './halaman/publik/Beranda';
import Kamus from './halaman/publik/Kamus';
import KamusDetail from './halaman/publik/KamusDetail';
import Tesaurus from './halaman/publik/Tesaurus';
import Glosarium from './halaman/publik/Glosarium';
import AuthCallback from './halaman/publik/AuthCallback';
import KebijakanPrivasi from './halaman/publik/KebijakanPrivasi';
import LoginAdmin from './halaman/redaksi/LoginAdmin';
import DasborAdmin from './halaman/redaksi/DasborAdmin';
import KamusAdmin from './halaman/redaksi/KamusAdmin';
import TesaurusAdmin from './halaman/redaksi/TesaurusAdmin';
import GlosariumAdmin from './halaman/redaksi/GlosariumAdmin';
import LabelAdmin from './halaman/redaksi/LabelAdmin';
import PenggunaAdmin from './halaman/redaksi/PenggunaAdmin';

function RuteRedaksi({ children }) {
  const { isAuthenticated, adalahAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
      </div>
    );
  }

  if (!isAuthenticated || !adalahAdmin) {
    return <Navigate to="/redaksi/login" replace />;
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
      <Route path="/redaksi/tesaurus" element={<RuteRedaksi><TesaurusAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/glosarium" element={<RuteRedaksi><GlosariumAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/label" element={<RuteRedaksi><LabelAdmin /></RuteRedaksi>} />
      <Route path="/redaksi/pengguna" element={<RuteRedaksi><PenggunaAdmin /></RuteRedaksi>} />
      {/* Public routes */}
      <Route element={<TataLetak />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/kamus" element={<Kamus />} />
        <Route path="/kamus/cari/:kata" element={<Kamus />} />
        <Route path="/kamus/:kategori/:kode" element={<Kamus />} />
        <Route path="/kamus/detail/:indeks" element={<KamusDetail />} />
        <Route path="/tesaurus" element={<Tesaurus />} />
        <Route path="/tesaurus/cari/:kata" element={<Tesaurus />} />
        <Route path="/glosarium" element={<Glosarium />} />
        <Route path="/glosarium/cari/:kata" element={<Glosarium />} />
        <Route path="/glosarium/bidang/:bidang" element={<Glosarium />} />
        <Route path="/glosarium/sumber/:sumber" element={<Glosarium />} />
        <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />
      </Route>
    </Routes>
  );
}

export default App;
