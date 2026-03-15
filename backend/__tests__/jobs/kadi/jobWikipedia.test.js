/**
 * @fileoverview Test job Wikipedia KADI
 * @tested_in backend/jobs/kadi/jobWikipedia.js
 */

const { EventEmitter } = require('events');

jest.mock('https', () => ({
  request: jest.fn(),
}));

jest.mock('../../../models/kadi/modelKandidatEntri', () => ({
  bulkUpsertDariScraper: jest.fn(),
  tambahBanyakAtestasi: jest.fn(),
}));

const https = require('https');
const db = require('../../../db');
const ModelKandidatEntri = require('../../../models/kadi/modelKandidatEntri');
const {
  ambilDaftarArtikelPilihan,
  ambilTeksArtikel,
  jalankanProsesWikipedia,
  tokenisasiDanFilter,
  __private,
} = require('../../../jobs/kadi/jobWikipedia');

function mockHttpsResponses(responses) {
  const queue = [...responses];

  https.request.mockImplementation((_options, callback) => {
    const scenario = queue.shift() || {};
    const req = new EventEmitter();

    req.setTimeout = jest.fn((_ms, handler) => {
      req.__timeoutHandler = handler;
    });
    req.destroy = jest.fn((error) => {
      process.nextTick(() => {
        req.emit('error', error);
      });
    });
    req.end = jest.fn(() => {
      if (scenario.requestError) {
        process.nextTick(() => {
          req.emit('error', scenario.requestError);
        });
        return;
      }

      if (scenario.triggerTimeout) {
        process.nextTick(() => {
          req.__timeoutHandler();
        });
        return;
      }

      const res = new EventEmitter();
      callback(res);

      process.nextTick(() => {
        for (const chunk of scenario.dataChunks || []) {
          res.emit('data', chunk);
        }
        res.emit('end');
      });
    });

    return req;
  });
}

