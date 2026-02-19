# Null-kan `homograf` jika tidak diperlukan (2026-02-19)

## Latar belakang

Pada migrasi awal homograf, semua baris `entri` diberi nilai `homograf` hasil pengelompokan lafal. Setelah kebijakan terbaru, `homograf` hanya ingin dipakai jika memang diperlukan untuk membedakan lebih dari satu kelompok lafal dalam `indeks` yang sama.

## Aturan

- Jika sebuah `indeks` punya **1 grup lafal** saja (termasuk grup kosong), maka `homograf` untuk semua baris pada indeks itu di-`NULL`-kan.
- Jika sebuah `indeks` punya **>1 grup lafal**, nilai `homograf` dipertahankan.

## Dampak

- Data menjadi lebih hemat/noise rendah: `homograf` hanya terisi pada kasus yang benar-benar homograf.
- Query aplikasi tetap aman karena sudah mengurutkan `homograf` dengan `NULLS LAST`.
