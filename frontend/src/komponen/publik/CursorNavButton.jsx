/**
 * @fileoverview Tombol navigasi cursor dengan state loading spinner
 */

function CursorNavButton({
  symbol,
  onClick,
  isLoading = false,
  disabled = false,
  className = 'kamus-detail-subentry-link',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      disabled={disabled}
    >
      {isLoading ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="inline-block w-4 h-4 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" className="opacity-25" />
          <path d="M21 12a9 9 0 0 0-9-9" className="opacity-100" />
        </svg>
      ) : symbol}
    </button>
  );
}

export default CursorNavButton;
