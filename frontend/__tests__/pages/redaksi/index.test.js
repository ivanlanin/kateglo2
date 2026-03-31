import { describe, expect, it } from 'vitest';
import * as redaksiPages from '../../../src/pages/redaksi';
import Dasbor from '../../../src/pages/redaksi/Dasbor';
import * as aksesPages from '../../../src/pages/redaksi/akses';
import * as auditPages from '../../../src/pages/redaksi/audit';
import * as gimPages from '../../../src/pages/redaksi/gim';
import * as interaksiPages from '../../../src/pages/redaksi/interaksi';
import * as kadiPages from '../../../src/pages/redaksi/kadi';
import * as leksikonPages from '../../../src/pages/redaksi/leksikon';
import * as masterPages from '../../../src/pages/redaksi/master';

describe('pages/redaksi index', () => {
  it('me-reexport semua modul redaksi utama', () => {
    expect(redaksiPages.Dasbor).toBe(Dasbor);
    expect(redaksiPages.IzinAdmin).toBe(aksesPages.IzinAdmin);
    expect(redaksiPages.PenggunaAdmin).toBe(aksesPages.PenggunaAdmin);
    expect(redaksiPages.PeranAdmin).toBe(aksesPages.PeranAdmin);
    expect(redaksiPages.AuditMaknaAdmin).toBe(auditPages.AuditMaknaAdmin);
    expect(redaksiPages.AuditTagarAdmin).toBe(auditPages.AuditTagarAdmin);
    expect(redaksiPages.KuisKataAdmin).toBe(gimPages.KuisKataAdmin);
    expect(redaksiPages.SusunKataBebasAdmin).toBe(gimPages.SusunKataBebasAdmin);
    expect(redaksiPages.SusunKataHarianAdmin).toBe(gimPages.SusunKataHarianAdmin);
    expect(redaksiPages.KomentarAdmin).toBe(interaksiPages.KomentarAdmin);
    expect(redaksiPages.PencarianAdmin).toBe(interaksiPages.PencarianAdmin);
    expect(redaksiPages.PencarianHitamAdmin).toBe(interaksiPages.PencarianHitamAdmin);
    expect(redaksiPages.KandidatKataAdmin).toBe(kadiPages.KandidatKataAdmin);
    expect(redaksiPages.EtimologiAdmin).toBe(leksikonPages.EtimologiAdmin);
    expect(redaksiPages.GlosariumAdmin).toBe(leksikonPages.GlosariumAdmin);
    expect(redaksiPages.KamusAdmin).toBe(leksikonPages.KamusAdmin);
    expect(redaksiPages.KataHariIniAdmin).toBe(leksikonPages.KataHariIniAdmin);
    expect(redaksiPages.TesaurusAdmin).toBe(leksikonPages.TesaurusAdmin);
    expect(redaksiPages.BahasaAdmin).toBe(masterPages.BahasaAdmin);
    expect(redaksiPages.BidangAdmin).toBe(masterPages.BidangAdmin);
    expect(redaksiPages.LabelAdmin).toBe(masterPages.LabelAdmin);
    expect(redaksiPages.SumberAdmin).toBe(masterPages.SumberAdmin);
    expect(redaksiPages.TagarAdmin).toBe(masterPages.TagarAdmin);
  });
});