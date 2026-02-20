-- Tambah flag penentu akses menu/area redaksi pada tabel peran

ALTER TABLE peran
ADD COLUMN IF NOT EXISTS akses_redaksi boolean NOT NULL DEFAULT false;

-- Pertahankan perilaku lama untuk peran redaksi yang sudah ada
UPDATE peran
SET akses_redaksi = true
WHERE kode IN ('admin', 'penyunting', 'editor');
