# Pengisian Bahasa dan Kata Asal dari Sumber Definisi

**Tanggal**: 2026-03-05
**Status**: Selesai
**File migrasi**: `202603051914_isi-bahasa-dari-sumber-definisi.sql`
**CSV review**: `202603051914_isi-bahasa-dari-sumber-definisi.csv`

---

## 1. Latar Belakang

Setelah migrasi aktivasi awal, masih tersisa 891 baris `aktif=false, meragukan=false`
yang tidak teraktifkan karena kolom `bahasa` kosong. Sebagian dari baris ini sebenarnya
memiliki informasi bahasa asal yang tersembunyi dalam `sumber_definisi` — berupa
notasi etimologi dari sumber LWIM dengan format `[from KATA (< BAHASA) + ...]`.

---

## 2. Metode Ekstraksi

### 2.1 Pola yang Dikenali

```
[from a- (< Belanda) + from biosfér (< Belanda)]
[from adi- (< Sanskerta) + from kodrati (< Arab)]
[from antar- (< Sanskerta) + from daerah (< Arab)]
< Arab kata
{from:Arab ...
```

Regex utama untuk komponen kata: `from\s+(\S+)\s+\(<\s*(BAHASA)\s*\)`

### 2.2 Tiga Kategori Hasil

**A. Tunggal** — satu bahasa atau semua komponen dari bahasa yang sama:

- `bahasa` diisi dengan bahasa tersebut
- Jika ada beberapa komponen: `kata_asal = kata1 + kata2` (tanpa label bahasa, sudah di kolom `bahasa`)
- `aktif = true` jika `entri_id IS NOT NULL`

Contoh:
```
abiosfer   : sumber "[from a- (< Belanda) + from biosfér (< Belanda)]"
             → bahasa=Belanda, kata_asal="a- + biosfér", aktif=true
adibusana  : sumber "[from adi- (< Sanskerta) + from busana (< Sanskerta)]"
             → bahasa=Sanskerta, kata_asal="adi- + busana", aktif=true
```

**B. Compound sejati** — komponen dari bahasa berbeda:

- `bahasa` dibiarkan kosong (NULL) — kata tidak berasal dari satu bahasa
- `kata_asal = komponen1 (BahsA) + komponen2 (BahsB)` — etymology tampil di publik
- `aktif` tetap `false` (karena `bahasa` kosong, aturan aktivasi tidak terpenuhi)

Contoh:
```
adikodrati  : "[from adi- (< Sanskerta) + from kodrati (< Arab)]"
              → bahasa=NULL, kata_asal="adi- (Sanskerta) + kodrati (Arab)"
antardaerah : "[from antar- (< Sanskerta) + from daerah (< Arab)]"
              → bahasa=NULL, kata_asal="antar- (Sanskerta) + daerah (Arab)"
```

**C. Tidak ada informasi** — `sumber_definisi` kosong atau tidak mengandung pola bahasa:
- Tidak ada perubahan

### 2.3 Aturan Aktivasi

Sama dengan aktivasi awal — `aktif = true` hanya jika:
1. Tipe A (bahasa terisi)
2. `entri_id IS NOT NULL`
3. `meragukan = false`

---

## 3. Hasil

| Kategori | Jumlah | Tindakan |
|----------|--------|----------|
| Tunggal (bahasa diisi) | 460 | `bahasa` + `aktif=true` (453 punya entri_id) |
| Compound sejati | 99 | `kata_asal` diisi, `bahasa` tetap NULL |
| Tidak ada info | 193 | Tidak diubah |

**Kondisi setelah migrasi**:

```
aktif=TRUE,  meragukan=FALSE : 15.928   (naik +453 dari 15.475)
aktif=FALSE, meragukan=FALSE :    438   (turun dari 891)
aktif=FALSE, meragukan=TRUE  :    146
──────────────────────────────────────
Total                        : 16.512
```

---

## 4. Sisa Yang Belum Terisi

438 baris `aktif=false, meragukan=false` tersisa:
- 99 compound sejati (bahasa NULL by design — kata_asal sudah terisi)
- 193 tidak ada info di `sumber_definisi` (kemungkinan perlu lookup manual)
- 146 doubtful entry (sengaja disembunyikan)

Catatan: 193 entri tanpa info bahasa banyak yang merupakan kata serapan umum
(alumni, alpokat, artesis, bonsai, dll.) yang asal bahasanya diketahui umum
tapi tidak dicatat di sumber LWIM. Perlu pengisian manual atau lookup kamus lain.
