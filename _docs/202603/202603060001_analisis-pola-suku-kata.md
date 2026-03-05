# Analisis Pola Suku Kata Bahasa Indonesia
## Kata Dasar dan Prakategorial

**Tanggal analisis:** 2026-03-06
**Tabel:** `entri`
**Filter jenis:** `dasar`, `prakategorial`
**Sumber data:** Kolom `pemenggalan` (KBBI4)

---

## Metodologi

### Notasi VK

Setiap suku kata direpresentasikan dalam notasi **VK** di mana:
- **V** = vokal tunggal (a, e, i, o, u)
- **VV** = diftong (ai, au, oi, ei) — diperlakukan sebagai dua unsur vokal dalam satu suku kata
- **K** = konsonan, termasuk digraf yang diperlakukan sebagai satu fonem:

  | Digraf | Fonem | Contoh suku |
  |---|---|---|
  | ng | /ŋ/ velar nasal | bu.nga, ngang |
  | ny | /ɲ/ palatal nasal | nya.ta, bu.nyi |
  | kh | /x/ frikatif velar | kha.sus, a.khir |
  | sy | /ʃ/ frikatif palatal | sya.rat, khu.syuk |
  | gh | /ɣ/ frikatif velar bersuara | ghaz.al (kata serapan) |

- **Diftong** yang dikenali: `ai`, `au`, `oi`, `ei` (sesuai konvensi PUEBI dan praktik KBBI)

### Proses Klasifikasi

1. Ambil nilai kolom `pemenggalan` (misal: `ber.ja.lan`)
2. Pecah berdasarkan titik sebagai batas suku kata
3. Tanda hubung (kata ulang seperti `si.a-si.a`) dinormalisasi sebagai batas suku kata (setara titik)
4. Tiap suku kata diklasifikasikan ke pola VK (misal: `ber` → KVK, `ja` → KV, `lan` → KVK)
5. Pola kata = gabungan pola suku kata dengan titik (misal: `KVK.KV.KVK`)
6. Entri multi-kata (mengandung spasi) dilewati

### Contoh Konversi

| Entri | Pemenggalan | Pola Kata | Pola per Suku |
|---|---|---|---|
| aku | a.ku | V.KV | V + KV |
| ilmu | il.mu | VK.KV | VK + KV |
| kata | ka.ta | KV.KV | KV + KV |
| paksa | pak.sa | KVK.KV | KVK + KV |
| drama | dra.ma | KKV.KV | KKV + KV |
| traktor | trak.tor | KKVK.KVK | KKVK + KVK |
| tekstil | teks.til | KVKK.KVK | KVKK + KVK |
| strata | stra.ta | KKKV.KV | KKKV + KV |
| struktur | struk.tur | KKKVK.KVK | KKKVK + KVK |
| kompleks | kom.pleks | KVK.KKVKK | KVK + KKVKK |
| bunga | bu.nga | KV.KV | KV + KV (ng = K tunggal) |

---

## Ringkasan Data

| Metrik | Kata Dasar | Prakategorial | Gabungan |
|---|---:|---:|---:|
| Total entri | 39671 | 1669 | 41340 |
| Dilewati (multi-kata/kosong) | 468 | 16 | 484 |
| Total suku kata dianalisis | 112,092 | 3,601 | 115,693 |

---

## 1. Distribusi Jumlah Suku Kata per Kata

### Kata Dasar

| Jumlah Suku | Jumlah Kata | % |
|---:|---:|---:|
| 1 | 1,341 | 3.42% |
| 2 | 18,044 | 46.03% |
| 3 | 10,275 | 26.21% |
| 4 | 5,675 | 14.48% |
| 5 | 2,551 | 6.51% |
| 6 | 955 | 2.44% |
| 7 | 268 | 0.68% |
| 8 | 77 | 0.20% |
| 9 | 14 | 0.04% |
| 10 | 1 | 0.00% |
| 11 | 1 | 0.00% |
| 14 | 1 | 0.00% |

### Prakategorial

| Jumlah Suku | Jumlah Kata | % |
|---:|---:|---:|
| 1 | 23 | 1.39% |
| 2 | 1,330 | 80.46% |
| 3 | 282 | 17.06% |
| 4 | 18 | 1.09% |

---

## 2. Perbandingan dengan Tipe Kanonik

Sebelas tipe suku kata yang diakui dalam fonologi bahasa Indonesia (berdasarkan rujukan).

