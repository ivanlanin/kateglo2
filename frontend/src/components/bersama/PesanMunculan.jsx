/**
 * @fileoverview Komponen toast pesan yang dapat dipakai ulang
 */

import { useEffect } from 'react';

function PesanMunculan({
  tampil = false,
  jenis = 'info',
  judul = '',
  deskripsi = '',
  durasi = 2600,
  token = '',
  onClose = () => {},
}) {
  useEffect(() => {
    if (!tampil || !durasi) return undefined;

    const timer = setTimeout(() => {
      onClose();
    }, durasi);

    return () => clearTimeout(timer);
  }, [durasi, onClose, tampil, token]);

  if (!tampil || !judul) return null;

  const kelasJenis = jenis === 'success'
    ? 'pesan-munculan-success'
    : jenis === 'error'
      ? 'pesan-munculan-error pesan-munculan-getar'
      : 'pesan-munculan-info';

  return (
    <div className="pesan-munculan-overlay" aria-live="polite" role="presentation">
      <div className={`pesan-munculan ${kelasJenis}`.trim()} role="status">
        <button
          type="button"
          className="pesan-munculan-tutup"
          onClick={onClose}
          aria-label="Tutup pesan"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <p className="pesan-munculan-judul">{judul}</p>
        {deskripsi ? <p className="pesan-munculan-deskripsi">{deskripsi}</p> : null}
      </div>
    </div>
  );
}

export default PesanMunculan;
