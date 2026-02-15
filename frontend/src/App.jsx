import { Routes, Route } from 'react-router-dom';
import TataLetak from './komponen/TataLetak';
import Beranda from './halaman/Beranda';
import Kamus from './halaman/Kamus';
import KamusDetail from './halaman/KamusDetail';
import KamusKategori from './halaman/KamusKategori';
import Tesaurus from './halaman/Tesaurus';
import TesaurusDetail from './halaman/TesaurusDetail';
import Glosarium from './halaman/Glosarium';

function App() {
  return (
    <Routes>
      <Route element={<TataLetak />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/kamus" element={<Kamus />} />
        <Route path="/kamus/cari/:kata" element={<Kamus />} />
        <Route path="/kamus/:kategori/:kode" element={<KamusKategori />} />
        <Route path="/kamus/detail/:entri" element={<KamusDetail />} />
        <Route path="/tesaurus" element={<Tesaurus />} />
        <Route path="/tesaurus/cari/:kata" element={<Tesaurus />} />
        <Route path="/tesaurus/:kata" element={<TesaurusDetail />} />
        <Route path="/glosarium" element={<Glosarium />} />
      </Route>
    </Routes>
  );
}

export default App;
