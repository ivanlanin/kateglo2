import { Routes, Route } from 'react-router-dom';
import TataLetak from './komponen/TataLetak';
import Beranda from './halaman/Beranda';
import Kamus from './halaman/Kamus';
import KamusDetail from './halaman/KamusDetail';
import Tesaurus from './halaman/Tesaurus';
import Glosarium from './halaman/Glosarium';
import AuthCallback from './halaman/AuthCallback';

function App() {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
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
      </Route>
    </Routes>
  );
}

export default App;
