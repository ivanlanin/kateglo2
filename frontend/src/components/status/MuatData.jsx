function MuatData({ isLoading = false, loadingText = 'Memuat data …', contentClassName = '', children }) {
  const kelasKonten = [contentClassName, isLoading ? 'navigasi-loading-content' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="navigasi-loading-body" aria-busy={isLoading}>
      <div className={kelasKonten}>
        {children}
      </div>
      {isLoading && (
        <div className="navigasi-loading-overlay" role="status" aria-live="polite">
          <span className="navigasi-loading-overlay-chip">
            <svg className="navigasi-loading-spinner animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" className="opacity-25" stroke="currentColor" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" className="opacity-90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>{loadingText}</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default MuatData;
