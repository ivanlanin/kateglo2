# Rencana dan Temuan Etimologi LWIM (Sealang.net)

**Tanggal awal**: 2026-02-22  
**Pembaruan**: 2026-02-26  
**Sumber rujukan**: http://sealang.net/lwim/ (Loan Words in Indonesian and Malay)  
**Status**: Rencana implementasi + temuan pembacaan korpus

---

## Ringkasan Temuan

Berdasarkan pembacaan korpus LWIM yang telah dihimpun pada tabel `etimologi_lwim`, ditemukan pola berikut:

- Total entri: **16.512**
- Entri dengan `etym_lang` terisi: **6.066**
- Entri dengan `etym_lang` kosong: **10.446**
- Dari `etym_lang` kosong:
  - Memiliki `raw_def`: **9.100**
  - Memiliki `xr_lihat`: **1.351**
  - Memiliki `raw_def` + `xr_lihat`: **5**
  - Tidak memiliki keduanya: **0**

Kesimpulan utama: ketika `etym_lang` kosong, informasi asal-usul tetap tersedia melalui narasi `raw_def` atau rujukan `xr_lihat`.

---

## Struktur Data Etimologi yang Ditemukan

### 1) Bentuk terstruktur (tag `<etym>`)

```xml
<entry orthTarget="komputer" id="LWIM:10960" hom="1">
  <def>computer</def>
  <etym><lang>English</lang> <mentioned>computer</mentioned></etym>
```

### 2) Bentuk naratif di `<def>`

```xml
<entry orthTarget="véntilasi" id="LWIM:22824" hom="1">
  <def>ventilation  [&lt; Dutch <i>ventilatie</i> (&lt; French)]</def>
```

Contoh pola naratif yang sering muncul:

- `bank [< Dutch bank (< Italian)]`
- `algoritme [< Dutch algoritme (f Greek)]`
- `per [< Dutch or < English per (< Latin)]`

### 3) Bentuk rujukan silang

- `<xr type="see"><ref>fair</ref></xr>`
- `<xr type="var"><ref>pir</ref></xr>`

Pada bentuk ini, jejak etimologi bisa hadir sebagai rujukan, bukan uraian langsung.

---

## Bahasa yang Teridentifikasi

### Bahasa unik pada kolom `etym_lang`

Jumlah bahasa unik terstruktur: **35**.

Arabic, Dutch, English, Sanskrit, Amoy, Persian, Portuguese, Latin, Tamil, Hindi, Japanese, Chiangchiu, Italian, Greek, French, Cantonese, Foochow, Hakka, German, Javanese, Mandarin, Russian, Spanish, Thai, American-English, Ningpo, Tsoanchiu, Amoy?, Amoy/Ts, Arabic<i>ṣalaf</i>, Chinese.A, Hebrew, Teochew, Tong'an, Tong'an/A.

### Bahasa yang muncul pada narasi `raw_def`

Ekstraksi heuristik menghasilkan **74 token bahasa/kandidat bahasa**.

Dominan:

- Dutch (6.344)
- French (2.985)
- Greek (2.449)
- Latin (2.301)
- English (2.025)
- Sanskrit (533)
- Arabic (401)
- Italian (213)
- German (134)
- Spanish (83)
- Portuguese (52)

Catatan kualitas data:

- Ada token non-bahasa/ambigu dari narasi (`Loan`, `Old`, `American`, `Am`, `Ar`, `Fr`).
- Ada variasi ejaan/markup di kolom terstruktur (`Arabic<i>ṣalaf</i>`, `Chinese.A`, `Amoy/Ts`, dll.).

---

## Masalah Utama untuk Penautan ke Entri Kamus

### Perbedaan lafal dan diakritik

Sealang menggunakan diakritik di `orthTarget` untuk membedakan lafal:

| Sealang `orthTarget` | Lafal | DB `lafal` |
|---|---|---|
| `per` (tanpa aksen) | pepet / schwa | `pər` |
| `pér` (aksen akut) | taling / open-e | `per` |

Secara visual tampak terbalik: tanpa aksen = pepet, `é` = taling.

### Nomor homonim tidak selalu sejajar

Nomor `hom` di sealang tidak selalu sama dengan `homonim` di tabel `entri`.

Untuk kasus seperti “per”, jumlah dan urutan kelompok makna tidak bisa dipadankan otomatis hanya dari nomor.

### Duplikasi `hom` di sumber

Ada kasus `orthTarget` yang memiliki `hom` duplikat namun `lwim_id` berbeda (contoh: `para`, `kala`, `si`).

