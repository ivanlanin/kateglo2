/**
 * @fileoverview Panel yang bisa dilipat/dibuka (collapsible section)
 */

import { useState } from 'react';

function PanelLipat({ judul, jumlah, children, terbukaAwal = false, aksen = false }) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);
  const rootClass = aksen ? 'panel-lipat-root panel-lipat-root-aksen' : 'panel-lipat-root';
  const triggerClass = aksen ? 'panel-lipat-trigger panel-lipat-trigger-aksen' : 'panel-lipat-trigger';
  const labelClass = aksen ? 'panel-lipat-label panel-lipat-label-aksen' : 'panel-lipat-label';
  const countClass = aksen ? 'panel-lipat-count panel-lipat-count-aksen' : 'panel-lipat-count';
  const iconClass = aksen ? 'panel-lipat-icon panel-lipat-icon-aksen' : 'panel-lipat-icon';

  return (
    <div className={rootClass}>
      <button
        type="button"
        onClick={() => setTerbuka(!terbuka)}
        className={triggerClass}
      >
        <span className={labelClass}>
          {judul}
          {jumlah !== undefined && (
            <span className={countClass}>
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
      {terbuka && (
        <div className="panel-lipat-body">
          {children}
        </div>
      )}
    </div>
  );
}

export default PanelLipat;
