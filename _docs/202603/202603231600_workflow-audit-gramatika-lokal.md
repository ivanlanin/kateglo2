# Workflow Audit Gramatika dengan Copilot

Tanggal dibuat: 2026-03-23

Dokumen ini menjelaskan cara memakai GitHub Copilot di VS Code untuk menyelesaikan audit Gramatika secara bertahap sampai tuntas.

## Artefak Kerja

- Manifest machine-readable: `_docs/202603/202603231545_manifest-audit-gramatika.json`
- Manifest ringkas: `_docs/202603/202603231545_manifest-audit-gramatika.md`
- Checklist aktif: `_docs/202603/202603231430_checklist-audit-gramatika-tbbbi.md`
- Sumber data tunggal navigasi: `frontend/src/constants/gramatikaData.js`
- Sumber primer audit: `_data/gramatika/bab-*/` berisi PDF bab dan JPG halaman

## Alur yang Disarankan

1. Segarkan manifest.
2. Ambil 1-5 item teratas dari antrian `Belum`.
3. Audit item satu per satu terhadap PDF bab dan JPG terkait.
4. Jika ada mismatch, perbaiki markdown item itu saja.
5. Perbarui checklist audit.
6. Segarkan manifest lagi agar antrian berikutnya akurat.

## Perintah Utama

Jalankan dari root repo:

```powershell
node backend/scripts/gramatika/generate-audit-manifest.js
```

## Template Prompt Copilot

### 1. Audit tanpa edit

```text
Audit item gramatika berikut terhadap sumber TBBBI.

File markdown: frontend/public/gramatika/pendahuluan/ragam-menurut-jenis-pemakaian.md
Checklist: _docs/202603/202603231430_checklist-audit-gramatika-tbbbi.md
Sumber PDF: _data/gramatika/bab-01/bab-01-pendahuluan.pdf
Sumber JPG: _data/gramatika/bab-01/

Tugas:
- cek kelengkapan teks
- cek artefak OCR yang belum dibersihkan
- cek apakah format daftar, italic, dan contoh masih setia ke sumber
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
- Setelah batch selesai, jalankan ulang generator manifest agar status dan antrian berikutnya sinkron.

## Target Selesai

Audit dianggap selesai jika:

- semua item di manifest berstatus `OK`, `Perlu Revisi`, atau `Tunda`
- tidak ada item `Belum`
- semua item `Perlu Revisi` sudah ditindaklanjuti sampai `OK` atau `Tunda`