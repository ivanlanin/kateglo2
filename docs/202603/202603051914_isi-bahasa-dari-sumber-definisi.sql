-- ============================================================
-- Isi bahasa dan kata_asal etimologi dari sumber_definisi
-- Dibuat  : 2026-03-05 19:14
-- Tunggal : 460 baris → bahasa diisi, 453 diaktifkan
-- Compound: 99 baris → kata_asal diisi, bahasa tetap kosong
-- Tidak   : 193 baris  → tidak diubah
-- ============================================================

BEGIN;

-- -------------------------------------------------------
-- A. Bahasa tunggal / semua komponen satu bahasa
--    aktif=true jika entri_id ada dan bukan meragukan
--    kata_asal diisi jika compound (kata1 + kata2)
-- -------------------------------------------------------
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'a- + biosfér', aktif = true, updated_at = NOW() WHERE id = 30; -- abiosfer
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 95; -- adakala
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 125; -- adibangkit
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 126; -- adibintang
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + busana', aktif = true, updated_at = NOW() WHERE id = 127; -- adibusana
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + cita', aktif = true, updated_at = NOW() WHERE id = 128; -- adicita
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + daya', aktif = true, updated_at = NOW() WHERE id = 129; -- adidaya
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + karya', aktif = true, updated_at = NOW() WHERE id = 132; -- adikarya
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + kuasa', aktif = true, updated_at = NOW() WHERE id = 138; -- adikuasa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + marga', aktif = true, updated_at = NOW() WHERE id = 141; -- adimarga
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 144; -- adipenghantar
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + pura', aktif = true, updated_at = NOW() WHERE id = 147; -- adipura
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + ratna', aktif = true, updated_at = NOW() WHERE id = 149; -- adiratna
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + siswa', aktif = true, updated_at = NOW() WHERE id = 152; -- adisiswa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 154; -- aditokoh
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + warna', aktif = true, updated_at = NOW() WHERE id = 156; -- adiwarna
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'adi- + widya', aktif = true, updated_at = NOW() WHERE id = 157; -- adiwidia
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 246; -- agamis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'agro- + ékonomi', aktif = true, updated_at = NOW() WHERE id = 286; -- agroekonomi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'agro- + ékosistem', aktif = true, updated_at = NOW() WHERE id = 287; -- agroekosistem
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'agro- + industri', aktif = true, updated_at = NOW() WHERE id = 290; -- agroindustri
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 423; -- aktinokimia
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 456; -- akupunkturis
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 595; -- aloleks
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'a- + nasional', aktif = true, updated_at = NOW() WHERE id = 787; -- anasional
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'angkasa + -wan', aktif = true, updated_at = NOW() WHERE id = 839; -- angkasawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'angkasa + -wati', aktif = true, updated_at = NOW() WHERE id = 840; -- angkasawati
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 867; -- anjangkarya
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'antar- + bangsa', aktif = true, updated_at = NOW() WHERE id = 896; -- antarbangsa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 897; -- antarbenua
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 904; -- antarkelompok
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 905; -- antarlingkungan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'antar- + muka', aktif = true, updated_at = NOW() WHERE id = 908; -- antarmuka
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'antar- + negara', aktif = true, updated_at = NOW() WHERE id = 909; -- antarnegara
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 911; -- antarpribadi
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 912; -- antarpulau
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 914; -- antarruang
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 916; -- antarsuku
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 919; -- antawacana
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'anté- + diluvium', aktif = true, updated_at = NOW() WHERE id = 920; -- antediluvium
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 934; -- antianemia
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 937; -- antibeku
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'anti- + énzim', aktif = true, updated_at = NOW() WHERE id = 944; -- antienzim
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'anti- + gravitasi', aktif = true, updated_at = NOW() WHERE id = 947; -- antigravitasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'anti- + matéri', aktif = true, updated_at = NOW() WHERE id = 956; -- antimateri
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 959; -- antimuntah
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 965; -- antipenawar
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1019; -- apabila
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1021; -- apakala
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 1100; -- aras
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 1180; -- asetimeter
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 1257; -- vokalis
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 1346; -- asparaga
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'a- + susila', aktif = true, updated_at = NOW() WHERE id = 1390; -- asusila
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'viriel + -isme', aktif = true, updated_at = NOW() WHERE id = 1443; -- virilisme
UPDATE etimologi SET bahasa = 'Latin', aktif = true, updated_at = NOW() WHERE id = 1504; -- avertebrata
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1515; -- awaair
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1516; -- awaarang
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1517; -- awabau
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1518; -- awabulu
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1519; -- awabusa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1520; -- awadara
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1521; -- awahama
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'awa- + nama', aktif = true, updated_at = NOW() WHERE id = 1525; -- awanama
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 1526; -- awaracun
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'awa- + warna', aktif = true, updated_at = NOW() WHERE id = 1528; -- awawarna
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 1611; -- Baitulharam
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 1615; -- Baitulmukadas
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'bangsa + -wan', aktif = true, updated_at = NOW() WHERE id = 1717; -- bangsawan
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 1753; -- bari
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'bea + siswa', aktif = true, updated_at = NOW() WHERE id = 1850; -- beasiswa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'bendahara + -wan', aktif = true, updated_at = NOW() WHERE id = 1917; -- bendaharawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'berita + -wan', aktif = true, updated_at = NOW() WHERE id = 1959; -- beritawan
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'beton + -isasi', aktif = true, updated_at = NOW() WHERE id = 1994; -- betonisasi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'biara + -wan', aktif = true, updated_at = NOW() WHERE id = 2000; -- biarawan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 2001; -- biarawati
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 2043; -- bilamana
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 2065; -- binaraga
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 2087; -- biokimia
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 2105; -- biosekuen
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'bi- + poliséntrisme', aktif = true, updated_at = NOW() WHERE id = 2119; -- bipolisentrisme
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'bi- + vérbal', aktif = true, updated_at = NOW() WHERE id = 2162; -- biverbal
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'candra + sengkala', aktif = true, updated_at = NOW() WHERE id = 2433; -- candrasengkala
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 2457; -- caturlarik
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 2458; -- caturtunggal
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'catur + warga', aktif = true, updated_at = NOW() WHERE id = 2459; -- caturwarga
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'zoo- + sémiotika', aktif = true, updated_at = NOW() WHERE id = 2492; -- zoosemiotika
UPDATE etimologi SET bahasa = 'Arab', kata_asal = 'zarah + -iah', aktif = true, updated_at = NOW() WHERE id = 2567; -- zariah
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wisuda + -wati', aktif = true, updated_at = NOW() WHERE id = 2702; -- wisudawati
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wisuda + -wan', aktif = true, updated_at = NOW() WHERE id = 2703; -- wisudawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wisata + -wan', aktif = true, updated_at = NOW() WHERE id = 2707; -- wisatawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wira- + usaha', aktif = true, updated_at = NOW() WHERE id = 2710; -- wirausaha
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wira + swasta', aktif = true, updated_at = NOW() WHERE id = 2711; -- wiraswasta
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wira- + suara', aktif = true, updated_at = NOW() WHERE id = 2712; -- wirasuara
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wira- + karya', aktif = true, updated_at = NOW() WHERE id = 2716; -- wirakarya
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'wijaya + kusuma', aktif = true, updated_at = NOW() WHERE id = 2730; -- wijayakusuma
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'widya + wisata', aktif = true, updated_at = NOW() WHERE id = 2734; -- widyawisata
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'warta + -wati', aktif = true, updated_at = NOW() WHERE id = 2784; -- wartawati
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'warta + -wan', aktif = true, updated_at = NOW() WHERE id = 2785; -- wartawan
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 2881; -- virilis
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'upa- + duta', aktif = true, updated_at = NOW() WHERE id = 3026; -- upaduta
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 3074; -- ultraungu
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 3080; -- ultralembayung
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tuna- + wisma', aktif = true, updated_at = NOW() WHERE id = 3131; -- tunawisma
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tuna- + susila', aktif = true, updated_at = NOW() WHERE id = 3133; -- tunasusila
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3134; -- tunarungu
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tuna- + karya', aktif = true, updated_at = NOW() WHERE id = 3136; -- tunakarya
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tuna- + grahita', aktif = true, updated_at = NOW() WHERE id = 3138; -- tunagrahita
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3139; -- tunaganda
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tuna- + busana', aktif = true, updated_at = NOW() WHERE id = 3141; -- tunabusana
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tuna- + aksara', aktif = true, updated_at = NOW() WHERE id = 3142; -- tunaaksara
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3203; -- triwulan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tri- + windu', aktif = true, updated_at = NOW() WHERE id = 3204; -- triwindu
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3213; -- tritunggal
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tri- + prasetia', aktif = true, updated_at = NOW() WHERE id = 3219; -- triprasetia
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3232; -- trilomba
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3236; -- trilipat
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tri- + darma', aktif = true, updated_at = NOW() WHERE id = 3251; -- tridarma
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tri- + buta', aktif = true, updated_at = NOW() WHERE id = 3252; -- tributa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 3441; -- titinada
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'térmo- + listrik', aktif = true, updated_at = NOW() WHERE id = 3548; -- termolistrik
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'térmo- + higrograf', aktif = true, updated_at = NOW() WHERE id = 3553; -- termohigrograf
UPDATE etimologi SET bahasa = 'Arab', aktif = false, updated_at = NOW() WHERE id = 3580; -- terhal
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'téknokrat + -isme', aktif = true, updated_at = NOW() WHERE id = 3722; -- teknokratisme
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 3746; -- teatris
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tata + usaha', aktif = true, updated_at = NOW() WHERE id = 3781; -- tata usaha
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tata + praja', aktif = true, updated_at = NOW() WHERE id = 3782; -- tata praja
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tata + negara', aktif = true, updated_at = NOW() WHERE id = 3783; -- tata negara
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tata + guna', aktif = true, updated_at = NOW() WHERE id = 3785; -- tata guna
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'tata + bahasa', aktif = true, updated_at = NOW() WHERE id = 3786; -- tata bahasa
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 3865; -- tanwujud
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 4111; -- syarab
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 4132; -- syajar khuldi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + usaha', aktif = true, updated_at = NOW() WHERE id = 4166; -- swausaha
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + sembada', aktif = true, updated_at = NOW() WHERE id = 4171; -- swasembada
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + praja', aktif = true, updated_at = NOW() WHERE id = 4174; -- swapraja
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + nama', aktif = true, updated_at = NOW() WHERE id = 4175; -- swanama
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 4176; -- swalayan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 4178; -- swakendali
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 4179; -- swakelola
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + karya', aktif = true, updated_at = NOW() WHERE id = 4180; -- swakarya
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 4182; -- swakaji
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 4184; -- swaimbas
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + harga', aktif = true, updated_at = NOW() WHERE id = 4185; -- swaharga
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + daya', aktif = true, updated_at = NOW() WHERE id = 4189; -- swadaya
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + darma', aktif = true, updated_at = NOW() WHERE id = 4190; -- swadarma
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'swa- + dana', aktif = true, updated_at = NOW() WHERE id = 4191; -- swadana
UPDATE etimologi SET bahasa = 'Arab', kata_asal = 'surah + -i', aktif = true, updated_at = NOW() WHERE id = 4221; -- surahi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'supra- + molekulér', aktif = true, updated_at = NOW() WHERE id = 4228; -- supramolekuler
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 4230; -- supraalami
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'super- + inféksi', aktif = true, updated_at = NOW() WHERE id = 4256; -- superinfeksi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 4260; -- supercepat
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'super- + blok', aktif = true, updated_at = NOW() WHERE id = 4261; -- superblok
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 4304; -- sukuisme
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sub- + organisasi', aktif = true, updated_at = NOW() WHERE id = 4365; -- suborganisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sub- + létal', aktif = true, updated_at = NOW() WHERE id = 4373; -- subletal
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sub- + léma', aktif = true, updated_at = NOW() WHERE id = 4374; -- sublema
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sub- + irigasi', aktif = true, updated_at = NOW() WHERE id = 4382; -- subirigasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sub- + géneralisasi', aktif = true, updated_at = NOW() WHERE id = 4385; -- subgeneralisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sub- + diréktorat', aktif = true, updated_at = NOW() WHERE id = 4390; -- subdirektorat
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 4391; -- subbagian
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 4392; -- subbab
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 4483; -- stereokimia
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 4557; -- sripanggung
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'spiral + -isasi', aktif = true, updated_at = NOW() WHERE id = 4586; -- spiralisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sosio- + nasional', aktif = true, updated_at = NOW() WHERE id = 4693; -- sosionasional
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sosio- + démokrasi', aktif = true, updated_at = NOW() WHERE id = 4702; -- sosiodemokrasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sistém + -isasi', aktif = true, updated_at = NOW() WHERE id = 4886; -- sistemisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 4887; -- sistemis
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'se- + tala', aktif = false, updated_at = NOW() WHERE id = 5196; -- setala
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'seri + danta', aktif = true, updated_at = NOW() WHERE id = 5243; -- seridanta
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'serba + aneka', aktif = true, updated_at = NOW() WHERE id = 5261; -- serbaneka
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'se- + rasa', aktif = false, updated_at = NOW() WHERE id = 5268; -- serasa
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 5317; -- sepakat
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 5343; -- senti
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 5367; -- seniwati
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sémi- + vokal', aktif = true, updated_at = NOW() WHERE id = 5411; -- semivokal
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'sémi- + idiom', aktif = true, updated_at = NOW() WHERE id = 5422; -- semiidiom
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 5507; -- sekularis
UPDATE etimologi SET bahasa = 'Arab', aktif = false, updated_at = NOW() WHERE id = 5569; -- sekadar
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'sedia + kala', aktif = true, updated_at = NOW() WHERE id = 5600; -- sediakala
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'sapta- + marga', aktif = true, updated_at = NOW() WHERE id = 5701; -- saptamarga
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'santri + -wati', aktif = true, updated_at = NOW() WHERE id = 5715; -- santriwati
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 5814; -- salasal
UPDATE etimologi SET bahasa = 'Arab', kata_asal = 'sadar + -iah', aktif = true, updated_at = NOW() WHERE id = 5938; -- sadariah
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 6093; -- rohaniwan
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 6172; -- revisibilitas
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ré- + tradisional + -isasi', aktif = true, updated_at = NOW() WHERE id = 6194; -- retradisionalisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ré- + struktur + -isasi', aktif = true, updated_at = NOW() WHERE id = 6212; -- restrukturisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 6325; -- remiling
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'rél + ban', aktif = true, updated_at = NOW() WHERE id = 6345; -- relban
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ré- + invéstasi', aktif = true, updated_at = NOW() WHERE id = 6395; -- reinvestasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ré- + indoktrinasi', aktif = true, updated_at = NOW() WHERE id = 6399; -- reindoktrinasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ré- + idéolog + -isasi', aktif = true, updated_at = NOW() WHERE id = 6401; -- reideologisasi
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6563; -- rakanita
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pustaka + -wan', aktif = true, updated_at = NOW() WHERE id = 6667; -- pustakawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'purna + wira + -wan', aktif = true, updated_at = NOW() WHERE id = 6679; -- purnawirawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'purna + sarjana', aktif = true, updated_at = NOW() WHERE id = 6681; -- purnasarjana
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'purna + karya + -wan', aktif = true, updated_at = NOW() WHERE id = 6683; -- purnakaryawan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6684; -- purnajual
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'purna + bakti', aktif = true, updated_at = NOW() WHERE id = 6685; -- purnabakti
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'purba + sangka', aktif = true, updated_at = NOW() WHERE id = 6697; -- purbasangka
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'pro- + léksém', aktif = true, updated_at = NOW() WHERE id = 6882; -- proleksem
UPDATE etimologi SET bahasa = 'Inggris', kata_asal = 'pré- + asétabulum', aktif = true, updated_at = NOW() WHERE id = 6934; -- preasetabulum
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'pré- + anténa', aktif = true, updated_at = NOW() WHERE id = 6935; -- preantena
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + yuwana', aktif = true, updated_at = NOW() WHERE id = 6938; -- prayuwana
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6940; -- pratinjau
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 6945; -- prasmanan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + setia', aktif = true, updated_at = NOW() WHERE id = 6946; -- prasetia
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + sejahtera', aktif = true, updated_at = NOW() WHERE id = 6951; -- prasejahtera
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6953; -- prasarana
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6954; -- prasaran
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + sangka', aktif = true, updated_at = NOW() WHERE id = 6955; -- prasangka
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + rasa', aktif = true, updated_at = NOW() WHERE id = 6957; -- prarasa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + pustaka', aktif = true, updated_at = NOW() WHERE id = 6958; -- prapustaka
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6963; -- praperadilan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6964; -- prapendapat
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6967; -- pramuwisma
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6968; -- pramuwisata
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 6970; -- pramubakti
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7039; -- prakilang
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + kata', aktif = true, updated_at = NOW() WHERE id = 7040; -- prakata
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + karsa', aktif = true, updated_at = NOW() WHERE id = 7041; -- prakarsa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + kala', aktif = true, updated_at = NOW() WHERE id = 7042; -- prakala
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + jaksa', aktif = true, updated_at = NOW() WHERE id = 7043; -- prajaksa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7044; -- prajabatan
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 7052; -- pragmatika
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7054; -- praduga
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pra- + dana', aktif = true, updated_at = NOW() WHERE id = 7058; -- pradana
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7060; -- praanggapan
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'poli- + kultur', aktif = true, updated_at = NOW() WHERE id = 7187; -- polikultur
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7332; -- pirsawan
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 7383; -- pianika
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 7409; -- peti es
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = false, updated_at = NOW() WHERE id = 7430; -- pesanggrahan
UPDATE etimologi SET bahasa = 'Arab', aktif = false, updated_at = NOW() WHERE id = 7582; -- perawi
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 7641; -- pelotaris
UPDATE etimologi SET bahasa = 'Belanda', aktif = false, updated_at = NOW() WHERE id = 7662; -- pelan
UPDATE etimologi SET bahasa = 'Persia', aktif = true, updated_at = NOW() WHERE id = 7675; -- pekojan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pasca- + yuwana', aktif = true, updated_at = NOW() WHERE id = 7782; -- pascayuwana
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pasca- + usaha', aktif = true, updated_at = NOW() WHERE id = 7783; -- pascausaha
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'pasca- + sarjana', aktif = true, updated_at = NOW() WHERE id = 7784; -- pascasarjana
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7785; -- pascaperang
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7786; -- pascapanen
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7790; -- pascajual
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7792; -- pascabedah
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'para- + linguistis', aktif = true, updated_at = NOW() WHERE id = 7881; -- paralinguistis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'para- + linguistik', aktif = true, updated_at = NOW() WHERE id = 7882; -- paralinguistik
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'pan- + kronis', aktif = true, updated_at = NOW() WHERE id = 7940; -- pankronis
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'panca- + usaha', aktif = true, updated_at = NOW() WHERE id = 7968; -- pancausaha
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'panca- + suara', aktif = true, updated_at = NOW() WHERE id = 7969; -- pancasuara
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7971; -- Pancasilais
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7974; -- pancaroba
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'panca- + marga', aktif = true, updated_at = NOW() WHERE id = 7978; -- pancamarga
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7979; -- pancalomba
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7981; -- pancalima
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7982; -- pancakembar
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'panca- + darma', aktif = true, updated_at = NOW() WHERE id = 7984; -- pancadarma
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'panca- + cita', aktif = true, updated_at = NOW() WHERE id = 7985; -- pancacita
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 7987; -- pancabicara
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 8020; -- palawija
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 8074; -- padahal
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8226; -- oratoris
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8236; -- optoelektronika
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 8344; -- olahragawan
UPDATE etimologi SET bahasa = 'Prancis', aktif = true, updated_at = NOW() WHERE id = 8396; -- obyektivitas
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8435; -- nyentrik
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 8443; -- nusantara
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + tradisional', aktif = true, updated_at = NOW() WHERE id = 8503; -- nontradisional
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + téknis', aktif = true, updated_at = NOW() WHERE id = 8504; -- nonteknis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + standar', aktif = true, updated_at = NOW() WHERE id = 8506; -- nonstandar
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + silabis', aktif = true, updated_at = NOW() WHERE id = 8507; -- nonsilabis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + prédikatif', aktif = true, updated_at = NOW() WHERE id = 8513; -- nonpredikatif
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + politik', aktif = true, updated_at = NOW() WHERE id = 8514; -- nonpolitik
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8515; -- nonpemerintah
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + militér', aktif = true, updated_at = NOW() WHERE id = 8517; -- nonmiliter
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + médis', aktif = true, updated_at = NOW() WHERE id = 8519; -- nonmedis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + kooperasi', aktif = true, updated_at = NOW() WHERE id = 8521; -- nonkooperasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + industri', aktif = true, updated_at = NOW() WHERE id = 8527; -- nonindustri
UPDATE etimologi SET bahasa = 'Portugis', aktif = true, updated_at = NOW() WHERE id = 8529; -- noni
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + historis', aktif = true, updated_at = NOW() WHERE id = 8530; -- nonhistoris
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + éksakta', aktif = true, updated_at = NOW() WHERE id = 8533; -- noneksakta
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + ékonomi', aktif = true, updated_at = NOW() WHERE id = 8534; -- nonekonomi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + départeméntal', aktif = true, updated_at = NOW() WHERE id = 8535; -- nondepartemental
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + départemén', aktif = true, updated_at = NOW() WHERE id = 8536; -- nondepartemen
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'non- + blok', aktif = true, updated_at = NOW() WHERE id = 8537; -- nonblok
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8544; -- non
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'nir- + warta', aktif = true, updated_at = NOW() WHERE id = 8583; -- nirwarta
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'nir- + laba', aktif = true, updated_at = NOW() WHERE id = 8586; -- nirlaba
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 8588; -- nirgesekan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 8589; -- nirgelar
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'nir- + aksara + -wan', aktif = true, updated_at = NOW() WHERE id = 8590; -- niraksarawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'nir- + aksara', aktif = true, updated_at = NOW() WHERE id = 8591; -- niraksara
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8655; -- neositosis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'néon + -isasi', aktif = true, updated_at = NOW() WHERE id = 8659; -- neonisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'néo- + lokal', aktif = true, updated_at = NOW() WHERE id = 8663; -- neolokal
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'néo- + féodalistis', aktif = true, updated_at = NOW() WHERE id = 8671; -- neofeodalistis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'néo- + féodalisme', aktif = true, updated_at = NOW() WHERE id = 8672; -- neofeodalisme
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'negara + -wan', aktif = true, updated_at = NOW() WHERE id = 8701; -- negarawan
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 8712; -- naziisme
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 8771; -- narasumber
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'nara- + praja', aktif = true, updated_at = NOW() WHERE id = 8773; -- narapraja
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'nara- + pidana', aktif = true, updated_at = NOW() WHERE id = 8774; -- narapidana
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + valénsi', aktif = true, updated_at = NOW() WHERE id = 8977; -- multivalensi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multirasial + -isme', aktif = true, updated_at = NOW() WHERE id = 8979; -- multirasialisme
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + organ', aktif = true, updated_at = NOW() WHERE id = 8989; -- multiorgan
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + kultur', aktif = true, updated_at = NOW() WHERE id = 8997; -- multikultur
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + krisis', aktif = true, updated_at = NOW() WHERE id = 8998; -- multikrisis
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + kompléks', aktif = true, updated_at = NOW() WHERE id = 8999; -- multikompleks
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'juta + -wan', aktif = true, updated_at = NOW() WHERE id = 9000; -- multijutawan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9001; -- multiguna
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + fungsi', aktif = true, updated_at = NOW() WHERE id = 9002; -- multifungsi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + fasét', aktif = true, updated_at = NOW() WHERE id = 9003; -- multifaset
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'multi- + diménsi', aktif = true, updated_at = NOW() WHERE id = 9005; -- multidimensi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'bahasa + -wan', aktif = true, updated_at = NOW() WHERE id = 9006; -- multibahasawan
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9007; -- multibahasa
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 9176; -- monosilabisme
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'mono- + sémantik', aktif = true, updated_at = NOW() WHERE id = 9178; -- monosemantik
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9185; -- monoloyalitas
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9203; -- monogini
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'mono- + atom', aktif = true, updated_at = NOW() WHERE id = 9210; -- monoatom
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'modérn + maniak', aktif = true, updated_at = NOW() WHERE id = 9254; -- modernomaniak
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 9278; -- mizan
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9398; -- mikrolet
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'mikro- + histori', aktif = true, updated_at = NOW() WHERE id = 9401; -- mikrohistori
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9403; -- mikrogelombang
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9425; -- mik
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'métropolis + -isasi', aktif = true, updated_at = NOW() WHERE id = 9443; -- metropolisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9548; -- mentifakta
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9571; -- megaohm
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9576; -- Megalitikum
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9612; -- mayokratio
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9737; -- martaban
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9841; -- mangkubumi
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 9863; -- Malikuljabar
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9869; -- malatindak
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9870; -- malasuai
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'mala- + petaka', aktif = true, updated_at = NOW() WHERE id = 9873; -- malapetaka
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'makro- + sosiologi', aktif = true, updated_at = NOW() WHERE id = 9881; -- makrososiologi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'makro- + météorologi', aktif = true, updated_at = NOW() WHERE id = 9886; -- makrometeorologi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'makro- + kriminologi', aktif = true, updated_at = NOW() WHERE id = 9888; -- makrokriminologi
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9967; -- mahatahu
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'maha- + suci', aktif = true, updated_at = NOW() WHERE id = 9968; -- mahasuci
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9969; -- mahasiswi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'maha- + siswa', aktif = true, updated_at = NOW() WHERE id = 9970; -- mahasiswa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'maha- + rupa', aktif = true, updated_at = NOW() WHERE id = 9971; -- maharupa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 9975; -- maharajalela
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'maha- + kuasa', aktif = true, updated_at = NOW() WHERE id = 9982; -- mahakuasa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'maha- + karya', aktif = true, updated_at = NOW() WHERE id = 9983; -- mahakarya
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 9996; -- magnetor
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'loka + karya', aktif = true, updated_at = NOW() WHERE id = 10047; -- lokakarya
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 10061; -- logawiah
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'manca + warna', aktif = true, updated_at = NOW() WHERE id = 10386; -- mancawarna
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 10388; -- manasuka
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 10391; -- manakala
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 10420; -- malabau
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 10439; -- mahabintang
UPDATE etimologi SET bahasa = 'Amoy', aktif = true, updated_at = NOW() WHERE id = 10492; -- long
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'loka + wisata', aktif = true, updated_at = NOW() WHERE id = 10511; -- lokawisata
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 10633; -- laknatullah
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 10711; -- kutubusitah
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 10734; -- kulzum
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'kultur + -isasi', aktif = true, updated_at = NOW() WHERE id = 10738; -- kulturisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 10805; -- kuadrupleks
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 10829; -- kronosekuen
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'kriminal + -isasi', aktif = true, updated_at = NOW() WHERE id = 10899; -- kriminalisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 10900; -- kriminalis
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'kosa + kata', aktif = true, updated_at = NOW() WHERE id = 10963; -- kosakata
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 11066; -- kooperativisme
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 11151; -- konstatatif
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'konstanta + gravitasi', aktif = true, updated_at = NOW() WHERE id = 11153; -- konstantagravitasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'kondom + -isasi', aktif = true, updated_at = NOW() WHERE id = 11274; -- kondomisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'koboi + -isme', aktif = true, updated_at = NOW() WHERE id = 11525; -- koboisme
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ko- + aksi', aktif = true, updated_at = NOW() WHERE id = 11534; -- koaksi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'ko- + agrégasi', aktif = true, updated_at = NOW() WHERE id = 11537; -- koagregasi
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 11555; -- klorinasi
UPDATE etimologi SET bahasa = 'Yunani', aktif = true, updated_at = NOW() WHERE id = 11565; -- klona
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 11670; -- kinetokardiografi
UPDATE etimologi SET bahasa = 'Arab', kata_asal = 'khilaf + -iah', aktif = true, updated_at = NOW() WHERE id = 11757; -- khilafiah
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 11854; -- keratoelastin
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 11924; -- kelobotisme
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'karya + -wati', aktif = true, updated_at = NOW() WHERE id = 12109; -- karyawati
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'karya + -wan', aktif = true, updated_at = NOW() WHERE id = 12110; -- karyawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'karya + siswa', aktif = true, updated_at = NOW() WHERE id = 12112; -- karyasiswa
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12191; -- karbonan
UPDATE etimologi SET bahasa = 'Jepang', aktif = true, updated_at = NOW() WHERE id = 12297; -- kanji
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12303; -- kanibalisasi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'kala + kian', aktif = true, updated_at = NOW() WHERE id = 12445; -- kalakian
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'kaca + puri', aktif = true, updated_at = NOW() WHERE id = 12524; -- kacapuri
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 12525; -- kacamata
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'juta + -wan', aktif = true, updated_at = NOW() WHERE id = 12547; -- jutawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'jaga + bahaya', aktif = true, updated_at = NOW() WHERE id = 12760; -- jagabaya
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12852; -- isokemi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12853; -- isokalori
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12854; -- isokal
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12864; -- isoflor
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 12866; -- isofase
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'intra- + véna', aktif = true, updated_at = NOW() WHERE id = 12941; -- intravena
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'intra- + molekul', aktif = true, updated_at = NOW() WHERE id = 12947; -- intramolekul
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'inter- + zona', aktif = true, updated_at = NOW() WHERE id = 12964; -- interzona
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 13066; -- instansional
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 13147; -- inframerah
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 13156; -- infleksif
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 13193; -- indonesianisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'in- + disiplinér', aktif = true, updated_at = NOW() WHERE id = 13209; -- indisipliner
UPDATE etimologi SET bahasa = 'Arab', aktif = true, updated_at = NOW() WHERE id = 13470; -- hujah
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'homoséksual + -isme', aktif = true, updated_at = NOW() WHERE id = 13511; -- homoseksualisme
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 13618; -- hipersonika
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 13630; -- hipergami
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'hiper- + amnési', aktif = true, updated_at = NOW() WHERE id = 13636; -- hiperamnesi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'hégémoni + -isme', aktif = true, updated_at = NOW() WHERE id = 13844; -- hegemonisme
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'halogén + -asi', aktif = true, updated_at = NOW() WHERE id = 13949; -- halogenasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'géo- + téknologi', aktif = true, updated_at = NOW() WHERE id = 14242; -- geoteknologi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'géo- + sinkronis', aktif = true, updated_at = NOW() WHERE id = 14246; -- geosinkronis
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 14367; -- gandaria
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'ganda + pura', aktif = true, updated_at = NOW() WHERE id = 14368; -- gandapura
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 14385; -- gamalisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 14601; -- fluktuatif
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 14782; -- fasilitator
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 14898; -- etnopolitik
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 15036; -- epifiton
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'éléktro- + patologi', aktif = true, updated_at = NOW() WHERE id = 15243; -- elektropatologi
UPDATE etimologi SET bahasa = 'Inggris', aktif = true, updated_at = NOW() WHERE id = 15258; -- elektrolisi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'éka- + bahasa + -wan', aktif = true, updated_at = NOW() WHERE id = 15475; -- ekabahasawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'éka- + bahasa', aktif = true, updated_at = NOW() WHERE id = 15476; -- ekabahasa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 15523; -- dwitunggal
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 15524; -- dwitarung
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 15525; -- dwisegi
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 15527; -- dwiperan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dwi- + muka', aktif = true, updated_at = NOW() WHERE id = 15528; -- dwimuka
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 15532; -- dwiganda
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dwi- + dasawarsa', aktif = true, updated_at = NOW() WHERE id = 15534; -- dwidasawarsa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dwi- + darma', aktif = true, updated_at = NOW() WHERE id = 15535; -- dwidarma
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dwi- + bahasa + -wan', aktif = true, updated_at = NOW() WHERE id = 15536; -- dwibahasawan
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dwi- + bahasa', aktif = true, updated_at = NOW() WHERE id = 15537; -- dwibahasa
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dwi- + arti', aktif = true, updated_at = NOW() WHERE id = 15538; -- dwiarti
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'duo + drama', aktif = true, updated_at = NOW() WHERE id = 15565; -- duodrama
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'duka + cita', aktif = true, updated_at = NOW() WHERE id = 15582; -- dukacita
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'di- + transitif', aktif = true, updated_at = NOW() WHERE id = 15721; -- ditransitif
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'dis- + mutasi', aktif = true, updated_at = NOW() WHERE id = 15750; -- dismutasi
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'derma + -wan', aktif = true, updated_at = NOW() WHERE id = 16035; -- dermawan
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'dé- + personifikasi', aktif = true, updated_at = NOW() WHERE id = 16069; -- depersonifikasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'dé- + -isasi', aktif = true, updated_at = NOW() WHERE id = 16075; -- deparpolisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 16157; -- dekontekstualisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'dé- + konstruksi', aktif = true, updated_at = NOW() WHERE id = 16158; -- dekonstruksi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'dé- + klasifikasi', aktif = true, updated_at = NOW() WHERE id = 16170; -- deklasifikasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 16192; -- deideologisasi
UPDATE etimologi SET bahasa = 'Belanda', aktif = true, updated_at = NOW() WHERE id = 16205; -- defonologisasi
UPDATE etimologi SET bahasa = 'Belanda', kata_asal = 'dé- + birokratisasi', aktif = true, updated_at = NOW() WHERE id = 16239; -- debirokratisasi
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 16263; -- dasatitah
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'dasa- + sila', aktif = true, updated_at = NOW() WHERE id = 16264; -- dasasila
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 16265; -- dasarian
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 16266; -- dasalomba
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'darma + wisata', aktif = true, updated_at = NOW() WHERE id = 16277; -- darmawisata
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'darma + siswa', aktif = true, updated_at = NOW() WHERE id = 16278; -- darmasiswa
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 16279; -- darmakelana
UPDATE etimologi SET bahasa = 'Sanskerta', kata_asal = 'darma + bakti', aktif = true, updated_at = NOW() WHERE id = 16280; -- darmabakti
UPDATE etimologi SET bahasa = 'Persia', aktif = true, updated_at = NOW() WHERE id = 16399; -- cokmar
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 16442; -- cerpenis
UPDATE etimologi SET bahasa = 'Sanskerta', aktif = true, updated_at = NOW() WHERE id = 16443; -- cerpen

