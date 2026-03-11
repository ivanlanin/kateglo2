-- Draft migration komentar standar tabel dan kolom database.
-- Disiapkan untuk review, belum dijalankan.
-- Catatan:
-- 1. Fokus pada tabel stabil di schema public.
-- 2. Tabel turunan bulanan pencarian_YYYYMM tidak diberi komentar eksplisit
--    karena dibentuk dinamis oleh trigger dan dapat mengikuti pola tabel induk.

BEGIN;

COMMENT ON TABLE public.audit_makna IS 'Antrian audit untuk indeks yang jumlah maknanya perlu ditinjau atau diperbaiki';
COMMENT ON COLUMN public.audit_makna.indeks IS 'Indeks entri yang sedang diaudit dalam bentuk ternormalisasi';
COMMENT ON COLUMN public.audit_makna.jumlah IS 'Jumlah makna yang terdeteksi untuk indeks terkait';
COMMENT ON COLUMN public.audit_makna.entri_id IS 'Referensi opsional ke entri yang terkait dengan audit';
COMMENT ON COLUMN public.audit_makna.makna_id IS 'Referensi opsional ke makna yang terkait dengan audit';
COMMENT ON COLUMN public.audit_makna.status IS 'Status audit: tinjau, salah, tambah, atau nama';
COMMENT ON COLUMN public.audit_makna.catatan IS 'Catatan redaksional untuk hasil audit';

COMMENT ON TABLE public.bahasa IS 'Master bahasa yang dipakai pada etimologi dan glosarium';
COMMENT ON COLUMN public.bahasa.kode IS 'Kode internal bahasa yang unik';
COMMENT ON COLUMN public.bahasa.nama IS 'Nama bahasa untuk tampilan';
COMMENT ON COLUMN public.bahasa.iso2 IS 'Kode ISO 639-1 jika tersedia';
COMMENT ON COLUMN public.bahasa.iso3 IS 'Kode ISO 639-2 atau ISO 639-3 jika tersedia';
COMMENT ON COLUMN public.bahasa.aktif IS 'Flag apakah bahasa aktif dipakai di aplikasi';
COMMENT ON COLUMN public.bahasa.keterangan IS 'Keterangan tambahan tentang bahasa';

COMMENT ON TABLE public.bidang IS 'Master bidang keilmuan atau kategori topik';
COMMENT ON COLUMN public.bidang.kode IS 'Kode bidang yang unik';
COMMENT ON COLUMN public.bidang.nama IS 'Nama bidang untuk tampilan';
COMMENT ON COLUMN public.bidang.kamus IS 'Flag apakah bidang dapat dipakai pada data kamus';
COMMENT ON COLUMN public.bidang.keterangan IS 'Keterangan tambahan tentang bidang';
COMMENT ON COLUMN public.bidang.glosarium IS 'Flag apakah bidang dapat dipakai pada data glosarium';

COMMENT ON TABLE public.contoh IS 'Contoh pemakaian untuk satu makna';
COMMENT ON COLUMN public.contoh.legacy_cid IS 'ID contoh dari basis data lama jika berasal dari migrasi';
COMMENT ON COLUMN public.contoh.makna_id IS 'Referensi ke makna yang memiliki contoh ini';
COMMENT ON COLUMN public.contoh.urutan IS 'Urutan tampilan contoh dalam satu makna';
COMMENT ON COLUMN public.contoh.contoh IS 'Teks contoh pemakaian';
COMMENT ON COLUMN public.contoh.makna_contoh IS 'Penjelasan singkat atau arti dari contoh pemakaian';
COMMENT ON COLUMN public.contoh.aktif IS 'Flag apakah contoh ditampilkan sebagai data aktif';

