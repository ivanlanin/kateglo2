/**
 * @fileoverview Panel geser dari kanan (Notion-style) untuk formulir penyuntingan admin
 */

import { useEffect, useRef } from 'react';

/**
 * Panel geser overlay dari kanan layar
 * @param {boolean} buka - Apakah panel terbuka
 * @param {() => void} onTutup - Callback saat panel ditutup
 * @param {string} judul - Judul panel
 * @param {ReactNode} children - Konten panel
 */
function PanelGeser({ buka, onTutup, judul, children }) {
  const panelRef = useRef(null);

  // Escape key to close
  useEffect(() => {
    if (!buka) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onTutup();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [buka, onTutup]);

  // Lock body scroll when open
  useEffect(() => {
    if (buka) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [buka]);

  // Focus trap — focus panel on open
  useEffect(() => {
    if (buka && panelRef.current) {
      panelRef.current.focus();
    }
  }, [buka]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`panel-geser-backdrop ${buka ? 'panel-geser-backdrop-aktif' : ''}`}
        onClick={onTutup}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`panel-geser ${buka ? 'panel-geser-aktif' : ''}`}
      >
        {/* Header */}
        <div className="panel-geser-header">
          <h3 className="panel-geser-judul">{judul}</h3>
          <button
            type="button"
            onClick={onTutup}
            className="panel-geser-tutup"
            aria-label="Tutup panel"
          >
            ✕
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="panel-geser-body">
          {buka && children}
        </div>
      </div>
    </>
  );
}

export default PanelGeser;
