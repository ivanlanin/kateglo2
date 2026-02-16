import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetak from './komponen/TataLetak';
import Beranda from './halaman/Beranda';
import Kamus from './halaman/Kamus';
import KamusDetail from './halaman/KamusDetail';
import Tesaurus from './halaman/Tesaurus';
import Glosarium from './halaman/Glosarium';
import AuthCallback from './halaman/AuthCallback';
import KebijakanPrivasi from './halaman/KebijakanPrivasi';
import LoginAdmin from './halaman/admin/LoginAdmin';
import DasborAdmin from './halaman/admin/DasborAdmin';
import KamusAdmin from './halaman/admin/KamusAdmin';
import TesaurusAdmin from './halaman/admin/TesaurusAdmin';
import GlosariumAdmin from './halaman/admin/GlosariumAdmin';
import PenggunaAdmin from './halaman/admin/PenggunaAdmin';

function RuteAdmin({ children }) {
  const { isAuthenticated, adalahAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
        <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
      </div>
    );
  }

  if (!isAuthenticated || !adalahAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      {/* Admin routes — tanpa TataLetak */}
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/admin" element={<RuteAdmin><DasborAdmin /></RuteAdmin>} />
      <Route path="/admin/kamus" element={<RuteAdmin><KamusAdmin /></RuteAdmin>} />
      <Route path="/admin/tesaurus" element={<RuteAdmin><TesaurusAdmin /></RuteAdmin>} />
      <Route path="/admin/glosarium" element={<RuteAdmin><GlosariumAdmin /></RuteAdmin>} />
      <Route path="/admin/pengguna" element={<RuteAdmin><PenggunaAdmin /></RuteAdmin>} />
      {/* Public routes */}
      <Route element={<TataLetak />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/kamus" element={<Kamus />} />
        <Route path="/kamus/cari/:kata" element={<Kamus />} />
        <Route path="/kamus/:kategori/:kode" element={<Kamus />} />
        <Route path="/kamus/detail/:entri" element={<KamusDetail />} />
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
