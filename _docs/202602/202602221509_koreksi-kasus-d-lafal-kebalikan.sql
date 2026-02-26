-- Koreksi Kasus D (2026-02-22):
-- Batch sebelumnya mengisi lafal kosong dengan nilai sibling yang sama.
-- Sesuai keputusan terbaru, Kasus D harus diisi dengan bentuk kebalikan:
-- e <-> ə
-- Contoh: apel -> apəl

UPDATE entri
SET lafal = translate(lafal, 'eəEƏ', 'əeƏE'),
    updated_at = NOW()
WHERE jenis = 'dasar'
  AND aktif = 1
  AND entri ~* 'e'
  AND updated_at >= TIMESTAMP '2026-02-22 08:06:15'
  AND updated_at < TIMESTAMP '2026-02-22 08:06:16';
