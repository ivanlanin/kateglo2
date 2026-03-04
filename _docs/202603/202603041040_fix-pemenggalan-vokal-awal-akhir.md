# Fix Pemenggalan: Vokal Awal dan Akhir

**Tanggal:** 2026-03-04
**Tabel:** `entri`
**Filter:** `jenis = 'dasar'`, `aktif = 1`

## Latar Belakang

Data pemenggalan lama melewatkan dua kasus pemenggalan menurut PUEBI:

1. **Vokal awal** — kata yang dimulai dengan pola V-C-V (vokal–satu konsonan–vokal) harus memisahkan vokal pertama sebagai suku tersendiri.
   Contoh: `aba` → `a.ba`, `abadi` → `a.ba.di`

2. **Vokal akhir** — dua vokal berurutan non-diftong di akhir suku terakhir harus dipisah.
   Contoh: `abu.lia` → `abu.li.a`, `ab.lep.sia` → `ab.lep.si.a`

## Aturan Dasar yang Diterapkan (PUEBI)

- **Aturan 1a**: Vokal berurutan di tengah kata dipenggal di antara keduanya.
- **Aturan 1d**: Satu konsonan di antara dua vokal dipenggal sebelum konsonan itu.
- **Aturan 1e**: Dua konsonan berurutan dipenggal di antara keduanya (tidak berubah).
- **Pengecualian diftong**: `ai`, `au`, `ei`, `oi` tidak dipenggal.
- **Pengecualian monoftong**: `eu` tidak dipenggal (aturan 1b).

## Logika Fix

### Vokal Awal

Kondisi: pemenggalan TIDAK dimulai dengan `[V].` (misal: pemenggalan `abadi` bukan `a.ba.di`).

Algoritma:
1. Ambil suku pertama (sebelum titik pertama).
2. Pisahkan vokal awal dari sisa suku pertama (`consonantPart`).
3. Jika `consonantPart` mengandung vokal (mis: `ba`, `ban`, `bang`) → tambahkan `[V].` di depan.
4. Jika `consonantPart` hanya konsonan (mis: `b` dari `ab.ak.si.al`) → gabungkan dengan suku berikutnya dulu, lalu tambahkan `[V].`.

Contoh:
- `aba` → `a.ba` (consonantPart `ba` ada vokal)
- `aban.do.ne.men` → `a.ban.do.ne.men` (consonantPart `ban` ada vokal)
- `ab.ak.si.al` → `a.bak.si.al` (consonantPart `b` tanpa vokal, gabung dengan `ak`)

Tidak berubah (V-CC-V, dua konsonan):
- `abdi` → `ab.di` (tetap, `bd` adalah dua konsonan)
- `abdomen` → `ab.do.men` (tetap)

### Vokal Akhir

Kondisi: dua karakter terakhir pemenggalan adalah pasangan vokal non-diftong, non-monoftong.

Algoritma: sisipkan titik sebelum karakter terakhir dari suku akhir.

Contoh:
- `abu.lia` → `abu.li.a` (akhiran `ia`)
- `ad.ver.bia` → `ad.ver.bi.a` (akhiran `ia`)
- `ada.gio` → `ada.gi.o` → `a.da.gi.o` (setelah vokal awal juga terfix)

Dikecualikan: `ai`, `au`, `ei`, `oi` (diftong), `eu` (monoftong).

### Kata Bertanda Hubung

Tiap bagian diproses secara mandiri, dipisah di `-`, lalu digabung kembali.

Contoh:
- `aba-aba` → `a.ba-a.ba`
- `sia-sia` → `si.a-si.a`

## Jumlah Perubahan

| Kasus | Jumlah |
|---|---|
| Vokal awal (non-hubung) | 2.790 |
| Vokal awal (bertanda hubung) | 126 |
| Vokal akhir (non-hubung) | 1.072 |
| Vokal akhir (bertanda hubung) | 6 |
| **Total** | **3.994** |

## Verifikasi Sampel

| Entri | Sebelum | Sesudah |
|---|---|---|
| aba | aba | a.ba |
| abadi | aba.di | a.ba.di |
| abaksial | ab.ak.si.al | a.bak.si.al |
| abdi | ab.di | ab.di (tidak berubah) |
| adagio | ada.gio | a.da.gi.o |
| abulia | abu.lia | a.bu.li.a |
| ablepsia | ab.lep.sia | ab.lep.si.a |
| milieu | mi.li.eu | mi.li.eu (tidak berubah, eu = monoftong) |
| aba-aba | aba-aba | a.ba-a.ba |
| sia-sia | si.a-sia | si.a-si.a |

## Referensi

- PUEBI: Aturan pemenggalan, Bagian V.E.1
- File referensi: `frontend/public/ejaan/penulisan-kata/pemenggalan-kata.md`
- Konfirmasi via KBBI daring: `https://kbbi.kemendikdasmen.go.id/entri/<indeks>`
