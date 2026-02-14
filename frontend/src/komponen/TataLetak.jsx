/**
 * @fileoverview Tata letak utama dengan Navbar dan konten
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function TataLetak() {
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [tabAktif, setTabAktif] = useState('changelog');
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [teksChangelog, setTeksChangelog] = useState('');
  const [teksTodo, setTeksTodo] = useState('');

  const appTimestamp = typeof __APP_TIMESTAMP__ !== 'undefined'
    ? __APP_TIMESTAMP__
    : `${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(/-/g, '')}.${new Date().toLocaleTimeString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).slice(0, 5).replace(/:/g, '')}`;

  const bukaModal = async () => {
    setModalTerbuka(true);
    if (teksChangelog || teksTodo) return;

    setSedangMemuat(true);
    try {
      const [resChangelog, resTodo] = await Promise.all([
        fetch('/changelog.md'),
        fetch('/todo.md'),
      ]);

      const [isiChangelog, isiTodo] = await Promise.all([
        resChangelog.text(),
        resTodo.text(),
      ]);

      setTeksChangelog(isiChangelog);
      setTeksTodo(isiTodo);
    } catch (_error) {
      const pesanGalat = 'Gagal memuat dokumen.';
      setTeksChangelog(pesanGalat);
      setTeksTodo(pesanGalat);
    } finally {
      setSedangMemuat(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <button
            type="button"
            onClick={bukaModal}
            className="text-blue-600 hover:underline"
          >
            Kateglo {appTimestamp}
          </button>
        </div>
      </footer>
      </div>

      {modalTerbuka && (
        <div className="modal-overlay p-4" onClick={() => setModalTerbuka(false)}>
          <div className="modal-container-kateglo h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-kateglo mb-0 flex items-center justify-between px-5 py-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTabAktif('changelog')}
                  className={`tab-button-pills-compact ${tabAktif === 'changelog' ? 'tab-button-pills-active' : 'tab-button-pills-inactive'}`}
                >
                  Riwayat
                </button>
                <button
                  type="button"
                  onClick={() => setTabAktif('todo')}
                  className={`tab-button-pills-compact ${tabAktif === 'todo' ? 'tab-button-pills-active' : 'tab-button-pills-inactive'}`}
                >
                  Tugas
                </button>
              </div>
              <button type="button" onClick={() => setModalTerbuka(false)} className="modal-close-button text-2xl leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {sedangMemuat ? (
                <div className="loading-spinner">Memuat...</div>
              ) : (
                <div className="changelog-content">
                  <ReactMarkdown>
                    {tabAktif === 'changelog' ? teksChangelog : teksTodo}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="modal-footer-kateglo px-5 py-3">
              <button
                type="button"
                onClick={() => setModalTerbuka(false)}
                className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TataLetak;