| # | Tipe | Contoh (Ref) | Ada di Data | Jumlah | % dari total suku | Contoh pemenggalan |
|---:|---|---|:---:|---:|---:|---|
| 1 | `KV` | `ka.mu` | ✅ | 57,784 | 49.95% | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| 2 | `KVK` | `pak.sa` | ✅ | 39,799 | 34.40% | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| 3 | `V` | `a.ku` | ✅ | 6,253 | 5.40% | a, a.a, a.ba, a.ba-a.ba |
| 4 | `VK` | `il.mu` | ✅ | 5,714 | 4.94% | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| 5 | `KKV` | `dra.ma` | ✅ | 2,503 | 2.16% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| 6 | `KKVK` | `trak.tor` | ✅ | 1,352 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.sten.si, ae.ro.gram |
| 7 | `KVKK` | `teks.til` | ✅ | 305 | 0.26% | ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans, ab.sorp.tif |
| 8 | `KKVKK` | `kom.pleks` | ✅ | 87 | 0.08% | ae.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| 9 | `KKKVK` | `struk.tur` | ✅ | 62 | 0.05% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| 10 | `KKKV` | `stra.ta` | ✅ | 51 | 0.04% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| 11 | `KVKKK` | `korps` | ✅ | 9 | 0.01% | gi.ga.hertz, hertz, karst, ki.lo.hertz |

---

## 3. Pola di Luar Tipe Kanonik

Pola-pola berikut **tidak termasuk** dalam 11 tipe kanonik. Perlu analisis apakah ini:
- (A) Perluasan valid — diftong sebagai unsur baru (VV, KVV, dll.)
- (B) Kata serapan dengan fonotaktik asing yang tidak ada padanannya dalam kanonik Indonesia
- (C) Anomali data — pemenggalan yang kemungkinan keliru dalam sumber

### 3.0 Efek Normalisasi Digraf dan Diftong

Tabel utama di bawah menggunakan normalisasi digraf (ng, ny, kh, sy, gh = K tunggal) dan diftong (ai, au, oi, ei = VV). Bila normalisasi **dinonaktifkan** — setiap karakter diklasifikasikan apa adanya — sebagian pola lenyap dan sebagian berubah bentuk:

| Perubahan | Contoh | Penjelasan |
|---|---|---|
| `VKVK` (65) → `VKKVK` | `angah` | ng = n+g = KK, bukan K tunggal |
| `VKV` (20) → `VKKV` | `akhirat` | kh = k+h = KK |
| `VKK` (106) → bertambah | `akh`, `angan` | kh/ng dihitung dua karakter → lebih banyak koda ganda |
| `KKVV` (24) → bertambah | `banyai`, `bangai` | ny/ng tidak dinormalisasi, vokal berdampingan tetap VV |

**Pola anomali yang tetap muncul** meski tanpa normalisasi digraf/diftong (anomali "murni"):

| Pola | Jumlah | Contoh pemenggalan | Dugaan masalah |
|---|---:|---|---|
| `KVKV` | 25 | `ae.ro.bi.o.logi`, `ak.li.masi` | Akhiran `-logi`, `-masi` tidak dipecah (harusnya `lo.gi`, `ma.si`) |
| `K` | 25 | `b`, `c`, `d`, `f` | Entri singkatan huruf tunggal |
| `VKKV` | 21 | `akhi.rat`, `akli` | Pemecahan tidak tepat: `ak.hi.rat` atau `a.khi.rat` |
| `KVKVK` | 12 | `belur`, `colok`, `kakas` | 5 bunyi dalam satu suku — pemenggalan tidak dilakukan |
| `VKKVKK` | 5 | `anyang`, `anyang-anyang` | `anyang` = harusnya `a.nyang` = V.KVK |
| `VKV` | 4 | `-asi`, `qur.ani` | Suku akhiran `-asi` tidak dipecah |
| `KVKVKK` | 3 | `en.te.bering`, `kupang`, `selang` | Harusnya `ku.pang` = KV.KVK |
| `KVKKVK` | 3 | `kempas`, `timbul`, `tumpas` | Harusnya `kem.pas`, `tim.bul` |
| `KK` | 1 | `hen.ry` | `ry` bukan suku Indonesia baku |
| `KKK` | 1 | `rönt.gen` | Aksara asing dengan karakter non-ASCII |

