# Analisis Pola Suku Kata Bahasa Indonesia
## Kata Dasar dan Prakategorial

**Tanggal analisis:** 2026-03-05
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
| Total entri | 39.671 | 1.669 | 41.340 |
| Dilewati (multi-kata/kosong) | 467 | 16 | 483 |
| Total suku kata dianalisis | 112.308 | 3.610 | 115.918 |

---

## 1. Distribusi Jumlah Suku Kata per Kata

### Kata Dasar

| Jumlah Suku | Jumlah Kata | % |
|---:|---:|---:|
| 1 | 1.283 | 3.27% |
| 2 | 18.053 | 46.05% |
| 3 | 10.284 | 26.23% |
| 4 | 5.674 | 14.47% |
| 5 | 2.575 | 6.57% |
| 6 | 969 | 2.47% |
| 7 | 271 | 0.69% |
| 8 | 78 | 0.20% |
| 9 | 14 | 0.04% |
| 10 | 1 | 0.00% |
| 11 | 1 | 0.00% |
| 14 | 1 | 0.00% |

### Prakategorial

| Jumlah Suku | Jumlah Kata | % |
|---:|---:|---:|
| 1 | 16 | 0.97% |
| 2 | 1.336 | 80.82% |
| 3 | 282 | 17.06% |
| 4 | 19 | 1.15% |

---

## 2. Perbandingan dengan Tipe Kanonik

Sebelas tipe suku kata yang diakui dalam fonologi bahasa Indonesia (berdasarkan rujukan).

| # | Tipe | Contoh (Ref) | Ada di Data | Jumlah | % dari total suku | Contoh pemenggalan |
|---:|---|---|:---:|---:|---:|---|
| 1 | `KV` | `ka.mu` | ✅ | 57.884 | 49.94% | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| 2 | `KVK` | `pak.sa` | ✅ | 39.854 | 34.38% | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| 3 | `V` | `a.ku` | ✅ | 6.492 | 5.60% | A, a.a, a.ba, a.ba-a.ba |
| 4 | `VK` | `il.mu` | ✅ | 5.754 | 4.96% | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| 5 | `KKV` | `dra.ma` | ✅ | 2.505 | 2.16% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| 6 | `KKVK` | `trak.tor` | ✅ | 1.356 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.sten.si, a.e.ro.gram |
| 7 | `KVKK` | `teks.til` | ✅ | 305 | 0.26% | ab.sorb, ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans |
| 8 | `KKVKK` | `kom.pleks` | ✅ | 87 | 0.08% | a.e.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
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
| `VKVK` (14) → `VKKVK` | angah | ng = n+g = KK, bukan K tunggal |
| `VKV` (3) → `VKKV` | ukhuwah | kh = k+h = KK |
| `VKK` (104) → bertambah | alf, am.bi.ens | kh/ng dihitung dua karakter → lebih banyak koda ganda |
| `KKVV` (25) → bertambah | al.zhei.mer, dis.plai | ny/ng tidak dinormalisasi, vokal berdampingan tetap VV |

**Pola anomali yang tetap muncul** meski tanpa normalisasi digraf/diftong (anomali "murni"):

| Pola | Jumlah | Contoh pemenggalan | Dugaan masalah |
|---|---:|---|---|
| `VKK` | 493 | akh, akh.bar, akh.lak | — |
| `K` | 26 | à, B, C | — |
| `VKKVK` | 15 | Allah, angah, angan | — |
| `KVKVK` | 7 | colok, gorek, kakas | — |
| `KVKKV` | 5 | nahwu, penge-, qudsi | — |
| `KVKV` | 4 | beka, kaki, kali | — |
| `VKV` | 3 | -asi, ba.tu.ori, ki.asi | — |
| `KVKKVK` | 3 | kempas, timbul, tumpas | — |
| `KKKVKK` | 3 | spring, sprint, streng | — |
| `KVKVKK` | 2 | kupang, selang | — |
| `VKKVKVKV` | 1 | Allahuma | — |
| `VKKV` | 1 | am.bu-ambu | — |

