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
  useDaftarKomentarAdmin,
  useDaftarTesaurusAdmin,
  useDaftarGlosariumAdmin,
  useDaftarLabelAdmin,
  useKategoriLabelRedaksi,
  useDaftarPengguna,
  useDaftarPeran,
  useUbahPeran,
  useSimpanKamus,
  useSimpanKomentarAdmin,
  useHapusKamus,
  useDaftarMakna,
  useSimpanMakna,
  useHapusMakna,
  useSimpanContoh,
  useHapusContoh,
  useSimpanTesaurus,
  useHapusTesaurus,
  useSimpanGlosarium,
  useHapusGlosarium,
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

    const kamus = useDaftarKamusAdmin({ limit: 10, offset: 5, q: 'anak' });
    await kamus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', { params: { limit: 10, offset: 5, q: 'anak', aktif: undefined } });

    const kamusKosong = useDaftarKamusAdmin({ limit: 10, offset: 5, q: '' });
    await kamusKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', { params: { limit: 10, offset: 5, q: undefined, aktif: undefined } });

    const kamusDenganFilter = useDaftarKamusAdmin({
      limit: 15,
      offset: 0,
      q: 'kata',
      jenis: 'dasar',
      jenisRujuk: 'lihat',
    });
    await kamusDenganFilter.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', {
      params: {
        limit: 15,
        offset: 0,
        q: 'kata',
        aktif: undefined,
        jenis: 'dasar',
        jenis_rujuk: 'lihat',
      },
    });

    const tesaurus = useDaftarTesaurusAdmin({});
    await tesaurus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tesaurus', { params: { limit: 50, offset: 0, q: undefined, aktif: undefined } });

    const glosarium = useDaftarGlosariumAdmin({ q: '' });
    await glosarium.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/glosarium', { params: { limit: 50, offset: 0, q: undefined, aktif: undefined } });

    const label = useDaftarLabelAdmin({ q: '' });
    await label.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label', { params: { limit: 50, offset: 0, q: undefined, aktif: undefined } });

    const kategoriLabel = useKategoriLabelRedaksi(['ragam', 'kelas-kata']);
    await kategoriLabel.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label/kategori', { params: { nama: 'ragam,kelas-kata' } });

    const kategoriLabelKosong = useKategoriLabelRedaksi([]);
    await kategoriLabelKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/label/kategori', { params: { nama: undefined } });

    const pengguna = useDaftarPengguna({ limit: 20, offset: 40 });
    await pengguna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna', { params: { limit: 20, offset: 40, q: undefined, aktif: undefined } });

    const peran = useDaftarPeran();
    await peran.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna/peran');

    const makna = useDaftarMakna(44);
    expect(makna.enabled).toBe(true);
    await makna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/44/makna');

    const maknaKosong = useDaftarMakna(null);
    expect(maknaKosong.enabled).toBe(false);

    const komentar = useDaftarKomentarAdmin({ limit: 25, offset: 10, q: 'kata' });
    await komentar.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/komentar', { params: { limit: 25, offset: 10, q: 'kata', aktif: undefined } });
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