COMMENT ON TABLE public.entri IS 'Entri utama kamus, termasuk kata dasar, turunan, gabungan, dan entri rujukan';
COMMENT ON COLUMN public.entri.legacy_eid IS 'ID entri dari basis data lama jika berasal dari migrasi';
COMMENT ON COLUMN public.entri.entri IS 'Bentuk entri sebagaimana ditampilkan ke pengguna';
COMMENT ON COLUMN public.entri.jenis IS 'Jenis entri untuk klasifikasi data dan tampilan';
COMMENT ON COLUMN public.entri.induk IS 'Referensi ke entri induk dalam hierarki turunan atau gabungan';
COMMENT ON COLUMN public.entri.pemenggalan IS 'Pemenggalan suku kata untuk entri';
COMMENT ON COLUMN public.entri.lafal IS 'Representasi lafal atau pelafalan entri';
COMMENT ON COLUMN public.entri.varian IS 'Varian ejaan atau bentuk lain dari entri';
COMMENT ON COLUMN public.entri.jenis_rujuk IS 'Penanda jenis rujukan, misalnya simbol atau label rujuk';
COMMENT ON COLUMN public.entri.lema_rujuk IS 'Teks lema rujukan sebagaimana tersimpan dari sumber lama atau impor';
COMMENT ON COLUMN public.entri.aktif IS 'Status aktif entri dengan konvensi 1 aktif dan 0 nonaktif';
COMMENT ON COLUMN public.entri.legacy_tabel IS 'Nama tabel sumber lama tempat entri berasal';
COMMENT ON COLUMN public.entri.legacy_tid IS 'ID baris sumber lama pada tabel asal';
COMMENT ON COLUMN public.entri.indeks IS 'Kunci indeks ternormalisasi untuk pencarian dan pengelompokan entri';
COMMENT ON COLUMN public.entri.homonim IS 'Nomor urut homonim dalam kelompok indeks yang sama';
COMMENT ON COLUMN public.entri.homograf IS 'Nomor pengelompokan homograf untuk membedakan entri dengan ejaan sama';
COMMENT ON COLUMN public.entri.entri_rujuk IS 'Referensi ke entri tujuan rujukan';
COMMENT ON COLUMN public.entri.sumber_id IS 'Referensi ke sumber utama entri';

COMMENT ON TABLE public.entri_tagar IS 'Tabel penghubung many-to-many antara entri dan tagar morfologis';
COMMENT ON COLUMN public.entri_tagar.entri_id IS 'Referensi ke entri yang diberi tagar';
COMMENT ON COLUMN public.entri_tagar.tagar_id IS 'Referensi ke tagar yang ditempelkan pada entri';

COMMENT ON TABLE public.etimologi IS 'Data etimologi untuk entri kamus, termasuk asal kata dan sitasi sumber';
COMMENT ON COLUMN public.etimologi.indeks IS 'Indeks entri yang dipakai untuk pencocokan etimologi';
COMMENT ON COLUMN public.etimologi.entri_id IS 'Referensi opsional ke entri yang dipasangi etimologi';
COMMENT ON COLUMN public.etimologi.homonim IS 'Nomor homonim untuk membantu pencocokan dengan entri';
COMMENT ON COLUMN public.etimologi.lafal IS 'Lafal yang terkait dengan data etimologi bila tersedia';
COMMENT ON COLUMN public.etimologi.sumber_sitasi IS 'Sitasi singkat sumber etimologi';
COMMENT ON COLUMN public.etimologi.sumber_isi IS 'Isi atau kutipan sumber etimologi';
COMMENT ON COLUMN public.etimologi.sumber_aksara IS 'Bentuk aksara asal dari bahasa sumber';
COMMENT ON COLUMN public.etimologi.sumber_lihat IS 'Rujukan lihat dari sumber etimologi';
COMMENT ON COLUMN public.etimologi.sumber_varian IS 'Varian bentuk yang disebut di sumber etimologi';
COMMENT ON COLUMN public.etimologi.sumber_definisi IS 'Definisi atau glosa dari sumber etimologi';
COMMENT ON COLUMN public.etimologi.lwim_ref IS 'Referensi atau penanda entri asal pada sumber LWIM';
COMMENT ON COLUMN public.etimologi.aktif IS 'Flag apakah data etimologi siap ditampilkan';
COMMENT ON COLUMN public.etimologi.kata_asal IS 'Bentuk kata asal yang direkonstruksi atau dikutip dari sumber';
COMMENT ON COLUMN public.etimologi.arti_asal IS 'Arti atau glosa dari kata asal';
COMMENT ON COLUMN public.etimologi.sumber_id IS 'Referensi ke sumber utama etimologi';
COMMENT ON COLUMN public.etimologi.meragukan IS 'Flag apakah etimologi masih meragukan dan perlu tinjauan';
COMMENT ON COLUMN public.etimologi.bahasa_id IS 'Referensi ke bahasa asal kata';

