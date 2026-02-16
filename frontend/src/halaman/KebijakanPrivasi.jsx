/**
 * @fileoverview Halaman kebijakan privasi sederhana
 */

import HalamanDasar from '../komponen/HalamanDasar';

function KebijakanPrivasi() {
  return (
    <HalamanDasar judul="Kebijakan Privasi">
      <div className="space-y-4">
        <p className="muted-text">
          Kateglo berkomitmen melindungi data pribadi pengguna. Dokumen ini menjelaskan
          data apa yang kami gunakan dan untuk tujuan apa.
        </p>

        <section className="space-y-2">
          <h2 className="font-semibold">1. Data yang kami proses</h2>
          <p className="muted-text">
            Kami dapat memproses informasi akun dari autentikasi Google (nama, email,
            dan foto profil) untuk kebutuhan login dan personalisasi dasar.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">2. Penggunaan data</h2>
          <p className="muted-text">
            Data digunakan untuk autentikasi, keamanan layanan, analitik penggunaan,
            serta peningkatan kualitas fitur kamus, tesaurus, dan glosarium.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">3. Penyimpanan dan keamanan</h2>
          <p className="muted-text">
            Kami menerapkan langkah keamanan yang wajar untuk melindungi data dari
            akses tidak sah, perubahan, atau penghapusan tanpa izin.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">4. Hak pengguna</h2>
          <p className="muted-text">
            Anda dapat meminta pembaruan atau penghapusan data akun sesuai ketentuan
            hukum yang berlaku.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">5. Perubahan kebijakan</h2>
          <p className="muted-text">
            Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan
            diumumkan melalui pembaruan halaman ini.
          </p>
        </section>

        <p className="secondary-text">Terakhir diperbarui: 16 Februari 2026</p>
      </div>
    </HalamanDasar>
  );
}

export default KebijakanPrivasi;
