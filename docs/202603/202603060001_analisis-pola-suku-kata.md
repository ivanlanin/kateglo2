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
- **V** = vokal tunggal (a, e, i, o, u). Diftong (ai, au, oi, ei) diperlakukan sebagai **satu V** — satu unsur vokal.
- **K** = konsonan, termasuk digraf yang diperlakukan sebagai satu fonem:

  | Digraf | Fonem | Contoh suku |
  |---|---|---|
  | ng | /ŋ/ velar nasal | bu.nga, ngang |
  | ny | /ɲ/ palatal nasal | nya.ta, bu.nyi |
  | kh | /x/ frikatif velar | kha.sus, a.khir |
  | sy | /ʃ/ frikatif palatal | sya.rat, khu.syuk |

- **Diftong** yang dikenali: `ai`, `au`, `oi`, `ei` (sesuai EYD V). Karena diftong = satu unsur vokal, suku seperti `pan.dai` terbaca sebagai **KVK.KV** (bukan KVK.KVV).

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
| pandai | pan.dai | KVK.KV | KVK + KV (diftong = V) |

---

## Ringkasan Data

| Metrik | Jumlah |
|---|---:|
| Total entri | 41.339 |
| Dilewati (multi-kata/kosong) | 482 |
| Entri dianalisis | 40.857 |
| Total suku kata | 115.986 |

---

## 1. Distribusi Jumlah Suku Kata per Kata

| Jumlah Suku | Jumlah Kata | % |
|---:|---:|---:|
| 1 | 1.264 | 3.09% |
| 2 | 19.413 | 47.51% |
| 3 | 10.563 | 25.85% |
| 4 | 5.704 | 13.96% |
| 5 | 2.574 | 6.30% |
| 6 | 972 | 2.38% |
| 7 | 272 | 0.67% |
| 8 | 78 | 0.19% |
| 9 | 14 | 0.03% |
| 10 | 1 | 0.00% |
| 11 | 1 | 0.00% |
| 14 | 1 | 0.00% |

---

## 2. Perbandingan dengan Tipe Kanonik

Sebelas tipe suku kata yang diakui dalam fonologi bahasa Indonesia (berdasarkan rujukan).

| # | Tipe | Contoh (Ref) | Ada di Data | Jumlah | % dari total suku | Contoh pemenggalan |
|---:|---|---|:---:|---:|---:|---|
| 1 | `KV` | `ka.mu` | ✅ | 59.038 | 50.90% | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| 2 | `KVK` | `pak.sa` | ✅ | 39.901 | 34.40% | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| 3 | `V` | `a.ku` | ✅ | 6.662 | 5.74% | A, a.a, a.ba, a.ba-a.ba |
| 4 | `VK` | `il.mu` | ✅ | 5.806 | 5.01% | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| 5 | `KKV` | `dra.ma` | ✅ | 2.529 | 2.18% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| 6 | `KKVK` | `trak.tor` | ✅ | 1.361 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.stain, ab.sten.si |
| 7 | `KVKK` | `teks.til` | ✅ | 306 | 0.26% | ab.sorb, ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans |
| 8 | `KKVKK` | `kom.pleks` | ✅ | 87 | 0.08% | a.e.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| 9 | `KKKVK` | `struk.tur` | ✅ | 62 | 0.05% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| 10 | `KKKV` | `stra.ta` | ✅ | 53 | 0.05% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| 11 | `KVKKK` | `korps` | ✅ | 9 | 0.01% | gi.ga.hertz, hertz, karst, ki.lo.hertz |

---

## 3. Pola di Luar Tipe Kanonik

Pola-pola berikut **tidak termasuk** dalam 11 tipe kanonik.

