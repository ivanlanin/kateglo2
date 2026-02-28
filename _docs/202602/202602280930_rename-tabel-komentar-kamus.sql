-- Rename tabel komentar_kamus menjadi komentar
ALTER TABLE komentar_kamus RENAME TO komentar;

-- Rename constraint
ALTER TABLE komentar RENAME CONSTRAINT komentar_kamus_indeks_pengguna_key TO komentar_indeks_pengguna_key;
ALTER TABLE komentar RENAME CONSTRAINT komentar_kamus_indeks_check TO komentar_indeks_check;
ALTER TABLE komentar RENAME CONSTRAINT komentar_kamus_komentar_check TO komentar_komentar_check;

-- Rename index
ALTER INDEX idx_komentar_kamus_indeks RENAME TO idx_komentar_indeks;
ALTER INDEX idx_komentar_kamus_indeks_aktif RENAME TO idx_komentar_indeks_aktif;
ALTER INDEX idx_komentar_kamus_pengguna_id RENAME TO idx_komentar_pengguna_id;
ALTER INDEX idx_komentar_kamus_updated_at RENAME TO idx_komentar_updated_at;

-- Rename trigger
ALTER TRIGGER trg_set_timestamp_fields__komentar_kamus ON komentar RENAME TO trg_set_timestamp_fields__komentar;
