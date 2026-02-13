import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        {/* TODO: Add more routes */}
        {/* <Route path="/kamus/:slug" element={<Dictionary />} /> */}
        {/* <Route path="/glosarium" element={<Glossary />} /> */}
        {/* <Route path="/peribahasa" element={<Proverb />} /> */}
      </Routes>
    </div>
  );
}

export default App;
