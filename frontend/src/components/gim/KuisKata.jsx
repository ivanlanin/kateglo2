/**
 * @fileoverview Komponen Kuis Kata untuk beranda dan halaman gim Kateglo.
 *
 * Lima domain per ronde: kamus, tesaurus, glosarium, makna, rima.
 * Skor hanya di memori sesi (Fase 1 — tanpa login).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ambilRondeKuisKata, submitRekapKuisKata } from '../../api/apiPublik';
import { useAuthOptional } from '../../context/authContext';
import { buatPathDetailKamus } from '../../utils/paramUtils';

const labelMode = {
  kamus: 'Kamus',
  tesaurus: 'Tesaurus',
  glosarium: 'Glosarium',
  makna: 'Makna',
  rima: 'Rima',
};

const labelSkor = (skor) => {
  if (skor >= 50) return 'Sempurna!';
  if (skor >= 40) return 'Hampir sempurna!';
  if (skor >= 30) return 'Lumayan!';
  if (skor >= 20) return 'Terus berlatih!';
  return 'Coba lagi!';
};

function ikonMode(mode) {
  const peta = { kamus: '📖', tesaurus: '🔄', glosarium: '🌐', makna: '💡', rima: '🎵' };
  return peta[mode] || '❓';
}

function batasiPilihanTesaurus(teks) {
  const teksAman = String(teks || '');
  const bagian = teksAman
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  if (bagian.length <= 3) {
    return teksAman;
  }

  return bagian.slice(0, 3).join('; ');
}

function teksPilihan(soal, pilihan) {
  if (soal.mode === 'tesaurus') {
    return batasiPilihanTesaurus(pilihan);
  }
  return pilihan;
}

function gabungRiwayat(prev, rondeBaru, batasPerMode = 3) {
  const hasil = Array.isArray(prev) ? [...prev] : [];
  const tambahan = Array.isArray(rondeBaru)
    ? rondeBaru
      .map((soal) => ({
        mode: soal?.mode,
        kunciSoal: soal?.kunciSoal || soal?.soal,
      }))
      .filter((item) => item.mode && item.kunciSoal)
    : [];

  for (const item of tambahan) {
    const mode = String(item.mode).trim().toLowerCase();
    const kunciSoal = String(item.kunciSoal).trim();
    if (!mode || !kunciSoal) continue;

    const tanpaDuplikat = hasil.filter(
      (entry) => !(entry.mode === mode && entry.kunciSoal === kunciSoal),
    );
    tanpaDuplikat.push({ mode, kunciSoal });

    const perMode = tanpaDuplikat.filter((entry) => entry.mode === mode);
    if (perMode.length > batasPerMode) {
      const buang = perMode.length - batasPerMode;
      let sisaBuang = buang;
      hasil.length = 0;
      for (const entry of tanpaDuplikat) {
        if (entry.mode === mode && sisaBuang > 0) {
          sisaBuang -= 1;
          continue;
        }
        hasil.push(entry);
      }
    } else {
      hasil.length = 0;
      hasil.push(...tanpaDuplikat);
    }
  }

  return hasil;
}

function kelasSkorAkhir(jumlahBenar, totalSoal) {
  if (jumlahBenar <= 0) return 'gim-ringkasan-skor-merah';
  if (jumlahBenar >= totalSoal) return 'gim-ringkasan-skor-hijau';
  if (jumlahBenar === totalSoal - 1) return 'gim-ringkasan-skor-hijau-muda';
  if (jumlahBenar === Math.ceil(totalSoal / 2)) return 'gim-ringkasan-skor-kuning';
  if (jumlahBenar < Math.ceil(totalSoal / 2)) return 'gim-ringkasan-skor-jingga';
  return 'gim-ringkasan-skor-limau';
}

function kelasSkorHeader(skor) {
  if (skor <= 0) return 'gim-header-skor-merah';
  if (skor >= 50) return 'gim-header-skor-hijau';
  return 'gim-header-skor-hijau-muda';
}

function buatPathRingkasan(soal) {
  switch (soal.mode) {
    case 'glosarium':
      return `/glosarium/detail/${encodeURIComponent(soal.soal)}`;
    case 'tesaurus':
      return `/tesaurus/cari/${encodeURIComponent(soal.soal)}`;
    case 'makna':
      return `/makna/cari/${encodeURIComponent(soal.soal)}`;
    case 'rima':
      return `/rima/cari/${encodeURIComponent(soal.soal)}`;
    default:
      return buatPathDetailKamus(soal.soal);
  }
}

function TautanRingkasan({ soal }) {
  const tujuan = buatPathRingkasan(soal);

  return (
    <Link to={tujuan} className="gim-tautan-ringkasan" onClick={(event) => event.stopPropagation()}>
      {soal.mode === 'glosarium' ? <em>{soal.soal}</em> : soal.soal}
    </Link>
  );
}

function PertanyaanRingkasan({ soal }) {
  switch (soal.mode) {
    case 'makna':
      return (
        <>
          Apa yang bermakna &apos;<TautanRingkasan soal={soal} />&apos;?
        </>
      );
    case 'rima':
      return (
        <>
          Apa yang berima dengan <TautanRingkasan soal={soal} />?
        </>
      );
    case 'glosarium':
      return (
        <>
          Apa padanan <TautanRingkasan soal={soal} />?
        </>
      );
    case 'tesaurus':
      return (
        <>
          Apa {soal.relasi || 'sinonim'} <TautanRingkasan soal={soal} />?
        </>
      );
    default:
      return (
        <>
          Apa arti <TautanRingkasan soal={soal} />?
        </>
      );
  }
}

function PertanyaanSoal({ soal }) {
  switch (soal.mode) {
    case 'makna':
      return (
        <>
          Apa yang bermakna &apos;{soal.soal}&apos;?
        </>
      );
    case 'rima':
      return (
        <>
          Apa yang berima dengan <strong>{soal.soal}</strong>?
        </>
      );
    case 'glosarium':
      return (
        <>
          Apa padanan <em>{soal.soal}</em>?
        </>
      );
    case 'tesaurus':
      return (
        <>
          Apa {soal.relasi || 'sinonim'} <strong>{soal.soal}</strong>?
        </>
      );
    default:
      return (
        <>
          Apa arti <strong>{soal.soal}</strong>?
        </>
      );
  }
}

function ItemRingkasan({ soal, pilihanUser }) {
  const [buka, setBuka] = useState(false);
  const benar = pilihanUser === soal.jawaban;

  return (
    <div
      className={`gim-ringkasan-item${buka ? ' gim-ringkasan-item-terbuka' : ''}`}
      onClick={() => setBuka((v) => !v)}
    >
      <div className={`gim-ringkasan-item-header${buka ? ' gim-ringkasan-item-header-terbuka' : ''}`}>
        <span className={benar ? 'gim-ikon-benar' : 'gim-ikon-salah'}>{benar ? '✓' : '✗'}</span>
        <span className="flex-1 text-sm"><PertanyaanRingkasan soal={soal} /></span>
        <span className="text-gray-400 text-xs">{buka ? '▲' : '▼'}</span>
      </div>
      {buka && (
        <div className="gim-ringkasan-item-detail">
          {soal.pilihan.map((p, i) => {
            const adalahJawaban = i === soal.jawaban;
            return adalahJawaban ? (
              <div key={p} className="gim-ringkasan-item-benar">
                <span className="gim-ikon-benar">✓</span>
                <span>{teksPilihan(soal, p)}</span>
              </div>
            ) : (
              <div key={p} className="gim-ringkasan-item-salah">
                <span className="gim-ikon-salah">✗</span>
                <span>{teksPilihan(soal, p)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KuisKata() {
  const auth = useAuthOptional();
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const queryClient = useQueryClient();
  const rondeRef = useRef([]);
  const skorAwalRef = useRef(true);
  const rondeTerkirimRef = useRef(null);

  const [rondeKey, setRondeKey] = useState(0);
  const [riwayatSoal, setRiwayatSoal] = useState([]);
  const [totalSkor, setTotalSkor] = useState(0);
  const [animasiSkor, setAnimasiSkor] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [jawabanUser, setJawabanUser] = useState([]);
  const [fase, setFase] = useState('soal'); // 'soal' | 'ringkasan'
  const [rondeMulaiAt, setRondeMulaiAt] = useState(Date.now());
  const [statusRekap, setStatusRekap] = useState(isAuthenticated ? 'idle' : 'guest');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['kuis-kata', rondeKey, riwayatSoal.map((item) => `${item.mode}:${item.kunciSoal}`).join('|')],
    queryFn: () => ambilRondeKuisKata({ riwayat: riwayatSoal }),
    staleTime: Infinity,
  });

  const ronde = data?.ronde ?? [];
  const soalSaatIni = ronde[indeks];

  const kirimRekap = useMutation({
    mutationFn: (payload) => submitRekapKuisKata(payload),
    onMutate: () => {
      setStatusRekap('saving');
    },
    onSuccess: () => {
      setStatusRekap('saved');
    },
    onError: () => {
      setStatusRekap('error');
    },
  });

  useEffect(() => {
    rondeRef.current = data?.ronde ?? [];
  }, [data]);

  useEffect(() => {
    rondeTerkirimRef.current = null;
    setRondeMulaiAt(Date.now());
    setStatusRekap(isAuthenticated ? 'idle' : 'guest');
  }, [isAuthenticated, rondeKey, ronde.length]);

  useEffect(() => {
    if (skorAwalRef.current) {
      skorAwalRef.current = false;
      return undefined;
    }

    setAnimasiSkor(true);
    const timerId = window.setTimeout(() => {
      setAnimasiSkor(false);
    }, 420);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [totalSkor]);

  const jumlahBenar = jawabanUser.reduce((total, pilihan, i) => {
    if (pilihan !== null && pilihan !== undefined && ronde[i] && pilihan === ronde[i].jawaban) {
      return total + 1;
    }
    return total;
  }, 0);

  const sudahJawab = jawabanUser[indeks] !== undefined && jawabanUser[indeks] !== null;

  const handleLewati = useCallback(() => {
    setJawabanUser((prev) => {
      const baru = [...prev];
      baru[indeks] = -1;
      return baru;
    });
  }, [indeks]);

  const handlePilih = useCallback((pilihanIndeks) => {
    if (soalSaatIni && pilihanIndeks === soalSaatIni.jawaban) {
      setTotalSkor((prev) => prev + 10);
    }
    setJawabanUser((prev) => {
      const baru = [...prev];
      baru[indeks] = pilihanIndeks;
      return baru;
    });
  }, [indeks, soalSaatIni]);

  const handleRondeBaru = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['kuis-kata', rondeKey] });
    setRiwayatSoal((prev) => gabungRiwayat(prev, rondeRef.current));
    setRondeKey((k) => k + 1);
    setIndeks(0);
    setJawabanUser([]);
    setFase('soal');
  }, [queryClient, rondeKey]);

  useEffect(() => {
    if (!sudahJawab || fase !== 'soal' || !soalSaatIni) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      if (indeks < ronde.length - 1) {
        setIndeks((current) => current + 1);
      } else {
        setFase('ringkasan');
      }
    }, 1900);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [fase, indeks, ronde.length, sudahJawab, soalSaatIni]);

  useEffect(() => {
    if (fase !== 'ringkasan' || !ronde.length) {
      return;
    }

    if (!isAuthenticated) {
      setStatusRekap('guest');
      return;
    }

    if (rondeTerkirimRef.current === rondeKey || kirimRekap.isPending) {
      return;
    }

    rondeTerkirimRef.current = rondeKey;
    kirimRekap.mutate({
      jumlahBenar,
      jumlahPertanyaan: ronde.length,
      durasiDetik: Math.max(Math.round((Date.now() - rondeMulaiAt) / 1000), 0),
    });
  }, [fase, isAuthenticated, jumlahBenar, kirimRekap, ronde.length, rondeKey, rondeMulaiAt]);

  if (isLoading) {
    return (
      <div className="gim-kuis-kata">
        <div className="gim-muat">
          <span>Menyiapkan soal …</span>
        </div>
      </div>
    );
  }

  if (isError || ronde.length === 0) {
    return null;
  }

  if (fase === 'ringkasan') {
    const kelasSkor = kelasSkorAkhir(jumlahBenar, ronde.length);
    let catatanRekap = 'Masuk untuk ikut ke klasemen harian.';

    if (isAuthenticated && statusRekap === 'saving') {
      catatanRekap = 'Menyimpan skor harian…';
    } else if (isAuthenticated && statusRekap === 'saved') {
      catatanRekap = 'Skor harian tersimpan.';
    } else if (isAuthenticated && statusRekap === 'error') {
      catatanRekap = 'Skor harian belum tersimpan.';
    } else if (isAuthenticated) {
      catatanRekap = 'Skor harian sedang disiapkan.';
    }

    return (
      <div className="gim-kuis-kata">
        <div className="gim-ringkasan-atas">
          <div className="gim-ringkasan">
            <div className={`gim-ringkasan-skor-angka ${kelasSkor}`}>{jumlahBenar}/{ronde.length}</div>
            <div className="gim-ringkasan-label">{labelSkor(jumlahBenar * 10)}</div>
            <div className="gim-ringkasan-catatan">{catatanRekap}</div>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={handleRondeBaru}>
            Main lagi!
          </button>
        </div>
        <div className="gim-ringkasan-list">
          {ronde.map((soal, i) => (
            <ItemRingkasan key={`${soal.mode}-${i}`} soal={soal} pilihanUser={jawabanUser[i]} />
          ))}
        </div>
      </div>
    );
  }

  if (!soalSaatIni) return null;

  return (
    <div className="gim-kuis-kata">
      <div className="gim-header">
        <span className="gim-header-mode">{ikonMode(soalSaatIni.mode)} {labelMode[soalSaatIni.mode]}</span>
        <div className="gim-progress" aria-label={`Progres soal ${indeks + 1} dari ${ronde.length}`}>
          {ronde.map((soal, i) => {
            const pilihan = jawabanUser[i];
            let kelasBullet = 'gim-progress-bullet';

            if (pilihan !== undefined && pilihan !== null) {
              kelasBullet += pilihan === soal.jawaban
                ? ' gim-progress-bullet-benar'
                : ' gim-progress-bullet-salah';
            }

            if (i === indeks && fase === 'soal') {
              kelasBullet += ' gim-progress-bullet-aktif';
            }

            return <span key={`${soal.mode}-${i}`} className={kelasBullet} aria-hidden="true" />;
          })}
        </div>
        <span className={`gim-header-skor ${kelasSkorHeader(totalSkor)}${animasiSkor ? ' gim-header-skor-animasi' : ''}`}>{totalSkor}</span>
      </div>

      <p className="gim-soal">
        <PertanyaanSoal soal={soalSaatIni} />
      </p>

      <div className="gim-pilihan-list">
        {soalSaatIni.pilihan.map((pilihan, i) => {
          let kelas = 'gim-tombol';
          let statusPilihan = null;
          if (sudahJawab) {
            if (jawabanUser[indeks] === soalSaatIni.jawaban && i === soalSaatIni.jawaban) {
              kelas += ' gim-tombol-benar';
              statusPilihan = 'benar';
            } else if (i === jawabanUser[indeks]) {
              kelas += ' gim-tombol-salah';
              statusPilihan = 'salah';
            }
          }
          return (
            <button
              key={pilihan}
              type="button"
              className={kelas}
              onClick={() => handlePilih(i)}
              disabled={sudahJawab}
            >
              <span className={`gim-tombol-konten${statusPilihan ? ' gim-tombol-konten-berikon' : ''}`}>
                {statusPilihan ? (
                  <span className="gim-tombol-ikon" aria-hidden="true">
                    {statusPilihan === 'benar' ? '✓' : '✕'}
                  </span>
                ) : null}
                <span className="gim-tombol-label">{teksPilihan(soalSaatIni, pilihan)}</span>
              </span>
            </button>
          );
        })}
      </div>

      {!sudahJawab && (
        <div className="gim-aksi-bawah">
          <button type="button" className="gim-tombol-lewati" onClick={handleLewati}>
            Lewati
          </button>
        </div>
      )}
    </div>
  );
}

export default KuisKata;
export { gabungRiwayat };
export const __private = {
  labelSkor,
  ikonMode,
  batasiPilihanTesaurus,
  teksPilihan,
  kelasSkorAkhir,
  kelasSkorHeader,
  buatPathRingkasan,
  TautanRingkasan,
  PertanyaanRingkasan,
  PertanyaanSoal,
};