| Pola | Jumlah | % | Kategori | Contoh pemenggalan | Keterangan |
|---|---:|---:|---|---|---|
| `KVV` | 1121 | 0.97% | A – diftong | a.bai, A.bai, a.bai.ma.na, a.bau | |
| `VV` | 156 | 0.13% | A – diftong | ai, ai.boh.fo.bi.a, ai.gi.a.li.um, ai.gi.a.lo.fi.li | |
| `VKK` | 104 | 0.09% | C – anomali (pemenggalan keliru?) | alf, am.bi.ens, ark.ti.ka, au.di.ens | |
| `VVK` | 40 | 0.03% | A – diftong | aib, aih, aik.mo.fo.bi.a, ail | |
| `KVVK` | 30 | 0.03% | A – diftong | a.part.heid, as.tro.naut, at.rium, bauk.sit | |
| `K` | 26 | 0.02% | C – anomali (pemenggalan keliru?) | à, B, C, D | |
| `KKVV` | 25 | 0.02% | A – diftong | al.zhei.mer, cut.brai, dis.plai, drai | |
| `VKVK` | 14 | 0.01% | C – anomali (pemenggalan keliru?) | angah, angan, engah, enyak | |
| `KVKVK` | 9 | 0.01% | C – anomali (pemenggalan keliru?) | colok, gorek, kakas, kupang | |
| `KKVVK` | 7 | 0.01% | A – diftong | ab.stain, blues, brail.le, floem | |
| `KVKV` | 5 | 0.00% | C – anomali (pemenggalan keliru?) | beka, kaki, kali, penge- | |
| `KVKKV` | 4 | 0.00% | B – serapan (koda kompleks) | nahwu, qudsi, raksi, tendo | |
| `VKV` | 3 | 0.00% | C – anomali (pemenggalan keliru?) | -asi, ba.tu.ori, ki.asi | |
| `KVKKVK` | 3 | 0.00% | B – serapan (koda kompleks) | kempas, timbul, tumpas | |
| `VKKVK` | 2 | 0.00% | B – serapan (koda kompleks) | Allah, aplus | |
| `KKKVV` | 2 | 0.00% | A – diftong | ek.sploi.ta.si, ek.sploi.tir | |
| `VKKVKVKV` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | Allahuma | |
| `VKKV` | 1 | 0.00% | B – serapan (koda kompleks) | am.bu-ambu | |
| `KK` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | hen.ry | |
| `KVVV` | 1 | 0.00% | A – diftong | Riau | |
| `KKKK` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | rönt.gen | |
| `KVKVV` | 1 | 0.00% | A – diftong | sagai | |
| `KKVKKK` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | sfinks | |
| `KKKVKK` | 1 | 0.00% | C – anomali (pemenggalan keliru?) | sprint | |

---

## 4. Distribusi Lengkap Jenis Suku Kata

Dihitung per suku kata individual.

### Semua Jenis (Dasar + Prakategorial)

Total: **115.918** suku kata