describe('jobs/kadi/jobWikipedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.query.mockReset();
    ModelKandidatEntri.bulkUpsertDariScraper.mockReset();
    ModelKandidatEntri.tambahBanyakAtestasi.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('tetap mencari sampai limit artikel utama terpenuhi', async () => {
    const fetchJsonFn = jest.fn()
      .mockResolvedValueOnce({
        continue: { cmcontinue: 'next-batch' },
        query: {
          categorymembers: [
            { pageid: 1, ns: 4, title: 'Wikipedia:Artikel pilihan' },
            { pageid: 2, ns: 0, title: '? (film)' },
            { pageid: 3, ns: 1, title: 'Pembicaraan:? (film)' },
          ],
        },
      })
      .mockResolvedValueOnce({
        query: {
          categorymembers: [
            { pageid: 4, ns: 0, title: 'A Christmas Carol' },
          ],
        },
      });
    const delayFn = jest.fn().mockResolvedValue();

    const hasil = await __private.ambilDaftarArtikelPilihanDenganFetcher(2, { fetchJsonFn, delayFn });

    expect(hasil).toEqual([
      { pageid: 2, ns: 0, title: '? (film)' },
      { pageid: 4, ns: 0, title: 'A Christmas Carol' },
    ]);
    expect(fetchJsonFn).toHaveBeenCalledTimes(2);
    expect(fetchJsonFn.mock.calls[0][0]).toContain('cmtitle=Kategori%3AArtikel%20pilihan');
    expect(fetchJsonFn.mock.calls[0][0]).toContain('cmlimit=50');
    expect(fetchJsonFn.mock.calls[0][0]).toContain('cmnamespace=0');
    expect(delayFn).toHaveBeenCalledTimes(1);
  });

  it('menghentikan paginasi ketika token continue berulang dan wrapper publik memakai fetcher bawaan', async () => {
    const fetchJsonFn = jest.fn()
      .mockResolvedValueOnce({
        continue: { cmcontinue: 'duplikat' },
        query: { categorymembers: [{ pageid: 1, ns: 0, title: 'Artikel A' }] },
      })
      .mockResolvedValueOnce({
        continue: { cmcontinue: 'duplikat' },
        query: { categorymembers: [{ pageid: 2, ns: 0, title: 'Artikel B' }] },
      });

    await expect(__private.ambilDaftarArtikelPilihanDenganFetcher(10, {
      fetchJsonFn,
      delayFn: jest.fn().mockResolvedValue(),
    })).resolves.toEqual([{ pageid: 1, ns: 0, title: 'Artikel A' }, { pageid: 2, ns: 0, title: 'Artikel B' }]);

    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({ query: { categorymembers: [{ pageid: 9, ns: 0, title: 'Artikel C' }] } })],
      },
    ]);

    await expect(ambilDaftarArtikelPilihan(5)).resolves.toEqual([{ pageid: 9, ns: 0, title: 'Artikel C' }]);

    await expect(__private.ambilDaftarArtikelPilihanDenganFetcher(undefined, {
      fetchJsonFn: jest.fn().mockResolvedValue({ query: { categorymembers: [] } }),
      delayFn: jest.fn().mockResolvedValue(),
    })).resolves.toEqual([]);

    await expect(__private.ambilDaftarArtikelPilihanDenganFetcher(1, {
      fetchJsonFn: jest.fn().mockResolvedValue({}),
      delayFn: jest.fn().mockResolvedValue(),
    })).resolves.toEqual([]);

    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({ query: { categorymembers: [] } })],
      },
    ]);
    await expect(ambilDaftarArtikelPilihan()).resolves.toEqual([]);
  });

  it('fetchJson menangani respons JSON valid, invalid, timeout, dan request error', async () => {
    mockHttpsResponses([
      { dataChunks: [JSON.stringify({ ok: true })] },
      { dataChunks: ['{invalid-json'] },
      { triggerTimeout: true },
      { requestError: new Error('jaringan putus') },
    ]);

    await expect(__private.fetchJson('https://id.wikipedia.org/w/api.php?action=query')).resolves.toEqual({ ok: true });
    await expect(__private.fetchJson('https://id.wikipedia.org/w/api.php?action=parse')).rejects.toThrow('JSON parse error');
    await expect(__private.fetchJson('https://id.wikipedia.org/w/api.php?action=timeout')).rejects.toThrow('Request timeout');
    await expect(__private.fetchJson('https://id.wikipedia.org/w/api.php?action=error')).rejects.toThrow('jaringan putus');
  });

  it('ambilTeksArtikel membersihkan HTML dan membentuk URL artikel', async () => {
    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({
          parse: {
            text: {
              '*': '<div><table><tr><td>hapus</td></tr></table><p>Alpha [sunting] beta <sup>1</sup></p><div class="thumb">hapus</div><p>Gamma</p></div>',
            },
          },
        })],
      },
    ]);

    await expect(ambilTeksArtikel('Alpha Beta')).resolves.toEqual({
      title: 'Alpha Beta',
      text: 'Alpha beta Gamma',
      url: 'https://id.wikipedia.org/wiki/Alpha_Beta',
    });

    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({ parse: { text: {} } })],
      },
    ]);
    await expect(ambilTeksArtikel('Kosong')).resolves.toEqual({
      title: 'Kosong',
      text: '',
      url: 'https://id.wikipedia.org/wiki/Kosong',
    });
  });

  it('tokenisasiDanFilter menyaring stopword, angka, token pendek, dan duplikasi', () => {
    const hasil = tokenisasiDanFilter('Ini kalimat panjang tentang Baru 123 baru hebat. Kalimat kedua tentang Hilang dan baru lagi.');

    expect(hasil).toEqual(expect.arrayContaining([
      { token: 'kalimat', konteks: 'Ini kalimat panjang tentang Baru 123 baru hebat' },
      { token: 'tentang', konteks: 'Ini kalimat panjang tentang Baru 123 baru hebat' },
      { token: 'hebat', konteks: 'Ini kalimat panjang tentang Baru 123 baru hebat' },
      { token: 'hilang', konteks: 'Kalimat kedua tentang Hilang dan baru lagi' },
    ]));
    expect(new Set(hasil.map((item) => item.token)).size).toBe(hasil.length);
  });

  it('delay menyelesaikan promise setelah durasi yang diminta', async () => {
    jest.useFakeTimers();

    const promise = __private.delay(25);
    await jest.advanceTimersByTimeAsync(25);

    await expect(promise).resolves.toBeUndefined();
  });

  it('jalankanProsesWikipedia mendukung dry run dan progress log tiap 10 artikel', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((handler) => {
      handler();
      return 0;
    });
    db.query.mockResolvedValueOnce({ rows: [{ indeks: 'lama' }] });

    const daftarArtikel = Array.from({ length: 10 }, (_, index) => ({
      pageid: index + 1,
      ns: 0,
      title: `Artikel ${index + 1}`,
    }));

    mockHttpsResponses([
      { dataChunks: [JSON.stringify({ query: { categorymembers: daftarArtikel } })] },
      ...daftarArtikel.map((artikel) => ({
        dataChunks: [JSON.stringify({
          parse: { text: { '*': `<p>${artikel.title} membahas kata baru hebat panjang sekali.</p>` } },
        })],
      })),
    ]);

    const hasil = await jalankanProsesWikipedia({ batasArtikel: 10, dryRun: true });

    expect(hasil.artikelDiproses).toBe(10);
    expect(hasil.kandidatBaru).toBeGreaterThan(0);
    expect(ModelKandidatEntri.bulkUpsertDariScraper).not.toHaveBeenCalled();
    expect(ModelKandidatEntri.tambahBanyakAtestasi).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it('jalankanProsesWikipedia menyimpan kandidat baru, melewati kandidat tanpa id, dan melanjutkan saat artikel gagal', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((handler) => {
      handler();
      return 0;
    });
    db.query.mockResolvedValueOnce({ rows: [{ indeks: 'lama' }] });
    ModelKandidatEntri.bulkUpsertDariScraper.mockResolvedValue(new Map([['hilang', 11]]));
    ModelKandidatEntri.tambahBanyakAtestasi.mockResolvedValue(1);

    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({
          query: {
            categorymembers: [
              { pageid: 1, ns: 0, title: 'Artikel Satu' },
              { pageid: 2, ns: 0, title: 'Artikel Dua' },
            ],
          },
        })],
      },
      {
        dataChunks: [JSON.stringify({
          parse: { text: { '*': '<p>Baru hilang muncul dalam kalimat panjang sekali untuk pengujian.</p>' } },
        })],
      },
      {
        requestError: new Error('artikel gagal'),
      },
    ]);

    const hasil = await jalankanProsesWikipedia({ batasArtikel: 2, dryRun: false });

    expect(ModelKandidatEntri.bulkUpsertDariScraper).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ kata: 'hilang', sumber_scraper: 'wikipedia-id-pilihan' }),
      expect.objectContaining({ kata: 'pengujian', sumber_scraper: 'wikipedia-id-pilihan' }),
    ]));
    expect(ModelKandidatEntri.tambahBanyakAtestasi).toHaveBeenCalledWith([
      expect.objectContaining({ kandidat_id: 11, kutipan: expect.any(String), sumber_tipe: 'ensiklopedia' }),
    ]);
    expect(hasil).toEqual(expect.objectContaining({
      artikelDiproses: 1,
      kandidatBaru: 1,
      atestasiDitambah: 1,
    }));
    setTimeoutSpy.mockRestore();
  });

  it('jalankanProsesWikipedia tidak menambah atestasi saat tidak ada kandidat valid', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((handler) => {
      handler();
      return 0;
    });
    db.query.mockResolvedValueOnce({ rows: [{ indeks: 'lama' }] });
    ModelKandidatEntri.bulkUpsertDariScraper.mockResolvedValue(new Map());

    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({ query: { categorymembers: [{ pageid: 1, ns: 0, title: 'Artikel Satu' }] } })],
      },
      {
        dataChunks: [JSON.stringify({ parse: { text: { '*': '<p>Kalimat lama lama lama lama cukup panjang.</p>' } } })],
      },
    ]);

    const hasil = await jalankanProsesWikipedia({ batasArtikel: 1, dryRun: false });

    expect(ModelKandidatEntri.tambahBanyakAtestasi).not.toHaveBeenCalled();
    expect(hasil.atestasiDitambah).toBe(0);
    setTimeoutSpy.mockRestore();
  });

  it('jalankanProsesWikipedia memakai opsi default saat dipanggil tanpa argumen', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((handler) => {
      handler();
      return 0;
    });
    db.query.mockResolvedValueOnce({ rows: [] });
    ModelKandidatEntri.bulkUpsertDariScraper.mockResolvedValue(new Map());

    mockHttpsResponses([
      {
        dataChunks: [JSON.stringify({ query: { categorymembers: [] } })],
      },
    ]);

    const hasil = await jalankanProsesWikipedia();

    expect(hasil).toEqual({
      artikelDiproses: 0,
      tokenDitemukan: 0,
      tokenSudahDiKamus: 0,
      kandidatBaru: 0,
      kandidatSudahAda: 0,
      atestasiDitambah: 0,
    });
    setTimeoutSpy.mockRestore();
  });
});