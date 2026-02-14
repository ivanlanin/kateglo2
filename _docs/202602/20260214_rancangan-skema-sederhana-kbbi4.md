# Rancangan Skema Sederhana KBBI4 (Model Rujukan)

**Tanggal:** 2026-02-14  
**Status:** Draft untuk review

## Keputusan Desain (Final dari diskusi)

1. Tabel inti: **lema**, **makna**, **contoh**, **label**.
2. Tabel `bahasa`, `bidang`, `kelaskata`, `ragam` digabung sebagai lookup `label`.
3. Tabel `berimbuhan`, `gabungan`, `idiom`, `peribahasa`, `varian` dilebur ke `lema` via kolom `jenis`.
4. **Tidak** memakai tabel `entri_relasi`.
5. `ilmiah` dan `kimia` tetap menempel pada `makna` (asumsi 1:1).
6. `contoh` + `maknacontoh` disederhanakan jadi satu tabel `contoh`.

## Dasar dari Sistem Rujukan (UI)

Berdasarkan tangkapan layar admin rujukan:

- Level entri memerlukan: jenis entri, induk kata, homonim, aktif, pemenggalan, lafal, mode makna/rujuk, jenis rujuk, entri rujuk, jumlah makna.
- Level makna memerlukan: polisem, makna, ragam, ragam varian, kelas kata, bahasa, bidang, tipe penyingkat, kiasan, ilmiah, kimia, jumlah contoh.
- Level contoh memerlukan: contoh, ragam, bahasa, bidang, kiasan, makna contoh.
- Nilai dropdown eksplisit terlihat untuk:
  - jenis entri (entri dasar/kata turunan/gabungan kata/idiom/peribahasa/varian/ungkapan),
  - ragam dan ragam varian,
  - kelas kata,
  - bahasa,
  - bidang,
  - tipe penyingkat (akronim/kependekan/singkatan).

## Pemetaan Tabel Lama → Tabel Baru

### 1) `lema`

- Sumber utama: `entri` (legacy), ditambah join ke tabel detail berdasarkan `entri.tabel` + `entri.tid`.
- Mapping jenis:
  - `kata` -> `entri_dasar`
  - `berimbuhan` -> `kata_turunan`
  - `gabungan` -> `gabungan_kata`
  - `idiom` -> `idiom`
  - `peribahasa` -> `peribahasa`
  - `varian` -> `varian`
- Data `kata` dimigrasi lebih dulu agar `lema.id = kata.kid`.
- Kolom `induk` menyimpan relasi ke `lema.id` (kata dasar).
- Data `rujuk` diterapkan sebagai atribut pada `lema` existing melalui kolom `jenis_rujuk` dan `lema_rujuk` (tanpa membuat baris `jenis='rujuk'`).

### 2) `makna`

- Sumber: `makna` (legacy).
- `makna` <- `makna.makna`
- `polisem_no` <- nomor urut per `eid`
- `is_kiasan` <- interpretasi dari `makna.ki`
- `tipe_penyingkat` <- interpretasi dari `makna.akr`
- `ilmiah` <- `ilmiah.nama` (join by `mid`)
- `kimia` <- `kimia.rumus` (join by `mid`)

### 3) `label` + kolom label teks di `makna`

- `label` diisi union dari:
  - `ragam(ragam, ragam_lgkp)`
  - `kelaskata(kkata, kkata_lgkp)`
  - `bahasa(bahasa, bahasa_lgkp)`
  - `bidang(bidang, bidang_lgkp)`
- Pemakaian label pada makna disimpan langsung sebagai teks display di tabel `makna`:
  - `ragam_label`
  - `ragam_varian_label`
  - `kelas_kata_label`
  - `bahasa_label`
  - `bidang_label`
- Tabel `label` tetap dipertahankan sebagai tabel rujukan lookup (bukan relasi wajib untuk display).

### 4) `contoh`

