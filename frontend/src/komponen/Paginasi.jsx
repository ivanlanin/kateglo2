/**
 * @fileoverview Komponen pagination sederhana
 */

function Paginasi({ total, limit, offset, onChange }) {
  const halamanSaatIni = Math.floor(offset / limit) + 1;
  const totalHalaman = Math.ceil(total / limit);

  if (totalHalaman <= 1) return null;

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <p className="text-sm text-gray-600">
        Menampilkan {mulai}–{akhir} dari {total.toLocaleString('id-ID')} entri
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => keHalaman(halamanSaatIni - 1)}
          disabled={halamanSaatIni <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100"
        >
          ‹
        </button>
        {halamanTampil[0] > 1 && (
          <>
            <button type="button" onClick={() => keHalaman(1)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100">1</button>
            {halamanTampil[0] > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}
        {halamanTampil.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => keHalaman(h)}
            className={`px-3 py-1.5 text-sm border rounded-md ${
              h === halamanSaatIni
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {h}
          </button>
        ))}
        {halamanTampil[halamanTampil.length - 1] < totalHalaman && (
          <>
            {halamanTampil[halamanTampil.length - 1] < totalHalaman - 1 && <span className="px-1 text-gray-400">…</span>}
            <button type="button" onClick={() => keHalaman(totalHalaman)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100">{totalHalaman}</button>
          </>
        )}
        <button
          type="button"
          onClick={() => keHalaman(halamanSaatIni + 1)}
          disabled={halamanSaatIni >= totalHalaman}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default Paginasi;
