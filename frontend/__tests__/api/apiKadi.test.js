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
    delete: vi.fn(() => Promise.resolve({ data: { ok: true } })),
  },
}));

import klien from '../../src/api/klien';
import {
  useDaftarKandidatKataAdmin,
  useDetailKandidatKataAdmin,
  useSimpanKandidatKata,
  useUbahStatusKandidatKata,
  useHapusKandidatKata,
  useStatistikKandidatKata,
  useDaftarAtestasi,
  useTambahAtestasi,
  useDaftarRiwayat,
} from '../../src/api/apiKadi';

describe('apiKadi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mengonfigurasi semua query hook kandidat kata', async () => {
    const daftarDefault = useDaftarKandidatKataAdmin();
    await daftarDefault.queryFn();
    expect(daftarDefault.queryKey).toEqual([
      'admin-kandidat-kata',
      {
        limit: 50,
        cursor: null,
        direction: 'next',
        lastPage: false,
        q: '',
        status: '',
        jenis: '',
        sumberScraper: '',
        prioritas: '',
      },
    ]);
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata', {
      params: {
        limit: 50,
        cursor: undefined,
        direction: 'next',
        lastPage: undefined,
        q: undefined,
        status: undefined,
        jenis: undefined,
        sumber_scraper: undefined,
        prioritas: undefined,
      },
    });

    const daftarCustom = useDaftarKandidatKataAdmin({
      limit: 10,
      cursor: 'cur-1',
      direction: 'prev',
      lastPage: true,
      q: '  swafoto  ',
      status: 'ditinjau',
      jenis: 'kata-dasar',
      sumberScraper: 'wikipedia',
      prioritas: 0,
    });
    await daftarCustom.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata', {
      params: {
        limit: 10,
        cursor: 'cur-1',
        direction: 'prev',
        lastPage: '1',
        q: '  swafoto  ',
        status: 'ditinjau',
        jenis: 'kata-dasar',
        sumber_scraper: 'wikipedia',
        prioritas: 0,
      },
    });

    const detailTanpaId = useDetailKandidatKataAdmin(null);
    expect(detailTanpaId.enabled).toBe(false);
    await detailTanpaId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/null');

    const detailDenganId = useDetailKandidatKataAdmin(14);
    expect(detailDenganId.enabled).toBe(true);
    await detailDenganId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/14');

    const statistikDefault = useStatistikKandidatKata();
    expect(statistikDefault.enabled).toBe(true);
    expect(statistikDefault.staleTime).toBe(30000);
    await statistikDefault.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/stats');

    const statistikDisabled = useStatistikKandidatKata({ enabled: false });
    expect(statistikDisabled.enabled).toBe(false);

    const atestasiTanpaId = useDaftarAtestasi(0);
    expect(atestasiTanpaId.enabled).toBe(false);
    await atestasiTanpaId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/0/atestasi');

    const atestasiDenganId = useDaftarAtestasi(8);
    expect(atestasiDenganId.enabled).toBe(true);
    await atestasiDenganId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/8/atestasi');

    const riwayatTanpaId = useDaftarRiwayat('');
    expect(riwayatTanpaId.enabled).toBe(false);
    await riwayatTanpaId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata//riwayat');

    const riwayatDenganId = useDaftarRiwayat(5);
    expect(riwayatDenganId.enabled).toBe(true);
    await riwayatDenganId.queryFn();
    expect(klien.get).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/5/riwayat');
  });

  it('mengonfigurasi semua mutation hook kandidat kata dan invalidasi query terkait', async () => {
    const simpan = useSimpanKandidatKata();
    await simpan.mutationFn({ id: 9, kata: 'swafoto' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/9', { id: 9, kata: 'swafoto' });
    simpan.onSuccess();
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, { queryKey: ['admin-kandidat-kata'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(2, { queryKey: ['admin-kandidat-kata-detail'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(3, { queryKey: ['admin-kandidat-kata-stats'] });

    const ubahStatus = useUbahStatusKandidatKata();
    await ubahStatus.mutationFn({ id: 4, status: 'ditinjau', catatan: 'cek' });
    expect(klien.put).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/4/status', {
      status: 'ditinjau',
      catatan: 'cek',
    });
    ubahStatus.onSuccess();
    expect(invalidateQueries).toHaveBeenNthCalledWith(4, { queryKey: ['admin-kandidat-kata'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(5, { queryKey: ['admin-kandidat-kata-detail'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(6, { queryKey: ['admin-kandidat-kata-stats'] });

    const hapus = useHapusKandidatKata();
    await hapus.mutationFn(13);
    expect(klien.delete).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/13');
    hapus.onSuccess();
    expect(invalidateQueries).toHaveBeenNthCalledWith(7, { queryKey: ['admin-kandidat-kata'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(8, { queryKey: ['admin-kandidat-kata-detail'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(9, { queryKey: ['admin-kandidat-kata-stats'] });

    const tambahAtestasi = useTambahAtestasi();
    await tambahAtestasi.mutationFn({ kandidatId: 7, kutipan: 'contoh', sumber_url: 'https://contoh.test' });
    expect(klien.post).toHaveBeenCalledWith('/api/redaksi/kandidat-kata/7/atestasi', {
      kutipan: 'contoh',
      sumber_url: 'https://contoh.test',
    });
    tambahAtestasi.onSuccess();
    expect(invalidateQueries).toHaveBeenNthCalledWith(10, { queryKey: ['admin-kandidat-kata-atestasi'] });
    expect(invalidateQueries).toHaveBeenNthCalledWith(11, { queryKey: ['admin-kandidat-kata-detail'] });
  });
});