| Pola | Jumlah | % | Kategori | Contoh pemenggalan | Keterangan |
|---|---:|---:|---|---|---|
| `KVV` | 1130 | 0.98% | A – diftong | a.bai, a.bai.ma.na, a.bau, a.boi | Konsonan + diftong — valid di PUEBI (kai.sar, lau.t) |
| `VV` | 222 | 0.19% | A – diftong | ae.lo.tro.pik, ae.o.lus, ae.ra.si, ae.ra.tor | Diftong tanpa onset (awal kata: ai, au, oi, ei) |
| `VKK` | 106 | 0.09% | B – serapan (koda kompleks) | alf, alz.hei.mer, am.bi.ens, ark.ti.ka | Vokal + dua konsonan (alf, alz) — koda kluster serapan |
| `VKVK` | 65 | 0.06% | C – anomali (pemenggalan keliru?) | akhir, angah, angan, angel | Contoh: angah (harusnya ang.ah = VK.VK), akhir (a.khir → kh = K tunggal) |
| `VVK` | 59 | 0.05% | A – diftong | aes.te.ti.ka, aib, aih, aik.mo.fo.bi.a | Diftong + koda (aib, ais) — awal kata |
| `KVVK` | 39 | 0.03% | A – diftong | a.dion, a.mien, am.piang, a.part.heid | Konsonan + diftong + koda (maut, main) |
| `KVKV` | 28 | 0.02% | C – anomali (pemenggalan keliru?) | ae.ro.bi.o.logi, ag.ri.o.logi, ak.li.masi, am.ba.rile | Empat bunyi tanpa batas suku → pemenggalan kemungkinan keliru (lo.gi → KV.KV, bukan KVKV) |
| `K` | 25 | 0.02% | C – anomali (singkatan) | b, c, d, f | Konsonan tunggal — kemungkinan singkatan/akronim |
| `KKVV` | 24 | 0.02% | A – diftong | cut.brai, dis.plai, drai, ein.stei.ni.um | Kluster + diftong (brai, plai) — serapan |
| `VKV` | 20 | 0.02% | C – anomali (pemenggalan keliru?) | akhi.rat, akhi.rul.ka.lam, akhi.ru.sa.nah, angi.na | V-K-V dalam satu suku → kemungkinan suku parsial dari pemrosesan digraf kh |
| `KVKVK` | 15 | 0.01% | C – anomali (pemenggalan keliru?) | belur, colok, en.te.bering, kakas | Lima bunyi dalam satu suku → kemungkinan pemenggalan keliru |
| `KKVVK` | 7 | 0.01% | A – diftong | ab.stain, blues, brail.le, floem | Kluster + diftong + koda (stain, brail) — serapan |
| `VKKV` | 5 | 0.00% | B – serapan (koda kompleks) | akli, am.bu-ambu, asta, eflu.en | Onset ganda setelah vokal (akli, ambu) — anomali |
| `KVKKV` | 5 | 0.00% | B – serapan (koda kompleks) | a.su.ransi, nahwu, qudsi, raksi | Coda konsonan ganda + vokal akhir — serapan tidak baku |
| `KVKKVK` | 3 | 0.00% | B – serapan (koda kompleks) | kempas, timbul, tumpas | Sangat kompleks — kemungkinan pemenggalan keliru atau serapan tidak baku |
| `VKKVK` | 2 | 0.00% | B – serapan (koda kompleks) | allah, aplus | allah (all = kluster?) → anomali penulisan Arab |
| `KVKVKV` | 2 | 0.00% | C – anomali (pemenggalan keliru?) | a.rowana, kemudi | — |
| `KKKVV` | 2 | 0.00% | A – diftong | ek.sploi.ta.si, ek.sploi.tir | Kluster 3K + diftong (sploi) — serapan eksotik |
| `VKVV` | 2 | 0.00% | A – diftong | ingau, unyai | — |
| `KVVV` | 2 | 0.00% | A – diftong | ma.la.suai, riau | — |
| `VKKVKKVKVK` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | aldosteron | — |
| `VKKVKVKV` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | allahuma | — |
| `VKKVV` | 1 | 0.00% | A – diftong | antoi | — |
| `VKVKVK` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | anyang-anyangan | — |
| `KKVKV` | 1 | 0.00% | B – serapan | gladi | — |
| `KK` | 1 | 0.00% | C – anomali (singkatan) | hen.ry | Dua konsonan — kemungkinan singkatan |
| `KKK` | 1 | 0.00% | C – anomali (singkatan) | rönt.gen | Tiga konsonan — pemenggalan aksara asing (rönt-gen) |
| `KVKVV` | 1 | 0.00% | A – diftong | sagai | — |
| `KKVKKK` | 1 | 0.00% | B – serapan | sfinks | — |
| `KKKVKK` | 1 | 0.00% | B – serapan | sprint | — |
| `VVV` | 1 | 0.00% | A – diftong | uai | — |

