# Pembaruan Otomasi Nirtagar & Notasi Reduplikasi

**Tanggal**: 2026-03-03  
**Konteks**: Lanjutan audit tagar entri turunan

---

## 1) Notasi reduplikasi yang disepakati (diskusi redaksi)

Notasi subtipe reduplikasi yang dipakai pada identifikasi:

- `R.penuh` (reduplikasi penuh/biasa)
- `R.salin`
- `R.purwa`
- `R.wasana`
- `R.tri`

Catatan implementasi saat ini:
- `R.penuh` dipakai eksplisit sebagai tagar reduplikasi penuh.
- `R-an` dan `R-nya` tidak dipakai lagi; direpresentasikan sebagai kombinasi `R.penuh` + `-an` atau `R.penuh` + `-nya`.
- Tagar subtipe lanjutan (`R.salin`, `R.purwa`, `R.wasana`, `R.tri`) sudah ditambahkan ke tabel `tagar`.
- Migrasi data dari fallback `R` ke subtipe non-penuh sudah dijalankan.

---

## 2) Eksekusi auto-assign aman (sedang/tinggi)

Baseline sebelum auto-assign:
- Entri turunan nirtagar: **401**

Aksi yang dijalankan:
- Auto-assign untuk kandidat reduplikasi dengan keyakinan `sedang/tinggi`
- Pemetaan tagar yang disisipkan: prefiks terdeteksi (`ber-`, `meng-`, dll) + `R.penuh` + sufiks terdeteksi (`-an`, `-kan`, `-i`, `-nya`) bila ada

Hasil:
- Entri yang terisi otomatis: **88 entri**
- Residual nirtagar setelah auto-assign: **313 entri**

Log hasil auto-assign:
- `docs/202603/202603032235_auto-assign-reduplikasi-sedang-tinggi.csv`

## 2.1) Migrasi notasi ke subtipe (iterasi terbaru)

Perubahan yang dijalankan:
- Menambahkan tagar baru ke tabel `tagar`: `R.salin`, `R.purwa`, `R.wasana`, `R.tri`
- File SQL: `docs/202603/202603032320_tambah_tagar_subtipe_reduplikasi.sql`
- Migrasi data lama: entri yang sebelumnya bertagar `R` dan terdeteksi non-penuh dipindahkan ke subtipe

Hasil migrasi data:
- Total entri dimigrasikan dari `R` ke subtipe: **1462 entri**
- Distribusi migrasi:
  - `R.salin`: 205
  - `R.purwa`: 12
  - `R.wasana`: 1245
  - `R.tri`: 0

Snapshot distribusi tagar reduplikasi pascamigrasi:
- `R.penuh`: 399
- `R.salin`: 205
- `R.purwa`: 12
- `R.wasana`: 1245

Setelah seeder sinkronisasi ulang:
- Entri turunan aktif: 24605
- Terdeteksi: 24253 (98.6%)
- Tidak terdeteksi: **352**

Setelah regenerasi identifikasi residual terbaru:
- Residual nirtagar turun lagi menjadi **253**
- Distribusi: `(tanpa reduplikasi)` 217, `R.purwa` 36

## 2.2) Batch auto-assign untuk `jenis=dasar` (hyphen-only)

Perubahan yang dijalankan:
- Target: entri `jenis=dasar`, aktif, dan ber-hubung (`LIKE '%-%'`)
- Normalisasi: sufiks homonim `(x)` diabaikan sebelum klasifikasi
- Auto-assign subtype reduplikasi pada entri yang belum punya tagar reduplikasi

Hasil:
- Entri yang diisi otomatis: **680 entri**
- Distribusi pengisian:
  - `R.penuh`: 402
  - `R.salin`: 200
  - `R.purwa`: 56
  - `R.wasana`: 20
  - `R.tri`: 2

Dokumen terkait:
- Ringkasan audit dasar terbaru:
  - `docs/202603/202603032335_ringkasan-audit-dasar-reduplikasi-hyphen.md`
- Lampiran audit dasar:
  - `docs/202603/202603032335_audit-dasar-reduplikasi-hyphen.csv`
- Log batch auto-assign:
  - `docs/202603/202603032350_auto-assign-dasar-reduplikasi-hyphen.csv`

---

## 3) Dokumen yang dimutakhirkan

- Ringkasan identifikasi residual (terbaru):
  - `docs/202603/202603032210_ringkasan-identifikasi-nirtagar.md`
- Lampiran lengkap residual (terbaru):
  - `docs/202603/202603032210_identifikasi-nirtagar-notasi-reduplikasi-baru.csv`
- Audit khusus `jenis=dasar` (hyphen-only, normalisasi `(x)`):
  - `docs/202603/202603032335_ringkasan-audit-dasar-reduplikasi-hyphen.md`
  - `docs/202603/202603032335_audit-dasar-reduplikasi-hyphen.csv`

Distribusi residual terbaru (post auto-assign):
- `(tanpa reduplikasi)`: 217
- `R.purwa`: 36
- Total residual terbaru: **253**

---

## 4) Rekomendasi langkah berikutnya

1. Pertahankan `R.penuh` sebagai notasi reduplikasi penuh/biasa, dengan kombinasi sufiks sebagai tag terpisah (`-an`, `-nya`, dst.).
2. Lanjutkan penyempurnaan aturan klasifikasi subtype agar sebaran `R.salin`/`R.wasana`/`R.tri` pada residual bisa teridentifikasi lebih presisi.
3. Prioritaskan residual non-reduplikasi (`217`) untuk rule tambahan (keluarga `ajar`, bentuk be-/te- nonreguler, frasa-spasi, dan bentuk leksikal khusus).