COMMENT ON TABLE public.etimologi_lwim IS 'Cache atau hasil ekstraksi mentah etimologi dari sumber LWIM';
COMMENT ON COLUMN public.etimologi_lwim.lwim_id IS 'ID entri pada sumber LWIM bila tersedia';
COMMENT ON COLUMN public.etimologi_lwim.indeks_query IS 'Indeks yang dipakai saat melakukan kueri ke LWIM';
COMMENT ON COLUMN public.etimologi_lwim.lwim_orth IS 'Bentuk ortografis entri pada LWIM';
COMMENT ON COLUMN public.etimologi_lwim.lwim_hom IS 'Nomor homonim pada sumber LWIM';
COMMENT ON COLUMN public.etimologi_lwim.etym_lang IS 'Bahasa asal menurut LWIM';
COMMENT ON COLUMN public.etimologi_lwim.etym_mentioned IS 'Bentuk kata asal yang disebut oleh LWIM';
COMMENT ON COLUMN public.etimologi_lwim.etym_cite IS 'Sitasi atau rujukan sumber dari LWIM';
COMMENT ON COLUMN public.etimologi_lwim.etym_aksara IS 'Bentuk aksara asal menurut LWIM';
COMMENT ON COLUMN public.etimologi_lwim.raw_def IS 'Definisi mentah yang diambil dari LWIM';
COMMENT ON COLUMN public.etimologi_lwim.xr_lihat IS 'Rujukan lihat mentah dari LWIM';
COMMENT ON COLUMN public.etimologi_lwim.xr_varian IS 'Rujukan varian mentah dari LWIM';
COMMENT ON COLUMN public.etimologi_lwim.fetched_at IS 'Waktu data LWIM diambil';

COMMENT ON TABLE public.glosarium IS 'Istilah glosarium bilingual yang menghubungkan istilah Indonesia dan istilah asing';
COMMENT ON COLUMN public.glosarium.indonesia IS 'Istilah atau padanan dalam bahasa Indonesia';
COMMENT ON COLUMN public.glosarium.asing IS 'Istilah padanan dalam bahasa asing';
COMMENT ON COLUMN public.glosarium.wpid IS 'ID halaman Wikipedia bahasa Indonesia jika tersedia';
COMMENT ON COLUMN public.glosarium.wpen IS 'ID halaman Wikipedia bahasa Inggris jika tersedia';
COMMENT ON COLUMN public.glosarium.updated IS 'Waktu pembaruan data asal glosarium';
COMMENT ON COLUMN public.glosarium.updater IS 'Identitas pembaru terakhir pada data asal';
COMMENT ON COLUMN public.glosarium.wikipedia_updated IS 'Waktu sinkronisasi metadata Wikipedia';
COMMENT ON COLUMN public.glosarium.aktif IS 'Flag apakah istilah glosarium aktif ditampilkan';
COMMENT ON COLUMN public.glosarium.bidang_id IS 'Referensi ke bidang keilmuan glosarium';
COMMENT ON COLUMN public.glosarium.sumber_id IS 'Referensi ke sumber glosarium';
COMMENT ON COLUMN public.glosarium.bahasa_id IS 'Referensi ke bahasa asing pada istilah glosarium';

