/**
 * @fileoverview Halaman redirect entri acak kamus.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ambilEntriAcakKamus } from '../../../api/apiPublik';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';

function KamusAcak() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let aktif = true;

    async function redirectKeEntriAcak() {
      try {
        const data = await ambilEntriAcakKamus();
        const url = String(data?.url || '').trim();

        if (!aktif) {
          return;
        }

        if (!url) {
          setStatus('error');
          return;
        }

        navigate(url, { replace: true });
      } catch (_error) {
        if (aktif) {
          setStatus('error');
        }
      }
    }

    redirectKeEntriAcak();

    return () => {
      aktif = false;
    };
  }, [navigate]);

  return (
    <HalamanPublik
      judul="Entri acak"
      deskripsi="Mengarahkan ke entri kamus acak."
      tampilkanJudul={false}
    >
      <p className="secondary-text kamus-acak-status">
        {status === 'error'
          ? 'Entri acak belum tersedia.'
          : 'Mengarahkan ke entri acak …'}
      </p>
    </HalamanPublik>
  );
}

export default KamusAcak;