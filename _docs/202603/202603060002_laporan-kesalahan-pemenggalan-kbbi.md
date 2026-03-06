# Laporan Dugaan Kesalahan Pemenggalan dalam KBBI

**Tanggal:** 2026-03-06
**Sumber data:** Kateglo 2.0, hasil verifikasi terhadap KBBI VI Daring
**Rujukan:** EYD V (Ejaan Bahasa Indonesia yang Disempurnakan Edisi V, 2022), khususnya kaidah Pemenggalan Kata

---

## Ringkasan

Verifikasi pemenggalan terhadap KBBI VI Daring menemukan **3 kategori masalah sistematis**:

| Kategori | Jumlah entri | Keparahan |
|---|---:|---|
| A. Kata ulang tidak konsisten | 4 | Tinggi |
| B. Suku kata tidak dipecah (≥ 4 bunyi) | ~20 | Tinggi |
| C. Vokal berurutan: VV / KVV pada kata serapan | ~50 | Perlu kajian |

---

## A. Kata Ulang Tidak Konsisten

Pada kata ulang berulang penuh, kedua unsur seharusnya diperlakukan sama.
KBBI memecah satu unsur tetapi tidak yang lain.

| Entri | Pemenggalan KBBI | Seharusnya | Catatan |
|---|---|---|---|
| bulu-bulu | `bulu-bu.lu` | `bu.lu-bu.lu` | Unsur pertama tidak dipecah |
| lupa-lupa | `lu.pa-lupa` | `lu.pa-lu.pa` | Unsur kedua tidak dipecah |
| ruba-ruba | `ru.ba-ruba` | `ru.ba-ru.ba` | Unsur kedua tidak dipecah |
| tali-tali | `tali-tali` | `ta.li-ta.li` | Kedua unsur tidak dipecah |

**Dasar:** EYD V, kaidah Pemenggalan Kata — aturan pemenggalan berlaku pada setiap unsur kata ulang secara mandiri.

---

## B. Suku Kata Tidak Dipecah (Pola ≥ 4 Bunyi)

Suku kata yang mengandung 4 atau lebih bunyi (konsonan + vokal) tanpa pemisahan internal.
Menurut EYD V (kaidah 1d), konsonan di antara dua vokal harus dipindah ke suku berikutnya.

### B.1 Kata dasar monosilabik yang seharusnya disilabik

| Entri | Pemenggalan KBBI | Seharusnya | Pola saat ini |
|---|---|---|---|
| belur | `belur` | `be.lur` | KVKVK |
| keju | `keju` | `ke.ju` | KVKV |
| wahib | `wahib` | `wa.hib` | KVKVK |
| Tuhan | `Tuhan` | `Tu.han` | KVKVK |
| gladi | `gladi` | `gla.di` | KKVKV |

### B.2 Suku kata dalam kata polisuku yang tidak dipecah

| Entri | Pemenggalan KBBI | Seharusnya | Suku bermasalah |
|---|---|---|---|
| antoni | `an.toni` | `an.to.ni` | `toni` → KVKV, harusnya `to.ni` |
| bentulu | `ben.tulu` | `ben.tu.lu` | `tulu` → KVKV, harusnya `tu.lu` |
| entebering | `en.te.bering` | `en.te.be.ring` | `bering` → KVKVK, harusnya `be.ring` |
| hewani | `he.wani` | `he.wa.ni` | `wani` → KVKV, harusnya `wa.ni` |
| uniseluler | `u.ni.se.luler` | `u.ni.se.lu.ler` | `luler` → KVKVK, harusnya `lu.ler` |
| selang-seli | `se.lang-seli` | `se.lang-se.li` | `seli` → KVKV, harusnya `se.li` |
| supraalami | `sup.ra.a.lami` | `sup.ra.a.la.mi` | `lami` → KVKV, harusnya `la.mi` |
| cenggema | `ceng.gema` | `ceng.ge.ma` | `gema` → KVKV, harusnya `ge.ma` |

### B.3 Suku akhiran yang tidak dipecah

| Entri | Pemenggalan KBBI | Seharusnya | Suku bermasalah |
|---|---|---|---|
| yaumulakhir | `yau.mul.akhir` | `yau.mul.a.khir` | `akhir` → VKVK, harusnya `a.khir` |
| yaumulkiamah | `yau.mul.ki.amah` | `yau.mul.ki.a.mah` | `amah` → VKVK, harusnya `a.mah` |
| Wariagung | `Wa.ri.agung` | `Wa.ri.a.gung` | `agung` → VKVK, harusnya `a.gung` |

**Dasar:** EYD V, kaidah 1d — jika ada satu konsonan di antara dua vokal, konsonan tersebut menjadi bagian suku kata berikutnya.

---

## C. Vokal Berurutan pada Kata Serapan (Perlu Kajian)

Kelompok ini lebih kompleks — melibatkan urutan vokal yang tidak termasuk diftong resmi (ai, au, oi, ei).
Beberapa mungkin benar menurut konvensi KBBI untuk kata serapan tertentu; lainnya mungkin perlu dipisah.

| Entri | Pemenggalan KBBI | Pola bermasalah | Alternatif |
|---|---|---|---|
| anaerob | `an.ae.rob` | `ae` = VV | `a.e.rob`? |
| milieu | `mi.li.eu` | `eu` = VV | `mi.li.e.u`? |
| paleoaatekologi | `pa.le.o.aa.te.ko.lo.gi` | `aa` = VV | Kemungkinan kesalahan ketik |
| kolpopoiesis | `kol.po.po.ie.sis` | `ie` = VV | `kol.po.po.i.e.sis`? |
| requiem | `re.ku.i.em` | diperbarui via verifikasi | — |

**Catatan:** Sebagian besar entri KVV dan VV telah diperbarui dari verifikasi KBBI (misalnya `ae.ro.di.ne` → `a.e.ro.di.ne`). Entri dalam tabel ini adalah yang KBBI sendiri masih tidak memisahkan vokal berurutan.