| Pola | Jumlah | % | Keterangan | Contoh pemenggalan |
|---|---:|---:|---|---|
| `VKK` | 104 | 0.09% | Kata serapan (fonotaktik asing, koda -KK) | alf, am.bi.ens, ark.ti.ka, au.di.ens |
| `K` | 26 | 0.02% | Huruf abjad | à, B, C, D |
| `VVK` | 18 | 0.02% | C – anomali (perlu ditinjau) | aom, fir.a.un.iah, is.ti.ma.iah, uak |
| `KVV` | 8 | 0.01% | C – anomali (perlu ditinjau) | ba.heu.la, ceu.ki, meu.na.sah, re.kui.em |
| `VV` | 7 | 0.01% | C – anomali (perlu ditinjau) | an.ae.rob, an.ae.ro.bik, e.u.kar.io.tik, kol.po.po.ie.sis |
| `KKVVK` | 2 | 0.00% | C – anomali (perlu ditinjau) | blues, floem |
| `KVVK` | 2 | 0.00% | C – anomali (perlu ditinjau) | leun.ca, pas.teur |
| `KK` | 1 | 0.00% | C – anomali (perlu ditinjau) | hen.ry |
| `KKVV` | 1 | 0.00% | C – anomali (perlu ditinjau) | in.dria.wi |
| `KKKK` | 1 | 0.00% | C – anomali (perlu ditinjau) | rönt.gen |
| `KKVKKK` | 1 | 0.00% | C – anomali (perlu ditinjau) | sfinks |
| `KKKVKK` | 1 | 0.00% | C – anomali (perlu ditinjau) | sprint |

### Detail Kasus untuk Ditinjau

#### `VKK` — 104 suku

**eks- (bentuk terikat):** eks (eks), eks (eks), eks (eks), eks (eks.fo.li.a.si), eks (eks.ha.la.si), eks (eks.hi.bi.si), eks (eks.hi.bi.si.o.nis), eks (eks.hi.bi.si.o.nis.me), eks (eks.hi.bi.tum), eks (eks.ka.va.si), eks (eks.ka.va.tor), eks (eks.kla.ve), eks (eks.klu.sif), eks (eks.klu.si.vis.me), eks (eks.klu.si.vi.tas), eks (eks.ko.mu.ni.ka.si), eks (eks.kre.si), eks (eks.kre.ta), eks (eks.kur.si), eks (eks.kur.sif), eks (eks.pan.si), eks (eks.pan.sif), eks (eks.pan.si.o.nis), eks (eks.pan.si.o.nis.me), eks (eks.pan.si.o.nis.tis), eks (eks.pe.di.si), eks (eks.pe.di.tor), eks (eks.pe.di.tur), eks (eks.pek.ta.si), eks (eks.pi.ra.si), eks (eks.plan), eks (eks.pli.ka.si), eks (eks.pli.sit), eks (eks.plo.si), eks (eks.plo.sif), eks (eks.plo.si.me.ter), eks (eks.po), eks (eks.por), eks (eks.por.tir), eks (eks.pos), eks (eks.po.se), eks (eks.po.si.si), eks (eks.po.sur), eks (eks.pre.si), eks (eks.pre.sif), eks (eks.pre.si.o.nis.me), eks (eks.pre.si.o.nis.tik), eks (eks.pre.si.vi.tas), eks (eks.ten.si), eks (eks.ten.sif), eks (eks.ten.si.fi.ka.si), eks (eks.te.ri.or), eks (eks.te.ri.o.ri.sa.si), eks (eks.te.ri.to.ri.a.li.tas), eks (eks.tern), eks (eks.ter.nal), eks (eks.tra), eks (eks.tra.di.si), eks (eks.tra.kar.di.al), eks (eks.tra.ku.ri.ku.ler), eks (eks.tra.li.ngu.is.tis), eks (eks.tra.ma.ri.tal), eks (eks.tra.par.le.men.ter), eks (eks.tra.po.la.si), eks (eks.tra.se.lu.lar), eks (eks.tra.se.lu.ler), eks (eks.tra.ser.ba.sif), eks (eks.tra.te.res.tri.al), eks (eks.tra.te.ri.to.ri.a.li.tas), eks (eks.tra.u.te.rin), eks (eks.tra.va.gan.za), eks (eks.tra.ver.si), eks (eks.trin.sik), eks (eks.tro.spek.si), eks (eks.tro.ver), eks (eks.tru.si), eks (eks.tru.si), eks (eks.tru.si), eks (re.eks.por)

**Non-eks-:** alf (alf), ens (am.bi.ens), ark (ark.ti.ka), ens (au.di.ens), ens (dif.lu.ens), erg (erg), ans (i.ra.di.ans), ens (kon.flu.ens), ark (ku.ark), art (ku.art), ohm (me.ga.ohm), ohm (mik.ro.ohm), obs (obs.tet.ri), obs (obs.tru.en), obs (obs.truk.si), obs (obs.truk.tif), ohm (ohm), ohm (ohm.me.ter), ons (ons), ops (ops.tal), ord (ord.ner), ark (pat.ri.ark), ans (ra.di.ans), ins (sa.ins), ans (va.ri.ans)


