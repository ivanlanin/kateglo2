/**
 * @fileoverview Panel yang bisa dilipat/dibuka (collapsible section)
 */

import { useState } from 'react';

function PanelLipat({ judul, jumlah, children, terbukaAwal = false }) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);

  return (
    <div className="panel-lipat-root">
      <button
        type="button"
        onClick={() => setTerbuka(!terbuka)}
        className="panel-lipat-trigger"
      >
        <span className="panel-lipat-label">
          {judul}
          {jumlah !== undefined && (
            <span className="panel-lipat-count">
              {jumlah}
            </span>
          )}
        </span>
        <svg
          className={`panel-lipat-icon ${terbuka ? 'rotate-180' : ''}`}
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
