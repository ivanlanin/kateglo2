/**
 * @fileoverview Tombol aksi utama untuk kepala halaman admin
 */

function TombolAksiAdmin({ onClick, label = '+ Tambah' }) {
  return (
    <button type="button" onClick={onClick} className="form-admin-btn-simpan whitespace-nowrap">
      {label}
    </button>
  );
}

export default TombolAksiAdmin;