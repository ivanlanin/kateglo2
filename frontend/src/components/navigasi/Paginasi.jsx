/**
 * @fileoverview Komponen pagination sederhana
 */

function Paginasi({
  total,
  limit,
  offset = 0,
  onChange,
  pageInfo,
  currentPage = 1,
  onNavigateCursor,
  maxOffset = 1000,
  className = '',
}) {
  const modeCursor = Boolean(onNavigateCursor);
  const halamanSaatIni = modeCursor ? currentPage : (Math.floor(offset / limit) + 1);
  const totalHalamanData = Math.ceil(total / limit);
  const memakaiBatasOffset = Number.isFinite(maxOffset);
  const totalHalamanMaksOffset = memakaiBatasOffset
    ? (Math.floor(maxOffset / limit) + 1)
    : totalHalamanData;
  const totalHalaman = modeCursor
    ? totalHalamanData
    : (memakaiBatasOffset ? Math.min(totalHalamanData, totalHalamanMaksOffset) : totalHalamanData);
  const navigasiAktif = totalHalaman > 1 || Boolean(pageInfo?.hasNext) || Boolean(pageInfo?.hasPrev);

  const mulai = total > 0 ? ((halamanSaatIni - 1) * limit) + 1 : 0;
  const akhir = total > 0 ? Math.min(halamanSaatIni * limit, total) : 0;

  const keHalaman = (halaman) => {
    const newOffset = (halaman - 1) * limit;
    onChange(newOffset);
  };

  const handleCursor = (action) => {
    onNavigateCursor(action);
  };

  const disableFirstPrev = modeCursor
    ? !pageInfo?.hasPrev
    : halamanSaatIni <= 1;
  const disableNextLast = modeCursor
    ? !pageInfo?.hasNext
    : halamanSaatIni >= totalHalaman;

  return (
    <div className={`paginasi-container ${className}`.trim()}>
      {navigasiAktif ? (
        <>
          <button
            type="button"
            onClick={() => (modeCursor ? handleCursor('first') : keHalaman(1))}
            disabled={disableFirstPrev}
            className="paginasi-btn"
            aria-label="Halaman pertama"
            title="Halaman pertama"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => (modeCursor ? handleCursor('prev') : keHalaman(halamanSaatIni - 1))}
            disabled={disableFirstPrev}
            className="paginasi-btn"
            aria-label="Halaman sebelumnya"
            title="Halaman sebelumnya"
          >
            ‹
          </button>
          <span className="paginasi-info">
            Halaman {halamanSaatIni} ({mulai}–{akhir} dari {total.toLocaleString('id-ID')} entri)
          </span>
          <button
            type="button"
            onClick={() => (modeCursor ? handleCursor('next') : keHalaman(halamanSaatIni + 1))}
            disabled={disableNextLast}
            className="paginasi-btn"
            aria-label="Halaman berikutnya"
            title="Halaman berikutnya"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => (modeCursor ? handleCursor('last') : keHalaman(totalHalaman))}
            disabled={disableNextLast}
            className="paginasi-btn"
            aria-label="Halaman terakhir"
            title="Halaman terakhir"
          >
            »
          </button>
        </>
      ) : (
        <span className="paginasi-info">
          {mulai}–{akhir} dari {total.toLocaleString('id-ID')} entri
        </span>
      )}
    </div>
  );
}

export default Paginasi;
