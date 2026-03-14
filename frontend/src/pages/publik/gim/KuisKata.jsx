/**
 * @fileoverview Halaman publik Kuis Kata.
 */

import { useState } from 'react';
import { Info } from 'lucide-react';
import HalamanPublik from '../../../components/publik/HalamanPublik';
import KuisKataKomponen from '../../../components/publik/KuisKata';

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
    </div>
  );
}

function KuisKataPage() {
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);

  return (
    <HalamanPublik
      judul="Kuis Kata"
      deskripsi="Mainkan kuis kata pilihan ganda untuk menebak arti, sinonim, padanan, makna, dan rima langsung di Kateglo."
      tampilkanJudul={false}
    >
      <div className="gim-page-wrap">
        <div className="gim-page-heading-row">
          <button
            type="button"
            className="gim-page-panel-btn gim-page-panel-btn-left"
            aria-label={panelInfoTerbuka ? 'Kembali ke kuis kata' : 'Lihat petunjuk gim'}
            onClick={() => setPanelInfoTerbuka((prev) => !prev)}
          >
            <Info size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <h1 className="gim-page-heading">Kuis Kata</h1>
        </div>
        {panelInfoTerbuka ? <PanelInfoKuisKata /> : <KuisKataKomponen />}
      </div>
    </HalamanPublik>
  );
}

export default KuisKataPage;