#### `K` — 26 suku

*Catatan: huruf vokal (A, E, I, O, U) muncul di pola `V`, bukan di sini.*

à (à), B (B), C (C), D (D), F (F), G (G), H (H), J (J), K (K), L (L), M (M), M (M), N (N), N (N), P (P), Q (Q), R (R), S (S), S (S), T (T), V (V), W (W), X (X), X (X), Y (Y), Z (Z)


#### `VVK` — 18 suku

aom (aom), aom (aom), iah (fir.a.un.iah), iah (is.ti.ma.iah), uak (uak), uak (uak), uan (uan), uan (uan), uan (uan), uap (uap), uap (uap), uar (uar), uar (uar), uih (uih), uir (uir-uir), uir (uir-uir), uir (uir-uir), uir (uir-uir)


#### `KVV` — 8 suku

**Mengandung `eu` (bahasa daerah, diterima):** heu (ba.heu.la), ceu (ceu.ki), meu (meu.na.sah), seu (seu.da.ti), seu (seu.lu.mat), meu (Si.meu.lu.e)

**Lainnya (perlu ditinjau):** kui (re.kui.em), kui (re.kui.si.tor)


#### `VV` — 7 suku

ae (an.ae.rob), ae (an.ae.ro.bik), io (e.u.kar.io.tik), ie (kol.po.po.ie.sis), eu (mi.li.eu), aa (pa.le.o.aa.te.ko.lo.gi), io (pat.ro.io.fo.bi.a)


#### `KKVVK` — 2 suku

blues (blues), floem (floem)


#### `KVVK` — 2 suku

**Mengandung `eu` (bahasa daerah, diterima):** leun (leun.ca), teur (pas.teur)


#### `KK` — 1 suku

ry (hen.ry)


#### `KKVV` — 1 suku

dria (in.dria.wi)


#### `KKKK` — 1 suku

rönt (rönt.gen)


#### `KKVKKK` — 1 suku

sfinks (sfinks)


#### `KKKVKK` — 1 suku

sprint (sprint)



---

## 4. Distribusi Lengkap Jenis Suku Kata

Total: **115.986** suku kata

