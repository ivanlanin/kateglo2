/**
 * @fileoverview Halaman gim Susun Kata
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ambilPuzzleSusunKata, validasiKataSusunKata } from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';
import { useAuth } from '../../context/authContext';
import TombolMasukGoogle from '../../komponen/bersama/TombolMasukGoogle';
import PesanMunculan from '../../komponen/bersama/PesanMunculan';
import { buatPathDetailKamus } from '../../utils/paramUtils';

const MAKS_PERCOBAAN = 6;
const PANJANG_DEFAULT = 5;
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl'];
const PRIORITAS_STATUS = {
  salah: 0,
  ada: 1,
  benar: 2,
};

function evaluasiTebakan(tebakan, target) {
  const hasil = Array.from({ length: target.length }, () => 'salah');
  const sisa = {};

  for (let i = 0; i < target.length; i += 1) {
    if (tebakan[i] === target[i]) {
      hasil[i] = 'benar';
    } else {
      const hurufTarget = target[i];
      sisa[hurufTarget] = (sisa[hurufTarget] || 0) + 1;
    }
  }

  for (let i = 0; i < target.length; i += 1) {
    if (hasil[i] === 'benar') continue;
    const huruf = tebakan[i];
    if ((sisa[huruf] || 0) > 0) {
      hasil[i] = 'ada';
      sisa[huruf] -= 1;
    }
  }

  return hasil;
}

function kelasStatusSel(status) {
  if (status === 'benar') return 'susun-kata-cell-benar';
  if (status === 'ada') return 'susun-kata-cell-ada';
  if (status === 'salah') return 'susun-kata-cell-salah';
  return '';
}

function kelasStatusKey(status) {
  if (status === 'benar') return 'susun-kata-key-benar';
  if (status === 'ada') return 'susun-kata-key-ada';
  if (status === 'salah') return 'susun-kata-key-salah';
  return '';
}

function buatPetaKeyboard(riwayat, target) {
  const peta = {};

  riwayat.forEach((tebakan) => {
    const statusTebakan = evaluasiTebakan(tebakan, target);
    statusTebakan.forEach((status, idx) => {
      const huruf = tebakan[idx];
      if (!huruf) return;
      const statusLama = peta[huruf];
      if (!statusLama || PRIORITAS_STATUS[status] > PRIORITAS_STATUS[statusLama]) {
        peta[huruf] = status;
      }
    });
  });

  return peta;
}

function SusunKata() {
  const { isAuthenticated, isLoading: authLoading, loginDenganGoogle } = useAuth();
  const [riwayat, setRiwayat] = useState([]);
  const [tebakan, setTebakan] = useState('');
  const [pesanMunculan, setPesanMunculan] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['gim-susun-kata-puzzle', PANJANG_DEFAULT],
    queryFn: () => ambilPuzzleSusunKata({ panjang: PANJANG_DEFAULT }),
    staleTime: 0,
    enabled: Boolean(isAuthenticated),
  });

  const panjang = Number(data?.panjang) || PANJANG_DEFAULT;
  const target = String(data?.target || '').toLowerCase();
  const kamusSet = useMemo(
    () => new Set((data?.kamus || []).map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)),
    [data?.kamus]
  );
  const menang = Boolean(target) && riwayat.some((item) => item === target);
  const kalah = !menang && riwayat.length >= MAKS_PERCOBAAN;
  const selesai = menang || kalah;
  const petaKeyboard = useMemo(() => buatPetaKeyboard(riwayat, target), [riwayat, target]);

  const tampilkanPesan = useCallback((jenis, judul, deskripsi = '') => {
    setPesanMunculan({
      token: `${Date.now()}-${Math.random()}`,
      jenis,
      judul,
      deskripsi,
    });
  }, []);

  const submitTebakan = useCallback(async () => {
    if (!target || selesai) return;

    if (tebakan.length !== panjang) {
      tampilkanPesan('error', `Masukkan tepat ${panjang} huruf.`);
      return;
    }

    let validDiKamus = kamusSet.has(tebakan);

    if (!validDiKamus) {
      try {
        const hasilValidasi = await validasiKataSusunKata(tebakan, { panjang });
        validDiKamus = Boolean(hasilValidasi?.valid);
      } catch (_error) {
        validDiKamus = false;
      }
    }

    if (!validDiKamus) {
      tampilkanPesan('error', 'Kata tidak ada di kamus Susun Kata.');
      return;
    }

    const riwayatBaru = [...riwayat, tebakan];
    const menangBaru = tebakan === target;
    const kalahBaru = !menangBaru && riwayatBaru.length >= MAKS_PERCOBAAN;

    setRiwayat(riwayatBaru);
    setTebakan('');

    if (menangBaru) {
      const artiAman = data?.arti || 'arti belum tersedia';
      tampilkanPesan(
        'success',
        'Selamat! 🥳',
        (
          <>
            Kata {target.toUpperCase()} berarti {"'"}{artiAman}{"'"}.
            <br />
            <br />
            Lihat <Link className="pesan-munculan-link" to={buatPathDetailKamus(target)}>entri kata itu di kamus</Link>.
          </>
        )
      );
      return;
    }

    if (kalahBaru) {
      tampilkanPesan('error', `Kesempatan habis. Jawabannya ${target.toUpperCase()}.`);
    }
  }, [data?.arti, kamusSet, panjang, riwayat, selesai, tampilkanPesan, target, tebakan]);

  useEffect(() => {
    setRiwayat([]);
    setTebakan('');
    setPesanMunculan(null);
  }, [target]);

  useEffect(() => {
    if (!isAuthenticated || !target || selesai) return undefined;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void submitTebakan();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        setTebakan((prev) => prev.slice(0, -1));
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        setTebakan((prev) => `${prev}${event.key.toLowerCase()}`.slice(0, panjang));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, selesai, submitTebakan, panjang, target]);

  const barisGrid = Array.from({ length: MAKS_PERCOBAAN }, (_, idx) => {
    const nilai = riwayat[idx] || '';
    const status = riwayat[idx] && target ? evaluasiTebakan(riwayat[idx], target) : [];
    const aktif = idx === riwayat.length && !selesai;
    const preview = aktif ? tebakan : nilai;

    return {
      key: `baris-${idx}`,
      huruf: Array.from({ length: panjang }, (_x, i) => preview[i] || ''),
      status,
      aktif,
    };
  });

  return (
    <HalamanDasar judul="Susun Kata" deskripsi="Gim susun kata dari data Kateglo" tampilkanJudul={false}>
      <div className="susun-kata-wrap">
        <h1 className="susun-kata-heading">Susun Kata</h1>
        {isAuthenticated ? (
          <p className="susun-kata-info" aria-live="polite">
            Kata benar (debug): {target ? target.toUpperCase() : '—'}
          </p>
        ) : null}

        <QueryFeedback
          isLoading={isAuthenticated && isLoading && !data}
          isError={isError}
          error={error}
          loadingText="Menyiapkan gim ..."
          errorText="Gagal memuat gim."
        />

        {!authLoading && !isAuthenticated && (
          <div className="susun-kata-locked-wrap">
            <p className="susun-kata-locked-text">
              Susun Kata adalah gim menyusun lima huruf untuk membentuk kata yang sah dalam kamus dalam enam kesempatan. Gim ini terinspirasi oleh Wordle dari Josh Wardle dan mengikuti semua aturan gim tersebut.
            </p>
            <TombolMasukGoogle
              label="Masuk untuk Bermain"
              className="susun-kata-login-btn"
              onClick={() => loginDenganGoogle('/gim/susun-kata')}
            />
          </div>
        )}

        {!isError && isAuthenticated && data && (
          <>
            <div className="susun-kata-grid">
              {barisGrid.map((baris) => (
                <div key={baris.key} className="susun-kata-grid-row">
                  {baris.huruf.map((huruf, idx) => {
                    const status = baris.status[idx] || '';
                    const kelasStatus = kelasStatusSel(status);
                    return (
                      <div
                        key={`${baris.key}-${idx}`}
                        className={`susun-kata-cell ${kelasStatus} ${baris.aktif ? 'susun-kata-cell-aktif' : ''}`.trim()}
                      >
                        {huruf.toUpperCase()}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="susun-kata-keyboard" aria-label="Keyboard indikator huruf">
              {KEYBOARD_ROWS.map((row) => (
                <div key={row} className="susun-kata-keyboard-row">
                  {row.split('').map((huruf) => (
                    <span
                      key={huruf}
                      className={`susun-kata-key ${kelasStatusKey(petaKeyboard[huruf])}`.trim()}
                    >
                      {huruf.toUpperCase()}
                    </span>
                  ))}
                </div>
              ))}
              <div className="susun-kata-keyboard-row">
                <button
                  type="button"
                  className="susun-kata-key susun-kata-key-wide"
                  onClick={() => void submitTebakan()}
                  disabled={selesai}
                >
                  Enter
                </button>
                {'zxcvbnm'.split('').map((huruf) => (
                  <span
                    key={`baris-bawah-${huruf}`}
                    className={`susun-kata-key ${kelasStatusKey(petaKeyboard[huruf])}`.trim()}
                  >
                    {huruf.toUpperCase()}
                  </span>
                ))}
                <button
                  type="button"
                  className="susun-kata-key susun-kata-key-wide"
                  onClick={() => setTebakan((prev) => prev.slice(0, -1))}
                  disabled={selesai}
                >
                  Hapus
                </button>
              </div>
            </div>

            <PesanMunculan
              tampil={Boolean(pesanMunculan)}
              token={pesanMunculan?.token || ''}
              jenis={pesanMunculan?.jenis || 'info'}
              judul={pesanMunculan?.judul || ''}
              deskripsi={pesanMunculan?.deskripsi || ''}
              durasi={pesanMunculan?.jenis === 'success' ? 0 : 2200}
              onClose={() => setPesanMunculan(null)}
            />
          </>
        )}
      </div>
    </HalamanDasar>
  );
}

export default SusunKata;
