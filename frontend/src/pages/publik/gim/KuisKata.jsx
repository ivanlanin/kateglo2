/**
 * @fileoverview Halaman publik Kuis Kata.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Play, Trophy } from 'lucide-react';
import { ambilKlasemenKuisKata } from '../../../api/apiPublik';
import HalamanPublik from '../../../components/publik/HalamanPublik';
import KuisKataKomponen from '../../../components/publik/KuisKata';

const formatBilanganId = new Intl.NumberFormat('id-ID');

function PanelInfoKuisKata() {
  return (
    <div className="gim-page-info-panel">
      <p className="gim-page-info-text">
        Kuis Kata adalah gim pilihan ganda untuk menebak arti, sinonim, padanan, makna, dan rima kata bahasa Indonesia langsung di Kateglo.
      </p>
      <p className="gim-page-info-text">
        Setiap ronde memuat lima soal dari domain yang berbeda. Tiap jawaban benar menambah skor, lalu di akhir ronde kamu akan melihat ringkasan hasil per soal.
      </p>
      <p className="gim-page-info-text">
        Kuis ini dibuat untuk sesi singkat: buka halaman, jawab cepat, lalu main lagi jika ingin mengulang dengan ronde baru.
      </p>
      <p className="gim-page-info-text">
        Skor harian hanya dicatat untuk pengguna yang sudah masuk log. Klasemen harian menampilkan akumulasi skor benar per hari.
      </p>
    </div>
  );
}

function KuisKataPage() {
  const [panelAktif, setPanelAktif] = useState('permainan');
  const panelInfoTerbuka = panelAktif === 'info';
  const panelKlasemenTerbuka = panelAktif === 'klasemen';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gim-kuis-kata-klasemen'],
    queryFn: () => ambilKlasemenKuisKata({ limit: 10 }),
    staleTime: 30 * 1000,
    enabled: panelKlasemenTerbuka,
  });

  const daftarKlasemen = Array.isArray(data?.data) ? data.data : [];

  return (
    <HalamanPublik
      judul="Kuis Kata"
      deskripsi="Mainkan kuis kata pilihan ganda untuk menebak arti, sinonim, padanan, makna, dan rima langsung di Kateglo."
      tampilkanJudul={false}
    >
      <div className="gim-page-wrap">
        <div className="gim-page-heading-row">
          <div className="gim-page-panel-group gim-page-panel-group-left">
            <button
              type="button"
              className="gim-page-panel-btn gim-page-panel-btn-left"
              aria-label={panelInfoTerbuka ? 'Kembali ke kuis kata' : 'Lihat petunjuk gim'}
              onClick={() => setPanelAktif((prev) => (prev === 'info' ? 'permainan' : 'info'))}
            >
              <Info size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`gim-page-panel-btn gim-page-panel-btn-main${panelAktif === 'permainan' ? ' gim-page-panel-btn-main-active' : ''}`}
              aria-label="Kembali ke permainan kuis kata"
              onClick={() => setPanelAktif('permainan')}
            >
              <Play size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          <h1 className="gim-page-heading">Kuis Kata</h1>
          <button
            type="button"
            className="gim-page-panel-btn gim-page-panel-btn-right"
            aria-label={panelKlasemenTerbuka ? 'Kembali ke kuis kata' : 'Lihat klasemen harian'}
            onClick={() => setPanelAktif((prev) => (prev === 'klasemen' ? 'permainan' : 'klasemen'))}
          >
            <Trophy size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        {panelInfoTerbuka ? (
          <PanelInfoKuisKata />
        ) : panelKlasemenTerbuka ? (
          <div className="gim-klasemen-panel">
            {isLoading ? <p className="gim-klasemen-kosong">Memuat klasemen harian…</p> : null}
            {!isLoading && isError ? <p className="gim-klasemen-kosong">Gagal memuat klasemen harian.</p> : null}
            {!isLoading && !isError && daftarKlasemen.length ? (
              <ol className="gim-klasemen-list">
                {daftarKlasemen.map((item, index) => (
                  <li key={item.id || `${item.pengguna_id}-${index}`} className="gim-klasemen-item">
                    <span className="gim-klasemen-rank">#{index + 1}</span>
                    <span className="gim-klasemen-name">{item.nama}</span>
                    <span className="gim-klasemen-score">
                      {formatBilanganId.format(Number(item.skor_total) || 0)} poin; {formatBilanganId.format(Number(item.jumlah_main) || 0)}x main
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
            {!isLoading && !isError && !daftarKlasemen.length ? (
              <p className="gim-klasemen-kosong">Belum ada skor kuis kata hari ini.</p>
            ) : null}
          </div>
        ) : (
          <KuisKataKomponen />
        )}
      </div>
    </HalamanPublik>
  );
}

export default KuisKataPage;