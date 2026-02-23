import { useEffect, useState } from 'react';

function useNavigasiMemuat(isFetching, resetKey) {
  const [navigasiAktif, setNavigasiAktif] = useState(null);

  useEffect(() => {
    setNavigasiAktif(null);
  }, [resetKey]);

  useEffect(() => {
    if (!isFetching) {
      setNavigasiAktif(null);
    }
  }, [isFetching]);

  const mulaiNavigasi = (key) => {
    setNavigasiAktif(key);
  };

  const isNavigasiMemuat = Boolean(isFetching && navigasiAktif);

  return {
    navigasiAktif,
    mulaiNavigasi,
    isNavigasiMemuat,
  };
}

export default useNavigasiMemuat;