| Pola Suku | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV` | 57.884 | 49.94% | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| `KVK` | 39.854 | 34.38% | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| `V` | 6.492 | 5.60% | A, a.a, a.ba, a.ba-a.ba |
| `VK` | 5.754 | 4.96% | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| `KKV` | 2.505 | 2.16% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `KKVK` | 1.356 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.sten.si, a.e.ro.gram |
| `KVV` | 1.121 | 0.97% | a.bai, A.bai, a.bai.ma.na, a.bau |
| `KVKK` | 305 | 0.26% | ab.sorb, ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans |
| `VV` | 156 | 0.13% | ai, ai.boh.fo.bi.a, ai.gi.a.li.um, ai.gi.a.lo.fi.li |
| `VKK` | 104 | 0.09% | alf, am.bi.ens, ark.ti.ka, au.di.ens |
| `KKVKK` | 87 | 0.08% | a.e.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| `KKKVK` | 62 | 0.05% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| `KKKV` | 51 | 0.04% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `VVK` | 40 | 0.03% | aib, aih, aik.mo.fo.bi.a, ail |
| `KVVK` | 30 | 0.03% | a.part.heid, as.tro.naut, at.rium, bauk.sit |
| `K` | 26 | 0.02% | à, B, C, D |
| `KKVV` | 25 | 0.02% | al.zhei.mer, cut.brai, dis.plai, drai |
| `VKVK` | 14 | 0.01% | angah, angan, engah, enyak |
| `KVKVK` | 9 | 0.01% | colok, gorek, kakas, kupang |
| `KVKKK` | 9 | 0.01% | gi.ga.hertz, hertz, karst, ki.lo.hertz |
| `KKVVK` | 7 | 0.01% | ab.stain, blues, brail.le, floem |
| `KVKV` | 5 | 0.00% | beka, kaki, kali, penge- |
| `KVKKV` | 4 | 0.00% | nahwu, qudsi, raksi, tendo |
| `VKV` | 3 | 0.00% | -asi, ba.tu.ori, ki.asi |
| `KVKKVK` | 3 | 0.00% | kempas, timbul, tumpas |
| `VKKVK` | 2 | 0.00% | Allah, aplus |
| `KKKVV` | 2 | 0.00% | ek.sploi.ta.si, ek.sploi.tir |
| `VKKVKVKV` | 1 | 0.00% | Allahuma |
| `VKKV` | 1 | 0.00% | am.bu-ambu |
| `KK` | 1 | 0.00% | hen.ry |
| `KVVV` | 1 | 0.00% | Riau |
| `KKKK` | 1 | 0.00% | rönt.gen |
| `KVKVV` | 1 | 0.00% | sagai |
| `KKVKKK` | 1 | 0.00% | sfinks |
| `KKKVKK` | 1 | 0.00% | sprint |

### Perbandingan: Dasar vs Prakategorial

| Pola Suku | Dasar (%) | Prakategorial (%) | Selisih |
|---|---:|---:|---:|
| `KV` | 50.26% | 39.78% | 10.48pp |
| `KVK` | 33.91% | 48.95% | -15.04pp |
| `V` | 5.66% | 3.85% | 1.81pp |
| `VK` | 4.99% | 4.27% | 0.72pp |
| `KKV` | 2.23% | 0.14% | 2.09pp |
| `KKVK` | 1.19% | 0.53% | 0.66pp |
| `KVV` | 0.93% | 2.16% | -1.23pp |
| `KVKK` | 0.27% | 0.03% | 0.24pp |
| `VV` | 0.14% | 0.11% | 0.03pp |
| `VKK` | 0.09% | 0.00% | 0.09pp |
| `KKVKK` | 0.08% | 0.00% | 0.08pp |
| `KKKVK` | 0.06% | 0.00% | 0.06pp |
| `KKKV` | 0.05% | 0.00% | 0.05pp |
| `VVK` | 0.03% | 0.03% | 0.00pp |
| `KVVK` | 0.03% | 0.00% | 0.03pp |
| `K` | 0.02% | 0.00% | 0.02pp |
| `KKVV` | 0.02% | 0.00% | 0.02pp |
| `VKVK` | 0.01% | 0.11% | -0.10pp |
| `KVKVK` | 0.01% | 0.06% | -0.05pp |
| `KVKKK` | 0.01% | 0.00% | 0.01pp |
| `KKVVK` | 0.01% | 0.00% | 0.01pp |

---

## 5. Distribusi Pola Kata (Top 30)

Pola kata = gabungan pola tiap suku kata.

### Kata Dasar (Top 30)

Total pola unik: **1.929**

| Pola Kata | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV.KVK` | 7.520 | 19.18% | ba.bad, ba.bah, ba.bak, ba.bal |
| `KVK.KVK` | 4.010 | 10.23% | bab.las, baf.tah, bah.kan, bak.dul |
| `KV.KV.KVK` | 2.495 | 6.36% | ba.ba.kan, ba.ba.tan, ba.bu.rin, ba.du.yut |
| `KV.KV` | 1.728 | 4.41% | ba.ba, ba.be, ba.bi, ba.bu |
| `KV.KV.KV` | 1.287 | 3.28% | ba.bi.bu, ba.bu.ru, ba.da.ni, ba.da.ri |
| `KVK.KV` | 933 | 2.38% | baf.ta, bah.ri, bah.wa, bak.da |
| `KV.KVK.KVK` | 839 | 2.14% | ba.dan.dang, ba.lan.dong, ba.lang.kep, ba.lis.tik |
| `KVK.KV.KVK` | 787 | 2.01% | bak.ba.rak, bak.te.rin, bal.se.ros, ban.ci.ngah |
| `V.KVK` | 771 | 1.97% | a.bad, a.bah, a.ban, a.bang |
| `KVK` | 769 | 1.96% | bab, bad, bah, bak |
| `KVK.KV.KV` | 609 | 1.55% | bah.te.ra, bak.da.hu, bak.te.ri, bam.ba.ru |
| `KV.KV.KV.KV` | 605 | 1.54% | ba.ha.du.ri, ba.ji-ba.ji, ba.le-ba.le, ba.le.ri.na |
| `VK.KVK` | 594 | 1.52% | ab.dul, ab.jad, ab.lur, ab.nus |
| `KV.KV.KV.KVK` | 517 | 1.32% | ba.ga.so.sis, ba.ha.ri.wan, ba.ha.sa.wan, ba.la.ni.tis |
| `KV.VK` | 504 | 1.29% | ba.al, Ba.al, ba.ang, ba.id |
| `KV.KV.VK` | 387 | 0.99% | ba.ki.ak, ba.li.an, Ba.li.em, ba.ni.an |
| `KV.KVV` | 333 | 0.85% | ba.dai, ba.dau, ba.gai, ba.gau |
| `KV.KVK.KV` | 285 | 0.73% | ba.bong.ko, ba.gin.da, ba.pan.da, ba.rong.ko |
| `V.KV.KVK` | 266 | 0.68% | a.ba.kus, a.bi.din, a.bi.lah, a.bi.sal |
| `KV.KVK.KV.KVK` | 265 | 0.68% | ba.jang-ba.jang, ba.ngun-ba.ngun, ba.rat-ba.rat, ba.rung-ba.rung |
| `VK.KV.KVK` | 259 | 0.66% | ab.do.men, ab.la.tif, ab.ra.sif, ab.ri.kos |
| `KVK.KV.KV.KV` | 254 | 0.65% | bah.wa.sa.nya, ben.da.ha.ra, ben.da.ha.ri, ber.di.ka.ri |
| `KKV.KVK` | 236 | 0.60% | bla.bar, bla.nguh, bla.zer, ble.bes |
| `KVK.KV.KV.KVK` | 209 | 0.53% | bak.te.ri.sid, ban.se.ko.wer, bar.ba.ri.tas, bar.bi.tu.rat |
| `KVK.KKVK` | 196 | 0.50% | ban.drang, ban.drek, ban.dring, ban.drol |
| `KV.V.KVK` | 166 | 0.42% | ba.a.suh, bi.a.dab, bi.a.dat, bi.a.wak |
| `KVK.KVV` | 161 | 0.41% | bak.tau, bang.kai, bang.sai, ban.sai |
| `KV.KV.KV.KV.KV` | 160 | 0.41% | ba.lo.ni.sa.si, ba.ru.na.wa.ti, be.to.ni.sa.si, ca.ra.ka.wa.ti |
| `KV.KV.KV.VK` | 152 | 0.39% | ba.hi.mi.ah, ba.si.di.um, ba.ta.li.on, ba.ti.ni.ah |
| `KKVK` | 150 | 0.38% | blek, bleng, blog, blok |

