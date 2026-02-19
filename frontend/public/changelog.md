# Riwayat Perubahan

## 2026-02-19 Kamis

- Memisahkan 486 partikel menjadi 26 preposisi, 37 konjungsi, 66 interjeksi, 357 partikel
- Menambahkan info dibuat dan diubah di detail kamus
- Membuat `metaUtils` untuk menyeragamkan metadata halaman
- Menyambungkan detail kamus dengan halaman redaksi dan sebaliknya
- Memberikan tautan ke KBBI di detail kamus
- Menambahkan kolom sumber untuk entri kamus dengan standar KBBI IV
- Menambahkan jenis entri prakategorial dan menambahkannya ke kategori "Bentuk Terikat"
- Menambahkan filter jenis di redaksi kamus
- Menambahkan kolom entri.homograf, misalnya untuk "per" dan "seri"
- Menambahkan filter punya homograf dan punya homonim di redaksi kamus
- Merapikan tabel dan isi tesaurus
- Menyeragamkan tombol tambah, filter, dan paginasi di halaman redaksi
- Menerapkan autentikasi dengan banyak peran
- Menerapkan paginasi dengan kursor untuk meningkatkan kinerja

## 2026-02-18 Rabu

- Menyiapkan migrasi ke SSR untuk melayani HTML dinamis di URL asli
- Menambahkan penanda aktif di tabel label, makna, contoh, glosarium, dan tesaurus
- Menerapkan DRY di UI redaksi, router, dan model untuk mengurangi duplikasi kode
- Menerapkan SSR dengan satu server layanan web untuk lapis payun dan lapis pungkur

## 2026-02-17 Selasa

- Menambahkan fitur pengelolaan label untuk redaksi
- Mengubah entri jenis "berimbuhan" menjadi "turunan"
- Mengonsistenkan tata letak publik dan redaksi
- Mengubah tampilan detail kamus menjadi berdasarkan indeks
- Menghilangkan sufiks angka dari pemenggalan kata
- Mengubah autokomplet kamus untuk mencari berdasarkan indeks dan menampilkan detail jika dipilih spesifik
- Memberi tautan di lencana detail kamus untuk menampilkan daftar kata dalam kategori itu
- Membuat tampilan makna menjadi satu baris seperti kamus cetak
- Mengubah perilaku entri "varian" menjadi hanya ditampilkan di induknya
- Memisahkan jenis entri menjadi bentuk (dasar, turunan, gabungan) dan ekspresi (idiom, peribahasa)
- Memisahkan kelas kata menjadi kelas kata dan unsur terikat
- Memindahkan data makna.kelas_kata unsur terikat ke entri.jenis
- Menambahkan fitur komentar pengguna di halaman kamus
- Memasang _trigger_ untuk kolom `created_at` dan `updated_at` di semua tabel
- Menyinkronkan pelabelan entri dan makna
- Membuat pratayang logo, judul, dan deskripsi untuk media sosial
- Menerapkan _caching_ dengan Redis di Render

## 2026-02-16 Senin

- Menampilkan superskrip untuk judul entri
- Menampilkan kotak "Serupa" untuk menampung homonim dan homograf di detail kamus
- Mengoptimalkan pencarian glosarium dengan indeks teks lengkap
- Membersihkan basis data dari tabel yang tidak terpakai
- Memberikan saran lain ketika pencarian atau detail tidak menemukan hasil
- Membuat hierarki kata dan menyesuaikan data untuk memfasilitasi itu
- Menambahkan Google Analytics untuk melacak penggunaan situs
- Menambahkan batasan pencarian 60 kali/15 menit untuk mencegah penyalahgunaan
- Menerapkan autentikasi oAuth Google dan halaman kebijakan privasi
- Menambahkan menu atas di beranda
- Menyiapkan akses admin mengembangkan halaman dasar untuk admin
- Menyesuaikan nama tabel dan kolom dengan lema → entri

## 2026-02-15 Minggu

- Menyederhanakan tampilan beranda
- Memberikan pilihan pencarian kamus, tesaurus, dan glosarium di kotak cari
- Memberikan judul unik untuk tiap halaman
- Menampilkan kategori di halaman kamus
- Mengamankan API dengan CORS dan kunci bersama (opsional)
- Menambahkan autokomplet untuk pencarian
- Mengubah pencarian glosarium menjadi mencari istilah Indonesia dan asing
- Memfokuskan otomatis pada kotak cari saat membuka halaman
- Menyesuaikan laman detail kamus dan tesaurus
- Membersihkan lema, makna, dan contoh dari kurung siku dan HTML
- Mengembangkan singkatan di lema, makna, dan contoh, misalnya "yg" menjadi "yang"
- Menyederhanakan jenis infiks, konfiks, prefiks, dan sufiks
- Memigrasi label kiasan, kependekan, dan akronim

## 2026-02-14 Sabtu

- Menyiapkan server di Render.com
- Mengimpor basis data dari kateglo.lostfocus.org
- Mengatur tampilan standar yang kurang lebih sama dengan versi lama
- Menstandarkan _style_ dan menerapkan pilihan mode gelap/terang
- Menjalankan `lint` dan menyiapkan infrastruktur tes
- Menyederhanakan struktur tabel kamus menjadi lema, makna, contoh, dan label