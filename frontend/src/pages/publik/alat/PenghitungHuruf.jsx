/**
 * @fileoverview Alat penghitung huruf dengan tabel dan grafik distribusi huruf.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import HalamanPublik from '../../../components/publik/HalamanPublik';

Chart.register(ChartDataLabels);

const contohTeksHuruf = 'Bahasa Indonesia kaya akan ragam kata dan bunyi.';

function hitungFrekuensiHuruf(text = '') {
  const hurufKecil = String(text || '').toLowerCase();
  const frequency = {};
  let totalChars = 0;

  for (const char of hurufKecil) {
    if (/[a-z]/.test(char)) {
      frequency[char] = (frequency[char] || 0) + 1;
      totalChars += 1;
    }
  }

  const items = Object.entries(frequency)
    .sort((left, right) => right[1] - left[1])
    .map(([char, count]) => ({
      char,
      count,
      percentage: totalChars ? Number(((count / totalChars) * 100).toFixed(2)) : 0,
    }));

  return {
    totalChars,
    uniqueChars: items.length,
    items,
  };
}

function PenghitungHuruf() {
  const [teksMasukan, setTeksMasukan] = useState('');
  const [teksAnalisis, setTeksAnalisis] = useState('');
  const [pesanGalat, setPesanGalat] = useState('');
  const [tabHasilAktif, setTabHasilAktif] = useState('tabel');
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const hasil = useMemo(() => hitungFrekuensiHuruf(teksAnalisis), [teksAnalisis]);
  const adaHasil = hasil.totalChars > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (!adaHasil || !hasil.items.length) {
      return undefined;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return undefined;
    }

    chartRef.current = new Chart(context, {
      type: 'bar',
      data: {
        labels: hasil.items.map((entry) => entry.char),
        datasets: [
          {
            data: hasil.items.map((entry) => entry.percentage),
            backgroundColor: 'rgba(37, 99, 235, 0.22)',
            borderColor: 'rgba(37, 99, 235, 0.9)',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback(value) {
                return `${value}%`;
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.raw}%`;
              },
            },
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#1f2937',
            formatter(value) {
              return `${value}%`;
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [adaHasil, hasil]);

  const handleHitung = (event) => {
    event.preventDefault();
    if (!teksMasukan.trim()) {
      setPesanGalat('Silakan masukkan teks terlebih dahulu.');
      return;
    }

    setPesanGalat('');
    setTeksAnalisis(teksMasukan);
    setTabHasilAktif('tabel');
  };

  const handleIsiContoh = () => {
    setPesanGalat('');
    setTeksMasukan(contohTeksHuruf);
    setTeksAnalisis(contohTeksHuruf);
    setTabHasilAktif('tabel');
  };

  const handleBersihkan = () => {
    setPesanGalat('');
    setTeksMasukan('');
    setTeksAnalisis('');
    setTabHasilAktif('tabel');
  };

  return (
    <HalamanPublik
      judul="Penghitung Huruf"
      deskripsi="Alat untuk menghitung frekuensi huruf a-z, melihat persentasenya, dan menampilkan grafik distribusi huruf."
      tampilkanJudul={false}
    >
      <div className="alat-page">
        <section className="alat-hero">
          <div className="alat-hero-head">
            <div>
              <p className="alat-kicker">Alat Bahasa</p>
              <h1 className="alat-title">Penghitung Huruf</h1>
            </div>
            <p className="alat-hero-note">Distribusi huruf a-z dalam satu panel analisis yang ringkas.</p>
          </div>
          <p className="alat-description">
            Masukkan teks, lalu lihat sebaran huruf alfabet Latin dalam bentuk tabel persentase dan grafik batang.
          </p>
          <div className="alat-actions">
            <Link to="/alat" className="alat-link-secondary">Kembali ke daftar alat</Link>
            <button type="button" className="alat-link-secondary" onClick={handleIsiContoh}>Isi contoh</button>
          </div>
        </section>

        <div className="alat-tool-layout">
          <section className="alat-panel" aria-labelledby="alat-huruf-input-title">
            <div className="alat-panel-header">
              <h2 id="alat-huruf-input-title" className="alat-panel-title">Masukan</h2>
              <p className="alat-panel-caption">Huruf yang dihitung hanya a-z dan tidak peka huruf besar-kecil.</p>
            </div>

            <form onSubmit={handleHitung} className="alat-form">
              <label htmlFor="alat-huruf-teks" className="sr-only">Teks untuk dihitung hurufnya</label>
              <textarea
                id="alat-huruf-teks"
                className="alat-textarea alat-textarea-compact"
                value={teksMasukan}
                onChange={(event) => setTeksMasukan(event.target.value)}
                placeholder="Masukkan teks di sini..."
                rows={8}
              />

              {pesanGalat ? <p className="alat-error-text">{pesanGalat}</p> : null}

              <div className="alat-actions">
                <button type="submit" className="alat-link-primary">Hitung</button>
                <button type="button" className="alat-link-secondary" onClick={handleBersihkan}>Bersihkan</button>
              </div>
            </form>
          </section>

          <section className="alat-panel" aria-labelledby="alat-huruf-output-title">
            <div className="alat-panel-header">
              <h2 id="alat-huruf-output-title" className="alat-panel-title">Hasil</h2>
              <p className="alat-panel-caption">
                {adaHasil ? 'Tabel dan grafik dibangun dari teks terakhir yang dihitung.' : 'Belum ada hasil. Jalankan hitung setelah mengisi teks.'}
              </p>
            </div>

            <div className="alat-summary-inline">
              <article className="alat-mini-stat">
                <span className="alat-mini-stat-label">Total huruf</span>
                <strong className="alat-mini-stat-value">{hasil.totalChars}</strong>
              </article>
              <article className="alat-mini-stat">
                <span className="alat-mini-stat-label">Huruf unik</span>
                <strong className="alat-mini-stat-value">{hasil.uniqueChars}</strong>
              </article>
            </div>

            <div className="alat-result-pills" role="tablist" aria-label="Kategori hasil penghitung huruf">
              <button
                id="alat-huruf-pill-tabel"
                type="button"
                role="tab"
                aria-selected={tabHasilAktif === 'tabel'}
                aria-controls="alat-huruf-panel-tabel"
                className={`alat-pill-button ${tabHasilAktif === 'tabel' ? 'alat-pill-button-active' : ''}`}
                onClick={() => setTabHasilAktif('tabel')}
              >
                Tabel
              </button>
              <button
                id="alat-huruf-pill-grafik"
                type="button"
                role="tab"
                aria-selected={tabHasilAktif === 'grafik'}
                aria-controls="alat-huruf-panel-grafik"
                className={`alat-pill-button ${tabHasilAktif === 'grafik' ? 'alat-pill-button-active' : ''}`}
                onClick={() => setTabHasilAktif('grafik')}
              >
                Grafik
              </button>
            </div>

            <div className="alat-result-stack">
              <section
                id="alat-huruf-panel-tabel"
                role="tabpanel"
                aria-labelledby="alat-huruf-pill-tabel"
                hidden={tabHasilAktif !== 'tabel'}
                className="alat-subpanel"
              >
                <h3 className="alat-subpanel-title">Tabel frekuensi</h3>
                {adaHasil ? (
                  <div className="alat-table-wrap">
                    <table className="alat-data-table">
                      <thead>
                        <tr>
                          <th>Huruf</th>
                          <th>Jumlah</th>
                          <th>Frekuensi (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasil.items.map((entry) => (
                          <tr key={entry.char}>
                            <td>{entry.char}</td>
                            <td>{entry.count}</td>
                            <td>{entry.percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="alat-empty-text">Belum ada data huruf untuk ditampilkan.</p>
                )}
              </section>

              <section
                id="alat-huruf-panel-grafik"
                role="tabpanel"
                aria-labelledby="alat-huruf-pill-grafik"
                hidden={tabHasilAktif !== 'grafik'}
                className="alat-subpanel"
              >
                <h3 className="alat-subpanel-title">Grafik distribusi huruf</h3>
                <div className="alat-chart-shell">
                  {adaHasil ? (
                    <canvas ref={canvasRef} className="alat-chart-canvas" aria-label="Grafik frekuensi huruf" />
                  ) : (
                    <p className="alat-empty-text">Belum ada grafik yang ditampilkan.</p>
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </HalamanPublik>
  );
}

export default PenghitungHuruf;