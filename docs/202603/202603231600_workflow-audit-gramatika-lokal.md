# Workflow Audit Gramatika Lokal

Tanggal dibuat: 2026-03-23

Dokumen ini menjelaskan alur audit Gramatika yang dikerjakan secara lokal di repo. Copilot bersifat opsional sebagai alat bantu baca, ringkas, atau edit, tetapi alur kerja utamanya tidak bergantung pada sesi CLI atau agent tertentu.

## Artefak Kerja

- Manifest machine-readable: `docs/202603/202603231545_manifest-audit-gramatika.json`
- Manifest ringkas: `docs/202603/202603231545_manifest-audit-gramatika.md`
- Checklist aktif: `docs/202603/202603231430_checklist-audit-gramatika-tbbbi.md`
- Sumber data tunggal navigasi: `frontend/src/constants/gramatikaData.js`
- Sumber primer audit: `_data/gramatika/bab-*/` berisi PDF bab dan JPG halaman

## Alur yang Disarankan

1. Segarkan manifest.
2. Ambil 1-5 item teratas dari antrian `Belum`.
3. Audit item satu per satu terhadap PDF bab dan JPG terkait.
4. Jika ada mismatch, perbaiki markdown item itu saja.
5. Perbarui checklist audit.
6. Segarkan manifest lagi agar antrian berikutnya akurat.

Catatan:

- Antrian manifest dipakai untuk item audit teks. Halaman landing bab yang hanya berisi daftar isi tidak perlu masuk antrian `Belum`.
- Jika suatu halaman memang hanya berfungsi sebagai daftar isi bab, cukup cek kesinkronannya dengan `gramatikaData.js` dan catat di checklist.

## Perintah Utama

Jalankan dari root repo:

```powershell
node backend/scripts/gramatika/generate-audit-manifest.js
```

## Copilot Opsional

Copilot dapat dipakai untuk mempercepat audit, tetapi bukan prasyarat. Jika ingin bekerja sepenuhnya manual, gunakan checklist, PDF bab, JPG halaman, dan manifest saja.

## Template Prompt Copilot

### 1. Audit tanpa edit

```text
Audit item gramatika berikut terhadap sumber TBBBI.

File markdown: frontend/public/gramatika/pendahuluan/ragam-menurut-jenis-pemakaian.md
Checklist: docs/202603/202603231430_checklist-audit-gramatika-tbbbi.md
Sumber PDF: _data/gramatika/bab-01/bab-01-pendahuluan.pdf
Sumber JPG: _data/gramatika/bab-01/

Tugas:
- cek kelengkapan teks
- cek artefak OCR yang belum dibersihkan
- cek apakah format daftar, italic, dan contoh masih setia ke sumber
- cek apakah markdown menambahkan huruf tebal atau penekanan visual baru yang tidak ada di sumber
- jangan edit dulu
- simpulkan status: OK / Perlu Revisi / Tunda
```

### 2. Audit dan langsung perbaiki jika ada temuan

```text
Audit item gramatika ini terhadap PDF dan JPG terkait, lalu langsung perbaiki jika ada temuan.

Batasan kerja:
- ubah hanya file markdown item yang relevan
- jangan ubah struktur bab lain
- setelah edit, perbarui checklist audit
- jika tidak ada temuan, cukup tandai OK di checklist
```

### 3. Kerja batch kecil

```text
Kerjakan 3 item teratas berstatus Belum dari manifest audit gramatika.

Untuk tiap item:
- baca markdown
- cocokkan dengan PDF bab dan JPG terkait
- perbaiki jika perlu
- perbarui checklist
- berhenti setelah 3 item selesai
```

## Aturan Operasional

- Jangan audit lebih dari 5 item per sesi jika itemnya panjang atau kaya tabel.
- Jika menemukan bab atau item yang butuh keputusan editorial, tandai `Tunda` dan tulis alasannya singkat.
- Jangan melakukan pemecahan struktur baru sebelum item di bab itu stabil.
- Untuk subbab yang punya turunan, pastikan halaman induk hanya memuat pengantar dan navigasi bila memang begitu struktur sumbernya.
- Jika halaman induk tidak memiliki pengantar asli yang perlu dipertahankan, tampilkan daftar subhalaman saja tanpa menambahkan pengantar baru.
- Di halaman induk konten, tampilkan hanya anak langsung. Jangan tampilkan cucu atau turunan yang lebih dalam pada daftar tautan halaman induk.
- Penamaan slug dan judul file turunan diputuskan per file berdasarkan cakupan isi aktual. Jangan memaksakan satu pola kaku jika hasilnya ambigu. Jika heading asal terlalu generik atau bentrok dengan bab lain, gunakan judul dan slug yang lebih spesifik secara semantis, misalnya `numeralia-tentu-dan-taktentu` alih-alih `numeralia` atau `penentu-numeralia`.
- Bedakan koreksi sumber dari styling editorial. Huruf tebal, italic, dan penekanan visual lain hanya dipertahankan jika memang berasal dari TBBBI atau dibutuhkan secara teknis.
- Untuk isi paragraf dan label intra-paragraf, anggap huruf tebal sebagai tidak sah secara default. Jika PDF hanya menampilkan roman biasa atau italic, hapus bold tambahan di markdown. Pengecualian utamanya adalah heading/subheading yang memang tampak menonjol sebagai struktur di sumber, bukan sebagai penekanan editorial baru.
- Setelah batch selesai, jalankan ulang generator manifest agar status dan antrian berikutnya sinkron.
- Setelah mengubah `frontend/src/constants/gramatikaData.js`, selalu jalankan `node frontend/scripts/sync-gramatika-toc.mjs` untuk memutakhirkan halaman daftar isi bab seperti `tata-bahasa.md` agar tidak drift terhadap struktur terbaru. Halaman daftar isi bab mengikuti struktur rekursif penuh sesuai skrip, berbeda dari halaman induk konten yang hanya menampilkan anak langsung.

## Target Selesai

Audit dianggap selesai jika:

- semua item di manifest berstatus `OK`, `Perlu Revisi`, atau `Tunda`
- tidak ada item `Belum`
- semua item `Perlu Revisi` sudah ditindaklanjuti sampai `OK` atau `Tunda`