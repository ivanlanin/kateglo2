/**
 * @fileoverview Halaman gim Susun Kata
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Info, Trophy } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ambilKlasemenSusunKata,
  ambilKlasemenSusunKataBebas,
  ambilBebasSusunKata,
  ambilPuzzleSusunKata,
  simpanProgresSusunKata,
  submitSkorSusunKata,
  submitSkorSusunKataBebas,
  validasiKataSusunKata,
} from '../../../api/apiPublik';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';
import { QueryFeedback } from '../../../components/status/StatusKonten';
import { useAuth } from '../../../context/authContext';
import TombolMasuk from '../../../components/tombol/TombolMasuk';
import PesanMunculan from '../../../components/status/PesanMunculan';
import { buatPathDetailKamus } from '../../../utils/paramUtils';
import '../../../styles/gim.css';

const MAKS_PERCOBAAN = 6;
const PANJANG_DEFAULT = 5;
const MODE_HARIAN = 'harian';
const MODE_BEBAS = 'bebas';
const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl'];
const PRIORITAS_STATUS = {
  salah: 0,
  ada: 1,
  benar: 2,
};

const formatAngkaId = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatSatuDesimalId = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

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

export function buatPetaKeyboard(riwayat, target) {
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

export function parseRiwayatDariSkor(tebakanRaw, panjang) {
  const panjangAman = Number(panjang) || PANJANG_DEFAULT;
  return String(tebakanRaw || '')
    .split(';')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length === panjangAman && /^[a-z]+$/.test(item))
    .slice(0, MAKS_PERCOBAAN);
}

function StrongInfoBadge({ children, ...props }) {
  const label = Array.isArray(children) ? children.join('') : String(children || '');
  const labelBersih = label.trim().toLowerCase();

  if (labelBersih === 'hijau') {
    return <span {...props} className="susun-kata-info-badge susun-kata-info-badge-benar">{children}</span>;
  }

  if (labelBersih === 'kuning') {
    return <span {...props} className="susun-kata-info-badge susun-kata-info-badge-ada">{children}</span>;
  }

  if (labelBersih === 'abu-abu') {
    return <span {...props} className="susun-kata-info-badge susun-kata-info-badge-salah">{children}</span>;
  }

  return <strong {...props}>{children}</strong>;
}

function PanelInfoSusunKata() {
  const komponenMarkdown = {
    strong: StrongInfoBadge,
  };

  return (
    <KontenMarkdownStatis
      src="/halaman/gim/susun-kata.md"
      className="halaman-markdown-content susun-kata-info-panel"
      loadingText="Memuat petunjuk gim …"
      errorText="Gagal memuat petunjuk gim."
      components={komponenMarkdown}
    />
  );
}

function SusunKata() {
  const { isAuthenticated, isLoading: authLoading, loginDenganGoogle } = useAuth();
  const navigate = useNavigate();
  const { mode: modeParam } = useParams();
  const [modeAktif, setModeAktif] = useState(MODE_HARIAN);
  const [riwayat, setRiwayat] = useState([]);
  const [tebakan, setTebakan] = useState('');
  const [pesanMunculan, setPesanMunculan] = useState(null);
  const [mulaiMainAt, setMulaiMainAt] = useState(Date.now());
  const [skorTerkirim, setSkorTerkirim] = useState(false);
  const [panelAktif, setPanelAktif] = useState('permainan');
  const [putaranBebas, setPutaranBebas] = useState(0);
  const modeDariPath = modeParam === MODE_BEBAS ? MODE_BEBAS : MODE_HARIAN;
  const judulSeo = modeAktif === MODE_BEBAS ? 'Susun Kata Bebas' : 'Susun Kata Harian';
  const deskripsiSeo = modeAktif === MODE_BEBAS
    ? 'Mainkan mode bebas Susun Kata untuk menyusun kata bahasa Indonesia kapan saja dengan ronde baru yang bisa diulang langsung di Kateglo.'
    : 'Mainkan gim susun kata harian seperti Wordle untuk menyusun kata bahasa Indonesia dalam enam percobaan.';

  useEffect(() => {
    setModeAktif(modeDariPath);
    setPanelAktif('permainan');
    setPesanMunculan(null);

    if (modeDariPath === MODE_BEBAS) {
      setPutaranBebas((prev) => prev + 1);
    }
  }, [modeDariPath]);

  const {
    data: dataHarian,
    isLoading: isLoadingHarian,
    isError: isErrorHarian,
    error: errorHarian,
  } = useQuery({
    queryKey: ['gim-susun-kata-puzzle', PANJANG_DEFAULT],
    queryFn: () => ambilPuzzleSusunKata({ panjang: PANJANG_DEFAULT }),
    staleTime: 0,
    enabled: Boolean(isAuthenticated && modeAktif === MODE_HARIAN),
  });

  const {
    data: dataBebas,
    isLoading: isLoadingBebas,
    isError: isErrorBebas,
    error: errorBebas,
  } = useQuery({
    queryKey: ['gim-susun-kata-bebas', putaranBebas],
    queryFn: () => ambilBebasSusunKata(),
    staleTime: 0,
    enabled: Boolean(isAuthenticated && modeAktif === MODE_BEBAS),
  });

  const data = modeAktif === MODE_HARIAN ? dataHarian : dataBebas;
  const isLoading = modeAktif === MODE_HARIAN ? isLoadingHarian : isLoadingBebas;
  const isError = modeAktif === MODE_HARIAN ? isErrorHarian : isErrorBebas;
  const error = modeAktif === MODE_HARIAN ? errorHarian : errorBebas;

  const panjang = Number(data?.panjang) || PANJANG_DEFAULT;
  const target = String(data?.target || '').toLowerCase();
  const sudahMainHariIni = modeAktif === MODE_HARIAN ? Boolean(data?.sudahMainHariIni) : false;
  const kamusSet = useMemo(
    () => new Set((data?.kamus || []).map((item) => String(item || '').trim().toLowerCase()).filter(Boolean)),
    [data?.kamus]
  );
  const menang = Boolean(target) && riwayat.some((item) => item === target);
  const kalah = !menang && riwayat.length >= MAKS_PERCOBAAN;
  const selesai = menang || kalah || sudahMainHariIni;
  const petaKeyboard = useMemo(() => buatPetaKeyboard(riwayat, target), [riwayat, target]);

  const kirimSkor = useMutation({
    mutationFn: (payload) => {
      if (modeAktif === MODE_BEBAS) {
        return submitSkorSusunKataBebas(payload);
      }
      return submitSkorSusunKata(payload);
    },
  });

  const simpanProgres = useMutation({
    mutationFn: (payload) => simpanProgresSusunKata(payload),
  });

  const { data: dataKlasemen } = useQuery({
    queryKey: ['gim-susun-kata-klasemen', modeAktif, panjang],
    queryFn: () => (
      modeAktif === MODE_BEBAS
        ? ambilKlasemenSusunKataBebas({ limit: 10 })
        : ambilKlasemenSusunKata({ panjang, limit: 10 })
    ),
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

  const mulaiSesiBaruBebas = useCallback(() => {
    setPesanMunculan(null);
    setPutaranBebas((prev) => prev + 1);
  }, []);

  const tambahHuruf = useCallback((huruf) => {
    setTebakan((prev) => `${prev}${huruf}`.slice(0, panjang));
  }, [panjang]);

  const hapusHuruf = useCallback(() => {
    setTebakan((prev) => prev.slice(0, -1));
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
    const serializedTebakan = riwayatBaru.join(';');

    setRiwayat(riwayatBaru);
    setTebakan('');

    if (modeAktif === MODE_HARIAN && !menangBaru && !kalahBaru) {
      simpanProgres.mutate({
        panjang,
        tebakan: serializedTebakan,
      });
    }

    if (menangBaru) {
      if (!skorTerkirim) {
        const detik = Math.max(Math.floor((Date.now() - mulaiMainAt) / 1000), 0);
        const payloadSkor = {
          panjang,
          percobaan: riwayatBaru.length,
          detik,
          menang: true,
          tebakan: serializedTebakan,
        };

        if (modeAktif === MODE_BEBAS) {
          payloadSkor.kata = target;
        }

        kirimSkor.mutate(
          payloadSkor,
          {
            onSettled: () => setSkorTerkirim(true),
          }
        );
      }

      tampilkanPesan(
        'success',
        'Selamat! 🥳',
        modeAktif === MODE_BEBAS
          ? (
              <>
                <Link
                  className="pesan-munculan-link"
                  to={buatPathDetailKamus(target)}
                  state={{ sumberPelacakan: 'susun-kata' }}
                >
                  Mau lihat arti {target} di kamus
                </Link>
                {' '}atau
                {' '}
                <a
                  href="#"
                  className="pesan-munculan-link"
                  onClick={(event) => {
                    event.preventDefault();
                    mulaiSesiBaruBebas();
                  }}
                >
                  mulai sesi baru
                </a>
                ?
              </>
            )
          : (
              <>
                <Link
                  className="pesan-munculan-link"
                  to={buatPathDetailKamus(target)}
                  state={{ sumberPelacakan: 'susun-kata' }}
                >
                  Mau lihat arti {target} di kamus
                </Link>
                ?
              </>
            )
      );
      return;
    }

    if (kalahBaru) {
      if (!skorTerkirim) {
        const detik = Math.max(Math.floor((Date.now() - mulaiMainAt) / 1000), 0);
        const payloadSkor = {
          panjang,
          percobaan: MAKS_PERCOBAAN,
          detik,
          menang: false,
          tebakan: serializedTebakan,
        };

        if (modeAktif === MODE_BEBAS) {
          payloadSkor.kata = target;
        }

        kirimSkor.mutate(
          payloadSkor,
          {
            onSettled: () => setSkorTerkirim(true),
          }
        );
      }

      tampilkanPesan('error', `Kesempatan habis. Jawabannya ${target.toUpperCase()}.`);
    }
  }, [
    kamusSet,
    kirimSkor,
    mulaiMainAt,
    panjang,
    riwayat,
    selesai,
    skorTerkirim,
    modeAktif,
    simpanProgres,
    mulaiSesiBaruBebas,
    tampilkanPesan,
    target,
    tebakan,
  ]);

  useEffect(() => {
    const riwayatDariSkor = parseRiwayatDariSkor(data?.hasilHariIni?.tebakan, panjang);
    const riwayatDariProgres = parseRiwayatDariSkor(data?.progresHariIni?.tebakan, panjang);
    const riwayatTersimpan = riwayatDariSkor.length ? riwayatDariSkor : riwayatDariProgres;
    const mulaiAtProgres = data?.progresHariIni?.mulai_at
      ? new Date(data.progresHariIni.mulai_at).getTime()
      : null;

    setRiwayat(riwayatTersimpan);
    setTebakan('');
    setPesanMunculan(null);
    setMulaiMainAt(Number.isFinite(mulaiAtProgres) ? mulaiAtProgres : Date.now());
    setSkorTerkirim(modeAktif === MODE_HARIAN ? Boolean(data?.sudahMainHariIni) : false);
  }, [
    data?.hasilHariIni?.tebakan,
    data?.progresHariIni?.tebakan,
    data?.progresHariIni?.mulai_at,
    data?.sudahMainHariIni,
    modeAktif,
    panjang,
    target,
  ]);

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
    <HalamanPublik
      judul={judulSeo}
      deskripsi={deskripsiSeo}
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

        <div className="susun-kata-mode-row" role="tablist" aria-label="Mode permainan Susun Kata">
          <button
            type="button"
            role="tab"
            aria-selected={modeAktif === MODE_HARIAN}
            className={`susun-kata-mode-pill ${modeAktif === MODE_HARIAN ? 'susun-kata-mode-pill-aktif' : ''}`.trim()}
            onClick={() => {
              if (modeAktif !== MODE_HARIAN) {
                navigate('/gim/susun-kata/harian');
              }
            }}
          >
            Harian
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modeAktif === MODE_BEBAS}
            className={`susun-kata-mode-pill ${modeAktif === MODE_BEBAS ? 'susun-kata-mode-pill-aktif' : ''}`.trim()}
            onClick={() => {
              if (modeAktif !== MODE_BEBAS) {
                navigate('/gim/susun-kata/bebas');
              } else {
                setPutaranBebas((prev) => prev + 1);
              }
            }}
          >
            Bebas
          </button>
        </div>

        <QueryFeedback
          isLoading={isAuthenticated && isLoading && !data}
          isError={isError}
          error={error}
          loadingText="Menyiapkan gim …"
          errorText="Gagal memuat gim."
        />

        {!authLoading && !isAuthenticated && (
          <div className="susun-kata-locked-wrap">
            <PanelInfoSusunKata />
            <TombolMasuk
              label="Masuk untuk Bermain"
              className="susun-kata-login-btn"
              onClick={() => loginDenganGoogle(`/gim/susun-kata/${modeAktif}`)}
            />
          </div>
        )}

        {!isError && isAuthenticated && data && (
          <>
            {panelInfoTerbuka ? (
              <PanelInfoSusunKata />
            ) : panelKlasemenTerbuka ? (
              <div className="susun-kata-klasemen-panel">
                {daftarKlasemen.length ? (
                  <ol className="susun-kata-klasemen-list">
                    {daftarKlasemen.map((item, index) => (
                      <li key={`${item.pengguna_id}-${index}`} className="susun-kata-klasemen-item">
                        <span className="susun-kata-klasemen-rank">#{index + 1}</span>
                        <span className="susun-kata-klasemen-name">{item.nama}</span>
                        {modeAktif === MODE_BEBAS ? (
                          <span className="susun-kata-klasemen-score">
                            {formatSatuDesimalId.format(Number(item.rata_poin) || 0)} poin; {formatSatuDesimalId.format(Number(item.rata_detik) || 0)} detik; {formatAngkaId.format(Number(item.total_main) || 0)}x main
                          </span>
                        ) : (
                          <span className="susun-kata-klasemen-score">{item.skor} poin, {item.detik} detik</span>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="susun-kata-klasemen-kosong">
                    {modeAktif === MODE_BEBAS ? 'Belum ada pemenang mode bebas.' : 'Belum ada skor hari ini.'}
                  </p>
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
    </HalamanPublik>
  );
}

export default SusunKata;
export const __private = {
  StrongInfoBadge,
};