| Pola Suku | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV` | 59.038 | 50.90% | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| `KVK` | 39.901 | 34.40% | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| `V` | 6.662 | 5.74% | A, a.a, a.ba, a.ba-a.ba |
| `VK` | 5.806 | 5.01% | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| `KKV` | 2.529 | 2.18% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `KKVK` | 1.361 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.stain, ab.sten.si |
| `KVKK` | 306 | 0.26% | ab.sorb, ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans |
| `VKK` | 104 | 0.09% | alf, am.bi.ens, ark.ti.ka, au.di.ens |
| `KKVKK` | 87 | 0.08% | a.e.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| `KKKVK` | 62 | 0.05% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| `KKKV` | 53 | 0.05% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `K` | 26 | 0.02% | à, B, C, D |
| `VVK` | 18 | 0.02% | aom, fir.a.un.iah, is.ti.ma.iah, uak |
| `KVKKK` | 9 | 0.01% | gi.ga.hertz, hertz, karst, ki.lo.hertz |
| `KVV` | 8 | 0.01% | ba.heu.la, ceu.ki, meu.na.sah, re.kui.em |
| `VV` | 7 | 0.01% | an.ae.rob, an.ae.ro.bik, e.u.kar.io.tik, kol.po.po.ie.sis |
| `KKVVK` | 2 | 0.00% | blues, floem |
| `KVVK` | 2 | 0.00% | leun.ca, pas.teur |
| `KK` | 1 | 0.00% | hen.ry |
| `KKVV` | 1 | 0.00% | in.dria.wi |
| `KKKK` | 1 | 0.00% | rönt.gen |
| `KKVKKK` | 1 | 0.00% | sfinks |
| `KKKVKK` | 1 | 0.00% | sprint |

---

## 5. Distribusi Pola Kata (Top 30)

Pola kata = gabungan pola tiap suku kata.

Total pola unik: **1.726**

| Pola Kata | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KV.KVK` | 8.209 | 20.09% | ba.bad, ba.bah, ba.bak, ba.bal |
| `KVK.KVK` | 4.296 | 10.51% | bab.las, baf.tah, bah.kan, bak.dul |
| `KV.KV.KVK` | 2.659 | 6.51% | ba.ba.kan, ba.ba.tan, ba.bu.rin, ba.du.yut |
| `KV.KV` | 2.215 | 5.42% | ba.ba, ba.be, ba.bi, ba.bu |
| `KV.KV.KV` | 1.406 | 3.44% | ba.bi.bu, ba.bu.nyai, ba.bu.ru, ba.da.ni |
| `KVK.KV` | 1.139 | 2.79% | baf.ta, bah.ri, bah.wa, bak.da |
| `KV.KVK.KVK` | 908 | 2.22% | ba.dan.dang, Bai.tul.lah, bai.tul.mal, ba.lan.dong |
| `V.KVK` | 878 | 2.15% | a.bad, a.bah, a.ban, a.bang |
| `KVK.KV.KVK` | 806 | 1.97% | bak.ba.rak, bak.te.rin, bal.se.ros, ban.ci.ngah |
| `KVK` | 780 | 1.91% | bab, bad, bah, bak |
| `VK.KVK` | 666 | 1.63% | ab.das, ab.dul, ab.jad, ab.lur |
| `KVK.KV.KV` | 655 | 1.60% | bah.te.ra, bak.da.hu, bak.te.ri, bam.ba.ru |
| `KV.KV.KV.KV` | 626 | 1.53% | ba.gai.ma.na, ba.ha.du.ri, ba.ji-ba.ji, ba.lai-ba.lai |
| `KV.VK` | 560 | 1.37% | ba.al, Ba.al, ba.ang, bai.at |
| `KV.KV.KV.KVK` | 522 | 1.28% | ba.ga.so.sis, ba.ha.ri.wan, ba.ha.sa.wan, ba.la.ni.tis |
| `KV.KV.VK` | 399 | 0.98% | ba.ki.ak, ba.li.an, Ba.li.em, ba.ni.an |
| `KV.KVK.KV` | 329 | 0.81% | ba.bong.ko, ba.gin.da, Ba.kum.pai, ba.pan.da |
| `V.KV.KVK` | 274 | 0.67% | a.ba.kus, a.bi.din, a.bi.lah, a.bi.sal |
| `KV.KVK.KV.KVK` | 271 | 0.66% | Bai.tul.ha.ram, ba.jang-ba.jang, ba.ngun-ba.ngun, ba.rat-ba.rat |
| `VK.KV.KVK` | 264 | 0.65% | ab.do.men, ab.la.tif, ab.ra.sif, ab.ri.kos |
| `KVK.KV.KV.KV` | 256 | 0.63% | bah.wa.sa.nya, ben.da.ha.ra, ben.da.ha.ri, ber.di.ka.ri |
| `KKV.KVK` | 241 | 0.59% | bla.bar, bla.nguh, bla.zer, ble.bes |
| `KVK.KV.KV.KVK` | 209 | 0.51% | bak.te.ri.sid, ban.se.ko.wer, bar.ba.ri.tas, bar.bi.tu.rat |
| `KVK.KKVK` | 207 | 0.51% | ban.drang, ban.drek, ban.dring, ban.drol |
| `V.KV` | 193 | 0.47% | a.ba, a.bai, A.bai, a.bau |
| `KV.V.KVK` | 170 | 0.42% | ba.a.suh, bi.a.dab, bi.a.dat, bi.a.wak |
| `KV.KV.KV.KV.KV` | 161 | 0.39% | ba.lo.ni.sa.si, ba.ru.na.wa.ti, be.to.ni.sa.si, ca.ra.ka.wa.ti |
| `VK.KV` | 155 | 0.38% | ab.di, ab.du, ah.li, aj.re |
| `KV.KV.KV.VK` | 155 | 0.38% | ba.hi.mi.ah, ba.si.di.um, ba.ta.li.on, ba.ti.ni.ah |
| `KKVK` | 153 | 0.37% | blek, bleng, blog, blok |

---

## 6. Suku Kata Terbuka vs Tertutup

Suku **terbuka** = berakhir vokal.
Suku **tertutup** = berakhir konsonan.

| Terbuka | Tertutup | Rasio Terbuka |
|---:|---:|---:|
| 68.298 | 47.688 | 58.88% |

---

## 7. Kluster Konsonan (KK-)

