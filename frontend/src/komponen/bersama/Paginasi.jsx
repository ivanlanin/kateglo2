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
}) {
  const modeCursor = Boolean(onNavigateCursor);
  const maxOffset = 1000;
  const halamanSaatIni = modeCursor ? currentPage : (Math.floor(offset / limit) + 1);
  const totalHalamanData = Math.ceil(total / limit);
  const totalHalamanMaksOffset = Math.floor(maxOffset / limit) + 1;
  const totalHalaman = modeCursor ? totalHalamanData : Math.min(totalHalamanData, totalHalamanMaksOffset);
  const navigasiAktif = totalHalaman > 1 || Boolean(pageInfo?.hasNext) || Boolean(pageInfo?.hasPrev);

  const mulai = total > 0 ? ((halamanSaatIni - 1) * limit) + 1 : 0;
  const akhir = total > 0 ? Math.min(halamanSaatIni * limit, total) : 0;

  const keHalaman = (halaman) => {
    const newOffset = (halaman - 1) * limit;
    onChange(newOffset);
  };

  const handleCursor = (action) => {
    if (!onNavigateCursor) return;
    onNavigateCursor(action);
  };

  const disableFirstPrev = modeCursor
    ? !pageInfo?.hasPrev
    : halamanSaatIni <= 1;
  const disableNextLast = modeCursor
    ? !pageInfo?.hasNext
    : halamanSaatIni >= totalHalaman;

  return (
    <div className="paginasi-container">
      <p className="paginasi-info">
        Menampilkan {mulai}–{akhir} dari {total.toLocaleString('id-ID')} entri
      </p>
      {navigasiAktif && (
        <div className="paginasi-controls">
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
        </div>
      )}
    </div>
  );
}

export default Paginasi;
