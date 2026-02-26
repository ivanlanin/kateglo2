/**
 * @fileoverview Panel yang bisa dilipat/dibuka (collapsible section)
 */

import { useState } from 'react';

function PanelLipat({ judul, jumlah, children, terbukaAwal = false, aksen = false, aksiKanan = null }) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  const punyaAksiKanan = Boolean(aksiKanan);
  const rootClass = aksen ? 'panel-lipat-root panel-lipat-root-aksen' : 'panel-lipat-root';
  const triggerClass = aksen ? 'panel-lipat-trigger panel-lipat-trigger-aksen' : 'panel-lipat-trigger';
  const labelClass = aksen ? 'panel-lipat-label panel-lipat-label-aksen' : 'panel-lipat-label';
  const countClass = 'kamus-count-badge ml-2';
  const iconClass = aksen ? 'panel-lipat-icon panel-lipat-icon-aksen' : 'panel-lipat-icon';

  return (
    <div className={rootClass}>
      {punyaAksiKanan ? (
        <div className="panel-lipat-heading">
          <button
            type="button"
            onClick={() => setTerbuka(!terbuka)}
            className={`${triggerClass} panel-lipat-trigger-title`}
          >
            <span className={labelClass}>
              {judul}
              {jumlah !== undefined && (
                <span className={countClass} data-count={jumlah}>
                  {jumlah}
                </span>
              )}
            </span>
          </button>
          <div className="panel-lipat-actions" aria-label="aksi panel">
            {aksiKanan}
          </div>
          <button
            type="button"
            onClick={() => setTerbuka(!terbuka)}
            className="panel-lipat-toggle-button"
            aria-label={terbuka ? 'Tutup panel' : 'Buka panel'}
          >
            <svg
              className={`${iconClass} ${terbuka ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setTerbuka(!terbuka)}
          className={triggerClass}
        >
          <span className={labelClass}>
            {judul}
            {jumlah !== undefined && (
              <span className={countClass} data-count={jumlah}>
                {jumlah}
              </span>
            )}
          </span>
          <svg
            className={`${iconClass} ${terbuka ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {terbuka && (
        <div className="panel-lipat-body">
          {children}
        </div>
      )}
    </div>
  );
}

export default PanelLipat;