### Prakategorial (semua pola)

Total pola unik: **57**

| Pola Kata | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV.KVK` | 622 | 37.63% | ba.bak, ba.ban, ba.bang, ba.bar |
| `KVK.KVK` | 280 | 16.94% | ban.cang, ban.cut, ban.dung, bang.kang |
| `KV.KV.KVK` | 152 | 9.20% | be.la.hak, be.la.lang, be.la.ngah, be.la.sut |
| `V.KVK` | 101 | 6.11% | a.ben, a.buk, a.cah, a.can |
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
| `KVK` | 7 | 0.42% | dab, dep, dub, dup |
| `KVK.KV.KV` | 7 | 0.42% | gem.pi.ta, gun.da.la, ken.da.na, leng.ke.sa |
| `KV.KV.KVV` | 6 | 0.36% | ce.ra.tai, ce.ri.cau, ge.le.pai, ge.ri.nyau |
| `VK.KVV` | 5 | 0.30% | am.bai, am.bau, am.pai, an.dai |
| `VK.KKVK` | 5 | 0.30% | am.bring, am.prung, om.byok, om.preng |
| `KV.KVK.KV` | 5 | 0.30% | be.rin.da, je.rem.ba, pe.rin.ci, se.ran.ta |
| `V.KVV` | 4 | 0.24% | a.cau, a.wai, u.nyai |
| `VKVK` | 4 | 0.24% | angah, angan, engah |
| `V.KVK.V.KVK` | 4 | 0.24% | o.lang-a.ling, o.nyah-a.nyih, o.pak-a.pik |
| `VK.KVK.VK.KVK` | 4 | 0.24% | om.bang-am.bing, ub.rak-ab.rik, um.bang-am.bing, un.dung-un.dung |
| `KV.VV` | 3 | 0.18% | bi.au, li.au, su.ai |
| `V.VK` | 3 | 0.18% | i.ur, u.is, u.it |
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
| `KKV.KV.KV` | 1 | 0.06% | pra.ki.ra |
| `KV.KVK.KV.KV` | 1 | 0.06% | se.lem.ba.na |
| `KV.V.KVK` | 1 | 0.06% | si.a.kon |
| `KVK.KVK.KV` | 1 | 0.06% | tak.mur.ni |
| `VVK` | 1 | 0.06% | uar |

---

## 6. Suku Kata Terbuka vs Tertutup

Suku **terbuka** = berakhir vokal (pola berakhir V atau VV).
Suku **tertutup** = berakhir konsonan.

| Jenis | Terbuka | Tertutup | Rasio Terbuka |
|---|---:|---:|---:|
| Kata Dasar | 66.590 | 45.718 | 59.29% |
| Prakategorial | 1.662 | 1.948 | 46.04% |

---

## 7. Kluster Konsonan (KK-)

Suku kata yang diawali dua atau lebih konsonan — umumnya kata serapan.

| Jenis | Suku KK- | Total Suku | % |
|---|---:|---:|---:|
| Kata Dasar | 4.075 | 112.308 | 3.63% |
| Prakategorial | 24 | 3.610 | 0.66% |

#### Distribusi Pola KK- (Kata Dasar)

| Pola | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KKV` | 2.505 | 2.23% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `KKVK` | 1.356 | 1.21% | a.bi.o.sfer, ab.ro.sfer, ab.sten.si, a.e.ro.gram |
| `KKVKK` | 87 | 0.08% | a.e.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| `KKKVK` | 62 | 0.06% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| `KKKV` | 51 | 0.05% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `KKVV` | 25 | 0.02% | al.zhei.mer, cut.brai, dis.plai, drai |
| `KKVVK` | 7 | 0.01% | ab.stain, blues, brail.le, floem |
| `KKKVV` | 2 | 0.00% | ek.sploi.ta.si, ek.sploi.tir |
| `KK` | 1 | 0.00% | hen.ry |
| `KKKK` | 1 | 0.00% | rönt.gen |
| `KKVKKK` | 1 | 0.00% | sfinks |
| `KKKVKK` | 1 | 0.00% | sprint |