- `isi_contoh` <- `contoh.contoh`
- `makna_contoh` <- `maknacontoh.makna_contoh` (left join via `cid`)
- `ragam_label` <- lookup `maknacontoh.ragam`
- `bahasa_label` <- lookup `maknacontoh.bahasa`
- `bidang_label` <- lookup `maknacontoh.bidang`
- `kiasan` <- interpretasi dari `maknacontoh.ki`
- Jika satu `cid` punya lebih dari satu baris `maknacontoh`, maka:
  - `makna_contoh` digabung menjadi satu string (delimiter `; `),
  - label contoh (`ragam/bahasa/bidang`) mengambil nilai pertama yang valid,
  - `is_kiasan` bernilai `true` jika salah satu baris bernilai true.

## Catatan Data Penting

1. `makna` memiliki banyak kolom label yang null; struktur baru harus menerima null label.
2. `maknacontoh` jauh lebih sedikit daripada `contoh`, sehingga join opsional aman.
3. Karena `entri_relasi` ditiadakan, fitur rujuk disimpan secara denormalisasi ringan pada baris `entri`.
4. Metadata contoh pada sistem rujukan tetap dipertahankan dan disimpan langsung di tabel `contoh`.

## Berkas Draft SQL

- `_docs/202602/20260214_draft-skema-sederhana-kbbi4.sql`

## Skrip ETL Tahap 1 (Sudah Tersedia)

- Script: `backend/scripts/check_kbbi4_stage1_etl.py`
- Output: JSONL ke `backend/.tmp/kbbi4_stage1/`

### Menjalankan Dry-Run

```powershell
Set-Location "C:/Kode/Kateglo/kateglo2"
$py = "C:/Kode/Kateglo/kateglo2/.venv/Scripts/python.exe"
& $py backend/scripts/check_kbbi4_stage1_etl.py --dry-run
```

### Menjalankan Ekspor

```powershell
Set-Location "C:/Kode/Kateglo/kateglo2"
$py = "C:/Kode/Kateglo/kateglo2/.venv/Scripts/python.exe"
& $py backend/scripts/check_kbbi4_stage1_etl.py --output-dir backend/.tmp/kbbi4_stage1
```

### Menjalankan Ekspor + Build SQLite Baru

```powershell
Set-Location "C:/Kode/Kateglo/kateglo2"
$py = "C:/Kode/Kateglo/kateglo2/.venv/Scripts/python.exe"
& $py backend/scripts/check_kbbi4_stage1_etl.py --output-dir backend/.tmp/kbbi4_stage1 --apply-sqlite --sqlite-output _data/kbbi.db
```

Hasil SQLite baru berisi tabel:
- `label(id, kategori, kode, nama, ...)`
- `lema(id, lema, jenis, induk, aktif, ...)`
- `makna(id, lema_id, makna, ragam, kelas_kata, bahasa, bidang, ... )`
- `contoh(id, makna_id, contoh, ragam, bahasa, bidang, kiasan, makna_contoh)`

### Ringkasan Hasil Uji Awal

- label: 205
- lema: 92.011
- makna: 109.005
- contoh: 27.889
- catatan kualitas data:
  - `ilmiah_multi_mid = 23` (kasus >1 nilai ilmiah pada satu `mid`, digabung dengan delimiter `; `)
  - `kimia_multi_mid = 0` (saat ini belum ada kasus multi nilai kimia)
  - `contoh_multi_maknacontoh = 12` (satu `cid` punya >1 makna contoh, didenormalisasi ke satu baris `contoh`)

## Saran Langkah Berikutnya

1. Buat skrip ETL sementara di `backend/` untuk load dari SQLite (`kbbi4.db`) ke PostgreSQL staging.
2. Validasi hasil migrasi dengan sampel kasus:
   - entri dasar dengan ilmiah,
   - entri dasar dengan kimia,
   - entri rujuk tanpa makna,
   - entri dengan >1 makna dan >1 contoh.
3. Setelah valid, finalisasi migration SQL versioned di `_docs/YYYYMM/`.