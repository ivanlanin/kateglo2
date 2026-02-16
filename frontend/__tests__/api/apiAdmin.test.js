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
  useDaftarTesaurusAdmin,
  useDaftarGlosariumAdmin,
  useDaftarPengguna,
  useDaftarPeran,
  useUbahPeran,
  useSimpanKamus,
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
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', { params: { limit: 10, offset: 5, q: 'anak' } });

    const kamusKosong = useDaftarKamusAdmin({ limit: 10, offset: 5, q: '' });
    await kamusKosong.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus', { params: { limit: 10, offset: 5, q: undefined } });

    const tesaurus = useDaftarTesaurusAdmin({});
    await tesaurus.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/tesaurus', { params: { limit: 50, offset: 0, q: undefined } });

    const glosarium = useDaftarGlosariumAdmin({ q: '' });
    await glosarium.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/glosarium', { params: { limit: 50, offset: 0, q: undefined } });

    const pengguna = useDaftarPengguna({ limit: 20, offset: 40 });
    await pengguna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna', { params: { limit: 20, offset: 40 } });

    const peran = useDaftarPeran();
    await peran.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/pengguna/peran');

    const makna = useDaftarMakna(44);
    expect(makna.enabled).toBe(true);
    await makna.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kamus/44/makna');

    const maknaKosong = useDaftarMakna(null);
    expect(maknaKosong.enabled).toBe(false);
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

  it('mengonfigurasi mutation admin tesaurus + glosarium', async () => {
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
  });
});