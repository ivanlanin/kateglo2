# Fix Pemenggalan: Semua Jenis Selain Dasar

**Tanggal:** 2026-03-04
**Tabel:** `entri`
**Filter:** `jenis != 'dasar'`, tanpa filter `aktif`

## Latar Belakang

Setelah fix `jenis = 'dasar'` (vokal awal, vokal akhir, eu), dilakukan cek terhadap semua jenis lain. Ditemukan isu yang sama pada beberapa jenis.

## Jenis yang Diperiksa

| Jenis | Total entri | Ada pemenggalan | Tindakan |
|---|---|---|---|
| turunan | 24.578 | 24.578 | Fix vokalAwal + vokalAkhir + eu |
| gabungan | 23.544 | 8 | Tidak difix (kata majemuk, pemenggalan tidak relevan) |
| peribahasa | 2.033 | 0 | Tidak ada pemenggalan |
| prakategorial | 1.669 | 1.669 | Fix vokalAwal + vokalAkhir |
| idiom | 272 | 0 | Tidak ada pemenggalan |
| terikat | 103 | 103 | Fix vokalAwal + vokalAkhir + eu |
| varian | 91 | 91 | Fix manual 1 entri |
| sufiks | 14 | 14 | Tidak difix (morfem pendek) |
| prefiks | 11 | 11 | Tidak difix (morfem pendek) |
| konfiks | 6 | 6 | Tidak difix (morfem pendek) |
| infiks | 6 | 6 | Tidak difix (morfem pendek) |
| klitik | 5 | 5 | Tidak difix (morfem pendek) |

**Sufiks/prefiks/konfiks/infiks/klitik tidak difix** karena pemenggalan morfem ini tidak berupa suku kata biasa (misalnya `-isasi`, `ber--an`) — pendeteksian V-C-V pada morfem ini adalah false positive.

## Jumlah Perubahan

| Jenis | vokalAwal | vokalAkhir | eu | Total |
|---|---|---|---|---|
| turunan | ~245 | ~111 | 1 | 357 |
| prakategorial | ~125 | 4 | 0 | 129 |
| terikat | 9 | 4 | 1 | 14 |
| varian | 0 | 0 | 0 | 1* |
| **Total** | | | | **501** |

\* varian: 1 entri manual (`udeh → u.deh`)

## Sampel Perubahan turunan

| Entri | Sebelum | Sesudah |
|---|---|---|
| abaian | abai.an | a.bai.an |
| abuhan | abuh.an | a.buh.an |
| alunan | alun.an | a.lun.an |
| berdoa | ber.doa | ber.do.a |
| berdua | ber.dua | ber.du.a |
| bersedia | ber.se.dia | ber.se.di.a |
| melalui | me.la.lui | me.la.lu.i |
| sia-sia | sia-sia | si.a-si.a |
| ketua | ke.tua | ke.tu.a |
| dipasteurisasi | di.pas.teu.ri.sa.si | di.pas.te.u.ri.sa.si |

## Sampel Perubahan prakategorial

| Entri | Sebelum | Sesudah |
|---|---|---|
| aben | aben | a.ben |
| acah | acah | a.cah |
| acara (2) | aca.ra | a.ca.ra |
| dua (2) | dua | du.a |
| sia | sia | si.a |
| sedia (3) | se.dia | se.di.a |

## Perubahan terikat

| Entri | Sebelum | Sesudah |
|---|---|---|
| adi- | adi- | a.di- |
| apo- | apo- | a.po- |
| eka- | eka- | e.ka- |
| epi- | epi- | e.pi- |
| iso- | iso- | i.so- |
| uni- (3) | uni- | u.ni- |
| upa- (2) | upa- | u.pa- |
| dia- (2) | dia- | di.a- |
| hagio- | ha.gio- | ha.gi.o- |
| neo- | neo- | ne.o- |
| sosio- | so.sio- | so.si.o- |
| pseudo- | pseu.do- | pse.u.do- |

## Kesalahan KBBI yang Ditemukan

Selama proses verifikasi acak, ditemukan ketidakkonsistenan KBBI:

| Entri | KBBI (salah) | Seharusnya | Catatan |
|---|---|---|---|
| berdua | ber.dua | ber.du.a | Bentuk dasar `dua = du.a` (KBBI sendiri) — turunan harus konsisten |

Keputusan: mengikuti bentuk dasar sebagai standar. "Yang penting, ada satu pola yang standar" (lihat juga dokumentasi eu/diftong sebelumnya).

## Referensi

- PUEBI: Aturan pemenggalan, Bagian V.E.1
- Verifikasi KBBI: `abuhan=a.buh.an` ✓, `kue=ku.e` ✓, `melalui=me.la.lu.i` ✓, `berdoa=ber.do.a` ✓, `dua=du.a` ✓
- Dokumen terkait: `202603041040_fix-pemenggalan-vokal-awal-akhir.md`, `202603041100_fix-pemenggalan-eu-diftong-au.md`