-- -------------------------------------------------------
-- B. Compound sejati (bahasa berbeda antar komponen)
--    kata_asal diisi, bahasa tetap NULL, aktif tetap false
-- -------------------------------------------------------
UPDATE etimologi SET kata_asal = 'adi- (Sanskerta) + kodrati (Arab)', updated_at = NOW() WHERE id = 133; -- adikodrati
UPDATE etimologi SET kata_asal = 'agama (Sanskerta) + -wi (Arab)', updated_at = NOW() WHERE id = 243; -- agamawi
UPDATE etimologi SET kata_asal = 'agri- (Belanda) + silvikultur (Inggris)', updated_at = NOW() WHERE id = 283; -- agrisilvikultur
UPDATE etimologi SET kata_asal = 'agro- (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 291; -- agrokimia
UPDATE etimologi SET kata_asal = 'antar- (Sanskerta) + daerah (Arab)', updated_at = NOW() WHERE id = 898; -- antardaerah
UPDATE etimologi SET kata_asal = 'antar- (Sanskerta) + master (Inggris)', updated_at = NOW() WHERE id = 906; -- antarmaster
UPDATE etimologi SET kata_asal = 'antar- (Sanskerta) + molekul (Belanda)', updated_at = NOW() WHERE id = 907; -- antarmolekul
UPDATE etimologi SET kata_asal = 'antar- (Sanskerta) + planét (Belanda)', updated_at = NOW() WHERE id = 910; -- antarplanet
UPDATE etimologi SET kata_asal = 'antar- (Sanskerta) + ras (Belanda)', updated_at = NOW() WHERE id = 913; -- antarras
UPDATE etimologi SET kata_asal = 'antar- (Sanskerta) + sél (Belanda)', updated_at = NOW() WHERE id = 915; -- antarsel
UPDATE etimologi SET kata_asal = 'anti- (Belanda) + jasad (Arab)', updated_at = NOW() WHERE id = 948; -- antijasad
UPDATE etimologi SET kata_asal = 'anti- (Belanda) + wira (Sanskerta) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 982; -- antiwirawan
UPDATE etimologi SET kata_asal = 'anti- (Belanda) + zarah (Arab)', updated_at = NOW() WHERE id = 983; -- antizarah
UPDATE etimologi SET kata_asal = 'awa- (Sanskerta) + mineral (Belanda)', updated_at = NOW() WHERE id = 1523; -- awamineral
UPDATE etimologi SET kata_asal = 'bina (Arab) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 2066; -- binaragawan
UPDATE etimologi SET kata_asal = 'biro (Belanda) + faks (Inggris)', updated_at = NOW() WHERE id = 2127; -- birofaks
UPDATE etimologi SET kata_asal = 'wira (Sanskerta) + bank (Belanda)', updated_at = NOW() WHERE id = 2718; -- wirabank
UPDATE etimologi SET kata_asal = 'wa- (Arab) + sangka (Sanskerta)', updated_at = NOW() WHERE id = 2781; -- wasangka
UPDATE etimologi SET kata_asal = 'tri- (Sanskerta) + unsur (Arab)', updated_at = NOW() WHERE id = 3210; -- triunsur
UPDATE etimologi SET kata_asal = 'tri- (Sanskerta) + lingua (Latin)', updated_at = NOW() WHERE id = 3237; -- trilingga
UPDATE etimologi SET kata_asal = 'térmo- (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 3552; -- termokimia
UPDATE etimologi SET kata_asal = 'télé- (Belanda) + novéla (Inggris)', updated_at = NOW() WHERE id = 3672; -- telenovela
UPDATE etimologi SET kata_asal = 'téknologi (Belanda) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 3720; -- teknologiwan
UPDATE etimologi SET kata_asal = 'swasta (Sanskerta) + -isasi (Belanda)', updated_at = NOW() WHERE id = 4168; -- swastanisasi
UPDATE etimologi SET kata_asal = 'swa- (Sanskerta) + kontradiksi (Belanda)', updated_at = NOW() WHERE id = 4177; -- swakontradiksi
UPDATE etimologi SET kata_asal = 'swa- (Sanskerta) + disiplin (Belanda)', updated_at = NOW() WHERE id = 4187; -- swadisiplin
UPDATE etimologi SET kata_asal = 'suka (Sanskerta) + réla (Arab) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 4311; -- sukarelawan
UPDATE etimologi SET kata_asal = 'suka (Sanskerta) + réla (Arab)', updated_at = NOW() WHERE id = 4312; -- sukarela
UPDATE etimologi SET kata_asal = 'sub- (Belanda) + kontraktor (Inggris)', updated_at = NOW() WHERE id = 4376; -- subkontraktor
UPDATE etimologi SET kata_asal = 'sub- (Belanda) + étnik (Inggris)', updated_at = NOW() WHERE id = 4386; -- subetnik
UPDATE etimologi SET kata_asal = 'sub- (Belanda) + éntri (Inggris)', updated_at = NOW() WHERE id = 4388; -- subentri
UPDATE etimologi SET kata_asal = 'pri- (Jawa) + bumi (Sanskerta)', updated_at = NOW() WHERE id = 4654; -- pribumi
UPDATE etimologi SET kata_asal = 'sejarah (Arab) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 5572; -- sejarawan
UPDATE etimologi SET kata_asal = 'sapta- (Sanskerta) + pesona (Persia)', updated_at = NOW() WHERE id = 5700; -- saptapesona
UPDATE etimologi SET kata_asal = 'rol (Belanda) + prés (Inggris)', updated_at = NOW() WHERE id = 6079; -- rolpres
UPDATE etimologi SET kata_asal = 'rétro- (Belanda) + mamal (Inggris)', updated_at = NOW() WHERE id = 6184; -- retromamal
UPDATE etimologi SET kata_asal = 'radio (Inggris) + kimia (Arab)', updated_at = NOW() WHERE id = 6612; -- radiokimia
UPDATE etimologi SET kata_asal = 'purna (Sanskerta) + waktu (Arab)', updated_at = NOW() WHERE id = 6680; -- purnawaktu
UPDATE etimologi SET kata_asal = 'pséudo- (Belanda) + kata (Sanskerta)', updated_at = NOW() WHERE id = 6793; -- pseudokata
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + syarat (Arab)', updated_at = NOW() WHERE id = 6942; -- prasyarat
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + syarat (Arab)', updated_at = NOW() WHERE id = 6943; -- prasyarat
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + studi (Belanda)', updated_at = NOW() WHERE id = 6944; -- prastudi
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + séminar (Inggris)', updated_at = NOW() WHERE id = 6947; -- praseminar
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + sekolah (Portugis)', updated_at = NOW() WHERE id = 6948; -- prasekolah
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + sejarah (Arab)', updated_at = NOW() WHERE id = 6949; -- prasejarah
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + sejarah (Arab)', updated_at = NOW() WHERE id = 6950; -- prasejarah
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + rekam (Arab)', updated_at = NOW() WHERE id = 6956; -- prarekam
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + pubertas (Belanda)', updated_at = NOW() WHERE id = 6960; -- prapubertas
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + puber (Belanda)', updated_at = NOW() WHERE id = 6961; -- prapuber
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + promosi (Belanda)', updated_at = NOW() WHERE id = 6962; -- prapromosi
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + natal (Portugis)', updated_at = NOW() WHERE id = 6966; -- pranatal
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + modérn (Belanda)', updated_at = NOW() WHERE id = 6971; -- pramodern
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + lahir (Arab)', updated_at = NOW() WHERE id = 6972; -- pralahir
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + lahir (Arab)', updated_at = NOW() WHERE id = 6973; -- pralahir
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + konsépsi (Belanda)', updated_at = NOW() WHERE id = 7037; -- prakonsepsi
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + kondisi (Belanda)', updated_at = NOW() WHERE id = 7038; -- prakondisi
UPDATE etimologi SET kata_asal = 'pra- (Sanskerta) + desain (Inggris)', updated_at = NOW() WHERE id = 7056; -- pradesain
UPDATE etimologi SET kata_asal = 'péri- (Belanda) + orbita (Latin)', updated_at = NOW() WHERE id = 7531; -- periorbita
UPDATE etimologi SET kata_asal = 'pato- (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 7737; -- patokimia
UPDATE etimologi SET kata_asal = 'pasca- (Sanskerta) + larva (Belanda)', updated_at = NOW() WHERE id = 7787; -- pascalarva
UPDATE etimologi SET kata_asal = 'pasca- (Sanskerta) + lahir (Arab)', updated_at = NOW() WHERE id = 7788; -- pascalahir
UPDATE etimologi SET kata_asal = 'pasca- (Sanskerta) + kawin (Persia)', updated_at = NOW() WHERE id = 7789; -- pascakawin
UPDATE etimologi SET kata_asal = 'pasca- (Sanskerta) + doktoral (Belanda)', updated_at = NOW() WHERE id = 7791; -- pascadoktoral
UPDATE etimologi SET kata_asal = 'pan- (Belanda) + dialéktal (Inggris)', updated_at = NOW() WHERE id = 7960; -- pandialektal
UPDATE etimologi SET kata_asal = 'panca- (Sanskerta) + ragam (Tamil)', updated_at = NOW() WHERE id = 7976; -- pancaragam
UPDATE etimologi SET kata_asal = 'pada (Sanskerta) + hal (Arab)', updated_at = NOW() WHERE id = 8073; -- padahal
UPDATE etimologi SET kata_asal = 'non- (Belanda) + patogénik (Inggris)', updated_at = NOW() WHERE id = 8516; -- nonpatogenik
UPDATE etimologi SET kata_asal = 'non- (Belanda) + konvénsional (Inggris)', updated_at = NOW() WHERE id = 8522; -- nonkonvensional
UPDATE etimologi SET kata_asal = 'non- (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 8524; -- nonkimia
UPDATE etimologi SET kata_asal = 'non- (Belanda) + formal (Inggris)', updated_at = NOW() WHERE id = 8531; -- nonformal
UPDATE etimologi SET kata_asal = 'nasion (Inggris) + -isme (Belanda)', updated_at = NOW() WHERE id = 8743; -- nasionisme
UPDATE etimologi SET kata_asal = 'mini- (Belanda) + kata (Sanskerta)', updated_at = NOW() WHERE id = 9337; -- minikata
UPDATE etimologi SET kata_asal = 'mikologi (Belanda) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 9421; -- mikologiwan
UPDATE etimologi SET kata_asal = 'métro (Prancis) + mini (Belanda)', updated_at = NOW() WHERE id = 9447; -- metromini
UPDATE etimologi SET kata_asal = 'méta- (Yunani) + bahasa (Sanskerta)', updated_at = NOW() WHERE id = 9497; -- metabahasa
UPDATE etimologi SET kata_asal = 'mala- (Sanskerta) + gizi (Arab)', updated_at = NOW() WHERE id = 10417; -- malagizi
UPDATE etimologi SET kata_asal = 'mala- (Sanskerta) + fungsi (Belanda)', updated_at = NOW() WHERE id = 10418; -- malafungsi
UPDATE etimologi SET kata_asal = 'konform (Belanda) + -itas (Latin)', updated_at = NOW() WHERE id = 11250; -- konformitas
UPDATE etimologi SET kata_asal = 'konéksi (Belanda) + -itas (Latin)', updated_at = NOW() WHERE id = 11262; -- koneksitas
UPDATE etimologi SET kata_asal = 'konco (Jawa) + -isme (Belanda)', updated_at = NOW() WHERE id = 11284; -- koncoisme
UPDATE etimologi SET kata_asal = 'kinéstésia (Inggris) + méter (Belanda)', updated_at = NOW() WHERE id = 11674; -- kinestesiometer
UPDATE etimologi SET kata_asal = 'kilowatt (Belanda) + jam (Arab)', updated_at = NOW() WHERE id = 11696; -- kilowattjam
UPDATE etimologi SET kata_asal = 'kata (Sanskerta) + -wi (Arab)', updated_at = NOW() WHERE id = 12038; -- katawi
UPDATE etimologi SET kata_asal = 'jas (Belanda) + wadi (Arab)', updated_at = NOW() WHERE id = 12689; -- jaswadi
UPDATE etimologi SET kata_asal = 'iud (Inggris) + -isasi (Belanda)', updated_at = NOW() WHERE id = 12775; -- iudisasi
UPDATE etimologi SET kata_asal = 'Islam (Arab) + -is (Belanda)', updated_at = NOW() WHERE id = 12877; -- islamis
UPDATE etimologi SET kata_asal = 'intra- (Belanda) + kalimat (Arab)', updated_at = NOW() WHERE id = 12950; -- intrakalimat
UPDATE etimologi SET kata_asal = 'in- (Belanda) + konvénsional (Inggris)', updated_at = NOW() WHERE id = 13114; -- inkonvensional
UPDATE etimologi SET kata_asal = 'industri (Belanda) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 13183; -- industriawan
UPDATE etimologi SET kata_asal = 'imun(o (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 13234; -- imunokimia
UPDATE etimologi SET kata_asal = 'ilmu (Arab) + -wan (Sanskerta)', updated_at = NOW() WHERE id = 13310; -- ilmuwan
UPDATE etimologi SET kata_asal = 'homo (Belanda) + séks (Inggris)', updated_at = NOW() WHERE id = 13513; -- homoseks
UPDATE etimologi SET kata_asal = 'histo(logi (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 13569; -- histokimia
UPDATE etimologi SET kata_asal = 'géo- (Belanda) + kimia (Arab)', updated_at = NOW() WHERE id = 14258; -- geokimia
UPDATE etimologi SET kata_asal = 'dwi- (Sanskerta) + fungsi (Belanda)', updated_at = NOW() WHERE id = 15533; -- dwifungsi
UPDATE etimologi SET kata_asal = 'duplik (Belanda) + -itas (Latin)', updated_at = NOW() WHERE id = 15557; -- duplisitas
UPDATE etimologi SET kata_asal = 'dinamis (Belanda) + -ator (Inggris)', updated_at = NOW() WHERE id = 15835; -- dinamisator
UPDATE etimologi SET kata_asal = 'oknum (Arab) + -isasi (Belanda)', updated_at = NOW() WHERE id = 16078; -- deoknumisasi
UPDATE etimologi SET kata_asal = 'daérah (Arab) + -isme (Belanda)', updated_at = NOW() WHERE id = 16350; -- daerahisme

COMMIT;