---

## 4. Distribusi Lengkap Jenis Suku Kata

Dihitung per suku kata individual.

### Semua Jenis (Dasar + Prakategorial)

Total: **115,693** suku kata

| Pola Suku | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV` | 57,784 | 49.95% | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| `KVK` | 39,799 | 34.40% | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| `V` | 6,253 | 5.40% | a, a.a, a.ba, a.ba-a.ba |
| `VK` | 5,714 | 4.94% | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| `KKV` | 2,503 | 2.16% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `KKVK` | 1,352 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.sten.si, ae.ro.gram |
| `KVV` | 1,130 | 0.98% | a.bai, a.bai.ma.na, a.bau, a.boi |
| `KVKK` | 305 | 0.26% | ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans, ab.sorp.tif |
| `VV` | 222 | 0.19% | ae.lo.tro.pik, ae.o.lus, ae.ra.si, ae.ra.tor |
| `VKK` | 106 | 0.09% | alf, alz.hei.mer, am.bi.ens, ark.ti.ka |
| `KKVKK` | 87 | 0.08% | ae.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| `VKVK` | 65 | 0.06% | akhir, angah, angan, angel |
| `KKKVK` | 62 | 0.05% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| `VVK` | 59 | 0.05% | aes.te.ti.ka, aib, aih, aik.mo.fo.bi.a |
| `KKKV` | 51 | 0.04% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `KVVK` | 39 | 0.03% | a.dion, a.mien, am.piang, a.part.heid |
| `KVKV` | 28 | 0.02% | ae.ro.bi.o.logi, ag.ri.o.logi, ak.li.masi, am.ba.rile |
| `K` | 25 | 0.02% | b, c, d, f |
| `KKVV` | 24 | 0.02% | cut.brai, dis.plai, drai, ein.stei.ni.um |
| `VKV` | 20 | 0.02% | akhi.rat, akhi.rul.ka.lam, akhi.ru.sa.nah, angi.na |
| `KVKVK` | 15 | 0.01% | belur, colok, en.te.bering, kakas |
| `KVKKK` | 9 | 0.01% | gi.ga.hertz, hertz, karst, ki.lo.hertz |
| `KKVVK` | 7 | 0.01% | ab.stain, blues, brail.le, floem |
| `VKKV` | 5 | 0.00% | akli, am.bu-ambu, asta, eflu.en |
| `KVKKV` | 5 | 0.00% | a.su.ransi, nahwu, qudsi, raksi |
| `KVKKVK` | 3 | 0.00% | kempas, timbul, tumpas |
| `VKKVK` | 2 | 0.00% | allah, aplus |
| `KVKVKV` | 2 | 0.00% | a.rowana, kemudi |
| `KKKVV` | 2 | 0.00% | ek.sploi.ta.si, ek.sploi.tir |
| `VKVV` | 2 | 0.00% | ingau, unyai |
| `KVVV` | 2 | 0.00% | ma.la.suai, riau |
| `VKKVKKVKVK` | 1 | 0.00% | aldosteron |
| `VKKVKVKV` | 1 | 0.00% | allahuma |
| `VKKVV` | 1 | 0.00% | antoi |
| `VKVKVK` | 1 | 0.00% | anyang-anyangan |

### Perbandingan: Dasar vs Prakategorial

| Pola Suku | Dasar (%) | Prakategorial (%) | Selisih |
|---|---:|---:|---:|
| `KV` | 50.27% | 39.88% | 10.39pp |
| `KVK` | 33.93% | 48.93% | 15.00pp |
| `V` | 5.46% | 3.61% | 1.85pp |
| `VK` | 4.96% | 4.19% | 0.77pp |
| `KKV` | 2.23% | 0.14% | 2.09pp |
| `KKVK` | 1.19% | 0.53% | 0.66pp |
| `KVV` | 0.94% | 2.14% | 1.20pp |
| `KVKK` | 0.27% | 0.03% | 0.24pp |
| `VV` | 0.19% | 0.11% | 0.08pp |
| `VKK` | 0.09% | 0.00% | 0.09pp |
| `KKVKK` | 0.08% | 0.00% | 0.08pp |
| `VKVK` | 0.05% | 0.25% | 0.20pp |
| `KKKVK` | 0.06% | 0.00% | 0.06pp |
| `VVK` | 0.05% | 0.11% | 0.06pp |
| `KKKV` | 0.05% | 0.00% | 0.05pp |

---

## 5. Distribusi Pola Kata (Top 30)

Pola kata = gabungan pola tiap suku kata.

### Kata Dasar (Top 30)

Total pola unik: **1,958**

| Pola Kata | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV.KVK` | 7,516 | 19.17% | ba.bad, ba.bah, ba.bak, ba.bal |
| `KVK.KVK` | 4,010 | 10.23% | bab.las, baf.tah, bah.kan, bak.dul |
| `KV.KV.KVK` | 2,495 | 6.36% | ba.ba.kan, ba.ba.tan, ba.bu.rin, ba.du.yut |
| `KV.KV` | 1,723 | 4.40% | ba.ba, ba.be, ba.bi, ba.bu |
| `KV.KV.KV` | 1,285 | 3.28% | ba.bi.bu, ba.bu.ru, ba.da.ni, ba.da.ri |
| `KVK.KV` | 933 | 2.38% | baf.ta, bah.ri, bah.wa, bak.da |
| `KV.KVK.KVK` | 839 | 2.14% | ba.dan.dang, ba.lan.dong, ba.lang.kep, ba.lis.tik |
| `KVK.KV.KVK` | 787 | 2.01% | bak.ba.rak, bak.te.rin, bal.se.ros, ban.ci.ngah |
| `KVK` | 769 | 1.96% | bab, bad, bah, bak |
| `V.KVK` | 743 | 1.90% | a.bad, a.bah, a.ban, a.bang |
| `KVK.KV.KV` | 607 | 1.55% | bah.te.ra, bak.da.hu, bak.te.ri, bam.ba.ru |
| `KV.KV.KV.KV` | 601 | 1.53% | ba.ha.du.ri, ba.ji-ba.ji, ba.le-ba.le, ba.le.ri.na |
| `VK.KVK` | 594 | 1.52% | ab.dul, ab.jad, ab.lur, ab.nus |
| `KV.KV.KV.KVK` | 517 | 1.32% | ba.ga.so.sis, ba.ha.ri.wan, ba.ha.sa.wan, ba.la.ni.tis |
| `KV.VK` | 502 | 1.28% | ba.al, ba.ang, ba.id, ba.ik |
| `KV.KV.VK` | 386 | 0.98% | ba.ki.ak, ba.li.an, ba.li.em, ba.ni.an |
| `KV.KVV` | 334 | 0.85% | ba.dai, ba.dau, ba.gai, ba.gau |
| `KV.KVK.KV` | 285 | 0.73% | ba.bong.ko, ba.gin.da, ba.pan.da, ba.rong.ko |
| `KV.KVK.KV.KVK` | 265 | 0.68% | ba.jang-ba.jang, ba.ngun-ba.ngun, ba.rat-ba.rat, ba.rung-ba.rung |
| `V.KV.KVK` | 262 | 0.67% | a.ba.kus, a.bi.din, a.bi.lah, a.bi.sal |
| `VK.KV.KVK` | 259 | 0.66% | ab.do.men, ab.la.tif, ab.ra.sif, ab.ri.kos |
| `KVK.KV.KV.KV` | 254 | 0.65% | bah.wa.sa.nya, ben.da.ha.ra, ben.da.ha.ri, ber.di.ka.ri |
| `KKV.KVK` | 236 | 0.60% | bla.bar, bla.nguh, bla.zer, ble.bes |
| `KVK.KV.KV.KVK` | 209 | 0.53% | bak.te.ri.sid, ban.se.ko.wer, bar.ba.ri.tas, bar.bi.tu.rat |
| `KVK.KKVK` | 196 | 0.50% | ban.drang, ban.drek, ban.dring, ban.drol |
| `KV.V.KVK` | 164 | 0.42% | ba.a.suh, bi.a.dab, bi.a.dat, bi.a.wak |
| `KVK.KVV` | 161 | 0.41% | bak.tau, bang.kai, bang.sai, ban.sai |
| `KV.KV.KV.KV.KV` | 160 | 0.41% | ba.lo.ni.sa.si, ba.ru.na.wa.ti, be.to.ni.sa.si, ca.ra.ka.wa.ti |
| `KV.KV.KV.VK` | 152 | 0.39% | ba.hi.mi.ah, ba.si.di.um, ba.ta.li.on, ba.ti.ni.ah |
| `KKVK` | 150 | 0.38% | blek, bleng, blog, blok |

