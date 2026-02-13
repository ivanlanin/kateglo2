import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        {/* TODO: Add more admin routes */}
        {/* <Route path="/phrases" element={<Phrases />} /> */}
        {/* <Route path="/phrases/new" element={<PhraseForm />} /> */}
        {/* <Route path="/phrases/:id/edit" element={<PhraseForm />} /> */}
        {/* <Route path="/users" element={<Users />} /> */}
        {/* <Route path="/analytics" element={<Analytics />} /> */}
      </Routes>
    </div>
  );
}

export default App;
