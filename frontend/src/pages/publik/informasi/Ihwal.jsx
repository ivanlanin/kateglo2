/**
 * @fileoverview Halaman Ihwal Kateglo berbasis markdown statis.
 */

import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';

function Ihwal() {
  return (
    <HalamanPublik
      judul="Ihwal Kateglo"
      deskripsi="Penjelasan singkat tentang Kateglo, cakupan layanan, sumber, dan arah pengembangannya."
    >
      <KontenMarkdownStatis
        src="/halaman/info/ihwal-kateglo.md"
        loadingText="Memuat ihwal Kateglo ..."
        errorText="Gagal memuat ihwal Kateglo."
      />
    </HalamanPublik>
  );
}

export default Ihwal;
