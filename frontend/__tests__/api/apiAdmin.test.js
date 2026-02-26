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
  useDetailBidangAdmin,
  useDaftarSumberAdmin,
  useDetailSumberAdmin,
  useDaftarLabelAdmin,
  useDetailLabelAdmin,
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
  useSimpanSumber,
  useHapusSumber,
  useSimpanLabel,
  useHapusLabel,
  useSimpanPengguna,
} from '../../src/api/apiAdmin';

describe('apiAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mengonfigurasi semua query hooks admin', async () => {
    const statistik = useStatistikAdmin();
    await statistik.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/statistik');

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
      penyingkatan: 'singkatan',
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
        penyingkatan: 'singkatan',
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

    const label = useDaftarLabelAdmin({ q: '' });
    await label.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label', { params: { limit: 50, cursor: undefined, direction: 'next', lastPage: undefined, q: undefined, aktif: undefined } });

    const kategoriLabel = useKategoriLabelRedaksi(['ragam', 'kelas-kata']);
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

    const daftarBidang = useDaftarBidangAdmin({ limit: 12, q: 'kim', aktif: '1' });
    await daftarBidang.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang', {
      params: { limit: 12, cursor: undefined, direction: 'next', lastPage: undefined, q: 'kim', aktif: '1' },
    });

    const detailBidang = useDetailBidangAdmin(18);
    expect(detailBidang.enabled).toBe(true);
    await detailBidang.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/bidang/18');

    const daftarSumber = useDaftarSumberAdmin({ limit: 13, q: 'kb', aktif: '0' });
    await daftarSumber.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/sumber', {
      params: { limit: 13, cursor: undefined, direction: 'next', lastPage: undefined, q: 'kb', aktif: '0' },
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
});