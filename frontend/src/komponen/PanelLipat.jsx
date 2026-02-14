/**
 * @fileoverview Panel yang bisa dilipat/dibuka (collapsible section)
 */

import { useState } from 'react';

function PanelLipat({ judul, jumlah, children, terbukaAwal = false }) {
  const [terbuka, setTerbuka] = useState(terbukaAwal);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setTerbuka(!terbuka)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-medium text-gray-800">
          {judul}
          {jumlah !== undefined && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {jumlah}
            </span>
          )}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${terbuka ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {terbuka && (
        <div className="px-4 py-3 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

export default PanelLipat;
