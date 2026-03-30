# Audit Normalisasi Lafal Entri Dasar (Huruf `e`)

**Tanggal:** 2026-02-22  
**Status:** Implementasi mayoritas selesai (Kasus B, D, E selesai; representasi pepet memakai `ê`)  
**Lingkup:** tabel `entri`, khusus `jenis='dasar'`, `aktif=1`, dan `entri` mengandung huruf `e`

---

## 1) Tujuan

Dokumen ini mencatat:

1. Kondisi aktual data `lafal` hasil migrasi lama.
2. Klasifikasi kasus (aman vs berisiko) untuk normalisasi.
3. Contoh nyata tiap kasus.
4. Rencana lanjutan bertahap agar perbaikan bisa dilanjutkan aman.

---

## 2) Ringkasan Temuan Kuantitatif

Hasil audit pada data aktif:

- Total entri dasar yang mengandung `e`: **17.329**
- `lafal` terisi: **8.916**
- `lafal` kosong: **8.413**

Distribusi karakter pada `lafal` terisi:

- Mengandung `ê` (pepet): **1.845**
- Mengandung `e` biasa tanpa `ê`: **7.071**
- Mengandung `é`: **0**
- Varian aksen non-standar tersisa: `ə` = **0**, `é` = **0**, `è` = **0**, `ë` = **0**

Temuan inferensi berbasis sibling `indeks`:

- Total `indeks` yang punya entri berhuruf `e`: **15.940**
- `indeks` yang memiliki minimal satu `lafal` kosong: **7.598**
- `indeks` kosong tapi punya sibling terisi: **0**
  - inferensi tunggal (lebih aman): **0 indeks** (sudah dieksekusi)
  - inferensi ambigu (multi-pron): **0 indeks** (sudah dieksekusi manual berbasis KBBI)
- `indeks` dengan campuran `e` dan `ê`: **1.643**

Kesimpulan statistik: asumsi global **"lafal kosong = pepet"** tidak aman.

---

## 3) Klasifikasi Kasus + Contoh

### Kasus A — Sudah standar (biarkan)
**Definisi:** `lafal` sudah memakai `e`/`ê` sesuai data saat ini dan tidak memerlukan normalisasi aksen.

Contoh:
- `abampere` → `abamperê`
- `adverbia` → `advêrbia`
- `absen` → `absen`
- `abiturien` → `abiturien`

Tindakan: **tidak diubah**.

---

### Kasus B — Aksen non-standar perlu dinormalisasi (**sudah dieksekusi**)
**Definisi:** `lafal` berisi varian `ə/è/é/ë` yang perlu diseragamkan ke notasi pepet `ê`.

Contoh temuan:
- `alen` → `alèn`
- `kena` → `kêna`
- `kendo` → `kèndo`
- `keng` → `kèng`

Aturan normalisasi karakter:
- `é`, `è`, `ə`, `ë` → `ê`
- `ê` tetap `ê`

Catatan:
- Setelah keputusan terbaru, representasi pepet final mengikuti notasi KBBI, yaitu `ê`.
- Contoh: `kena` tetap ditulis `kêna` (bukan `kəna`).

Tindakan: **aman untuk update massal terkontrol**.

Status eksekusi:
- Migration dijalankan pada 2026-02-22, baris terdampak: **9**.
- Sisa lafal beraksen non-standar (`ə/é/è/ë`): **0**.

---

### Kasus C — `lafal` kosong tanpa referensi sibling
**Definisi:** Dalam `indeks` yang sama, semua baris `lafal` juga kosong.

Skala:
- sekitar **8.413 baris** (berdasarkan klasifikasi baris)

Contoh:
- `abalone` → `null`
- `abdomen` → `null`
- `adem` → `null`

Catatan kecenderungan:
- Sejumlah entri kosong secara linguistik cenderung pepet berdasarkan rujukan KBBI (mis. `adem` tercatat `/adêm/`, setara target internal `adêm`).
- Namun, karena kelompok ini tidak punya sibling berlafal pada indeks yang sama, pengisian tetap tidak dilakukan otomatis secara global.

Tindakan: **jangan auto-isi** (risiko salah tinggi).

---

### Kasus D — `lafal` kosong, sibling tunggal konsisten (semi-aman, **sudah dieksekusi**)
**Definisi:** `lafal` kosong, tetapi pada `indeks` yang sama ada sibling terisi dan semua sibling terisi memiliki bentuk lafal identik. Untuk kebijakan terbaru, nilai kosong diisi dengan **lafal kebalikan** dari sibling terisi (`e ↔ ê`).

Skala:
- **115 baris** (dari **72 indeks**) sudah diproses
- sisa kandidat inferensi tunggal: **0**

Contoh konkret hasil audit:
- `apel` (kosong) + sibling `apel` → diisi `apêl`
- `apostel (2)` (kosong) + sibling `apostel` → diisi `apostel`
- `belok (1)/(2)/(3)` (kosong) + sibling `belok` → diisi `bêlok`
- `dendang (1)/(2)` (kosong) + sibling `dendang` → diisi `dêndang`

Catatan:
- Hasil ini menegaskan keputusan user: Kasus D harus diisi sebagai pasangan lafal lawan dari bentuk yang sudah ada.
- Untuk kebutuhan audit rinci, daftar lengkap homonim yang terisi ada di `docs/202602/20260222_kasus-d-homonim-terisi.md` (90 baris, 50 indeks).

