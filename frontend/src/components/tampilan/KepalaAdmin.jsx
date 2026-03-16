/**
 * @fileoverview Kepala halaman admin untuk judul, aksi utama, dan area tambahan
 */

function KepalaAdmin({ judul = '', aksi = null, children = null }) {
  if (!judul && !aksi && !children) {
    return null;
  }

  return (
    <div className="mb-6 space-y-4">
      {(judul || aksi) && (
        <div className="flex items-center justify-between gap-3">
          {judul ? <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{judul}</h2> : <div />}
          {aksi}
        </div>
      )}
      {children}
    </div>
  );
}

export default KepalaAdmin;