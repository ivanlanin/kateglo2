import { beforeEach, describe, expect, it, vi } from 'vitest';

const invalidateQueries = vi.fn();
const useQuery = vi.fn((config) => config);
const useMutation = vi.fn((config) => config);

vi.mock('@tanstack/react-query', () => ({
  useQuery: (config) => useQuery(config),
  useMutation: (config) => useMutation(config),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock('../../src/api/klien', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    post: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    put: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    patch: vi.fn(() => Promise.resolve({ data: { ok: true } })),
    delete: vi.fn(() => Promise.resolve({ data: { ok: true } })),
  },
}));

import klien from '../../src/api/klien';
import {
  useStatistikAdmin,
  useDaftarKataHariIniAdmin,
  useDetailKataHariIniAdmin,
  useSimpanKataHariIniAdmin,
  useHapusKataHariIniAdmin,
  useStatistikPencarianAdmin,
  useDaftarPencarianHitamAdmin,
  useDetailPencarianHitamAdmin,
  useSimpanPencarianHitamAdmin,
  useHapusPencarianHitamAdmin,
  useDaftarKamusAdmin,
  useAutocompleteIndukKamus,
  useDetailKamusAdmin,
  useDaftarKomentarAdmin,
  useDetailKomentarAdmin,
  useDaftarAuditMaknaAdmin,
  useDaftarTesaurusAdmin,
  useDetailTesaurusAdmin,
  useDaftarEtimologiAdmin,
  useDetailEtimologiAdmin,
  useAutocompleteEntriEtimologi,
  useDaftarGlosariumAdmin,
  useDetailGlosariumAdmin,
  useDaftarBidangAdmin,
  useOpsiBidangAdmin,
  useOpsiBidangKamusAdmin,
  useDaftarSemuaBidangAdmin,
  useDetailBidangAdmin,
  useSusunKataHarianAdmin,
  useSusunKataBebasAdmin,
  useDetailSusunKataHarianAdmin,
  useKuisKataAdmin,
  useDaftarSumberAdmin,
  useDaftarSemuaSumberAdmin,
  useOpsiSumberAdmin,
  useDetailSumberAdmin,
  useDaftarLabelAdmin,
  useDetailLabelAdmin,
  useOpsiLabelRedaksi,
  useKategoriLabelRedaksi,
  useDaftarPengguna,
  useDetailPengguna,
  useDaftarPeran,
  useDaftarPeranAdmin,
  useDetailPeranAdmin,
  useDaftarIzinAdmin,
  useDaftarIzinKelolaAdmin,
  useDetailIzinAdmin,
  useDaftarPeranUntukIzinAdmin,
  useUbahPeran,
  useSimpanPeranAdmin,
  useSimpanIzinAdmin,
  useSimpanKamus,
  useSimpanKomentarAdmin,
  useSimpanAuditMaknaAdmin,
  useHapusKamus,
  useDaftarMakna,
  useSimpanMakna,
  useHapusMakna,
  useSimpanContoh,
  useHapusContoh,
  useSimpanTesaurus,
  useHapusTesaurus,
  useSimpanEtimologi,
  useHapusEtimologi,
  useSimpanGlosarium,
  useHapusGlosarium,
  useSimpanBidang,
  useHapusBidang,
  useDaftarBahasaAdmin,
  useDaftarSemuaBahasaAdmin,
  useDetailBahasaAdmin,
  useSimpanBahasa,
  useHapusBahasa,
  useOpsiBahasaAdmin,
  useOpsiBahasaKamusAdmin,
  useOpsiBahasaGlosariumAdmin,
  useOpsiBahasaEtimologiAdmin,
  useSimpanSusunKataHarianAdmin,
  useBuatSusunKataHarianAdmin,
  useSimpanSumber,
  useHapusSumber,
  useSimpanLabel,
  useHapusLabel,
  useSimpanPengguna,
  useDaftarTagarAdmin,
  useDaftarAuditTagarAdmin,
  useDaftarEntriTagarAdmin,
  useDetailTagarAdmin,
  useTagarEntri,
  useDaftarTagarUntukPilih,
  useKategoriTagarAdmin,
  useSimpanTagar,
  useHapusTagar,
  useSimpanTagarEntri,
  useStatistikSinsetAdmin,
  useTipeRelasiAdmin,
  useDaftarSinsetAdmin,
  useDetailSinsetAdmin,
  useAutocompleteLemaSinset,
  useKandidatMaknaSinset,
  useSimpanSinset,
  useSimpanPemetaanLema,
  useTambahLemaSinset,
} from '../../src/api/apiAdmin';

