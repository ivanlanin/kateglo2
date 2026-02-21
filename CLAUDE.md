@.github/copilot-instructions.md

## Aturan Wajib Setelah Edit Kode

Setiap kali selesai mengedit file di `backend/` atau `frontend/`, WAJIB jalankan lint dan test untuk package yang terdampak sebelum menganggap tugas selesai:

```bash
# Jika mengubah file backend
cd backend && npm run lint && npm run test

# Jika mengubah file frontend
cd frontend && npm run lint && npm run test
```

JANGAN lewati langkah ini meskipun perubahannya terasa kecil.