Suku kata yang diawali dua atau lebih konsonan — umumnya kata serapan. Total: **4.099** (3.53%)

| Pola | Jumlah | % | Contoh pemenggalan |
|---|---:|---:|---|
| `KKV` | 2.529 | 2.18% | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `KKVK` | 1.361 | 1.17% | a.bi.o.sfer, ab.ro.sfer, ab.stain, ab.sten.si |
| `KKVKK` | 87 | 0.08% | a.e.ro.plank.ton, an.traks, ba.ti.plank.ton, du.pleks |
| `KKKVK` | 62 | 0.05% | ab.strak, ab.strak.si, ad.strin.gen, ang.strom |
| `KKKV` | 53 | 0.05% | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `KKVVK` | 2 | 0.00% | blues, floem |
| `KK` | 1 | 0.00% | hen.ry |
| `KKVV` | 1 | 0.00% | in.dria.wi |
| `KKKK` | 1 | 0.00% | rönt.gen |
| `KKVKKK` | 1 | 0.00% | sfinks |
| `KKKVKK` | 1 | 0.00% | sprint |

---

## 8. Diftong (ai, au, oi, ei)

Suku kata mengandung diftong: **1.323** (1.14%)

| Pola suku | Jumlah | Contoh pemenggalan |
|---|---:|---|
| `KV` | 1.100 | a.ba, a.ba-a.ba, a.ba.di, a.ba.di.ah |
| `V` | 150 | A, a.a, a.ba, a.ba-a.ba |
| `KKV` | 24 | a.bi.o.tro.fi, a.bo.o.spo.ra, ab.sti.nen.si, ad.mi.nis.tra.si |
| `VK` | 22 | ab, a.ba.di.ah, a.ba.di.at, a.bak.si.al |
| `KVK` | 19 | a.bad, a.bah, a.bah-a.bah, a.bak.si.al |
| `KKVK` | 5 | a.bi.o.sfer, ab.ro.sfer, ab.stain, ab.sten.si |
| `KKKV` | 2 | al.to.stra.tus, de.mon.stra.si, de.mon.stra.tif, de.mon.stra.ti.va |
| `KVKK` | 1 | ab.sorb, ab.sorp.si, ab.sorp.si.o.me.ter, ab.sorp.tans |

---

## 9. Isu Menarik untuk Dikaji

### 9.1 Dominasi Pola KV (Warisan Austronesia)

Suku bertipe **KV** adalah yang paling dominan (~50%), diikuti **KVK** (~34%). Ini konsisten dengan tipologi rumpun bahasa Melayu-Polinesia yang menyukai suku terbuka (CV).

**Pertanyaan penelitian:** Apakah rasio suku terbuka berbeda signifikan antara kata asli Indonesia dan kata serapan?

### 9.2 Pola Kata Paling Produktif

Tiga pola kata paling umum: **`KV.KVK`, `KVK.KVK`, `KV.KV.KVK`**.

Kata Melayu-Indonesia cenderung berstruktur dua suku kata (disyllabic) dengan suku akhir tertutup.

**Pertanyaan penelitian:** Adakah korelasi antara frekuensi pemakaian kata (dari `searched_phrase`) dan pola suku kata?

### 9.3 Kata Satu Suku (Monosilabik)

Kata monosilabik: **1.264** (3.09%). Kemunculannya yang terbatas mencerminkan preferensi fonotaktik terhadap kata polisillabik.

**Pertanyaan penelitian:** Apa distribusi kelas kata (lex_class) pada kata dasar monosilabik?

### 9.4 Kata Polisuku Panjang (≥5 suku)

Kata ≥5 suku: **3.913** (9.58%). Umumnya serapan ilmiah (Yunani/Latin).

**Pertanyaan penelitian:** Adakah batas persepsi "kata panjang" di angka 4 suku?

---

## Referensi

- EYD V (Ejaan Bahasa Indonesia yang Disempurnakan Edisi V, 2022) — Kaidah pemenggalan kata
- Adelaar, A. (1992). *Proto Malayo-Javanic.* KITLV Press.
- Lapoliwa, H. (1981). *A Generative Approach to the Phonology of Bahasa Indonesia.* Pacific Linguistics.
- Sneddon, J.N. (2003). *The Indonesian Language: Its History and Role in Modern Society.*
- Data: KBBI4 (Kamus Besar Bahasa Indonesia edisi ke-4), diproses dalam Kateglo 2.0
