-- Tambah sumber TBBBI (Tata Bahasa Baku Bahasa Indonesia Edisi Keempat)
-- sebagai referensi bibliografi untuk konten halaman Gramatika.
--
-- Penyusun (dari halaman iii PDF):
--   Anton M. Moeliono, Hans Lapoliwa, Hasan Alwi,
--   Sri Satrya Tjatur Wisnu Sasangka, Sugiyono
--
-- Semua flag (glosarium, kamus, tesaurus, etimologi) dibiarkan false
-- karena TBBBI adalah sumber untuk konten gramatika, bukan untuk
-- keempat kategori tersebut.

INSERT INTO sumber (kode, nama, glosarium, kamus, tesaurus, etimologi, keterangan)
VALUES (
  'TBBBI',
  'Tata Bahasa Baku Bahasa Indonesia Edisi Keempat',
  false,
  false,
  false,
  false,
  'Moeliono, A.M., Lapoliwa, H., Alwi, H., Sasangka, S.S.T.W., & Sugiyono. (2017). *Tata Bahasa Baku Bahasa Indonesia Edisi Keempat*. Badan Pengembangan dan Pembinaan Bahasa, Kementerian Pendidikan dan Kebudayaan.'
);
