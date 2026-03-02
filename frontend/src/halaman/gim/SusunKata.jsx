/**
 * @fileoverview Halaman gim Susun Kata
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Info, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ambilKlasemenSusunKata,
  ambilPuzzleSusunKata,
  submitSkorSusunKata,
  validasiKataSusunKata,
} from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';
import { useAuth } from '../../context/authContext';
import TombolMasuk from '../../komponen/bersama/TombolMasuk';
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

function parseRiwayatDariSkor(tebakanRaw, panjang) {
  const panjangAman = Number(panjang) || PANJANG_DEFAULT;
  return String(tebakanRaw || '')
    .split(';')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length === panjangAman && /^[a-z]+$/.test(item))
    .slice(0, MAKS_PERCOBAAN);
}

function SusunKata() {
  const { isAuthenticated, isLoading: authLoading, loginDenganGoogle } = useAuth();
  const [riwayat, setRiwayat] = useState([]);
  const [tebakan, setTebakan] = useState('');
  const [pesanMunculan, setPesanMunculan] = useState(null);
  const [mulaiMainAt, setMulaiMainAt] = useState(Date.now());
  const [skorTerkirim, setSkorTerkirim] = useState(false);
  const [panelAktif, setPanelAktif] = useState('permainan');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['gim-susun-kata-puzzle', PANJANG_DEFAULT],
    queryFn: () => ambilPuzzleSusunKata({ panjang: PANJANG_DEFAULT }),
    staleTime: 0,
    enabled: Boolean(isAuthenticated),
  });

  const panjang = Number(data?.panjang) || PANJANG_DEFAULT;
  const target = String(data?.target || '').toLowerCase();
  const sudahMainHariIni = Boolean(data?.sudahMainHariIni);
  const kamusSet = useMemo(
    () => new Set((data?.kamus || []).map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)),
    [data?.kamus]
  );
  const menang = Boolean(target) && riwayat.some((item) => item === target);
  const kalah = !menang && riwayat.length >= MAKS_PERCOBAAN;
  const selesai = menang || kalah || sudahMainHariIni;
  const petaKeyboard = useMemo(() => buatPetaKeyboard(riwayat, target), [riwayat, target]);

  const kirimSkor = useMutation({
    mutationFn: submitSkorSusunKata,
  });

  const { data: dataKlasemen } = useQuery({
    queryKey: ['gim-susun-kata-klasemen', panjang],
    queryFn: () => ambilKlasemenSusunKata({ panjang, limit: 10 }),
    staleTime: 30 * 1000,
    enabled: panelAktif === 'klasemen',
  });

  const daftarKlasemen = dataKlasemen?.data || [];
  const panelKlasemenTerbuka = panelAktif === 'klasemen';
  const panelInfoTerbuka = panelAktif === 'info';

  const tampilkanPesan = useCallback((jenis, judul, deskripsi = '') => {
    setPesanMunculan({
      token: `${Date.now()}-${Math.random()}`,
      jenis,
      judul,
      deskripsi,
    });
  }, []);

  const tambahHuruf = useCallback((huruf) => {
    if (selesai) return;
    setTebakan((prev) => `${prev}${huruf}`.slice(0, panjang));
  }, [panjang, selesai]);

  const hapusHuruf = useCallback(() => {
    if (selesai) return;
    setTebakan((prev) => prev.slice(0, -1));
  }, [selesai]);

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
    const serializedTebakan = riwayatBaru.join(';');

    setRiwayat(riwayatBaru);
    setTebakan('');

    if (menangBaru) {
      if (!skorTerkirim) {
        const detik = Math.max(Math.floor((Date.now() - mulaiMainAt) / 1000), 0);
        kirimSkor.mutate(
          {
            panjang,
            percobaan: riwayatBaru.length,
            detik,
            menang: true,
            tebakan: serializedTebakan,
          },
          {
            onSettled: () => setSkorTerkirim(true),
          }
        );
      }

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
      if (!skorTerkirim) {
        const detik = Math.max(Math.floor((Date.now() - mulaiMainAt) / 1000), 0);
        kirimSkor.mutate(
          {
            panjang,
            percobaan: MAKS_PERCOBAAN,
            detik,
            menang: false,
            tebakan: serializedTebakan,
          },
          {
            onSettled: () => setSkorTerkirim(true),
          }
        );
      }

      tampilkanPesan('error', `Kesempatan habis. Jawabannya ${target.toUpperCase()}.`);
    }
  }, [
    data?.arti,
    kamusSet,
    kirimSkor,
    mulaiMainAt,
    panjang,
    riwayat,
    selesai,
    skorTerkirim,
    tampilkanPesan,
    target,
    tebakan,
  ]);

  useEffect(() => {
    const riwayatTersimpan = parseRiwayatDariSkor(data?.hasilHariIni?.tebakan, panjang);
    setRiwayat(riwayatTersimpan);
    setTebakan('');
    setPesanMunculan(null);
    setMulaiMainAt(Date.now());
    setSkorTerkirim(Boolean(data?.sudahMainHariIni));
  }, [data?.hasilHariIni?.tebakan, data?.sudahMainHariIni, panjang, target]);

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
        hapusHuruf();
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        tambahHuruf(event.key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hapusHuruf, isAuthenticated, selesai, submitTebakan, tambahHuruf, target]);

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
    <HalamanDasar
      judul="Susun Kata"
      deskripsi="Mainkan gim susun kata harian seperti Wordle untuk menyusun kata bahasa Indonesia dalam enam percobaan."
      tampilkanJudul={false}
    >
      <div className="susun-kata-wrap">
        <div className="susun-kata-heading-row">
          {isAuthenticated ? (
            <button
              type="button"
              className="susun-kata-panel-btn susun-kata-panel-btn-left"
              aria-label={panelInfoTerbuka ? 'Kembali ke papan permainan' : 'Lihat petunjuk gim'}
              onClick={() => setPanelAktif((prev) => (prev === 'info' ? 'permainan' : 'info'))}
            >
              <Info size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}

          <h1 className="susun-kata-heading">Susun Kata</h1>

          {isAuthenticated ? (
            <button
              type="button"
              className="susun-kata-panel-btn susun-kata-panel-btn-right"
              aria-label={panelKlasemenTerbuka ? 'Kembali ke papan permainan' : 'Lihat klasemen harian'}
              onClick={() => setPanelAktif((prev) => (prev === 'klasemen' ? 'permainan' : 'klasemen'))}
            >
              <Trophy size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <QueryFeedback
          isLoading={isAuthenticated && isLoading && !data}
          isError={isError}
          error={error}
          loadingText="Menyiapkan gim ..."
          errorText="Gagal memuat gim."
        />

        {!authLoading && !isAuthenticated && (
          <div className="susun-kata-locked-wrap">
            <div className="susun-kata-info-panel">
              <p className="susun-kata-info-text">
                Susun Kata adalah gim menyusun huruf untuk membentuk kata bahasa Indonesia yang ada di kamus Kateglo. Gim ini terinspirasi oleh Wordle dari Josh Wardle untuk kata bahasa Inggris.
              </p>
              <p className="susun-kata-info-text">
                Setiap hari akan ada satu kata yang sama yang ditebakkan. Peserta harus masuk log untuk bermain dan mendapat enam kesempatan untuk menebak.
              </p>
              <p className="susun-kata-info-text">
                Masukkan huruf untuk membentuk kata. Tekan enter untuk mengirim tebakan. Warna kotak dan tombol kibor di layar akan menunjukkan huruf yang sudah dipilih dan statusnya.
              </p>
              <ul className="susun-kata-info-list">
                <li><span className="susun-kata-info-badge susun-kata-info-badge-benar">Hijau</span>: Huruf dan tempatnya benar.</li>
                <li><span className="susun-kata-info-badge susun-kata-info-badge-ada">Kuning</span>: Huruf benar, tetapi tempatnya salah.</li>
                <li><span className="susun-kata-info-badge susun-kata-info-badge-salah">Abu-abu</span>: Huruf salah.</li>
              </ul>
            </div>
            <TombolMasuk
              label="Masuk untuk Bermain"
              className="susun-kata-login-btn"
              onClick={() => loginDenganGoogle('/gim/susun-kata')}
            />
          </div>
        )}

        {!isError && isAuthenticated && data && (
          <>
            {panelInfoTerbuka ? (
              <div className="susun-kata-info-panel">
                <p className="susun-kata-info-text">
                  Susun Kata adalah gim menyusun huruf untuk membentuk kata bahasa Indonesia yang ada di kamus Kateglo. Gim ini terinspirasi oleh Wordle dari Josh Wardle untuk kata bahasa Inggris.
                </p>
                <p className="susun-kata-info-text">
                  Setiap hari akan ada satu kata yang sama yang ditebakkan. Peserta harus masuk log untuk bermain dan mendapat enam kesempatan untuk menebak.
                </p>
                <p className="susun-kata-info-text">
                  Masukkan huruf untuk membentuk kata. Tekan enter untuk mengirim tebakan. Warna kotak dan tombol kibor di layar akan menunjukkan huruf yang sudah dipilih dan statusnya.
                </p>
                <ul className="susun-kata-info-list">
                  <li><span className="susun-kata-info-badge susun-kata-info-badge-benar">Hijau</span>: Huruf dan tempatnya benar</li>
                  <li><span className="susun-kata-info-badge susun-kata-info-badge-ada">Kuning</span>: Huruf benar, tetapi tempatnya salah</li>
                  <li><span className="susun-kata-info-badge susun-kata-info-badge-salah">Abu-abu</span>: Huruf salah</li>
                </ul>
              </div>
            ) : panelKlasemenTerbuka ? (
              <div className="susun-kata-klasemen-panel">
                {daftarKlasemen.length ? (
                  <ol className="susun-kata-klasemen-list">
                    {daftarKlasemen.map((item, index) => (
                      <li key={`${item.pengguna_id}-${index}`} className="susun-kata-klasemen-item">
                        <span className="susun-kata-klasemen-rank">#{index + 1}</span>
                        <span className="susun-kata-klasemen-name">{item.nama}</span>
                        <span className="susun-kata-klasemen-score">{item.skor} poin, {item.detik} detik</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="susun-kata-klasemen-kosong">Belum ada skor hari ini.</p>
                )}
              </div>
            ) : (
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
                        <button
                          type="button"
                          key={huruf}
                          className={`susun-kata-key ${kelasStatusKey(petaKeyboard[huruf])}`.trim()}
                          onClick={() => tambahHuruf(huruf)}
                          disabled={selesai}
                        >
                          {huruf.toUpperCase()}
                        </button>
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
                      <button
                        type="button"
                        key={`baris-bawah-${huruf}`}
                        className={`susun-kata-key ${kelasStatusKey(petaKeyboard[huruf])}`.trim()}
                        onClick={() => tambahHuruf(huruf)}
                        disabled={selesai}
                      >
                        {huruf.toUpperCase()}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="susun-kata-key susun-kata-key-wide"
                      onClick={hapusHuruf}
                      disabled={selesai}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </>
            )}

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
