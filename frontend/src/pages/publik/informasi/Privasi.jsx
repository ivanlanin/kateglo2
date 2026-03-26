/**
 * @fileoverview Halaman kebijakan privasi berbasis markdown statis.
 */

import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';

function Privasi() {
  return (
    <HalamanPublik
      judul="Kebijakan Privasi"
      deskripsi="Kebijakan privasi Kateglo mengenai data akun, sesi, preferensi lokal, dan penggunaan layanan."
    >
      <KontenMarkdownStatis
        src="/halaman/info/kebijakan-privasi.md"
        loadingText="Memuat kebijakan privasi ..."
        errorText="Gagal memuat kebijakan privasi."
      />
    </HalamanPublik>
  );
}

export default Privasi;