---

## 8. Diftong (ai, au, oi, ei)

| Jenis | Suku mengandung diftong | Total Suku | % |
|---|---:|---:|---:|
| Kata Dasar | 1.300 | 112.308 | 1.16% |
| Prakategorial | 83 | 3.610 | 2.30% |

#### Distribusi Pola Diftong (Dasar + Prakategorial)

| Pola | Jumlah | Contoh pemenggalan |
|---|---:|---|
| `KVV` | 1.121 | a.bai, A.bai, a.bai.ma.na, a.bau |
| `VV` | 156 | ai, ai.boh.fo.bi.a, ai.gi.a.li.um, ai.gi.a.lo.fi.li |
| `VVK` | 40 | aib, aih, aik.mo.fo.bi.a, ail |
| `KVVK` | 30 | a.part.heid, as.tro.naut, at.rium, bauk.sit |
| `KKVV` | 25 | al.zhei.mer, cut.brai, dis.plai, drai |
| `KKVVK` | 7 | ab.stain, blues, brail.le, floem |
| `KKKVV` | 2 | ek.sploi.ta.si, ek.sploi.tir |
| `KVVV` | 1 | Riau |
| `KVKVV` | 1 | sagai |

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

Kluster KK- sangat jarang di prakategorial (0.66%) vs kata dasar (3.63%). Ini mendukung hipotesis bahwa prakategorial merupakan warisan Melayu kuno yang fonotaktiknya lebih "murni".

