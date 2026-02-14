import { Routes, Route } from 'react-router-dom';
import TataLetak from './komponen/TataLetak';
import Beranda from './halaman/Beranda';
import Kamus from './halaman/Kamus';
import KamusDetail from './halaman/KamusDetail';
import Glosarium from './halaman/Glosarium';
import Peribahasa from './halaman/Peribahasa';
import Singkatan from './halaman/Singkatan';

function App() {
  return (
    <Routes>
      <Route element={<TataLetak />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/kamus" element={<Kamus />} />
        <Route path="/kamus/:slug" element={<KamusDetail />} />
        <Route path="/glosarium" element={<Glosarium />} />
        <Route path="/peribahasa" element={<Peribahasa />} />
        <Route path="/singkatan" element={<Singkatan />} />
      </Route>
    </Routes>
  );
}

export default App;
