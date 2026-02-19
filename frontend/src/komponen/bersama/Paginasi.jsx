/**
 * @fileoverview Komponen pagination sederhana
 */

function Paginasi({ total, limit, offset, onChange }) {
  const halamanSaatIni = Math.floor(offset / limit) + 1;
  const totalHalaman = Math.ceil(total / limit);
  const navigasiAktif = totalHalaman > 1;

  const mulai = offset + 1;
  const akhir = Math.min(offset + limit, total);

  const keHalaman = (halaman) => {
    const newOffset = (halaman - 1) * limit;
    onChange(newOffset);
  };

  // Buat array nomor halaman yang ditampilkan
  const halamanTampil = [];
  const range = 2;
  for (let i = Math.max(1, halamanSaatIni - range); i <= Math.min(totalHalaman, halamanSaatIni + range); i++) {
    halamanTampil.push(i);
  }

  return (
    <div className="paginasi-container">
      <p className="paginasi-info">
        Menampilkan {mulai}–{akhir} dari {total.toLocaleString('id-ID')} entri
      </p>
      {navigasiAktif && (
        <div className="paginasi-controls">
          <button
            type="button"
            onClick={() => keHalaman(halamanSaatIni - 1)}
            disabled={halamanSaatIni <= 1}
            className="paginasi-btn"
          >
            ‹
          </button>
          {halamanTampil[0] > 1 && (
            <>
              <button type="button" onClick={() => keHalaman(1)} className="paginasi-btn">1</button>
              {halamanTampil[0] > 2 && <span className="paginasi-ellipsis">…</span>}
            </>
          )}
          {halamanTampil.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => keHalaman(h)}
              className={`paginasi-btn ${h === halamanSaatIni ? 'paginasi-btn-active' : ''}`}
            >
              {h}
            </button>
          ))}
          {halamanTampil[halamanTampil.length - 1] < totalHalaman && (
            <>
              {halamanTampil[halamanTampil.length - 1] < totalHalaman - 1 && <span className="paginasi-ellipsis">…</span>}
              <button type="button" onClick={() => keHalaman(totalHalaman)} className="paginasi-btn">{totalHalaman}</button>
            </>
          )}
          <button
            type="button"
            onClick={() => keHalaman(halamanSaatIni + 1)}
            disabled={halamanSaatIni >= totalHalaman}
            className="paginasi-btn"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default Paginasi;
