import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import TataLetakPublik from './components/tampilan/TataLetakPublik';
import { LoginAdmin } from './pages/redaksi/inti';
import { ruteHalamanRedaksi } from './pages/redaksi/ruteRedaksi';
import { AuthCallbackPublik, ruteHalamanPublik } from './pages/publik/rutePublik';

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

function renderRutePublik({ Component, element = null }) {
  if (element) {
    return element;
  }

  return bungkusLazy(<Component />);
}

function renderRuteRedaksi(Component, izinDibutuhkan = []) {
  const element = izinDibutuhkan.length
    ? <RuteIzin izinDibutuhkan={izinDibutuhkan}><Component /></RuteIzin>
    : <RuteRedaksi><Component /></RuteRedaksi>;

  return bungkusLazy(element);
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
      <Route path="/auth/callback" element={bungkusLazy(<AuthCallbackPublik />)} />
      {/* Redaksi routes — tanpa TataLetak */}
      <Route path="/redaksi/login" element={<LoginAdmin />} />
      {ruteHalamanRedaksi.map(({ path, Component, izinDibutuhkan = [] }) => (
        <Route key={path} path={path} element={renderRuteRedaksi(Component, izinDibutuhkan)} />
      ))}
      {/* Public routes */}
      <Route element={<TataLetakPublik />}>
        {ruteHalamanPublik.map(({ path, Component, element = null }) => (
          <Route key={path} path={path} element={renderRutePublik({ Component, element })} />
        ))}
      </Route>
    </Routes>
  );
}

export default App;
export { RuteIzin };