COMMENT ON TABLE public.izin IS 'Master izin akses granular untuk fitur administrasi atau redaksi';
COMMENT ON COLUMN public.izin.kode IS 'Kode izin yang unik dan dipakai di aplikasi';
COMMENT ON COLUMN public.izin.nama IS 'Nama izin untuk tampilan admin';
COMMENT ON COLUMN public.izin.kelompok IS 'Kelompok modul atau area yang menaungi izin';

COMMENT ON TABLE public.komentar IS 'Komentar pengguna terhadap suatu indeks entri';
COMMENT ON COLUMN public.komentar.indeks IS 'Indeks entri yang dikomentari';
COMMENT ON COLUMN public.komentar.pengguna_id IS 'Referensi ke pengguna yang membuat komentar';
COMMENT ON COLUMN public.komentar.komentar IS 'Isi komentar pengguna';
COMMENT ON COLUMN public.komentar.aktif IS 'Flag moderasi apakah komentar ditampilkan';

COMMENT ON TABLE public.label IS 'Master label umum untuk ragam, kelas kata, bahasa, bidang, dan kategori sejenis';
COMMENT ON COLUMN public.label.kategori IS 'Kategori label, misalnya ragam, kelas_kata, bahasa, atau bidang';
COMMENT ON COLUMN public.label.kode IS 'Kode label yang unik dalam satu kategori';
COMMENT ON COLUMN public.label.nama IS 'Nama label untuk tampilan';
COMMENT ON COLUMN public.label.keterangan IS 'Keterangan tambahan tentang label';
COMMENT ON COLUMN public.label.urutan IS 'Urutan prioritas atau posisi label dalam daftar';
COMMENT ON COLUMN public.label.aktif IS 'Flag apakah label aktif dipakai';

COMMENT ON TABLE public.makna IS 'Definisi atau polisem untuk satu entri kamus';
COMMENT ON COLUMN public.makna.legacy_mid IS 'ID makna dari basis data lama jika berasal dari migrasi';
COMMENT ON COLUMN public.makna.entri_id IS 'Referensi ke entri yang memiliki makna ini';
COMMENT ON COLUMN public.makna.polisem IS 'Nomor urut makna dalam satu entri';
COMMENT ON COLUMN public.makna.makna IS 'Teks definisi utama';
COMMENT ON COLUMN public.makna.ragam IS 'Label ragam bahasa yang melekat pada makna';
COMMENT ON COLUMN public.makna.ragam_varian IS 'Kode varian ringkas untuk ragam tertentu';
COMMENT ON COLUMN public.makna.kelas_kata IS 'Label kelas kata untuk makna';
COMMENT ON COLUMN public.makna.bahasa IS 'Label bahasa yang terkait dengan makna';
COMMENT ON COLUMN public.makna.bidang IS 'Label bidang keilmuan yang terkait dengan makna';
COMMENT ON COLUMN public.makna.kiasan IS 'Flag apakah makna bersifat kiasan';
COMMENT ON COLUMN public.makna.penyingkatan IS 'Jenis penyingkatan, misalnya akronim, kependekan, atau singkatan';
COMMENT ON COLUMN public.makna.ilmiah IS 'Padanan atau nama ilmiah yang terkait dengan makna';
COMMENT ON COLUMN public.makna.kimia IS 'Padanan atau rumus kimia yang terkait dengan makna';
COMMENT ON COLUMN public.makna.aktif IS 'Flag apakah makna aktif ditampilkan';

COMMENT ON TABLE public.pencarian IS 'Tabel induk statistik pencarian harian lintas domain publik';
COMMENT ON COLUMN public.pencarian.tanggal IS 'Tanggal pencarian dalam zona waktu aplikasi';
COMMENT ON COLUMN public.pencarian.kata IS 'Kata atau frasa pencarian yang sudah dinormalisasi';
COMMENT ON COLUMN public.pencarian.jumlah IS 'Akumulasi jumlah pencarian untuk kombinasi tanggal, domain, dan kata';
COMMENT ON COLUMN public.pencarian.domain IS 'Kode domain pencarian: 1 kamus, 2 tesaurus, 3 glosarium, 4 makna, 5 rima';