### Prakategorial (semua pola)

Total pola unik: **58**

| Pola Kata | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV.KVK` | 622 | 37.63% | ba.bak, ba.ban, ba.bang, ba.bar |
| `KVK.KVK` | 280 | 16.94% | ban.cang, ban.cut, ban.dung, bang.kang |
| `KV.KV.KVK` | 152 | 9.20% | be.la.hak, be.la.lang, be.la.ngah, be.la.sut |
| `V.KVK` | 98 | 5.93% | a.ben, a.buk, a.cah, a.can |
| `KV.KV` | 78 | 4.72% | ba.da, ba.de, ba.ti, be.lu |
| `VK.KVK` | 66 | 3.99% | ab.das, ab.rek, am.bak, am.bal |
| `KV.KVK.KVK` | 63 | 3.81% | be.ling.kang, be.ling.sat, be.long.kot, be.lon.tang |
| `KV.VK` | 53 | 3.21% | ci.ar, co.ang, cu.ar, cu.at |
| `KV.KVV` | 44 | 2.66% | ba.dai, ba.jau, ba.ngai, be.lau |
| `KVK.KV` | 25 | 1.51% | dam.ba, dang.ka, jel.ma, lan.da |
| `KVK.KVV` | 16 | 0.97% | cer.kau, dem.bai, lam.bai, lan.dau |
| `KV.KV.KV` | 16 | 0.97% | ge.ju.ju, ge.li.gi, ge.lo.so, ge.ra.pu |
| `V.KV` | 12 | 0.73% | a.co, a.cu, a.du, a.ju |
| `KVK.KKVK` | 10 | 0.60% | bes.tral, cong.klang, deng.kleng, dom.pleng |
| `KVK.KV.KVK` | 9 | 0.54% | gen.ta.yang, hem.ba.lang, jem.pa.lit, sen.do.rong |
| `KV.KV.VK` | 8 | 0.48% | be.li.ak, ge.ri.ak, je.ra.it, ke.li.ar |
| `VKVK` | 7 | 0.42% | angah, angan, engah, onyok |
| `KVK` | 7 | 0.42% | dab, dep, dub, dup |
| `KVK.KV.KV` | 7 | 0.42% | gem.pi.ta, gun.da.la, ken.da.na, leng.ke.sa |
| `KV.KV.KVV` | 6 | 0.36% | ce.ra.tai, ce.ri.cau, ge.le.pai, ge.ri.nyau |
| `VK.KVV` | 5 | 0.30% | am.bai, am.bau, am.pai, an.dai |
| `VK.KKVK` | 5 | 0.30% | am.bring, am.prung, om.byok, om.preng |
| `KV.KVK.KV` | 5 | 0.30% | be.rin.da, je.rem.ba, pe.rin.ci, se.ran.ta |
| `VVK` | 4 | 0.24% | iur, uar, uis, uit |
| `VK.KVK.VK.KVK` | 4 | 0.24% | om.bang-am.bing, ub.rak-ab.rik, um.bang-am.bing, un.dung-un.dung |
| `V.KVV` | 3 | 0.18% | a.cau, a.wai |
| `KV.VV` | 3 | 0.18% | bi.au, li.au, su.ai |
| `V.KVK.V.KVK` | 3 | 0.18% | o.lang-a.ling, o.pak-a.pik |
| `V.KV.KV` | 2 | 0.12% | a.ca.ra, u.ta.ra |
| `V.KV.KV.KVK` | 2 | 0.12% | a.ko.mo.dir, a.wa.le.ngas |
| `VK.KV` | 2 | 0.12% | an.ja, ung.si |
| `VK.KV.KVK` | 2 | 0.12% | an.ta.mir, ih.ti.mal |
| `KV.KV.KV.KV` | 2 | 0.12% | ba.ta-ba.ta, ra.ja.le.la |
| `KVK.KKV.KVK` | 2 | 0.12% | dis.kre.dit, kon.sta.tir |
| `KKVK` | 2 | 0.12% | drop, jreng |
| `KV.V` | 2 | 0.12% | du.a, si.a |
| `KVKVK` | 2 | 0.12% | gorek, tutul |
| `KKVK.KVK` | 2 | 0.12% | grem.pel, plas.pas |
| `KV.KVK.KVV` | 2 | 0.12% | je.rung.kau, ke.lem.pai |
| `KV.KV.V` | 2 | 0.12% | pe.ti.a, se.di.a |
| `VK.KVKK` | 1 | 0.06% | ab.sorb |
| `V.KV.KVK.KVK` | 1 | 0.06% | a.di.han.tar |
| `KVK.KV.KVV` | 1 | 0.06% | beng.ka.lai |
| `KVK.KVK.KVK` | 1 | 0.06% | bom.bar.dir |
| `KVK.KKV` | 1 | 0.06% | can.dra |
| `KKV.KVK` | 1 | 0.06% | dri.bel |
| `KVK.KVK.V.KVK` | 1 | 0.06% | geb.yah-u.yah |
| `KV.KV.KVK.VK` | 1 | 0.06% | ge.la.yang.an |
| `KV.KV.KVK.KVK` | 1 | 0.06% | ge.li.man.tang |
| `KVK.KVK.KVK.KVK` | 1 | 0.06% | gem.bar-gem.bor |
| `KV.KV.VV` | 1 | 0.06% | ke.ri.au |
| `KV.KVK.KV.KVK` | 1 | 0.06% | ku.nar-ku.nar |
| `VKVK.VKVK` | 1 | 0.06% | onyah-anyih |
| `KKV.KV.KV` | 1 | 0.06% | pra.ki.ra |
| `KV.KVK.KV.KV` | 1 | 0.06% | se.lem.ba.na |
| `KV.V.KVK` | 1 | 0.06% | si.a.kon |
| `KVK.KVK.KV` | 1 | 0.06% | tak.mur.ni |
| `VKVV` | 1 | 0.06% | unyai |

---

## 6. Suku Kata Terbuka vs Tertutup

Suku **terbuka** = berakhir vokal (pola berakhir V atau VV).
Suku **tertutup** = berakhir konsonan.

| Jenis | Terbuka | Tertutup | Rasio Terbuka |
|---|---:|---:|---:|
| Kata Dasar | 66,385 | 45,707 | 59.22% |
| Prakategorial | 1,653 | 1,948 | 45.90% |

---

## 7. Kluster Konsonan (KK-)

Suku kata yang diawali dua atau lebih konsonan — umumnya kata serapan.

| Jenis | Suku KK- | Total Suku | % |
|---|---:|---:|---:|
| Kata Dasar | 4,069 | 112,092 | 3.63% |
| Prakategorial | 24 | 3,601 | 0.67% |

#### Distribusi Pola KK- (Kata Dasar)

| Pola | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KKV` | 2498 | 2.23% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `KKVK` | 1333 | 1.19% | a.bi.o.sfer, ab.ro.sfer, ab.sten.si, ae.ro.gram |
| `KKVKK` | 87 | 0.08% | ae.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| `KKKVK` | 62 | 0.06% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| `KKKV` | 51 | 0.05% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `KKVV` | 24 | 0.02% | cut.brai, dis.plai, drai, ein.stei.ni.um |
| `KKVVK` | 7 | 0.01% | ab.stain, blues, brail.le, floem |
| `KKKVV` | 2 | 0.00% | ek.sploi.ta.si, ek.sploi.tir |
| `KKVKV` | 1 | 0.00% | gladi |
| `KK` | 1 | 0.00% | hen.ry |
| `KKK` | 1 | 0.00% | rönt.gen |
| `KKVKKK` | 1 | 0.00% | sfinks |
| `KKKVKK` | 1 | 0.00% | sprint |

