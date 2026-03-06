/**
 * @fileoverview Widget Gim Pilih Ganda untuk beranda Kateglo.
 *
 * Lima domain per ronde: kamus, tesaurus, glosarium, makna, rima.
 * Skor hanya di memori sesi (Fase 1 — tanpa login).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ambilRondePilihGanda } from '../../api/apiPublik';
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
  const bagian = String(teks || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  if (bagian.length <= 3) {
    return teks;
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
    <div className="gim-ringkasan-item" onClick={() => setBuka((v) => !v)}>
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

function GimPilihGanda() {
  const queryClient = useQueryClient();
  const rondeRef = useRef([]);

  const [rondeKey, setRondeKey] = useState(0);
  const [riwayatSoal, setRiwayatSoal] = useState([]);
  const [totalSkor, setTotalSkor] = useState(0);
  const [indeks, setIndeks] = useState(0);
  const [jawabanUser, setJawabanUser] = useState([]);
  const [fase, setFase] = useState('soal'); // 'soal' | 'ringkasan'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gim-pilih-ganda', rondeKey, riwayatSoal.map((item) => `${item.mode}:${item.kunciSoal}`).join('|')],
    queryFn: () => ambilRondePilihGanda({ riwayat: riwayatSoal }),
    staleTime: Infinity,
  });

  const ronde = data?.ronde ?? [];
  const soalSaatIni = ronde[indeks];

  useEffect(() => {
    rondeRef.current = data?.ronde ?? [];
  }, [data]);

  const jumlahBenar = jawabanUser.reduce((total, pilihan, i) => {
    if (pilihan !== null && pilihan !== undefined && ronde[i] && pilihan === ronde[i].jawaban) {
      return total + 1;
    }
    return total;
  }, 0);

  const sudahJawab = jawabanUser[indeks] !== undefined && jawabanUser[indeks] !== null;

  const handleLewati = useCallback(() => {
    if (sudahJawab) return;
    setJawabanUser((prev) => {
      const baru = [...prev];
      baru[indeks] = -1;
      return baru;
    });
  }, [sudahJawab, indeks]);

  const handlePilih = useCallback((pilihanIndeks) => {
    if (sudahJawab) return;
    if (soalSaatIni && pilihanIndeks === soalSaatIni.jawaban) {
      setTotalSkor((prev) => prev + 10);
    }
    setJawabanUser((prev) => {
      const baru = [...prev];
      baru[indeks] = pilihanIndeks;
      return baru;
    });
  }, [sudahJawab, indeks, soalSaatIni]);

  const handleRondeBaru = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['gim-pilih-ganda', rondeKey] });
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

  if (isLoading) {
    return (
      <div className="gim-pilih-ganda">
        <div className="gim-muat">
          <span>Menyiapkan soal…</span>
        </div>
      </div>
    );
  }

  if (isError || ronde.length === 0) {
    return null;
  }

  if (fase === 'ringkasan') {
    const kelasSkor = kelasSkorAkhir(jumlahBenar, ronde.length || 5);

    return (
      <div className="gim-pilih-ganda">
        <div className="gim-ringkasan-atas">
          <div className="gim-ringkasan">
            <div className={`gim-ringkasan-skor-angka ${kelasSkor}`}>{jumlahBenar}/{ronde.length}</div>
            <div className="gim-ringkasan-label">{labelSkor(jumlahBenar * 10)}</div>
          </div>
          <button type="button" className="gim-tombol-ronde" onClick={handleRondeBaru}>
            Lagi!
          </button>
        </div>
        <div className="gim-ringkasan-list">
          {ronde.map((soal, i) => (
            <ItemRingkasan key={`${soal.mode}-${i}`} soal={soal} pilihanUser={jawabanUser[i] ?? null} />
          ))}
        </div>
      </div>
    );
  }

  if (!soalSaatIni) return null;

  return (
    <div className="gim-pilih-ganda">
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
        <span className={`gim-header-skor ${kelasSkorHeader(totalSkor)}`}>{totalSkor}</span>
      </div>

      <p className="gim-soal">
        <PertanyaanSoal soal={soalSaatIni} />
      </p>

      <div className="gim-pilihan-list">
        {soalSaatIni.pilihan.map((pilihan, i) => {
          let kelas = 'gim-tombol';
          if (sudahJawab) {
            if (jawabanUser[indeks] === soalSaatIni.jawaban && i === soalSaatIni.jawaban) {
              kelas += ' gim-tombol-benar';
            } else if (i === jawabanUser[indeks]) {
              kelas += ' gim-tombol-salah';
            } else {
              kelas += ' gim-tombol-redup';
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
              {teksPilihan(soalSaatIni, pilihan)}
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

export default GimPilihGanda;
export { gabungRiwayat };
