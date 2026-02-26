-- Migrasi: Optimasi indeks glosarium untuk paradigma sort by asing (Inggris)
-- Tanggal: 2026-02-22
--
-- Perubahan paradigma: halaman kategori glosarium sekarang diurutkan berdasarkan
-- istilah Inggris (kolom asing), bukan Indonesia. Indeks composite yang lama
-- (bidang_id/sumber_id + indonesia) diganti dengan yang baru (+ asing).
-- Dua indeks btree sederhana bidang_id dan sumber_id dihapus karena redundan
-- dengan composite index.
--
-- Gunakan CONCURRENTLY agar tidak memblokir tabel saat eksekusi di produksi.
-- Catatan: CONCURRENTLY tidak bisa dijalankan di dalam transaksi eksplisit.

-- 1. Buat indeks baru untuk paradigma sort by asing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_glosarium_aktif_bidang_id_asing
  ON glosarium (bidang_id, asing)
  WHERE aktif = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_glosarium_aktif_sumber_id_asing
  ON glosarium (sumber_id, asing)
  WHERE aktif = true;

-- 2. Hapus indeks lama (paradigma indonesia) setelah indeks baru selesai dibuat
DROP INDEX CONCURRENTLY IF EXISTS idx_glosarium_aktif_bidang_id_indonesia;
DROP INDEX CONCURRENTLY IF EXISTS idx_glosarium_aktif_sumber_id_indonesia;

-- 3. Hapus indeks btree sederhana yang redundan
--    (tercakup oleh composite index di atas)
DROP INDEX CONCURRENTLY IF EXISTS idx_glosarium_bidang_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_glosarium_sumber_id;
