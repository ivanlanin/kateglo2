# Audit Kata dari Makna (Belum Ada di Entri)

Tanggal: 2026-02-23

## Tujuan

Dokumen ini mendeskripsikan migrasi untuk membuat tabel audit kata yang muncul di `makna`, tetapi belum ada di `entri`.

Tujuan operasional:

- menemukan kandidat salah tik,
- menemukan kandidat entri baru yang perlu ditambahkan,
- memisahkan nama diri/istilah yang tidak perlu masuk kamus utama.

## File Migrasi

- `_docs/202602/20260223_migrasi_audit_kata_makna.sql`

## Struktur Tabel

Tabel baru: `audit_makna`

Field utama:

- `indeks` (unik, lowercase)
- `jumlah` (berapa kali muncul di semua `makna` aktif)
- `entri_id` (contoh referensi entri asal makna)
- `makna_id` (contoh referensi makna untuk review konteks)
- `status`:
  - `tinjau` (default)
  - `salah`
  - `tambah`
  - `nama`
- `catatan` (opsional untuk editor)

## Logika Pengisian Awal

Migrasi melakukan langkah berikut:

1. Tokenisasi teks `makna.makna` dengan regex pemisah non-huruf.
2. Lowercase semua token.
3. Filter token kosong, angka murni, dan satu huruf.
4. Agregasi frekuensi (`jumlah`) per indeks unik.
5. Anti-join ke `entri` berdasarkan `LOWER(entri.indeks)`.
6. Insert ke `audit_makna` (upsert jika sudah ada).
7. Hapus baris audit yang ternyata sudah ada di `entri.indeks`.

## Query Review yang Disarankan

Top indeks belum ditinjau:

```sql
SELECT indeks, jumlah, entri_id, makna_id
FROM audit_makna
WHERE status = 'tinjau'
ORDER BY jumlah DESC, indeks ASC
LIMIT 200;
```

Lihat konteks contoh makna:

```sql
SELECT akm.indeks, akm.jumlah, m.makna, e.entri AS entri_sumber
FROM audit_makna akm
LEFT JOIN makna m ON m.id = akm.makna_id
LEFT JOIN entri e ON e.id = m.entri_id
WHERE akm.indeks = 'contohindeks';
```

Update status hasil review:

```sql
UPDATE audit_makna
SET status = 'tambah', catatan = 'Muncul sering, valid sebagai lema umum'
WHERE indeks = 'contohindeks';
```

## Catatan Batasan (Tahap 1)

- Belum ada stemming/morfologi; bentuk berimbuhan dapat tetap muncul sebagai kandidat.
- Nama diri belum otomatis terdeteksi; tetap butuh review manual.
- Variasi ejaan bertanda baca tertentu tetap perlu evaluasi editor.

## Langkah Lanjut (Opsional)

- Tambah job berkala (mis. harian) untuk refresh isi tabel.
- Tambah endpoint admin untuk list + update `status`.
- Tambah kamus stopword khusus agar noise turun.
