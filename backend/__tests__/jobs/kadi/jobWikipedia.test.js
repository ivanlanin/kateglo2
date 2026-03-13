/**
 * @fileoverview Test job Wikipedia KADI
 * @tested_in backend/jobs/kadi/jobWikipedia.js
 */

const { __private } = require('../../../jobs/kadi/jobWikipedia');

describe('jobs/kadi/jobWikipedia', () => {
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
});