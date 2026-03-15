/**
 * @fileoverview Test model gim kuis kata
 * @tested_in backend/models/modelKuisKata.js
 */

const db = require('../../db');
const ModelKuisKata = require('../../models/modelKuisKata');

const { __private } = ModelKuisKata;

describe('ModelKuisKata', () => {
  beforeEach(() => {
    db.query.mockReset();
    jest.restoreAllMocks();
  });

  it('queryAcak menghapus TABLESAMPLE dan menambahkan ORDER BY RANDOM pada fallback', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'acak' }] });

    const sql = `SELECT e.indeks
      FROM entri e TABLESAMPLE SYSTEM(10)
      WHERE e.aktif = 1
      LIMIT 12`;

    const result = await __private.queryAcak(sql, ['x']);

    expect(result.rows).toEqual([{ indeks: 'acak' }]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY RANDOM() LIMIT 12'), ['x']);
    expect(db.query.mock.calls[1][0]).not.toContain('TABLESAMPLE');
  });

  it('queryAcak mengembalikan hasil awal tanpa fallback dan menghormati ORDER BY RANDOM yang sudah ada', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ indeks: 'tetap' }] });

    const sql = `SELECT e.indeks
      FROM entri e TABLESAMPLE SYSTEM(10)
      WHERE e.aktif = 1
      ORDER BY RANDOM()
      LIMIT 12`;

    const result = await __private.queryAcak(sql, ['x']);

    expect(result.rows).toEqual([{ indeks: 'tetap' }]);
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('queryAcak fallback mempertahankan ORDER BY RANDOM yang sudah ada', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'acak' }] });

    const sql = `SELECT e.indeks
      FROM entri e TABLESAMPLE SYSTEM(10)
      WHERE e.aktif = 1
      ORDER BY RANDOM()
      LIMIT 12`;

    const result = await __private.queryAcak(sql, ['x']);

    expect(result.rows).toEqual([{ indeks: 'acak' }]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY RANDOM()'), ['x']);
    expect(db.query.mock.calls[1][0]).not.toContain('TABLESAMPLE');
  });

  it('queryAcak memakai params default dan LIMIT kandidat default saat SQL fallback tidak punya LIMIT eksplisit', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'acak' }] });

    const sql = `SELECT e.indeks
      FROM entri e TABLESAMPLE SYSTEM(10)
      WHERE e.aktif = 1`;

    const result = await __private.queryAcak(sql);

    expect(result.rows).toEqual([{ indeks: 'acak' }]);
    expect(db.query).toHaveBeenNthCalledWith(1, sql, []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('ORDER BY RANDOM() LIMIT 12'), []);
  });

  it('helper utilitas menangani input kosong dan pemilihan acak', () => {
    expect(__private.acakDariArray()).toBeNull();
    expect(__private.acakArray()).toEqual([]);
    expect(__private.normalisasiDaftar()).toEqual([]);
    expect(__private.normalisasiDaftar(' satu; dua, tiga ,, ; empat ')).toEqual(['satu', 'dua', 'tiga', 'empat']);
    expect(__private.normalisasiRiwayatMode()).toEqual([]);
    expect(__private.normalisasiRiwayatMode(['', ' Alpha ', 'alpha', null, 'Beta'])).toEqual(['alpha', 'beta']);
    expect(__private.buatFilterRiwayat('e.indeks', [])).toEqual({ clause: '', params: [] });
    expect(__private.pilihBerbeda(null, () => false)).toBeNull();

    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);
    expect(__private.acakDariArray(['a', 'b'])).toBe('b');
    expect(__private.pilihBerbeda([{ nilai: 'a' }, { nilai: 'b' }], (item) => item.nilai === 'a')).toEqual({ nilai: 'b' });
    expect(__private.acakArray(['a', 'b', 'c', 'd'])).toEqual(['b', 'c', 'd', 'a']);
    randomSpy.mockRestore();
  });

  it('acakPilihan dan potong menutup kedua cabang', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0.2).mockReturnValueOnce(0.8);

    expect(__private.acakPilihan('benar', 'salah')).toEqual({ pilihan: ['benar', 'salah'], jawaban: 0 });
    expect(__private.acakPilihan('benar', 'salah')).toEqual({ pilihan: ['salah', 'benar'], jawaban: 1 });
    expect(__private.potong()).toBe('');
    expect(__private.potong('pendek', 10)).toBe('pendek');
    expect(__private.potong('abcdefghijkl', 6)).toBe('abcde…');

    randomSpy.mockRestore();
  });

  it('normalisasiRiwayatMode dan buatFilterRiwayat menjaga tiga item terbaru', () => {
    expect(__private.normalisasiRiwayatMode([' Alpha ', 'beta', 'alpha', 'gamma', 'delta'])).toEqual(['beta', 'gamma', 'delta']);
    expect(__private.buatFilterRiwayat('e.indeks', ['Alpha', 'beta'], 3)).toEqual({
      clause: ' AND LOWER(e.indeks) NOT IN ($3, $4)',
      params: ['alpha', 'beta'],
    });
  });

  it('soalTesaurus memilih kandidat dari pool dan mendukung pemisah koma-titik koma', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          { indeks: 'ramai', sinonim: 'riuh', antonim: '' },
          { indeks: 'dingin', sinonim: '', antonim: 'panas; beku, sejuk' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { kata_salah: 'sendu' },
          { kata_salah: 'hangat' },
        ],
      });

    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.75)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.2);

    const soal = await __private.soalTesaurus();

    expect(soal).toEqual(expect.objectContaining({
      mode: 'tesaurus',
      soal: 'dingin',
      relasi: 'antonim',
      jawaban: 0,
    }));
    expect(soal.pilihan).toEqual(expect.arrayContaining(['beku', 'hangat']));
    expect(soal.penjelasan).toBe('beku adalah antonim dari dingin.');
  });

  it('soalTesaurus mendukung relasi sinonim', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'ramai', sinonim: 'riuh;heboh', antonim: '' }] })
      .mockResolvedValueOnce({ rows: [{ kata_salah: 'sunyi' }] });

    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.7);

    const soal = await __private.soalTesaurus();

    expect(soal).toEqual(expect.objectContaining({
      mode: 'tesaurus',
      soal: 'ramai',
      relasi: 'sinonim',
    }));
    expect(soal.pilihan).toEqual(expect.arrayContaining(['riuh', 'sunyi']));
    expect(soal.pilihan[soal.jawaban]).toBe('riuh');
    randomSpy.mockRestore();
  });

  it('soalTesaurus mengembalikan null saat tidak ada soal, relasi, token, atau distraktor valid', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(__private.soalTesaurus()).resolves.toBeNull();

    db.query.mockReset();
    db.query.mockResolvedValueOnce({ rows: [{ indeks: 'ramai', sinonim: '', antonim: '' }] });
    await expect(__private.soalTesaurus()).resolves.toBeNull();

    db.query.mockReset();
    db.query.mockResolvedValueOnce({ rows: [{ indeks: 'ramai', sinonim: ' , ; ', antonim: '' }] });
    await expect(__private.soalTesaurus()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'ramai', sinonim: 'riuh', antonim: '' }] })
      .mockResolvedValueOnce({ rows: [{ kata_salah: 'riuh' }] });
    await expect(__private.soalTesaurus()).resolves.toBeNull();
  });

  it('soalKamus mengembalikan null saat soal atau distraktor tidak tersedia dan membentuk payload benar', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(__private.soalKamus()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'kata', makna_benar: 'makna benar' }] })
      .mockResolvedValueOnce({ rows: [{ makna_salah: 'makna benar' }] });
    await expect(__private.soalKamus({ riwayat: ['KATA'] })).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'kata', makna_benar: 'makna benar yang sangat panjang sekali' }] })
      .mockResolvedValueOnce({ rows: [{ makna_salah: 'opsi salah yang juga panjang sekali' }] });
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.2);

    await expect(__private.soalKamus({ riwayat: [' KATA ', 'lain'] })).resolves.toEqual(expect.objectContaining({
      mode: 'kamus',
      soal: 'kata',
      kunciSoal: 'kata',
      jawaban: 0,
      penjelasan: expect.stringContaining('kata artinya:'),
    }));
    expect(db.query.mock.calls[0][1]).toEqual(['kata', 'lain']);
    randomSpy.mockRestore();
  });

  it('soalGlosarium dan soalMakna menutup cabang null dan payload sukses', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(__private.soalGlosarium()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ asing: 'mouse', indonesia_benar: 'tetikus' }] })
      .mockResolvedValueOnce({ rows: [{ indonesia_salah: 'tetikus' }] });
    await expect(__private.soalGlosarium()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ asing: 'mouse', indonesia_benar: 'tetikus' }] })
      .mockResolvedValueOnce({ rows: [{ indonesia_salah: 'papan tik' }] });
    let randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    await expect(__private.soalGlosarium({ riwayat: ['mouse'] })).resolves.toEqual(expect.objectContaining({
      mode: 'glosarium',
      soal: 'mouse',
      jawaban: 1,
      pilihan: ['papan tik', 'tetikus'],
    }));
    expect(db.query.mock.calls[0][0]).toContain('JOIN bahasa ba ON ba.id = g.bahasa_id');
    expect(db.query.mock.calls[0][0]).toContain("ba.iso2 = 'en'");
    randomSpy.mockRestore();

    db.query.mockReset();
    db.query.mockResolvedValue({ rows: [] });
    await expect(__private.soalMakna()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks_benar: 'kata', makna: 'arti kata yang cukup panjang' }] })
      .mockResolvedValueOnce({ rows: [{ indeks_salah: 'kata' }] });
    await expect(__private.soalMakna()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks_benar: 'kata', makna: 'arti kata yang cukup panjang' }] })
      .mockResolvedValueOnce({ rows: [{ indeks_salah: 'frasa' }] });
    randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.4);
    await expect(__private.soalMakna({ riwayat: ['arti kata yang cukup panjang'] })).resolves.toEqual(expect.objectContaining({
      mode: 'makna',
      soal: 'arti kata yang cukup panjang',
      kunciSoal: 'arti kata yang cukup panjang',
      jawaban: 0,
    }));
    randomSpy.mockRestore();
  });

  it('soalRima mengembalikan null setelah beberapa percobaan gagal dan mengembalikan payload saat berhasil', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await expect(__private.soalRima()).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [{ soal: 'kata' }] })
      .mockResolvedValueOnce({ rows: [{ rima_benar: 'data' }] })
      .mockResolvedValueOnce({ rows: [{ rima_salah: 'bata' }, { rima_salah: 'siku' }] });
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.4)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.8);

    await expect(__private.soalRima({ riwayat: ['kata'] })).resolves.toEqual(expect.objectContaining({
      mode: 'rima',
      soal: 'kata',
      kunciSoal: 'kata',
      jawaban: 0,
      pilihan: ['data', 'bata'],
      penjelasan: 'data berima dengan kata (keduanya berakhiran -ata).',
    }));
    expect(db.query.mock.calls[0][1]).toEqual(['kata']);
    randomSpy.mockRestore();
  });

  it('soalRima melanjutkan percobaan saat rima benar atau distraktor tidak valid, lalu mendukung akhiran dua huruf', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ soal: 'pelita' }] })
      .mockResolvedValueOnce({ rows: [{ rima_benar: 'pelita' }] })
      .mockResolvedValueOnce({ rows: [{ soal: 'pelita' }] })
      .mockResolvedValueOnce({ rows: [{ rima_benar: 'kita' }] })
      .mockResolvedValueOnce({ rows: [{ rima_salah: 'kita' }] })
      .mockResolvedValueOnce({ rows: [{ soal: 'pelita' }] })
      .mockResolvedValueOnce({ rows: [{ rima_benar: 'cita' }] })
      .mockResolvedValueOnce({ rows: [{ rima_salah: 'sulur' }] });

    const randomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.8);

    await expect(__private.soalRima()).resolves.toEqual(expect.objectContaining({
      mode: 'rima',
      soal: 'pelita',
      penjelasan: 'cita berima dengan pelita (keduanya berakhiran -ta).',
      pilihan: ['cita', 'sulur'],
      jawaban: 0,
    }));
    randomSpy.mockRestore();
  });

  it('ambilRonde mengganti slot null dengan soal kamus cadangan, menoleransi rejection, dan mengacak urutan', async () => {
    const soalKamus = { mode: 'kamus', soal: 'alpha', kunciSoal: 'alpha' };
    const soalTesaurus = { mode: 'tesaurus', soal: 'beta', kunciSoal: 'beta' };
    const soalRima = { mode: 'rima', soal: 'epsilon', kunciSoal: 'epsilon' };

    const soalKamusSpy = jest.spyOn(__private, 'soalKamus')
      .mockResolvedValueOnce(soalKamus)
      .mockResolvedValueOnce({ mode: 'kamus', soal: 'cadangan', kunciSoal: 'cadangan' });
    const soalTesaurusSpy = jest.spyOn(__private, 'soalTesaurus').mockResolvedValueOnce(soalTesaurus);
    const soalGlosariumSpy = jest.spyOn(__private, 'soalGlosarium').mockResolvedValueOnce(null);
    const soalMaknaSpy = jest.spyOn(__private, 'soalMakna').mockRejectedValueOnce(new Error('gagal'));
    const soalRimaSpy = jest.spyOn(__private, 'soalRima').mockResolvedValueOnce(soalRima);
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    const ronde = await ModelKuisKata.ambilRonde({
      riwayat: {
        kamus: ['alpha'],
        tesaurus: ['beta'],
        glosarium: ['gamma'],
        makna: ['delta'],
        rima: ['epsilon'],
      },
    });

    expect(soalKamusSpy).toHaveBeenNthCalledWith(1, { riwayat: ['alpha'] });
    expect(soalTesaurusSpy).toHaveBeenCalledWith({ riwayat: ['beta'] });
    expect(soalGlosariumSpy).toHaveBeenCalledWith({ riwayat: ['gamma'] });
    expect(soalMaknaSpy).toHaveBeenCalledWith({ riwayat: ['delta'] });
    expect(soalRimaSpy).toHaveBeenCalledWith({ riwayat: ['epsilon'] });
    expect(soalKamusSpy).toHaveBeenNthCalledWith(2, { riwayat: ['alpha'] });
    expect(ronde).toHaveLength(4);
    expect(ronde).toEqual(expect.arrayContaining([soalKamus, soalTesaurus, soalRima, { mode: 'kamus', soal: 'cadangan', kunciSoal: 'cadangan' }]));

    randomSpy.mockRestore();
  });

  it('ambilRonde mengembalikan array kosong saat semua generator dan cadangan gagal', async () => {
    jest.spyOn(__private, 'soalKamus').mockResolvedValue(null);
    jest.spyOn(__private, 'soalTesaurus').mockResolvedValue(null);
    jest.spyOn(__private, 'soalGlosarium').mockRejectedValue(new Error('gagal'));
    jest.spyOn(__private, 'soalMakna').mockResolvedValue(null);
    jest.spyOn(__private, 'soalRima').mockResolvedValue(null);

    await expect(ModelKuisKata.ambilRonde()).resolves.toEqual([]);
  });
});