COMMENT ON TABLE public.pencarian_hitam IS 'Daftar kata yang dikecualikan dari pencatatan statistik pencarian';
COMMENT ON COLUMN public.pencarian_hitam.kata IS 'Kata ternormalisasi huruf kecil yang diblok dari statistik';
COMMENT ON COLUMN public.pencarian_hitam.aktif IS 'Flag apakah aturan daftar hitam masih berlaku';
COMMENT ON COLUMN public.pencarian_hitam.catatan IS 'Catatan alasan pemblokiran kata dari statistik';

COMMENT ON TABLE public.pengguna IS 'Akun pengguna yang terautentikasi untuk fitur komunitas dan administrasi';
COMMENT ON COLUMN public.pengguna.google_id IS 'Identifier unik pengguna dari Google OAuth';
COMMENT ON COLUMN public.pengguna.surel IS 'Alamat surel pengguna';
COMMENT ON COLUMN public.pengguna.nama IS 'Nama tampilan pengguna';
COMMENT ON COLUMN public.pengguna.foto IS 'URL foto profil pengguna';
COMMENT ON COLUMN public.pengguna.peran_id IS 'Referensi ke peran pengguna';
COMMENT ON COLUMN public.pengguna.aktif IS 'Status aktif akun dengan konvensi 1 aktif dan 0 nonaktif';
COMMENT ON COLUMN public.pengguna.login_terakhir IS 'Waktu login terakhir pengguna';

COMMENT ON TABLE public.peran IS 'Master peran pengguna untuk sistem otorisasi';
COMMENT ON COLUMN public.peran.kode IS 'Kode peran yang unik';
COMMENT ON COLUMN public.peran.nama IS 'Nama peran untuk tampilan';
COMMENT ON COLUMN public.peran.keterangan IS 'Keterangan tambahan tentang peran';
COMMENT ON COLUMN public.peran.akses_redaksi IS 'Flag apakah peran dapat mengakses area redaksi atau admin';

COMMENT ON TABLE public.peran_izin IS 'Relasi many-to-many antara peran dan izin';
COMMENT ON COLUMN public.peran_izin.peran_id IS 'Referensi ke peran';
COMMENT ON COLUMN public.peran_izin.izin_id IS 'Referensi ke izin';

COMMENT ON TABLE public.sumber IS 'Master sumber data untuk kamus, glosarium, tesaurus, dan etimologi';
COMMENT ON COLUMN public.sumber.kode IS 'Kode sumber yang unik';
COMMENT ON COLUMN public.sumber.nama IS 'Nama sumber untuk tampilan';
COMMENT ON COLUMN public.sumber.glosarium IS 'Flag apakah sumber dipakai untuk glosarium';
COMMENT ON COLUMN public.sumber.keterangan IS 'Keterangan tambahan tentang sumber';
COMMENT ON COLUMN public.sumber.kamus IS 'Flag apakah sumber dipakai untuk kamus';
COMMENT ON COLUMN public.sumber.tesaurus IS 'Flag apakah sumber dipakai untuk tesaurus';
COMMENT ON COLUMN public.sumber.etimologi IS 'Flag apakah sumber dipakai untuk etimologi';

COMMENT ON TABLE public.susun_kata IS 'Bank soal harian untuk gim susun kata';
COMMENT ON COLUMN public.susun_kata.tanggal IS 'Tanggal soal harian berlaku';
COMMENT ON COLUMN public.susun_kata.panjang IS 'Panjang kata target dalam huruf';
COMMENT ON COLUMN public.susun_kata.kata IS 'Jawaban kata target huruf kecil';
COMMENT ON COLUMN public.susun_kata.keterangan IS 'Catatan internal untuk soal';