Tindakan: **selesai (untuk batch ini)**.

---

### Kasus E — `lafal` kosong, sibling campuran (ambigu, **sudah diselesaikan manual berbasis KBBI**)
**Definisi:** Dalam indeks yang sama terdapat lafal campuran `e` dan `ê`, atau lebih dari satu pola lafal terisi.

Skala:
- awal: **10 baris** kosong pada **8 indeks** campuran
- saat ini: **0 baris** (selesai)

Contoh penyelesaian:
- `kelenteng` → `kêlêntêng`
- `ketel` → `kêtêl`
- `lempeng` → `lêmpêng`
- `per (4)/(5)` → `pêr`
- `rembes` → `rêmbês`
- `remet` → `rêmêt`
- `serang (3)` → `sêrang`
- `seri (4)/(5)` → `sêri`

Catatan saat ini:
- Pengisian dilakukan eksplisit per-ID menggunakan rujukan KBBI (`/entri/<indeks>`).
- Notasi pepet pada DB sekarang disimpan langsung sebagai `ê`.

Tindakan: **selesai untuk batch ini**.

---

## 3.1) Verifikasi Sampel ke KBBI Daring

Rujukan verifikasi: `https://kbbi.kemendikdasmen.go.id/entri/<indeks>`

Sampel yang dicek:

- `adem` → KBBI menampilkan `/adêm/` → disimpan sebagai `adêm`.
- `kena` → KBBI menampilkan `/kêna/` → disimpan sebagai `kêna`.
- `apel` → KBBI menampilkan `/apêl/` → disimpan sebagai `apêl`.
- `per` → KBBI menampilkan bentuk `/pêr/` pada beberapa subentri `per/per-` (indikasi pepet, bukan taling).

Catatan interpretasi rujukan:

- KBBI daring merekam pepet dengan notasi `ê`.
- Representasi internal `entri.lafal` kini mengikuti notasi yang sama (`ê`).
- Dengan demikian, verifikasi ke KBBI dapat dilakukan langsung secara tekstual pada simbol pepet.

---

## 4) Prinsip Keamanan Perbaikan

1. **Pisahkan normalisasi karakter** dari **pengisian nilai kosong**.
2. Jalankan dengan **preview** dulu (`SELECT`) sebelum `UPDATE`.
3. Simpan bukti sebelum/sesudah (snapshot baris terdampak).
4. Untuk kasus ambigu, jangan dipaksa otomatis.

---

## 5) Rencana Lanjutan (Bertahap)

### Fase 1 — Normalisasi karakter (Aman)
Target: hanya baris terisi yang mengandung `ə/è/é/ë`.

- Preview dampak baris
- Update normalisasi karakter
- Verifikasi hitungan pasca-update

Output yang diharapkan:
- Tidak ada `é/è/ë/ə` di `lafal`
- `ê` dipakai konsisten sebagai simbol pepet

---

### Fase 2 — Auto-isi terbatas (Semi-aman)
Target: hanya `lafal` kosong yang sibling-nya tunggal konsisten.

- Bangun kandidat dari grup `LOWER(indeks)`
- Exclude indeks ambigu/mixed
- Isi `lafal` kosong dari nilai sibling konsisten
- Simpan daftar affected rows untuk audit

Output yang diharapkan:
- Penurunan `lafal` kosong dengan risiko minimal

---

### Fase 3 — Antrian review manual
Target: kasus ambigu/multi-pron/tanpa referensi sibling.

- Ekspor daftar kandidat ke file kerja redaksi
- Prioritaskan kata frekuensi tinggi dulu (jika ada metrik penggunaan)
- Tambahkan sumber pembanding (mis. referensi lafal KBBI/kurasi internal)

Output yang diharapkan:
- Backlog terstruktur untuk kurasi bertahap

---

## 6) Checklist Eksekusi Teknis

1. Buat migration SQL di `docs/202602/` (2 file terpisah: fase aman & fase semi-aman).  
2. Jalankan migration ke DB development (sesuai SOP proyek).  
3. Regenerate schema: `backend/scripts/db-schema.js` bila ada perubahan struktur (untuk kasus ini kemungkinan tidak perlu).  
4. Simpan laporan ringkas before/after (jumlah baris terdampak, contoh 20 data).  
5. Lanjut fase berikutnya hanya setelah validasi hasil fase sebelumnya.

---

## 7) Usulan Artefak Berikutnya

Agar pekerjaan mudah dilanjutkan, berikut file yang disarankan dibuat di langkah berikutnya:

- `docs/202602/20260222_normalisasi-lafal-fase1-aman.sql`
- `docs/202602/20260222_normalisasi-lafal-fase2-semi-aman.sql`
- `docs/202602/20260222_laporan-hasil-normalisasi-lafal.md`

---

## 8) Keputusan Praktis Saat Ini

- **Sudah selesai:** Kasus B, D, dan E (dengan representasi pepet `ê`).  
- **Konversi representasi:** migration `20260222_konversi-simbol-schwa-ke-e-sirkumfleks.sql` sudah dijalankan (baris terdampak: 1.933).  
- **Fokus sisa utama:** Kasus C (`lafal` kosong tanpa referensi sibling), yang perlu dilanjutkan bertahap dengan rujukan KBBI/kurasi redaksi.  
- **Kebijakan tetap:** jangan auto-isi global Kasus C tanpa aturan validasi tambahan.
