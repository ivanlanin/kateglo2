import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ambilReturnTo } from '../api/apiAuth';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthToken } = useAuth();
  const processedRef = useRef(false);

  const errorMessage = useMemo(() => searchParams.get('error') || '', [searchParams]);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    if (errorMessage) {
      navigate('/', {
        replace: true,
        state: { authError: errorMessage },
      });
      return;
    }

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const token = new URLSearchParams(hash).get('token');

    if (!token) {
      navigate('/', {
        replace: true,
        state: { authError: 'Token login tidak ditemukan' },
      });
      return;
    }

    setAuthToken(token);
    const tujuan = ambilReturnTo();
    navigate(tujuan, { replace: true });
  }, [errorMessage, navigate, setAuthToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Memproses login Google...</p>
    </div>
  );
}

export default AuthCallback;