COMMENT ON TABLE public.susun_kata_bebas IS 'Riwayat permainan mode bebas per pengguna';
COMMENT ON COLUMN public.susun_kata_bebas.tanggal IS 'Tanggal permainan dicatat';
COMMENT ON COLUMN public.susun_kata_bebas.panjang IS 'Panjang kata target pada mode bebas';
COMMENT ON COLUMN public.susun_kata_bebas.kata IS 'Kata target huruf kecil';
COMMENT ON COLUMN public.susun_kata_bebas.pengguna_id IS 'Referensi ke pengguna yang bermain';
COMMENT ON COLUMN public.susun_kata_bebas.percobaan IS 'Jumlah percobaan yang dipakai sampai permainan selesai';
COMMENT ON COLUMN public.susun_kata_bebas.tebakan IS 'Rangkaian tebakan yang disimpan untuk kebutuhan replay atau audit';
COMMENT ON COLUMN public.susun_kata_bebas.detik IS 'Durasi bermain dalam detik';
COMMENT ON COLUMN public.susun_kata_bebas.menang IS 'Flag apakah permainan berakhir menang';

COMMENT ON TABLE public.susun_kata_skor IS 'Skor harian gim susun kata per pengguna';
COMMENT ON COLUMN public.susun_kata_skor.susun_kata_id IS 'Referensi ke soal harian';
COMMENT ON COLUMN public.susun_kata_skor.pengguna_id IS 'Referensi ke pengguna yang mengerjakan soal harian';
COMMENT ON COLUMN public.susun_kata_skor.percobaan IS 'Jumlah percobaan yang dipakai';
COMMENT ON COLUMN public.susun_kata_skor.detik IS 'Durasi penyelesaian dalam detik';
COMMENT ON COLUMN public.susun_kata_skor.menang IS 'Flag apakah pemain berhasil menyelesaikan soal';
COMMENT ON COLUMN public.susun_kata_skor.tebakan IS 'Rangkaian tebakan yang disimpan untuk audit permainan';
COMMENT ON COLUMN public.susun_kata_skor.selesai IS 'Flag apakah sesi harian sudah ditandai selesai';
COMMENT ON COLUMN public.susun_kata_skor.mulai_at IS 'Waktu mulai sesi permainan harian';

COMMENT ON TABLE public.tagar IS 'Master tagar morfologis yang dapat ditempelkan pada entri kamus';
COMMENT ON COLUMN public.tagar.kode IS 'Kode tagar unik yang aman dipakai sebagai identifier';
COMMENT ON COLUMN public.tagar.nama IS 'Nama tampilan tagar, misalnya dengan tanda hubung morfologis';
COMMENT ON COLUMN public.tagar.kategori IS 'Kategori tagar, misalnya prefiks, sufiks, infiks, konfiks, atau klitik';
COMMENT ON COLUMN public.tagar.deskripsi IS 'Deskripsi singkat fungsi atau penggunaan tagar';
COMMENT ON COLUMN public.tagar.urutan IS 'Urutan tampilan tagar dalam kategorinya';
COMMENT ON COLUMN public.tagar.aktif IS 'Flag apakah tagar aktif dipakai';

COMMENT ON TABLE public.tesaurus IS 'Data relasi sinonim dan antonim untuk satu indeks';
COMMENT ON COLUMN public.tesaurus.indeks IS 'Indeks entri yang menjadi kepala data tesaurus';
COMMENT ON COLUMN public.tesaurus.sinonim IS 'Daftar sinonim dalam format teks sesuai sumber';
COMMENT ON COLUMN public.tesaurus.antonim IS 'Daftar antonim dalam format teks sesuai sumber';
COMMENT ON COLUMN public.tesaurus.aktif IS 'Flag apakah data tesaurus aktif ditampilkan';
COMMENT ON COLUMN public.tesaurus.sumber_id IS 'Referensi ke sumber data tesaurus';

COMMIT;