describe('apiAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mengonfigurasi semua query hooks admin', async () => {
    const statistik = useStatistikAdmin();
    await statistik.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/statistik');

    const daftarKataHariIni = useDaftarKataHariIniAdmin({
      limit: 12,
      cursor: 'khi-1',
      direction: 'prev',
      lastPage: true,
      q: 'aktif',
      modePemilihan: 'admin',
    });
    await daftarKataHariIni.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kata-hari-ini', {
      params: {
        limit: 12,
        cursor: 'khi-1',
        direction: 'prev',
        lastPage: '1',
        q: 'aktif',
        mode_pemilihan: 'admin',
      },
    });

    const detailKataHariIni = useDetailKataHariIniAdmin(5);
    expect(detailKataHariIni.enabled).toBe(true);
    await detailKataHariIni.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kata-hari-ini/5');
    expect(useDetailKataHariIniAdmin(null).enabled).toBe(false);

    const statistikPencarianDefault = useStatistikPencarianAdmin();
    await statistikPencarianDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/statistik/pencarian', {
      params: {
        domain: undefined,
        periode: 'hariini',
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        tanggal_mulai: undefined,
        tanggal_selesai: undefined,
      },
    });

    const statistikPencarianCustom = useStatistikPencarianAdmin({
      domain: '3',
      periode: '30hari',
      limit: 500,
      cursor: 'sp-1',
      lastPage: true,
      tanggalMulai: '2026-02-01',
      tanggalSelesai: '2026-02-29',
    });
    await statistikPencarianCustom.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/statistik/pencarian', {
      params: {
        domain: '3',
        periode: '30hari',
        limit: 500,
        cursor: 'sp-1',
        direction: 'next',
        lastPage: '1',
        tanggal_mulai: '2026-02-01',
        tanggal_selesai: '2026-02-29',
      },
    });

    const statistikPencarianPeriodeKosong = useStatistikPencarianAdmin({ periode: '' });
    await statistikPencarianPeriodeKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/statistik/pencarian', {
      params: {
        domain: undefined,
        periode: undefined,
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        tanggal_mulai: undefined,
        tanggal_selesai: undefined,
      },
    });

    const kuisKataDefault = useKuisKataAdmin();
    await kuisKataDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kuis-kata', {
      params: {
        tanggal: undefined,
        limit: 200,
      },
    });

    const kuisKataCustom = useKuisKataAdmin({ tanggal: ' 2026-03-15 ', limit: 5000 });
    await kuisKataCustom.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kuis-kata', {
      params: {
        tanggal: '2026-03-15',
        limit: 1000,
      },
    });

    const kuisKataClampMinimum = useKuisKataAdmin({ tanggal: '   ', limit: -5 });
    await kuisKataClampMinimum.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kuis-kata', {
      params: {
        tanggal: undefined,
        limit: 1,
      },
    });

    const kuisKataNullTanggal = useKuisKataAdmin({ tanggal: null, limit: 'abc' });
    await kuisKataNullTanggal.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kuis-kata', {
      params: {
        tanggal: undefined,
        limit: 200,
      },
    });

    const kamus = useDaftarKamusAdmin({ limit: 10, q: 'anak' });
    await kamus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', {
      params: { limit: 10, cursor: undefined, direction: 'next', lastPage: undefined, q: 'anak', aktif: undefined },
    });

    const kamusKosong = useDaftarKamusAdmin({ limit: 10, q: '' });
    await kamusKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', {
      params: { limit: 10, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined },
    });

    const indukAutocomplete = useAutocompleteIndukKamus({ q: '  akar ', limit: 12, excludeId: 9 });
    expect(indukAutocomplete.enabled).toBe(true);
    await indukAutocomplete.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/opsi-induk', {
      params: {
        q: 'akar',
        limit: 12,
        exclude_id: 9,
      },
    });

      const autocompleteKosong = useAutocompleteIndukKamus({ q: '   ', limit: 4, excludeId: 0 });
      expect(autocompleteKosong.enabled).toBe(false);
      await autocompleteKosong.queryFn();
      expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/opsi-induk', {
        params: {
          q: undefined,
          limit: 4,
          exclude_id: undefined,
        },
      });

    const indukAutocompleteKosong = useAutocompleteIndukKamus({ q: '   ', limit: 8, excludeId: null });
    expect(indukAutocompleteKosong.enabled).toBe(false);

    const indukAutocompleteTanpaExclude = useAutocompleteIndukKamus({ q: 'kata', limit: 7, excludeId: 0 });
    expect(indukAutocompleteTanpaExclude.enabled).toBe(true);
    await indukAutocompleteTanpaExclude.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/opsi-induk', {
      params: {
        q: 'kata',
        limit: 7,
        exclude_id: undefined,
      },
    });

    const autocompleteDefault = useAutocompleteIndukKamus();
    expect(autocompleteDefault.enabled).toBe(false);
    await autocompleteDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/opsi-induk', {
      params: {
        q: undefined,
        limit: 8,
        exclude_id: undefined,
      },
    });

    const kamusDenganFilter = useDaftarKamusAdmin({
      limit: 15,
      q: 'kata',
      aktif: '1',
      jenis: 'dasar',
      jenisRujuk: 'lihat',
      punyaHomograf: '1',
      punyaHomonim: '0',
    });
    await kamusDenganFilter.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', {
      params: {
        limit: 15,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'kata',
        aktif: '1',
        jenis: 'dasar',
        jenis_rujuk: 'lihat',
        punya_homograf: '1',
        punya_homonim: '0',
      },
    });

    const kamusDenganSemuaFilter = useDaftarKamusAdmin({
      limit: 11,
      q: 'ujicoba',
      kelasKata: 'n',
      ragam: 'cak',
      ragamVarian: 'kas',
      bidang: 'umum',
      bahasa: 'id',
      punyaLafal: '1',
      punyaPemenggalan: '0',
      punyaIlmiah: '1',
      punyaKimia: '0',
      penyingkatan: 'sing',
      punyaKiasan: '1',
      punyaContoh: '1',
    });
    await kamusDenganSemuaFilter.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', {
      params: {
        limit: 11,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'ujicoba',
        kelas_kata: 'n',
        ragam: 'cak',
        ragam_varian: 'kas',
        bidang: 'umum',
        bahasa: 'id',
        punya_lafal: '1',
        punya_pemenggalan: '0',
        punya_ilmiah: '1',
        punya_kimia: '0',
        penyingkatan: 'sing',
        punya_kiasan: '1',
        punya_contoh: '1',
      },
    });

    const tesaurus = useDaftarTesaurusAdmin({});
    await tesaurus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tesaurus', { params: { limit: 50, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined } });

    const etimologi = useDaftarEtimologiAdmin({
      limit: 22,
      q: 'asal',
      cursor: 'et-1',
      direction: 'prev',
      lastPage: true,
      bahasa: 'Inggris',
      aktif: '1',
    });
    await etimologi.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi', {
      params: {
        limit: 22,
        cursor: 'et-1',
        direction: 'prev',
        lastPage: '1',
        q: 'asal',
        aktif: '1',
        bahasa: 'Inggris',
      },
    });

    const etimologiDefault = useDaftarEtimologiAdmin();
    await etimologiDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        aktif: undefined,
        bahasa: undefined,
      },
    });

    const etimologiKosong = useDaftarEtimologiAdmin({ bahasa: '__KOSONG__' });
    await etimologiKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        aktif: undefined,
        bahasa: '__KOSONG__',
      },
    });

    const etimologiMeragukan = useDaftarEtimologiAdmin({ meragukan: '0' });
    await etimologiMeragukan.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        aktif: undefined,
        meragukan: '0',
      },
    });

    const etimologiDenganIdMaster = useDaftarEtimologiAdmin({ bahasaId: 11, sumberId: 22 });
    await etimologiDenganIdMaster.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        aktif: undefined,
        bahasa_id: 11,
        sumber_id: 22,
      },
    });

    const autocompleteEntriEtimologi = useAutocompleteEntriEtimologi({ q: '  kata ', limit: 9 });
    expect(autocompleteEntriEtimologi.enabled).toBe(true);
    await autocompleteEntriEtimologi.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi/opsi-entri', {
      params: {
        q: 'kata',
        limit: 9,
      },
    });

    const autocompleteEntriEtimologiKosong = useAutocompleteEntriEtimologi({ q: '   ' });
    expect(autocompleteEntriEtimologiKosong.enabled).toBe(false);
    await autocompleteEntriEtimologiKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi/opsi-entri', {
      params: {
        q: undefined,
        limit: 8,
      },
    });

    const autocompleteEntriEtimologiNull = useAutocompleteEntriEtimologi({ q: null, limit: 6 });
    expect(autocompleteEntriEtimologiNull.enabled).toBe(false);
    await autocompleteEntriEtimologiNull.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi/opsi-entri', {
      params: {
        q: undefined,
        limit: 6,
      },
    });

    const auditMakna = useDaftarAuditMaknaAdmin({
      limit: 25,
      cursor: 'c-1',
      direction: 'prev',
      lastPage: true,
      q: 'audit',
      status: 'tinjau',
    });
    await auditMakna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/audit-makna', {
      params: {
        limit: 25,
        cursor: 'c-1',
        direction: 'prev',
        lastPage: '1',
        q: 'audit',
        status: 'tinjau',
      },
    });

    const auditMaknaTanpaStatus = useDaftarAuditMaknaAdmin({ q: '' });
    await auditMaknaTanpaStatus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/audit-makna', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
      },
    });

    const glosarium = useDaftarGlosariumAdmin({ q: '' });
    await glosarium.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/glosarium', { params: { limit: 50, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined } });

    const glosariumDenganFilterMaster = useDaftarGlosariumAdmin({
      q: 'term',
      bidangId: 12,
      sumberId: 34,
      aktif: '1',
    });
    await glosariumDenganFilterMaster.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/glosarium', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'term',
        aktif: '1',
        bidang_id: 12,
        sumber_id: 34,
      },
    });

    const glosariumDenganBahasaId = useDaftarGlosariumAdmin({ bahasaId: 56 });
    await glosariumDenganBahasaId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/glosarium', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        aktif: undefined,
        bahasa_id: 56,
      },
    });

    const label = useDaftarLabelAdmin({ q: '' });
    await label.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label', { params: { limit: 50, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined } });

    const kategoriLabel = useOpsiLabelRedaksi(['ragam', 'kelas-kata']);
    await kategoriLabel.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label/kategori', { params: { nama: 'ragam,kelas-kata' } });

    const kategoriLabelKosong = useKategoriLabelRedaksi([]);
    await kategoriLabelKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label/kategori', { params: { nama: undefined } });

    const pengguna = useDaftarPengguna({ limit: 20 });
    await pengguna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna', {
      params: { limit: 20, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined },
    });

    const penggunaDenganPeran = useDaftarPengguna({ limit: 20, peran_id: '3' });
    await penggunaDenganPeran.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna', {
      params: { limit: 20, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined, peran_id: '3' },
    });

    const peran = useDaftarPeran();
    await peran.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna/peran');

    const izinKelolaCursor = useDaftarIzinKelolaAdmin({
      limit: 15,
      cursor: 'cursor-1',
      direction: 'prev',
      lastPage: true,
      q: 'adm',
    });
    await izinKelolaCursor.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/izin', {
      params: {
        limit: 15,
        cursor: 'cursor-1',
        direction: 'prev',
        lastPage: '1',
        q: 'adm',
      },
    });

    const peranAdmin = useDaftarPeranAdmin({ limit: 30, q: 'adm' });
    await peranAdmin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/peran', {
      params: { limit: 30, cursor: undefined, direction: 'next', lastPage: undefined, q: 'adm' },
    });

    const peranAdminTanpaQ = useDaftarPeranAdmin({ limit: 5, q: '' });
    await peranAdminTanpaQ.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/peran', {
      params: { limit: 5, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined },
    });

    const detailPeran = useDetailPeranAdmin(99);
    expect(detailPeran.enabled).toBe(true);
    await detailPeran.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/peran/99');

    const daftarIzin = useDaftarIzinAdmin({ q: 'kelola' });
    await daftarIzin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/peran/izin', { params: { q: 'kelola' } });

    const daftarIzinTanpaQ = useDaftarIzinAdmin({ q: '' });
    await daftarIzinTanpaQ.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/peran/izin', { params: { q: undefined } });

    const izinKelola = useDaftarIzinKelolaAdmin({ limit: 40, q: 'lihat' });
    await izinKelola.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/izin', {
      params: { limit: 40, cursor: undefined, direction: 'next', lastPage: undefined, q: 'lihat' },
    });

    const izinKelolaTanpaQ = useDaftarIzinKelolaAdmin({ limit: 7, q: '' });
    await izinKelolaTanpaQ.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/izin', {
      params: { limit: 7, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined },
    });

    const detailIzin = useDetailIzinAdmin(101);
    expect(detailIzin.enabled).toBe(true);
    await detailIzin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/izin/101');

    const opsiPeranUntukIzin = useDaftarPeranUntukIzinAdmin({ q: 'adm' });
    await opsiPeranUntukIzin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/izin/peran', { params: { q: 'adm' } });

    const opsiPeranUntukIzinTanpaQ = useDaftarPeranUntukIzinAdmin({ q: '' });
    await opsiPeranUntukIzinTanpaQ.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/izin/peran', { params: { q: undefined } });

    expect(useDetailPeranAdmin(null).enabled).toBe(false);
    expect(useDetailIzinAdmin(null).enabled).toBe(false);

    const makna = useDaftarMakna(44);
    expect(makna.enabled).toBe(true);
    await makna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/44/makna');

    const maknaKosong = useDaftarMakna(null);
    expect(maknaKosong.enabled).toBe(false);

    const komentar = useDaftarKomentarAdmin({ limit: 25, q: 'kata' });
    await komentar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/komentar', {
      params: { limit: 25, cursor: undefined, direction: 'next', lastPage: undefined, q: 'kata', aktif: undefined },
    });

    const detailKamus = useDetailKamusAdmin(12);
    expect(detailKamus.enabled).toBe(true);
    await detailKamus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/12');

    const detailKomentar = useDetailKomentarAdmin(13);
    expect(detailKomentar.enabled).toBe(true);
    await detailKomentar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/komentar/13');

    const detailTesaurus = useDetailTesaurusAdmin(14);
    expect(detailTesaurus.enabled).toBe(true);
    await detailTesaurus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tesaurus/14');

    const detailEtimologi = useDetailEtimologiAdmin(77);
    expect(detailEtimologi.enabled).toBe(true);
    await detailEtimologi.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/etimologi/77');

    const detailGlosarium = useDetailGlosariumAdmin(15);
    expect(detailGlosarium.enabled).toBe(true);
    await detailGlosarium.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/glosarium/15');

    const daftarBidang = useDaftarBidangAdmin({ limit: 12, q: 'kim', kamus: '1', glosarium: '0' });
    await daftarBidang.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang', {
      params: {
        limit: 12,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'kim',
        kamus: '1',
        glosarium: '0',
      },
    });

    const opsiBidangAdmin = useOpsiBidangAdmin();
    await opsiBidangAdmin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang/opsi', { params: {} });

    const opsiBidangKamus = useOpsiBidangKamusAdmin();
    await opsiBidangKamus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang/opsi', { params: {} });

    const detailBidang = useDetailBidangAdmin(18);
    expect(detailBidang.enabled).toBe(true);
    await detailBidang.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang/18');

    const daftarBahasa = useDaftarBahasaAdmin({ limit: 12, q: 'ing', aktif: '1' });
    await daftarBahasa.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa', {
      params: {
        limit: 12,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'ing',
        aktif: '1',
      },
    });

    const daftarSemuaBahasa = useDaftarSemuaBahasaAdmin({ q: 'ar', aktif: '0', enabled: false });
    expect(daftarSemuaBahasa.enabled).toBe(false);
    await daftarSemuaBahasa.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa', {
      params: {
        offset: 0,
        limit: 200,
        q: 'ar',
        aktif: '0',
      },
    });

    const detailBahasa = useDetailBahasaAdmin(20);
    expect(detailBahasa.enabled).toBe(true);
    await detailBahasa.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa/20');

    const opsiBahasaAdmin = useOpsiBahasaAdmin();
    await opsiBahasaAdmin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa/opsi', { params: {} });

    const opsiBahasaKamus = useOpsiBahasaKamusAdmin();
    await opsiBahasaKamus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa/opsi', { params: {} });

    const opsiBahasaGlosarium = useOpsiBahasaGlosariumAdmin({ enabled: false });
    expect(opsiBahasaGlosarium.enabled).toBe(false);
    await opsiBahasaGlosarium.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa/opsi', { params: {} });

    const opsiBahasaEtimologi = useOpsiBahasaEtimologiAdmin({ enabled: false });
    expect(opsiBahasaEtimologi.enabled).toBe(false);
    await opsiBahasaEtimologi.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bahasa/opsi', { params: {} });

    const opsiSumberAdmin = useOpsiSumberAdmin({ glosarium: '1' });
    await opsiSumberAdmin.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sumber/opsi', {
      params: { glosarium: '1', kamus: '', tesaurus: '', etimologi: '' },
    });

    const susunKataHarian = useSusunKataHarianAdmin({ tanggal: '2026-03-02', panjang: '7' });
    await susunKataHarian.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: '2026-03-02',
        panjang: 5,
      },
    });

    const susunKataHarianNonNumerik = useSusunKataHarianAdmin({ tanggal: '2026-03-08', panjang: 'abc' });
    await susunKataHarianNonNumerik.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: '2026-03-08',
        panjang: 5,
      },
    });

    const susunKataHarianKosong = useSusunKataHarianAdmin({ tanggal: '', panjang: '' });
    await susunKataHarianKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: undefined,
        panjang: 5,
      },
    });

    const susunKataHarianNull = useSusunKataHarianAdmin({ tanggal: '2026-03-09', panjang: null });
    await susunKataHarianNull.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: '2026-03-09',
        panjang: 5,
      },
    });

    const susunKataBebas = useSusunKataBebasAdmin({ tanggal: '2026-03-03', limit: '77' });
    await susunKataBebas.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/bebas', {
      params: {
        tanggal: '2026-03-03',
        limit: 77,
      },
    });

    const susunKataBebasFallback = useSusunKataBebasAdmin({ tanggal: ' ', limit: 'abc' });
    await susunKataBebasFallback.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/bebas', {
      params: {
        tanggal: undefined,
        limit: 200,
      },
    });

    const susunKataBebasNull = useSusunKataBebasAdmin({ tanggal: null, limit: 10 });
    await susunKataBebasNull.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/bebas', {
      params: {
        tanggal: undefined,
        limit: 10,
      },
    });

    const detailSusunKata = useDetailSusunKataHarianAdmin({ tanggal: '2026-03-02', panjang: '9' });
    expect(detailSusunKata.enabled).toBe(true);
    await detailSusunKata.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian/detail', {
      params: {
        tanggal: '2026-03-02',
        panjang: 5,
      },
    });

    const detailSusunKataNonNumerik = useDetailSusunKataHarianAdmin({ tanggal: '2026-03-08', panjang: 'abc' });
    expect(detailSusunKataNonNumerik.enabled).toBe(true);
    await detailSusunKataNonNumerik.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian/detail', {
      params: {
        tanggal: '2026-03-08',
        panjang: 5,
      },
    });

    const detailSusunKataKosong = useDetailSusunKataHarianAdmin({ tanggal: '', panjang: '' });
    expect(detailSusunKataKosong.enabled).toBe(false);

    const detailSusunKataNull = useDetailSusunKataHarianAdmin({ tanggal: '2026-03-02', panjang: null });
    expect(detailSusunKataNull.enabled).toBe(false);

    const detailSusunKataTanggalNull = useDetailSusunKataHarianAdmin({ tanggal: null, panjang: '5' });
    expect(detailSusunKataTanggalNull.enabled).toBe(false);

    const daftarSumber = useDaftarSumberAdmin({ limit: 13, q: 'kb', glosarium: '1', kamus: '0' });
    await daftarSumber.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sumber', {
      params: {
        limit: 13,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'kb',
        aktif: undefined,
        glosarium: '1',
        kamus: '0',
      },
    });

    const daftarSemuaBidang = useDaftarSemuaBidangAdmin({ q: 'kim', kamus: '1', glosarium: '0', enabled: false });
    expect(daftarSemuaBidang.enabled).toBe(false);
    await daftarSemuaBidang.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang', {
      params: {
        limit: 200,
        q: 'kim',
        kamus: '1',
        glosarium: '0',
        offset: 0,
      },
    });

    const daftarSemuaSumber = useDaftarSemuaSumberAdmin({ q: 'kb', glosarium: '1', kamus: '0', tesaurus: '1', etimologi: '0', enabled: false });
    expect(daftarSemuaSumber.enabled).toBe(false);
    await daftarSemuaSumber.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sumber', {
      params: {
        limit: 200,
        q: 'kb',
        glosarium: '1',
        kamus: '0',
        tesaurus: '1',
        etimologi: '0',
        offset: 0,
      },
    });

    const detailSumber = useDetailSumberAdmin(19);
    expect(detailSumber.enabled).toBe(true);
    await detailSumber.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sumber/19');

    const detailLabel = useDetailLabelAdmin(16);
    expect(detailLabel.enabled).toBe(true);
    await detailLabel.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label/16');

    const detailPengguna = useDetailPengguna(17);
    expect(detailPengguna.enabled).toBe(true);
    await detailPengguna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna/17');

    expect(useDetailKamusAdmin(null).enabled).toBe(false);
    expect(useDetailKomentarAdmin(null).enabled).toBe(false);
    expect(useDetailTesaurusAdmin(null).enabled).toBe(false);
    expect(useDetailEtimologiAdmin(null).enabled).toBe(false);
    expect(useDetailGlosariumAdmin(null).enabled).toBe(false);
    expect(useDetailLabelAdmin(null).enabled).toBe(false);
    expect(useDetailPengguna(null).enabled).toBe(false);
    expect(useDetailBidangAdmin(null).enabled).toBe(false);
    expect(useDetailSumberAdmin(null).enabled).toBe(false);
    expect(useDetailBahasaAdmin(null).enabled).toBe(false);
  });

  it('mengonfigurasi mutation admin pengguna', async () => {
    const ubahPeran = useUbahPeran();
    await ubahPeran.mutationFn({ penggunaId: 5, peranId: 2 });
    expect(klien.patch).toHaveBeenCalledWith('/api/redaksi/pengguna/5/peran', { peran_id: 2 });
    ubahPeran.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pengguna'] });

    const simpanPengguna = useSimpanPengguna();
    await simpanPengguna.mutationFn({ id: 8, nama: 'Admin' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/pengguna/8', { id: 8, nama: 'Admin' });
    simpanPengguna.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pengguna'] });

    const simpanPeran = useSimpanPeranAdmin();
    await simpanPeran.mutationFn({ id: 2, kode: 'editor', nama: 'Editor', izin_ids: [1, 2] });
    await simpanPeran.mutationFn({ kode: 'reviewer', nama: 'Reviewer', izin_ids: [] });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/peran/2', { id: 2, kode: 'editor', nama: 'Editor', izin_ids: [1, 2] });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/peran', { kode: 'reviewer', nama: 'Reviewer', izin_ids: [] });

    simpanPeran.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-peran-kelola'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-peran'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pengguna'] });

    const simpanIzin = useSimpanIzinAdmin();
    await simpanIzin.mutationFn({ id: 4, kode: 'lihat_dashboard', nama: 'Lihat Dashboard', peran_ids: [1, 2] });
    await simpanIzin.mutationFn({ kode: 'lihat_statistik', nama: 'Lihat Statistik', peran_ids: [] });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/izin/4', { id: 4, kode: 'lihat_dashboard', nama: 'Lihat Dashboard', peran_ids: [1, 2] });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/izin', { kode: 'lihat_statistik', nama: 'Lihat Statistik', peran_ids: [] });

    simpanIzin.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-izin-kelola'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-izin'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-peran-kelola'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-peran'] });
  });

  it('mengonfigurasi mutation admin kamus + makna + contoh', async () => {
    const simpanKamus = useSimpanKamus();
    await simpanKamus.mutationFn({ id: 1, entri: 'uji' });
    await simpanKamus.mutationFn({ entri: 'baru' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kamus/1', { id: 1, entri: 'uji' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/kamus', { entri: 'baru' });
    simpanKamus.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-kamus'] });

    const hapusKamus = useHapusKamus();
    await hapusKamus.mutationFn(9);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/kamus/9');
    hapusKamus.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-kamus'] });

    const simpanKomentar = useSimpanKomentarAdmin();
    await simpanKomentar.mutationFn({ id: 4, komentar: 'baru', aktif: true });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/komentar/4', { id: 4, komentar: 'baru', aktif: true });
    simpanKomentar.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-komentar'] });

    const simpanAuditMakna = useSimpanAuditMaknaAdmin();
    await simpanAuditMakna.mutationFn({ id: 12, status: 'salah', catatan: 'uji' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/audit-makna/12', { id: 12, status: 'salah', catatan: 'uji' });
    simpanAuditMakna.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-audit-makna'] });

    const simpanMakna = useSimpanMakna();
    await simpanMakna.mutationFn({ entriId: 4, id: 2, makna: 'uji' });
    await simpanMakna.mutationFn({ entriId: 4, makna: 'baru' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kamus/4/makna/2', { id: 2, makna: 'uji' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/kamus/4/makna', { makna: 'baru' });
    simpanMakna.onSuccess(null, { entriId: 4 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-makna', 4] });

    const hapusMakna = useHapusMakna();
    await hapusMakna.mutationFn({ entriId: 4, maknaId: 77 });
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/kamus/4/makna/77');
    hapusMakna.onSuccess(null, { entriId: 4 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-makna', 4] });

    const simpanContoh = useSimpanContoh();
    await simpanContoh.mutationFn({ entriId: 3, maknaId: 6, id: 11, contoh: 'c1' });
    await simpanContoh.mutationFn({ entriId: 3, maknaId: 6, contoh: 'c2' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kamus/3/makna/6/contoh/11', { id: 11, contoh: 'c1' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/kamus/3/makna/6/contoh', { contoh: 'c2' });
    simpanContoh.onSuccess(null, { entriId: 3 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-makna', 3] });

    const hapusContoh = useHapusContoh();
    await hapusContoh.mutationFn({ entriId: 3, maknaId: 6, contohId: 11 });
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/kamus/3/makna/6/contoh/11');
    hapusContoh.onSuccess(null, { entriId: 3 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-makna', 3] });
  });

  it('mengonfigurasi mutation admin tesaurus + glosarium + label', async () => {
    const simpanTesaurus = useSimpanTesaurus();
    await simpanTesaurus.mutationFn({ id: 2, lema: 'a' });
    await simpanTesaurus.mutationFn({ lema: 'b' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/tesaurus/2', { id: 2, lema: 'a' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/tesaurus', { lema: 'b' });
    simpanTesaurus.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-tesaurus'] });

    const hapusTesaurus = useHapusTesaurus();
    await hapusTesaurus.mutationFn(2);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/tesaurus/2');
    hapusTesaurus.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-tesaurus'] });

    const simpanEtimologi = useSimpanEtimologi();
    await simpanEtimologi.mutationFn({ id: 8, indeks: 'asal' });
    await simpanEtimologi.mutationFn({ indeks: 'serapan' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/etimologi/8', { id: 8, indeks: 'asal' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/etimologi', { indeks: 'serapan' });
    simpanEtimologi.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-etimologi'] });

    const hapusEtimologi = useHapusEtimologi();
    await hapusEtimologi.mutationFn(8);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/etimologi/8');
    hapusEtimologi.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-etimologi'] });

    const simpanGlosarium = useSimpanGlosarium();
    await simpanGlosarium.mutationFn({ id: 5, indonesia: 'air' });
    await simpanGlosarium.mutationFn({ indonesia: 'api' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/glosarium/5', { id: 5, indonesia: 'air' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/glosarium', { indonesia: 'api' });
    simpanGlosarium.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-glosarium'] });

    const hapusGlosarium = useHapusGlosarium();
    await hapusGlosarium.mutationFn(5);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/glosarium/5');
    hapusGlosarium.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-glosarium'] });

    const simpanBidang = useSimpanBidang();
    await simpanBidang.mutationFn({ id: 2, kode: 'kim', nama: 'Kimia' });
    await simpanBidang.mutationFn({ kode: 'fis', nama: 'Fisika' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/bidang/2', { id: 2, kode: 'kim', nama: 'Kimia' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/bidang', { kode: 'fis', nama: 'Fisika' });
    simpanBidang.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bidang'] });

    const hapusBidang = useHapusBidang();
    await hapusBidang.mutationFn(2);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/bidang/2');
    hapusBidang.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bidang'] });

    const simpanBahasa = useSimpanBahasa();
    await simpanBahasa.mutationFn({ id: 4, kode: 'Ing', nama: 'Inggris' });
    await simpanBahasa.mutationFn({ kode: 'Ar', nama: 'Arab' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/bahasa/4', { id: 4, kode: 'Ing', nama: 'Inggris' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/bahasa', { kode: 'Ar', nama: 'Arab' });
    simpanBahasa.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bahasa'] });

    const hapusBahasa = useHapusBahasa();
    await hapusBahasa.mutationFn(4);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/bahasa/4');
    hapusBahasa.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bahasa'] });

    const simpanSusunKata = useSimpanSusunKataHarianAdmin();
    await simpanSusunKata.mutationFn({ tanggal: '2026-03-02', panjang: 5, kata: 'kartu' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', { tanggal: '2026-03-02', panjang: 5, kata: 'kartu' });
    simpanSusunKata.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-susun-kata-harian'] });

    const buatSusunKata = useBuatSusunKataHarianAdmin();
    await buatSusunKata.mutationFn({ tanggal: ' 2026-03-03 ', panjang: '20' });
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: '2026-03-03',
        panjang: 5,
      },
    });
    await buatSusunKata.mutationFn({ tanggal: '2026-03-04', panjang: 'abc' });
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: '2026-03-04',
        panjang: 5,
      },
    });
    await buatSusunKata.mutationFn({ tanggal: '   ', panjang: '' });
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: undefined,
        panjang: 5,
      },
    });
    await buatSusunKata.mutationFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/susun-kata/harian', {
      params: {
        tanggal: undefined,
        panjang: 5,
      },
    });
    buatSusunKata.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-susun-kata-harian'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-susun-kata-harian-detail'] });

    const simpanSumber = useSimpanSumber();
    await simpanSumber.mutationFn({ id: 3, kode: 'kbbi', nama: 'KBBI' });
    await simpanSumber.mutationFn({ kode: 'pusba', nama: 'Pusba' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/sumber/3', { id: 3, kode: 'kbbi', nama: 'KBBI' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/sumber', { kode: 'pusba', nama: 'Pusba' });
    simpanSumber.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-sumber'] });

    const hapusSumber = useHapusSumber();
    await hapusSumber.mutationFn(3);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/sumber/3');
    hapusSumber.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-sumber'] });

    const simpanLabel = useSimpanLabel();
    await simpanLabel.mutationFn({ id: 7, kategori: 'ragam', kode: 'cak', nama: 'cakapan' });
    await simpanLabel.mutationFn({ kategori: 'ragam', kode: 'ark', nama: 'arkais' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/label/7', { id: 7, kategori: 'ragam', kode: 'cak', nama: 'cakapan' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/label', { kategori: 'ragam', kode: 'ark', nama: 'arkais' });
    simpanLabel.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-label'] });

    const hapusLabel = useHapusLabel();
    await hapusLabel.mutationFn(7);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/label/7');
    hapusLabel.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-label'] });
  });

  it('meneruskan extra params non-kosong pada daftar sumber admin', async () => {
    const daftarSumber = useDaftarSumberAdmin({
      limit: 20,
      q: 'src',
      glosarium: '1',
      kamus: '0',
      tesaurus: '1',
      etimologi: '',
    });

    await daftarSumber.queryFn();

    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sumber', {
      params: {
        limit: 20,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'src',
        glosarium: '1',
        kamus: '0',
        tesaurus: '1',
      },
    });
  });

  it('useDaftarAdminSemua menggabungkan banyak halaman dan menangani chunk non-array', async () => {
    klien.get
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 1 }],
          total: 3,
          pageInfo: { hasNext: true },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 2 }, { id: 3 }],
          total: 3,
          pageInfo: { hasNext: false },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: null,
          total: 0,
          pageInfo: { hasNext: true },
        },
      });

    const semuaBidang = useDaftarSemuaBidangAdmin({ q: 'kim' });
    const hasilBidang = await semuaBidang.queryFn();
    expect(hasilBidang.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(hasilBidang.total).toBe(3);

    const semuaSumber = useDaftarSemuaSumberAdmin({ q: 'src' });
    const hasilSumber = await semuaSumber.queryFn();
    expect(hasilSumber.data).toEqual([]);
    expect(hasilSumber.total).toBe(0);
  });

  it('mengonfigurasi query pencarian hitam dan detailnya', async () => {
    const daftarDefault = useDaftarPencarianHitamAdmin();
    await daftarDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pencarianHitam', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        aktif: undefined,
      },
    });

    const daftarCustom = useDaftarPencarianHitamAdmin({
      limit: 80,
      cursor: 'ph-1',
      direction: 'prev',
      lastPage: true,
      q: 'spam',
      aktif: '0',
    });
    await daftarCustom.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pencarianHitam', {
      params: {
        limit: 80,
        cursor: 'ph-1',
        direction: 'prev',
        lastPage: '1',
        q: 'spam',
        aktif: '0',
      },
    });

    const detailAktif = useDetailPencarianHitamAdmin(11);
    expect(detailAktif.enabled).toBe(true);
    await detailAktif.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pencarianHitam/11');

    const detailNonaktif = useDetailPencarianHitamAdmin(0);
    expect(detailNonaktif.enabled).toBe(false);
  });

  it('mengonfigurasi query tagar dan audit tagar', async () => {
    const daftarTagar = useDaftarTagarAdmin({
      limit: 30,
      cursor: 't-1',
      direction: 'prev',
      lastPage: true,
      q: 'pref',
      kategori: 'prefiks',
      aktif: '1',
    });
    await daftarTagar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tagar', {
      params: {
        limit: 30,
        cursor: 't-1',
        direction: 'prev',
        lastPage: '1',
        q: 'pref',
        aktif: '1',
        kategori: 'prefiks',
      },
    });

    const auditDefault = useDaftarAuditTagarAdmin();
    await auditDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/audit-tagar', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        tagar_id: undefined,
        jenis: 'turunan',
        punya_tagar: undefined,
      },
    });

    const auditCustom = useDaftarAuditTagarAdmin({
      limit: 15,
      cursor: 'at-2',
      direction: 'prev',
      lastPage: true,
      q: 'me',
      tagarId: '7',
      jenis: 'dasar',
      punyaTagar: '0',
    });
    await auditCustom.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/audit-tagar', {
      params: {
        limit: 15,
        cursor: 'at-2',
        direction: 'prev',
        lastPage: '1',
        q: 'me',
        tagar_id: '7',
        jenis: 'dasar',
        punya_tagar: '0',
      },
    });

    const daftarEntriTagar = useDaftarEntriTagarAdmin({ q: 'lihat' });
    await daftarEntriTagar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/audit-tagar', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: 'lihat',
        tagar_id: undefined,
        jenis: 'turunan',
        punya_tagar: undefined,
      },
    });

    const detailTagar = useDetailTagarAdmin(3);
    expect(detailTagar.enabled).toBe(true);
    await detailTagar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tagar/3');
    expect(useDetailTagarAdmin(null).enabled).toBe(false);

    const tagarEntri = useTagarEntri(9);
    expect(tagarEntri.enabled).toBe(true);
    await tagarEntri.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/9/tagar');
    expect(useTagarEntri('').enabled).toBe(false);

    const semuaTagar = useDaftarTagarUntukPilih();
    expect(semuaTagar.staleTime).toBe(5 * 60 * 1000);
    await semuaTagar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tagar/opsi-pilih');

    const kategoriTagar = useKategoriTagarAdmin();
    expect(kategoriTagar.staleTime).toBe(5 * 60 * 1000);
    await kategoriTagar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tagar/kategori');

    const statistikSinset = useStatistikSinsetAdmin();
    expect(statistikSinset.enabled).toBe(true);
    await statistikSinset.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/statistik');

    expect(useStatistikSinsetAdmin({ enabled: false }).enabled).toBe(false);

    const tipeRelasi = useTipeRelasiAdmin();
    expect(tipeRelasi.enabled).toBe(true);
    expect(tipeRelasi.staleTime).toBe(10 * 60 * 1000);
    await tipeRelasi.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/tipe-relasi');

    expect(useTipeRelasiAdmin({ enabled: false }).enabled).toBe(false);

    const daftarSinset = useDaftarSinsetAdmin({
      limit: 25,
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
      q: 'air',
      status: 'tinjau',
      kelas_kata: 'n',
      ada_pemetaan: '1',
      akar: '0',
    });
    await daftarSinset.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset', {
      params: {
        limit: 25,
        cursor: 'abc',
        direction: 'prev',
        lastPage: '1',
        q: 'air',
        status: 'tinjau',
        kelas_kata: 'n',
        ada_pemetaan: '1',
        akar: '0',
      },
    });

    const daftarSinsetKosong = useDaftarSinsetAdmin();
    await daftarSinsetKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        status: undefined,
        kelas_kata: undefined,
        ada_pemetaan: undefined,
        akar: undefined,
      },
    });

    const detailSinset = useDetailSinsetAdmin('syn-1');
    expect(detailSinset.enabled).toBe(true);
    await detailSinset.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1');
    expect(useDetailSinsetAdmin('').enabled).toBe(false);

    const autocompleteLema = useAutocompleteLemaSinset({ sinsetId: 'syn-1', q: ' air ', limit: 3 });
    expect(autocompleteLema.enabled).toBe(true);
    await autocompleteLema.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1/opsi-lema', {
      params: {
        q: 'air',
        limit: 3,
      },
    });

    const autocompleteLemaKosong = useAutocompleteLemaSinset({ sinsetId: 'syn-1', q: '   ', limit: 3 });
    expect(autocompleteLemaKosong.enabled).toBe(false);
    await autocompleteLemaKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1/opsi-lema', {
      params: {
        q: undefined,
        limit: 3,
      },
    });

    const autocompleteLemaNull = useAutocompleteLemaSinset({ sinsetId: 'syn-1', q: null, limit: 2 });
    expect(autocompleteLemaNull.enabled).toBe(false);
    await autocompleteLemaNull.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1/opsi-lema', {
      params: {
        q: undefined,
        limit: 2,
      },
    });

    const kandidatMakna = useKandidatMaknaSinset('syn-1', 9);
    expect(kandidatMakna.enabled).toBe(true);
    await kandidatMakna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1/lema/9/kandidat');
    expect(useKandidatMaknaSinset('', null).enabled).toBe(false);
  });

  it('mengonfigurasi mutation tagar dan asosiasi tagar-entri', async () => {
    const simpanSinset = useSimpanSinset();
    await simpanSinset.mutationFn({ id: 'syn-1', definisi_id: 'arti', status: 'tinjau' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1', { definisi_id: 'arti', status: 'tinjau' });
    simpanSinset.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-sinset'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-sinset-detail'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-sinset-statistik'] });

    const simpanPemetaan = useSimpanPemetaanLema();
    await simpanPemetaan.mutationFn({ sinsetId: 'syn-1', lemaId: 4, makna_id: 9, terverifikasi: true });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1/lema/4', { makna_id: 9, terverifikasi: true });
    simpanPemetaan.onSuccess();

    const tambahLema = useTambahLemaSinset();
    await tambahLema.mutationFn({ sinsetId: 'syn-1', entri_id: 7 });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/sinset/syn-1/lema', { entri_id: 7 });
    tambahLema.onSuccess();

    const simpanTagar = useSimpanTagar();
    await simpanTagar.mutationFn({ id: 4, kode: 'me', nama: 'me-' });
    await simpanTagar.mutationFn({ kode: 'an', nama: '-an' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/tagar/4', { id: 4, kode: 'me', nama: 'me-' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/tagar', { kode: 'an', nama: '-an' });
    simpanTagar.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-tagar'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-tagar-detail'] });

    const hapusTagar = useHapusTagar();
    await hapusTagar.mutationFn(4);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/tagar/4');
    hapusTagar.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-tagar'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-tagar-detail'] });

    const simpanTagarEntri = useSimpanTagarEntri();
    await simpanTagarEntri.mutationFn({ entriId: 17, tagar_ids: [1, 2] });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kamus/17/tagar', { tagar_ids: [1, 2] });
    simpanTagarEntri.onSuccess(null, { entriId: 17 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tagar-entri'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-audit-tagar'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['tagar-entri', 17] });
  });

  it('mengonfigurasi mutation pencarian hitam', async () => {
    const simpanHitam = useSimpanPencarianHitamAdmin();
    await simpanHitam.mutationFn({ id: 21, kata: 'spam', aktif: true });
    await simpanHitam.mutationFn({ kata: 'iklan', aktif: false });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/pencarianHitam/21', { id: 21, kata: 'spam', aktif: true });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/pencarianHitam', { kata: 'iklan', aktif: false });
    simpanHitam.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pencarian-hitam'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pencarian-hitam-detail'] });

    const hapusHitam = useHapusPencarianHitamAdmin();
    await hapusHitam.mutationFn(21);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/pencarianHitam/21');
    hapusHitam.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pencarian-hitam'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-pencarian-hitam-detail'] });
  });

  it('mengonfigurasi mutation kata hari ini admin', async () => {
    const simpanKataHariIni = useSimpanKataHariIniAdmin();
    await simpanKataHariIni.mutationFn({ id: 4, indeks: 'aktif', tanggal: '2026-03-31' });
    await simpanKataHariIni.mutationFn({ indeks: 'uji', tanggal: '2026-04-01' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kata-hari-ini/4', { id: 4, indeks: 'aktif', tanggal: '2026-03-31' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/kata-hari-ini', { indeks: 'uji', tanggal: '2026-04-01' });
    simpanKataHariIni.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-kata-hari-ini'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-kata-hari-ini-detail'] });

    const hapusKataHariIni = useHapusKataHariIniAdmin();
    await hapusKataHariIni.mutationFn(4);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/kata-hari-ini/4');
    hapusKataHariIni.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-kata-hari-ini'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-kata-hari-ini-detail'] });
  });
});