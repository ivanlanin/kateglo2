/**
 * @fileoverview Halaman dasar bersama untuk publik dan redaksi
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ReactMarkdown = lazy(() => import('react-markdown'));

export function hitungModeGelapAwal({ hasWindow, tersimpan, prefersDark }) {
  if (!hasWindow) return false;
  if (tersimpan) return tersimpan === 'dark';
  return Boolean(prefersDark);
}

export function bacaPreferensiTema(runtimeWindow) {
  if (!runtimeWindow) {
    return { hasWindow: false, tersimpan: null, prefersDark: false };
  }
  return {
    hasWindow: true,
    tersimpan: runtimeWindow.localStorage.getItem('kateglo-theme'),
    prefersDark: runtimeWindow.matchMedia('(prefers-color-scheme: dark)').matches,
  };
}

function HalamanDasar({ mode = 'publik', navbar, konten, adalahRedaksi = false }) {
  const adalahAdmin = mode === 'admin';
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [tabAktif, setTabAktif] = useState('changelog');
  const [sedangMemuat, setSedangMemuat] = useState(false);
  const [teksChangelog, setTeksChangelog] = useState('');
  const [teksTodo, setTeksTodo] = useState('');
  const [modeGelap, setModeGelap] = useState(() => hitungModeGelapAwal(bacaPreferensiTema(globalThis.window)));
  const appTimestamp = __APP_TIMESTAMP__;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', modeGelap);
    localStorage.setItem('kateglo-theme', modeGelap ? 'dark' : 'light');
  }, [modeGelap]);

  const kelasTab = (namaTab) => (
    `tab-button-pills-compact ${tabAktif === namaTab ? 'tab-button-pills-active' : 'tab-button-pills-inactive'}`
  );

  const bukaModal = async () => {
    setModalTerbuka(true);
    if (teksChangelog || teksTodo) return;

    setSedangMemuat(true);
    try {
      const [resChangelog, resTodo] = await Promise.all([
        fetch('/docs/changelog.md'),
        fetch('/docs/todo.md'),
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
      <div className="kateglo-layout-root">
        {navbar}
        {konten}

        <footer className="kateglo-footer">
          <div className="kateglo-footer-content">
            <button
              type="button"
              onClick={bukaModal}
              className="kateglo-version-button"
            >
              Kateglo {appTimestamp}
            </button>
            <button
              type="button"
              onClick={() => setModeGelap((v) => !v)}
              className="kateglo-theme-toggle"
              title={modeGelap ? 'Mode terang' : 'Mode gelap'}
            >
              {modeGelap ? '☀️' : '🌙'}
            </button>
            <div className="kateglo-footer-links">
              <span className="text-sm">
                <Link to="/ihwal" className="link-action">Ihwal</Link>
                {' · '}
                <Link to="/privasi" className="link-action">Privasi</Link>
                {' · '}
                <Link to="/sumber" className="link-action">Sumber</Link>
                {adalahRedaksi && (
                  <>{' · '}<Link to="/redaksi" className="link-action">Redaksi</Link></>
                )}
                {adalahAdmin && (
                  <>{' · '}<Link to="/" className="link-action">Kateglo</Link></>
                )}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {modalTerbuka && (
        <div className="modal-overlay modal-overlay-kateglo" onClick={() => setModalTerbuka(false)}>
          <div className="modal-container-kateglo" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-kateglo">
              <div className="modal-tab-group">
                <button
                  type="button"
                  onClick={() => setTabAktif('changelog')}
                  className={kelasTab('changelog')}
                >
                  Riwayat
                </button>
                <button
                  type="button"
                  onClick={() => setTabAktif('todo')}
                  className={kelasTab('todo')}
                >
                  Tugas
                </button>
              </div>
              <button type="button" onClick={() => setModalTerbuka(false)} className="modal-close-button">×</button>
            </div>

            <div className="modal-body-kateglo">
              {sedangMemuat ? (
                <div className="loading-spinner">Memuat …</div>
              ) : (
                <div className="changelog-content">
                  <Suspense fallback={<div className="loading-spinner">Memuat …</div>}>
                    <ReactMarkdown>
                      {tabAktif === 'changelog' ? teksChangelog : teksTodo}
                    </ReactMarkdown>
                  </Suspense>
                </div>
              )}
            </div>

            <div className="modal-footer-kateglo">
              <button
                type="button"
                onClick={() => setModalTerbuka(false)}
                className="modal-close-action"
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

export default HalamanDasar;