import { describe, expect, it } from 'vitest';
import * as publikPages from '../../../src/pages/publik';
import Beranda from '../../../src/pages/publik/Beranda';
import * as kamusPages from '../../../src/pages/publik/kamus';
import * as glosariumPages from '../../../src/pages/publik/glosarium';
import * as alatPages from '../../../src/pages/publik/alat';
import * as gimPages from '../../../src/pages/publik/gim';
import * as informasiPages from '../../../src/pages/publik/informasi';

describe('pages/publik index', () => {
  it('me-reexport semua modul publik utama', () => {
    expect(publikPages.Beranda).toBe(Beranda);
    expect(publikPages.Ejaan).toBe(kamusPages.Ejaan);
    expect(publikPages.Kamus).toBe(kamusPages.Kamus);
    expect(publikPages.KamusDetail).toBe(kamusPages.KamusDetail);
    expect(publikPages.Makna).toBe(kamusPages.Makna);
    expect(publikPages.Rima).toBe(kamusPages.Rima);
    expect(publikPages.Tesaurus).toBe(kamusPages.Tesaurus);
    expect(publikPages.Glosarium).toBe(glosariumPages.Glosarium);
    expect(publikPages.GlosariumDetail).toBe(glosariumPages.GlosariumDetail);
    expect(publikPages.AlatIndex).toBe(alatPages.AlatIndex);
    expect(publikPages.PenganalisisTeks).toBe(alatPages.PenganalisisTeks);
    expect(publikPages.PenghitungHuruf).toBe(alatPages.PenghitungHuruf);
    expect(publikPages.GimIndex).toBe(gimPages.GimIndex);
    expect(publikPages.KuisKata).toBe(gimPages.KuisKata);
    expect(publikPages.SusunKata).toBe(gimPages.SusunKata);
    expect(publikPages.Ihwal).toBe(informasiPages.Ihwal);
    expect(publikPages.Privasi).toBe(informasiPages.Privasi);
    expect(publikPages.Sumber).toBe(informasiPages.Sumber);
  });
});
