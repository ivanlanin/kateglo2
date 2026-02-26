# Backfill entri_rujuk (FK) — 2026-02-25

## Ringkasan
- Total baris dengan `lema_rujuk` terisi sebelum backfill: **3473**
- Total baris `entri_rujuk` terisi sebelum backfill: **0**
- Total baris unresolved sebelum backfill: **3473**

## Langkah Backfill
- Exact entri: **3130** baris
- Tambahan (1): **262** baris
- Kapitalisasi paling cocok: **6** baris
- Variasi tanda kurung paling cocok: **33** baris

## Hasil Akhir
- Total `entri_rujuk` terisi: **3431**
- Total unresolved akhir (tetap `entri_rujuk = NULL`): **42**

## Aturan yang dipakai
- Exact: `lema_rujuk = entri.entri`
- Tambahan `(1)`: `lema_rujuk || ' (1)' = entri.entri`
- Kapitalisasi: `LOWER(lema_rujuk) = LOWER(entri.entri)`, lalu pilih kapitalisasi paling cocok
- Variasi kurung: cocokkan setelah menghapus suffix kurung, lalu pilih kandidat paling stabil

## Unresolved untuk Review Manual
- Baris di bawah ini dibiarkan `entri_rujuk = NULL` sementara.

| id | entri | lema_rujuk | saran |
|---:|---|---|---|
| 338 | adlib | ad libitum | Frasa multi-kata; cek apakah target ada sebagai entri frasa atau perlu normalisasi manual. |
| 1073 | algrafi | aluminiografi | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 5935 | cacengklok | cecengklok | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 7123 | cuci-maki | caci-maki | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 7937 | dena | dina | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 10108 | etikat | iktikat | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 10812 | fuyonghai | puyonghai | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 15544 | jinayat | ginayah | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 16874 | kasumat | kesumat | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 16880 | kaswi | kasui | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 19003 | klawu | kulawu | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 20392 | kukuk beluk | kokok beluk | Frasa multi-kata; cek apakah target ada sebagai entri frasa atau perlu normalisasi manual. |
| 23076 | majuj | yakjuj | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 23225 | malangkamo | malakama | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 23345 | mancur | pancur, memancur | Pisah multi-rujukan (koma/titik koma), pilih satu entri target utama. |
| 23428 | mangkih | cangkih | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 26832 | oreol | aureol | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 27203 | pakma (1) | patma | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 29158 | pidit | geridit | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 30063 | pringas-pringis | prangas | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 30998 | randih | rondah-randih | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 31993 | rial (1) | Lampiran Mata Uang | Rujukan metadata/lampiran, biarkan NULL atau buat tabel rujukan non-entri. |
| 32088 | ringgit (1) | Lampiran Mata Uang | Rujukan metadata/lampiran, biarkan NULL atau buat tabel rujukan non-entri. |
| 32245 | romo | rama | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 32294 | ronsen | rontgen | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 32364 | rubel | Lampiran Mata Uang | Rujukan metadata/lampiran, biarkan NULL atau buat tabel rujukan non-entri. |
| 32510 | rupee | Lampiran Mata Uang | Rujukan metadata/lampiran, biarkan NULL atau buat tabel rujukan non-entri. |
| 32511 | rupiah | Lampiran Mata Uang | Rujukan metadata/lampiran, biarkan NULL atau buat tabel rujukan non-entri. |
| 32891 | Samawa | Sumbawa | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 33547 | seharah | seharah | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 34003 | semalakama | malakama | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 34088 | sembirat | sebacat | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 34091 | sembrani | besi; kuda | Pisah multi-rujukan (koma/titik koma), pilih satu entri target utama. |
| 35008 | setormking | stormking | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 36028 | soyat | soyah | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 37022 | taawud | taawuz | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 37205 | takeh | tekar | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 38522 | teralis | tarali | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 39578 | Tukang Besi | Pulo | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 39860 | ubaya | hubaya | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 40779 | Wakatobi | Pulo | Kemungkinan varian/ejaan lama; verifikasi kandidat terdekat secara manual di redaksi. |
| 41095 | won | Lampiran Mata Uang | Rujukan metadata/lampiran, biarkan NULL atau buat tabel rujukan non-entri. |

## Catatan
- Kolom `lema_rujuk` **belum dihapus** sesuai keputusan saat ini.
- Logika relasi rujukan backend/admin sudah diarahkan ke `entri_rujuk` (FK ke `entri.id`).