**Pertanyaan penelitian:** Dapatkah pola suku kata digunakan sebagai fitur untuk mengklasifikasikan otomatis kata serapan vs kata asli?

### 9.4 Kata Satu Suku (Monosilabik)

Kata dasar monosilabik: **1.283** (3.27%). Prakategorial: **16** (0.97%). Kemunculannya yang terbatas mencerminkan preferensi fonotaktik terhadap kata polisillabik.

**Pertanyaan penelitian:** Apa distribusi kelas kata (lex_class) pada kata dasar monosilabik?

### 9.5 Kata Polisuku Panjang (≥5 suku)

Kata dasar ≥5 suku: **3.910** (9.97%). Umumnya serapan ilmiah (Yunani/Latin).

**Pertanyaan penelitian:** Adakah batas persepsi "kata panjang" di angka 4 suku?

### 9.6 Perbedaan Dasar vs Prakategorial

Prakategorial 80.82% berstruktur dua suku kata (dasar hanya 46.05%). Suku terbuka prakategorial (46.04%) lebih rendah dari kata dasar (59.29%), artinya prakategorial justru lebih banyak suku tertutup — menarik karena berlawanan dengan hipotesis Austronesia.

**Pertanyaan penelitian:** Apakah dominasi KVK di prakategorial mencerminkan bias leksikografi KBBI, atau memang pola fonotaktik yang khas?

### 9.7 Diftong dan Monoftongisasi

Diftong lebih banyak di prakategorial (2.30%) dibanding kata dasar (1.16%).

**Pertanyaan penelitian:** Apakah kemunculan diftong berkorelasi dengan asal bahasa? Diftong /au/ dan /ai/ dominan pada kata Melayu asli, sedangkan /ei/ hampir seluruhnya dari kata serapan.

### 9.8 Pola Anomali — Perlu Verifikasi Data

Beberapa pola yang muncul dalam data kemungkinan adalah kesalahan pemenggalan:

| Pola | Jumlah | Contoh | Seharusnya |
|---|---:|---|---|
| `VKVK` | 14 | angah, angan, engah, enyak | Suku dipecah: ang.ah → VK.VK, atau a.khir → V.KVK (kh = K tunggal) |
| `KVKV` | 5 | beka, kaki, kali, penge- | lo.gi → KV.KV, bukan KVKV satu suku |
| `VKV` | 3 | -asi, ba.tu.ori, ki.asi | Kemungkinan suku parsial dari digraf |
| `KVKVK` | 9 | colok, gorek, kakas, kupang | Lima bunyi satu suku — hampir pasti keliru |

---

## Referensi

- PUEBI (Pedoman Umum Ejaan Bahasa Indonesia) — Aturan pemenggalan kata
- Adelaar, A. (1992). *Proto Malayo-Javanic.* KITLV Press.
- Lapoliwa, H. (1981). *A Generative Approach to the Phonology of Bahasa Indonesia.* Pacific Linguistics.
- Sneddon, J.N. (2003). *The Indonesian Language: Its History and Role in Modern Society.*
- Data: KBBI4 (Kamus Besar Bahasa Indonesia edisi ke-4), diproses dalam Kateglo 2.0