---

## 8. Diftong (ai, au, oi, ei)

| Jenis | Suku mengandung diftong | Total Suku | % |
|---|---:|---:|---:|
| Kata Dasar | 1,404 | 112,092 | 1.25% |
| Prakategorial | 86 | 3,601 | 2.39% |

#### Distribusi Pola Diftong (Dasar + Prakategorial)

| Pola | Jumlah | Contoh pemenggalan |
|---|---:|---|
| `KVV` | 1130 | a.bai, a.bai.ma.na, a.bau, a.boi |
| `VV` | 222 | ae.lo.tro.pik, ae.o.lus, ae.ra.si, ae.ra.tor |
| `VVK` | 59 | aes.te.ti.ka, aib, aih, aik.mo.fo.bi.a |
| `KVVK` | 39 | a.dion, a.mien, am.piang, a.part.heid |
| `KKVV` | 24 | cut.brai, dis.plai, drai, ein.stei.ni.um |
| `KKVVK` | 7 | ab.stain, blues, brail.le, floem |
| `KKKVV` | 2 | ek.sploi.ta.si, ek.sploi.tir |
| `VKVV` | 2 | ingau, unyai |
| `KVVV` | 2 | ma.la.suai, riau |
| `VKKVV` | 1 | antoi |
| `KVKVV` | 1 | sagai |
| `VVV` | 1 | uai |

