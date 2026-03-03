# Audit Entri Turunan Belum Bertagar + Saran Penyelesaian

**Tanggal**: 2026-03-03  
**Sumber data**: PostgreSQL (`entri`, `entri_tagar`)  
**Ruang lingkup**: `entri.aktif = 1`, `entri.jenis = 'turunan'`, dan **belum memiliki relasi** di `entri_tagar`

---

## 1) Ringkasan

- Total entri turunan aktif yang belum punya tagar saat audit ini: **455 entri**.
- Daftar lengkap tersedia pada file:
  - `_docs/202603/202603031950_entri-turunan-belum-bertagar.csv`
- Daftar lengkap + **saran per entri** tersedia pada file:
  - `_docs/202603/202603031951_entri-turunan-belum-bertagar-dengan-saran.csv`
- Ringkasan kategori tersedia pada file:
  - `_docs/202603/202603031951_ringkasan-entri-turunan-belum-bertagar.json`

---

## 2) Distribusi Kategori Masalah

| Kategori | Jumlah | Catatan |
|---|---:|---|
| `reduplikasi-lain` | 127 | Reduplikasi idiomatik/variasi bunyi, belum tertangkap aturan deterministik |
| `prefiks-ber` | 72 | Banyak bentuk alomorf `be-` atau turunan non-reguler |
| `manual-lain` | 67 | Kasus khusus: serapan, arkais, bentuk leksikal tidak reguler |
| `prefiks-meng` | 43 | Turunan meN- yang masih membutuhkan aturan tambahan/kamus pengecualian |
| `prefiks-ter` | 34 | Banyak bentuk alomorf `te-` |
| `prefiks-peng` | 29 | Turunan peN- non-reguler / keluarga `ajar` |
| `frasa-spasi` | 23 | Entri bertanda spasi (frasa), perlu kebijakan tagging khusus |
| `konfiks-ke-an` | 18 | Cenderung bisa diselesaikan sebagai `ke-an` |
| `alomorf-menge` | 15 | Bentuk menge- (monosuku) dengan variasi lain |
| `reduplikasi-ber` | 10 | Reduplikasi berimbuhan `ber-` tanpa pola yang sudah tertangkap |
| `reduplikasi-meng` | 10 | Reduplikasi berimbuhan meN- kompleks |
| `alomorf-penge` | 5 | Bentuk penge- (monosuku) dengan variasi lain |
| `reduplikasi-peng` | 2 | Reduplikasi berimbuhan peN- kompleks |

---

## 3) Contoh Representatif

### `reduplikasi-lain`
- `ada-adanyakah` ← `ada`
- `alah-mengalahi` ← `alah`
- `atas-mengatasi` ← `atas`
- `awang-gemawang` ← `awang`

### `prefiks-ber`
- `bebatuan` ← `batu`
- `bebauan` ← `bau`
- `bebercak` ← `bercak`
- `bebuahan` ← `buah`

### `prefiks-meng`
- `membelajarkan` ← `ajar`
- `mempelajari` ← `ajar`
- `memperdalam` ← `dalam-dalam`
- `memperundungkan` ← `undung-undung`

### `prefiks-peng`
- `pedalaman` ← `dalam-dalam`
- `pelajar` ← `ajar`
- `pelajaran` ← `ajar`
- `pembelajar` ← `ajar`

### `alomorf-menge`
- `mengebelakangkan` ← `belakang`
- `mengebumikan` ← `bumi`
- `mengedepan` ← `depan`
- `mengedepankan` ← `depan`

### `alomorf-penge`
- `pengedepanan` ← `depan`
- `pengemuka` ← `muka`
- `pengemukaan` ← `muka`
- `pengetahuan` ← `tahu`

### `frasa-spasi`
- `ada-ada saja` ← `ada`
- `baru-baru ini` ← `baru`
- `bermaulid Rasul` ← `maulid`
- `bertenggang rasa` ← `tengang rasa`

---

## 4) Saran Penyelesaian

## A. Quick wins (otomasi tambahan)
1. Tambahkan aturan alomorf `be-` → `ber` dan `te-` → `ter` untuk kasus turunan yang konsisten.
2. Tambahkan kamus pengecualian keluarga `ajar` (`belajar`, `pelajar`, `pelajaran`, `pembelajaran`, dst.) agar konsisten memetakan `ber/meng/peng` + sufiks.
3. Tambahkan normalisasi bentuk rangkap tanpa pemisah (`bunuhbunuhan` dsb.) sebelum deteksi prefiks/sufiks.
4. Tambahkan aturan khusus turunan frasa dengan spasi untuk pola meN-/peN- + sufiks (`mengambinghitamkan`-like sudah ditangani; lanjutkan ke pola sejenis lain).

## B. Batch manual terarah di Audit Tagar
1. Prioritaskan kategori terbesar: `reduplikasi-lain` (127) dan `prefiks-ber` (72).
2. Gunakan pengisian manual batch berdasarkan awalan:
   - awalan `be*` → kandidat `ber`
   - awalan `te*` → kandidat `ter`
   - awalan `pe*`/`pen*`/`peng*` → kandidat `peng`
3. Untuk reduplikasi idiomatik/variasi bunyi, tetapkan kebijakan editor:
   - pilih salah satu dari `R`, `R-an`, `R-nya`, atau kombinasi dengan prefiks (`ber`, `meng`, `peng`).

## C. Quality gate
1. Setelah penambahan aturan baru, jalankan ulang seeder `entri_tagar`.
2. Rekam delta jumlah entri belum bertagar (target bertahap: < 300, lalu < 150).
3. Simpan daftar residual terbaru ke dokumen periodik `_docs/YYYYMM/`.

---

## 5) Catatan Implementasi

- Dokumen ini menyajikan **seluruh entri residual** melalui CSV lampiran.
- Kolom `saran` pada CSV bersifat **heuristik** untuk mempercepat triase redaksi; verifikasi linguistik tetap diperlukan untuk kasus idiomatik dan arkais.
- Untuk pekerjaan lanjutan, disarankan membuat script rule-based kecil per kategori terbesar agar beban manual menurun signifikan.