Konsekuensi: identitas paling stabil tetap `lwim_id`, bukan gabungan `orthTarget + hom`.

---

## Implikasi Pemodelan Data

1. `etym_lang` tidak bisa menjadi satu-satunya sumber bahasa asal.
2. `raw_def` dan `xr_lihat` harus diperlakukan sebagai sumber pendamping wajib.
3. Relasi `indeks_query = entri.indeks` adalah basis domain, tetapi tidak satu-ke-satu.
4. Tautan spesifik dilakukan lewat `entri_id` per baris etimologi.

### Pola kardinalitas

1. Satu `indeks_query` dapat memiliki **0..N** baris di `etimologi_lwim`.
2. Satu `entri.indeks` dapat memiliki **1..N** `entri.id`.
3. Karena itu, satu baris etimologi belum tentu langsung dapat dipadankan ke satu `entri.id` tanpa tahap analisis.

---

## Desain Tabel Final (berbasis `etimologi_lwim`)

```sql
alter table etimologi_lwim
  add column entri_id integer references entri(id) on delete set null;

create index idx_etimologi_lwim_entri_id on etimologi_lwim using btree (entri_id);
create index idx_etimologi_lwim_indeks_entri on etimologi_lwim using btree (indeks_query, entri_id);

-- Rekomendasi integritas:
-- 1) indeks_query diisi sesuai domain entri.indeks
-- 2) entri_id boleh null untuk kasus ambigu
-- 3) lwim_id dipakai sebagai idempotency key (disarankan UNIQUE jika belum)
```

### Aturan relasi

- `etimologi_lwim.indeks_query` harus berada pada domain nilai `entri.indeks`.
- Satu `indeks_query` bisa merujuk banyak `entri.id`.
- `entri_id` adalah tautan spesifik per baris LWIM, dan boleh `null`.
- Foreign key langsung dari `indeks_query` ke `entri.indeks` tidak dapat dipasang karena `entri.indeks` bukan kolom unik.

---

## Query Analisis Pola

```sql
-- 1) indeks yang punya banyak kandidat entri.id
select e.indeks, count(*) as jumlah_entri
from entri e
where e.jenis = 'dasar'
group by e.indeks
having count(*) > 1
order by jumlah_entri desc, e.indeks;

-- 2) kepadatan baris LWIM per indeks_query
select l.indeks_query, count(*) as jumlah_lwim
from etimologi_lwim l
group by l.indeks_query
order by jumlah_lwim desc, l.indeks_query;

-- 3) kandidat baris LWIM yang belum tertaut ke entri
select l.lwim_id, l.indeks_query, l.lwim_orth, l.lwim_hom
from etimologi_lwim l
where l.entri_id is null
order by l.indeks_query, l.lwim_orth, l.lwim_hom nulls last;

-- 4) validasi konsistensi entri_id vs indeks_query
select l.lwim_id, l.indeks_query, e.id as entri_id, e.indeks as indeks_entri
from etimologi_lwim l
join entri e on e.id = l.entri_id
where e.indeks <> l.indeks_query;
```

---

## Rencana Implementasi

### Fase 1 — Konsolidasi Data Etimologi

1. Ambil seluruh indeks unik dari `entri` (`jenis = 'dasar'`).
2. Lengkapi baris `etimologi_lwim` dengan `lwim_id`, `indeks_query`, dan informasi etimologi yang tersedia.
3. Pastikan update bersifat idempoten berdasarkan `lwim_id`.

### Fase 2 — Matching Heuristik ke `entri_id`

Kasus auto-link:

- `indeks_query` hanya punya 1 kandidat `entri.id` dan 1 entri etimologi relevan.
- Atau pola lafal/diakritik mendukung keputusan tunggal.

Kasus review manual (`entri_id = null`):

- Duplikasi `hom` dalam satu `orthTarget`.
- Banyak homonim pada `entri` tetapi `lafal` tidak cukup membedakan.
- Jumlah entri etimologi dan jumlah kandidat `entri.id` tidak seimbang.

### Fase 3 — Penyajian Frontend

- Tampilkan etimologi hanya untuk baris yang sudah memiliki `entri_id` valid.
- Untuk kasus ambigu, tahan di area redaksi sampai ditautkan.

---

## Catatan Penting

- LWIM berfokus pada kata serapan; tidak semua entri kamus akan memiliki etimologi LWIM.
- Bentuk naratif pada `raw_def` sangat dominan untuk kasus `etym_lang` kosong.
- Diperlukan kamus normalisasi bahasa (alias/ejaan) agar agregasi statistik lebih bersih.