---

## 9. Isu Menarik untuk Dikaji

### 9.1 Dominasi Pola KV (Warisan Austronesia)

Suku bertipe **KV** adalah yang paling dominan (~50%), diikuti **KVK** (~34%). Ini konsisten dengan tipologi rumpun bahasa Melayu-Polinesia yang menyukai suku terbuka (CV).

**Pertanyaan penelitian:** Apakah rasio suku terbuka berbeda signifikan antara kata asli Indonesia dan kata serapan?

### 9.2 Pola Kata Paling Produktif

Tiga pola kata paling umum pada kata dasar: **`KV.KVK`, `KVK.KVK`, `KV.KV.KVK`**.

Kata dasar Melayu-Indonesia cenderung berstruktur dua suku kata (disyllabic) dengan suku akhir tertutup.

**Pertanyaan penelitian:** Adakah korelasi antara frekuensi pemakaian kata (dari `searched_phrase`) dan pola suku kata?

### 9.3 Kluster Konsonan sebagai Penanda Kata Serapan

Kluster KK- sangat jarang di prakategorial (0.67%) vs kata dasar (3.63%). Ini mendukung hipotesis bahwa prakategorial merupakan warisan Melayu kuno yang fonotaktiknya lebih "murni".

**Pertanyaan penelitian:** Dapatkah pola suku kata digunakan sebagai fitur untuk mengklasifikasikan otomatis kata serapan vs kata asli?

