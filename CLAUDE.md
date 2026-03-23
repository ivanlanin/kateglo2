@.github/copilot-instructions.md

## Aturan Wajib Setelah Edit Kode

Setiap kali selesai mengedit file kode di `backend/` atau `frontend/`, WAJIB jalankan lint dan test untuk area yang terdampak sebelum menganggap tugas selesai.
Pengecualian: perubahan yang hanya menyentuh markdown konten publik di `frontend/public/` tidak wajib menjalankan lint/test selama tidak mengubah renderer/parser/SSR/skrip yang memproses konten tersebut.
Gunakan urutan berikut:

1. **Validasi terarah dulu** (default)
2. **Full suite package** hanya bila perubahan luas/berisiko tinggi atau diminta user

```bash
# Jika mengubah file backend (terarah)
cd backend && npm run lint && npx jest --findRelatedTests <file-yang-diubah>

# Jika mengubah file frontend (terarah)
cd frontend && npm run lint && npx vitest related --run <file-yang-diubah>

# Jika perlu regresi menyeluruh
cd backend && npm run test
cd frontend && npm run test
```

JANGAN lewati validasi, meskipun perubahannya kecil.
