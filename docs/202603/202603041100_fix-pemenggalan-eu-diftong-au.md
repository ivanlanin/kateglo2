# Fix Pemenggalan: eu Non-Monoftong dan Pengecualian Diftong au

**Tanggal:** 2026-03-04
**Tabel:** `entri`
**Filter:** `jenis = 'dasar'`, `aktif = 1`

## Latar Belakang

Setelah fix vokal awal dan vokal akhir (lihat `202603041040_fix-pemenggalan-vokal-awal-akhir.md`), ditemukan dua masalah pemenggalan berkaitan dengan `eu` dan `au`:

1. **eu non-monoftong**: Sebelumnya `eu` diasumsikan selalu monoftong (tidak dipenggal). Ternyata, `eu` dari bahasa Yunani/Latin adalah dua vokal yang harus dipenggal: `e.u`. Hanya `eu` dari bahasa Sunda/Aceh yang merupakan monoftong ø.
2. **aula**: Diftong `au` dalam `aula` ternyata bukan diftong — `au` dipenggal menjadi `a.u.la`.

## Aturan yang Diterapkan

### eu: Dua Kategori

| Jenis eu | Contoh | Pemenggalan |
|---|---|---|
| Monoftong Sunda/Aceh (ø) | meunasah, seudati, baheula | tidak dipenggal |
| Dua vokal Yunani/Latin | euforia, leukemia, neuron | dipenggal: e.u |

**Pola fix**: Ganti semua `eu.` (eu diikuti titik) dengan `e.u.` secara global dalam kolom `pemenggalan`.

**Pengecualian eksplisit** (eu = monoftong, harus dikecualikan manual):

| Entri | Catatan |
|---|---|
| baheula | Bahasa Sunda |
| ceuki | Bahasa Sunda |
| meunasah | Bahasa Aceh |
| seudati | Bahasa Aceh |
| seulumat | Bahasa Aceh |
| Simeulue | Nama pulau Aceh |

**Pengecualian otomatis** (pola regex tidak cocok, tidak perlu dikecualikan secara eksplisit):

| Entri | Pemenggalan | Alasan Aman |
|---|---|---|
| leunca | leun.ca | eu diikuti 'n', bukan titik |
| milieu | mi.li.eu | eu di akhir string, tidak ada titik setelah |
| tefeu | te.feu | eu di akhir string |
| Aneuk Jamee | A.neuk Jame.e | eu diikuti 'k' |
| pasteur | pas.teur | eu di akhir string |

> **Catatan pasteurisasi**: `pasteurisasi` berubah karena memiliki `teu.` → `pas.te.u.ri.sa.si` (benar).

### au: Diftong dengan Satu Pengecualian

Setelah investigasi KBBI, hampir semua `au` adalah diftong (tidak dipenggal):

| Entri | Pemenggalan | Status |
|---|---|---|
| audio | au.di.o | diftong, tidak berubah |
| aura | au.ra | diftong, tidak berubah |
| aurora | au.ro.ra | diftong, tidak berubah |
| audit | au.dit | diftong, tidak berubah |
| **aula** | **a.u.la** | **bukan diftong, dipenggal** |

Tidak ada pola yang membedakan `aula` dari yang lain secara otomatis — perbaikan dilakukan secara manual (UPDATE langsung).

### ai, ei, oi

Dikonfirmasi berfungsi benar sebagai diftong — tidak ada perubahan.

## Jumlah Perubahan

| Kasus | Jumlah |
|---|---|
| eu non-monoftong | 94 |
| aula (au → a.u) | 1 |
| **Total** | **95** |

## Sampel Perubahan eu

| Entri | Sebelum | Sesudah |
|---|---|---|
| eufemisme | eu.fe.mis.me | e.u.fe.mis.me |
| euforia | eu.fo.ri.a | e.u.fo.ri.a |
| leukemia | leu.ke.mi.a | le.u.ke.mi.a |
| heuristis | heu.ris.tis | he.u.ris.tis |
| neuron | neu.ron | ne.u.ron |
| pneumonia | pneu.mo.ni.a | pne.u.mo.ni.a |
| pseudonim | pseu.do.nim | pse.u.do.nim |
| pasteurisasi | pas.teu.ri.sa.si | pas.te.u.ri.sa.si |
| aleuron | a.leu.ron | a.le.u.ron |
| pleura | pleu.ra | ple.u.ra |
| reumatik | reu.ma.tik | re.u.ma.tik |

## Referensi

- PUEBI: Aturan pemenggalan, Bagian V.E.1
- File referensi: `frontend/public/ejaan/penulisan-kata/pemenggalan-kata.md`
- Verifikasi KBBI daring: `https://kbbi.kemendikdasmen.go.id/entri/<indeks>`
- Entri yang dikonfirmasi: euforia, leukemia, heuristis, neuron, pneumonia, pseudonim, aleuron, audio, aurora, aura, aula