### 9.4 Kata Satu Suku (Monosilabik)

Kata dasar monosilabik: **1341** (3.42%). Prakategorial: **23** (1.39%). Kemunculannya yang terbatas mencerminkan preferensi fonotaktik terhadap kata polisillabik.

**Pertanyaan penelitian:** Apa distribusi kelas kata (lex_class) pada kata dasar monosilabik?

### 9.5 Kata Polisuku Panjang (≥5 suku)

Kata dasar ≥5 suku: **3868** (9.87%). Umumnya serapan ilmiah (Yunani/Latin).

**Pertanyaan penelitian:** Adakah batas persepsi "kata panjang" di angka 4 suku?

### 9.6 Perbedaan Dasar vs Prakategorial

Prakategorial 80% berstruktur dua suku kata (dasar hanya 46%). Suku terbuka prakategorial (45.90%) lebih rendah dari kata dasar (59.22%), artinya prakategorial justru lebih banyak suku tertutup — menarik karena berlawanan dengan hipotesis Austronesia.

**Pertanyaan penelitian:** Apakah dominasi KVK di prakategorial mencerminkan bias leksikografi KBBI, atau memang pola fonotaktik yang khas?

### 9.7 Diftong dan Monoftongisasi

Diftong lebih banyak di prakategorial (2.39%) dibanding kata dasar (1.25%).

**Pertanyaan penelitian:** Apakah kemunculan diftong berkorelasi dengan asal bahasa? Diftong /au/ dan /ai/ dominan pada kata Melayu asli, sedangkan /ei/ hampir seluruhnya dari kata serapan.

### 9.8 Pola Anomali — Perlu Verifikasi Data

Beberapa pola yang muncul dalam data kemungkinan adalah kesalahan pemenggalan:

| Pola | Jumlah | Contoh | Seharusnya |
|---|---:|---|---|
| `VKVK` | 65 | akhir, angah, angan, angel | Suku dipecah: ang.ah → VK.VK, atau a.khir → V.KVK (kh = K tunggal) |
| `KVKV` | 28 | ae.ro.bi.o.logi, ag.ri.o.logi, ak.li.masi, am.ba.rile | lo.gi → KV.KV, bukan KVKV satu suku |
| `VKV` | 20 | akhi.rat, akhi.rul.ka.lam, akhi.ru.sa.nah, angi.na | Kemungkinan suku parsial dari digraf |
| `KVKVK` | 15 | belur, colok, en.te.bering, kakas | Lima bunyi satu suku — hampir pasti keliru |

---

## Referensi

- PUEBI (Pedoman Umum Ejaan Bahasa Indonesia) — Aturan pemenggalan kata
- Adelaar, A. (1992). *Proto Malayo-Javanic.* KITLV Press.
- Lapoliwa, H. (1981). *A Generative Approach to the Phonology of Bahasa Indonesia.* Pacific Linguistics.
- Sneddon, J.N. (2003). *The Indonesian Language: Its History and Role in Modern Society.*
- Data: KBBI4 (Kamus Besar Bahasa Indonesia edisi ke-4), diproses dalam Kateglo 2.0
