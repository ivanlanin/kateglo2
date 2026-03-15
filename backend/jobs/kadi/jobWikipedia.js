/**
 * @fileoverview Job KADI: proses Artikel Pilihan Wikipedia Indonesia
 *
 * Pipeline:
 * 1. Ambil daftar artikel dari Kategori:Artikel_pilihan via MediaWiki API
 * 2. Untuk setiap artikel: fetch teks HTML, strip tag, tokenisasi
 * 3. Filter: stopword, kata pendek, angka, kata yang sudah ada di kamus
 * 4. Bulk upsert kandidat baru + bulk insert atestasi
 *
 * Rate limit: 1 request/detik (kebijakan Wikimedia)
 * User-Agent: KategloBot/1.0
 */

const https = require('https');
const cheerio = require('cheerio');
const db = require('../../db');
const ModelKandidatEntri = require('../../models/kadi/modelKandidatEntri');

const API_URL = 'https://id.wikipedia.org/w/api.php';
const USER_AGENT = 'KategloBot/1.0 (https://kateglo.com/bot)';
const RATE_LIMIT_MS = 1000;
const SUMBER_KODE = 'wikipedia-id-pilihan';
const KATEGORI = 'Kategori:Artikel pilihan';
const MAIN_NAMESPACE = 0;
const CATEGORY_BATCH_SIZE = 50;

// ── Stopword bahasa Indonesia ────────────────────────────────────────────

const STOPWORDS = new Set([
  'ada', 'adalah', 'adanya', 'adapun', 'agak', 'agaknya', 'agar', 'akan',
  'akankah', 'akhir', 'akhirnya', 'aku', 'akulah', 'amat', 'amatlah',
  'anda', 'andalah', 'antar', 'antara', 'apa', 'apaan', 'apabila',
  'apakah', 'apalagi', 'apatah', 'artinya', 'asal', 'asalkan', 'atas',
  'atau', 'ataukah', 'ataupun', 'bagai', 'bagaikan', 'bagaimana',
  'bagaimanakah', 'bagaimanapun', 'bagi', 'bagian', 'bahkan', 'bahwa',
  'bahwasanya', 'baik', 'bakal', 'bakalan', 'balik', 'banyak', 'bapak',
  'baru', 'bawah', 'beberapa', 'begini', 'beginian', 'beginikah',
  'beginilah', 'begitu', 'begitukah', 'begitulah', 'begitupun', 'belakang',
  'belum', 'belumlah', 'benar', 'benarkah', 'benarlah', 'berada',
  'berakhir', 'berakhirlah', 'berakhirnya', 'berapa', 'berapakah',
  'berapalah', 'berapapun', 'berarti', 'berawal', 'berbagai', 'berdatangan',
  'beri', 'berikan', 'berikut', 'berikutnya', 'berjumlah', 'berkali',
  'berkata', 'berkehendak', 'berkeinginan', 'berkenaan', 'berlainan',
  'berlalu', 'berlangsung', 'berlebihan', 'bermacam', 'bermaksud',
  'bermula', 'bersama', 'bersiap', 'bertanya', 'berturut', 'berupa',
  'beserta', 'betulkah', 'biasa', 'biasanya', 'bila', 'bilamana', 'bisa',
  'bisakah', 'boleh', 'bolehkah', 'bolehlah', 'buat', 'bukan', 'bukankah',
  'bukanlah', 'bukannya', 'bulan', 'bung', 'cara', 'caranya', 'cukup',
  'cukupkah', 'cukuplah', 'cuma', 'dahulu', 'dalam', 'dan', 'dapat',
  'dari', 'daripada', 'datang', 'dekat', 'demi', 'demikian', 'demikianlah',
  'dengan', 'depan', 'dia', 'dialah', 'diantara', 'diantaranya', 'dibuat',
  'dibuatnya', 'didapat', 'didatangkan', 'digunakan', 'diibaratkan',
  'dijadikan', 'dilakukan', 'dimaksud', 'dimaksudkan', 'dimaksudkannya',
  'dimaksudnya', 'dimana', 'diminta', 'dimulai', 'dimulailah',
  'dimulainya', 'dimungkinkan', 'dini', 'dipastikan', 'diperbuat',
  'diperbuatnya', 'dipergunakan', 'diperlukan', 'diperlukannya',
  'dipersoalkan', 'dipertanyakan', 'dipunyai', 'diri', 'dirinya',
  'disamping', 'disebut', 'disebutkan', 'disebutkannya', 'disini',
  'disinilah', 'ditambahkan', 'ditandaskan', 'ditanya', 'ditanyai',
  'ditanyakan', 'ditujukan', 'ditunjuk', 'ditunjuki', 'ditunjukkan',
  'ditunjukkannya', 'ditunjuknya', 'dituturkan', 'dituturkannya',
  'diucapkan', 'diucapkannya', 'diungkapkan', 'dong', 'dua', 'dulu',
  'empat', 'enam', 'enggak', 'enggaknya', 'entah', 'entahlah', 'guna',
  'gunakan', 'hal', 'hampir', 'hanya', 'hanyalah', 'hari', 'harus',
  'haruslah', 'harusnya', 'hendak', 'hendaklah', 'hendaknya', 'hingga',
  'ibu', 'ialah', 'ibarat', 'ibaratkan', 'ibaratnya', 'iini', 'ika',
  'ini', 'inikah', 'inilah', 'itu', 'itukah', 'itulah', 'jadi',
  'jadilah', 'jadinya', 'jangan', 'jangankan', 'janganlah', 'jauh',
  'jawab', 'jawaban', 'jawabnya', 'jelas', 'jelaskan', 'jelaslah',
  'jelasnya', 'jika', 'jikalau', 'juga', 'jumlah', 'jumlahnya',
  'justru', 'kala', 'kalau', 'kalaulah', 'kalaupun', 'kalian', 'kami',
  'kamilah', 'kamu', 'kamulah', 'kan', 'kapan', 'kapankah', 'kapanpun',
  'karena', 'karenanya', 'kasus', 'kata', 'katakan', 'katakanlah',
  'katanya', 'ke', 'keadaan', 'kebetulan', 'kecil', 'kedua',
  'keduanya', 'keinginan', 'kelamaan', 'kelihatan', 'kelihatannya',
  'kelima', 'keluar', 'kembali', 'kemudian', 'kemungkinan',
  'kemungkinannya', 'kenapa', 'kepada', 'kepadanya', 'kesampaian',
  'keseluruhan', 'keseluruhannya', 'keterlaluan', 'ketika', 'khususnya',
  'kini', 'kinilah', 'kira', 'kiranya', 'kita', 'kitalah', 'kok',
  'kurang', 'lagi', 'lagian', 'lah', 'lain', 'lainnya', 'lalu',
  'lama', 'lamanya', 'lanjut', 'lanjutnya', 'lebih', 'lewat', 'lima',
  'luar', 'macam', 'maka', 'makanya', 'makin', 'malah', 'malahan',
  'mampu', 'mampukah', 'mana', 'manakala', 'manalagi', 'masa', 'masalah',
  'masalahnya', 'masih', 'masihkah', 'masing', 'mau', 'maupun',
  'melainkan', 'melakukan', 'melalui', 'melihat', 'memang', 'memastikan',
  'memberi', 'memberikan', 'membuat', 'memerlukan', 'memihak', 'memiliki',
  'meminta', 'memintakan', 'memisalkan', 'memperbuat', 'mempergunakan',
  'memperkirakan', 'memperlihatkan', 'mempersiapkan', 'mempersoalkan',
  'mempertanyakan', 'mempunyai', 'memulai', 'memungkinkan', 'menaiki',
  'menambahkan', 'menandaskan', 'menanti', 'menantikan', 'menanya',
  'menanyai', 'menanyakan', 'mendapat', 'mendapatkan', 'mendatang',
  'mendatangi', 'mendatangkan', 'menegaskan', 'mengakhiri',
  'mengapa', 'mengatakan', 'mengatakannya', 'mengenai',
  'mengerjakan', 'mengetahui', 'menggunakan', 'menghendaki',
  'mengibaratkan', 'mengibaratkannya', 'mengingat', 'mengingatkan',
  'menginginkan', 'mengira', 'mengucapkan', 'mengucapkannya',
  'mengungkapkan', 'menjadi', 'menjawab', 'menjelaskan', 'menuju',
  'menunjuk', 'menunjuki', 'menunjukkan', 'menunjuknya', 'menurut',
  'menuturkan', 'menyampaikan', 'menyangkut', 'menyatakan',
  'menyebutkan', 'merasa', 'mereka', 'merekalah', 'merupakan',
  'meski', 'meskipun', 'minta', 'mirip', 'misal', 'misalkan',
  'misalnya', 'mula', 'mulai', 'mulailah', 'mulanya', 'mungkin',
  'mungkinkah', 'nah', 'naik', 'namun', 'nanti', 'nantinya', 'nyaris',
  'nyatanya', 'oleh', 'olehnya', 'pada', 'padahal', 'padanya', 'pak',
  'paling', 'panjang', 'pantas', 'para', 'pasti', 'pastilah', 'penting',
  'pentingnya', 'per', 'percuma', 'perlu', 'perlukah', 'perlunya',
  'pernah', 'persoalan', 'pertama', 'pertanyaan', 'pertanyakan', 'pihak',
  'pihaknya', 'pukul', 'pula', 'pun', 'punya', 'rasa', 'rasanya',
  'rata', 'rupanya', 'saat', 'saatnya', 'saja', 'sajalah', 'saling',
  'sama', 'sambil', 'sampai', 'sana', 'sangat', 'sangatlah', 'satu',
  'saya', 'sayalah', 'se', 'sebab', 'sebabnya', 'sebagai', 'sebagaimana',
  'sebagainya', 'sebagian', 'sebaik', 'sebanyak', 'sebegini', 'sebegitu',
  'sebelum', 'sebelumnya', 'sebenarnya', 'seberapa', 'sebetulnya',
  'sebisanya', 'sebuah', 'sebut', 'sebutlah', 'sebutnya', 'secara',
  'secukupnya', 'sedang', 'sedangkan', 'sedemikian', 'sedikit',
  'sedikitnya', 'seenaknya', 'segala', 'segalanya', 'segera', 'seharusnya',
  'sehingga', 'seingat', 'sejak', 'sejauh', 'sejenak', 'sejumlah',
  'sekadar', 'sekadarnya', 'sekali', 'sekalian', 'sekaligus', 'sekalipun',
  'sekarang', 'sekecil', 'seketika', 'sekiranya', 'sekitar', 'sekitarnya',
  'sekurang', 'selain', 'selaku', 'selalu', 'selama', 'selamanya',
  'selanjutnya', 'seluruh', 'seluruhnya', 'semacam', 'semakin', 'semampu',
  'semaunya', 'sementara', 'semisal', 'semoga', 'sempat', 'semua',
  'semuanya', 'semula', 'sendiri', 'sendirinya', 'seolah', 'seorang',
  'sepanjang', 'sepantasnya', 'seperti', 'sepertinya', 'sepihak',
  'sering', 'seringnya', 'serta', 'serupa', 'sesaat', 'sesama',
  'sesampai', 'sesegera', 'sesekali', 'seseorang', 'sesuatu',
  'sesuatunya', 'sesudah', 'sesudahnya', 'setelah', 'setengah',
  'seterusnya', 'setiap', 'setiba', 'setidaknya', 'setinggi', 'seusai',
  'sewaktu', 'siap', 'siapa', 'siapakah', 'siapapun', 'sini', 'sinilah',
  'soal', 'soalnya', 'suatu', 'sudah', 'sudahkah', 'sudahlah', 'supaya',
  'tadi', 'tadinya', 'tahu', 'tahun', 'tak', 'tambah', 'tambahnya',
  'tampak', 'tampaknya', 'tandas', 'tandasnya', 'tanpa', 'tanya',
  'tanyakan', 'tanyanya', 'tapi', 'tentu', 'tentulah', 'tentunya',
  'tepat', 'terakhir', 'terasa', 'terbanyak', 'terdahulu', 'terdapat',
  'terdiri', 'terhadap', 'terhadapnya', 'teringat', 'terjadi',
  'terjadilah', 'terjadinya', 'terkira', 'terlalu', 'terlebih',
  'terlihat', 'termasuk', 'ternyata', 'tersampaikan', 'tersebut',
  'tersebutlah', 'tertentu', 'tertuju', 'terus', 'terutama', 'tetap',
  'tetapi', 'tiap', 'tiba', 'tidak', 'tidakkah', 'tidaklah', 'tiga',
  'toh', 'tujuh', 'turut', 'tutur', 'tuturnya', 'ucap', 'ucapnya',
  'ujar', 'ujarnya', 'umum', 'umumnya', 'ungkap', 'ungkapnya', 'untuk',
  'usah', 'usai', 'waduh', 'wah', 'wahai', 'waktu', 'walaupun', 'wong',
  'yaitu', 'yakin', 'yakni', 'yang',
]);

// ── HTTP helpers ─────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Request timeout'));
    });
    req.end();
  });
}

// ── MediaWiki API ────────────────────────────────────────────────────────

/**
 * Ambil semua anggota kategori Artikel Pilihan
 * @param {number} limit - Batas jumlah artikel
 * @returns {Promise<Array<{ pageid: number, title: string }>>}
 */
async function ambilDaftarArtikelPilihanDenganFetcher(
  limit = 500,
  { fetchJsonFn = fetchJson, delayFn = delay } = {},
) {
  const articles = [];
  let cmcontinue = '';
  const seenContinueTokens = new Set();

  while (articles.length < limit) {
    let url = `${API_URL}?action=query&list=categorymembers&cmtitle=${encodeURIComponent(KATEGORI)}&cmtype=page&cmnamespace=${MAIN_NAMESPACE}&cmlimit=${CATEGORY_BATCH_SIZE}&format=json`;
    if (cmcontinue) url += `&cmcontinue=${encodeURIComponent(cmcontinue)}`;

    const json = await fetchJsonFn(url);
    const members = (json?.query?.categorymembers || []).filter((article) => article.ns === MAIN_NAMESPACE);
    articles.push(...members);

    const nextContinue = json?.continue?.cmcontinue || '';
    if (!nextContinue || seenContinueTokens.has(nextContinue)) break;

    seenContinueTokens.add(nextContinue);
    cmcontinue = nextContinue;
    await delayFn(RATE_LIMIT_MS);
  }

  return articles.slice(0, limit);
}

async function ambilDaftarArtikelPilihan(limit = 500) {
  return ambilDaftarArtikelPilihanDenganFetcher(limit);
}

/**
 * Ambil teks bersih dari satu artikel via MediaWiki API
 * @param {string} title - Judul artikel Wikipedia
 * @returns {Promise<{ title: string, text: string, url: string }>}
 */
async function ambilTeksArtikel(title) {
  const url = `${API_URL}?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&disabletoc=true`;
  const json = await fetchJson(url);

  const html = json?.parse?.text?.['*'] || '';
  const $ = cheerio.load(html);

  // Remove elements that aren't useful text
  $('table, .infobox, .navbox, .sidebar, .mw-editsection, .reference, .reflist, sup, style, script, .thumb, .gallery, .toc, .mw-empty-elt, .noprint').remove();

  const text = $.text()
    .replace(/\[sunting\]/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title,
    text,
    url: `https://id.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  };
}

// ── Tokenisasi & Filter ──────────────────────────────────────────────────

/**
 * Tokenisasi teks menjadi kata-kata unik yang lolos filter
 * @param {string} text
 * @returns {Array<{ token: string, konteks: string }>}
 */
function tokenisasiDanFilter(text) {
  const kalimat = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const tokenMap = new Map();

  for (const kal of kalimat) {
    const tokens = kal
      .replace(/[^a-zA-Z\u00C0-\u024F\s-]/g, ' ')
      .split(/\s+/)
      .map((t) => t.toLowerCase().replace(/^-+|-+$/g, ''))
      .filter((t) => t.length >= 3 && !/^\d+$/.test(t) && !STOPWORDS.has(t));

    for (const token of tokens) {
      if (!tokenMap.has(token)) {
        tokenMap.set(token, kal.trim().slice(0, 300));
      }
    }
  }

  return Array.from(tokenMap.entries()).map(([token, konteks]) => ({ token, konteks }));
}

// ── Pipeline utama ───────────────────────────────────────────────────────

/**
 * Jalankan proses Wikipedia KADI
 * @param {object} options
 * @param {number} [options.batasArtikel=50] Jumlah artikel yang diproses
 * @param {boolean} [options.dryRun=false] Jika true, tidak menyimpan ke DB
 * @returns {Promise<object>} Statistik hasil
 */
async function jalankanProsesWikipedia({ batasArtikel = 50, dryRun = false } = {}) {
  const stats = {
    artikelDiproses: 0,
    tokenDitemukan: 0,
    tokenSudahDiKamus: 0,
    kandidatBaru: 0,
    kandidatSudahAda: 0,
    atestasiDitambah: 0,
  };

  // 1. Load kata-kata yang sudah ada di kamus
  const kamusResult = await db.query(
    "SELECT DISTINCT LOWER(TRIM(indeks)) AS indeks FROM entri WHERE aktif = 1",
  );
  const kamusSet = new Set(kamusResult.rows.map((r) => r.indeks));
  console.log(`[KADI] Kamus: ${kamusSet.size} kata diketahui`);

  // 2. Ambil daftar Artikel Pilihan
  console.log(`[KADI] Mengambil daftar Artikel Pilihan (maks ${batasArtikel})...`);
  const daftarArtikel = await ambilDaftarArtikelPilihan(batasArtikel);
  console.log(`[KADI] Ditemukan ${daftarArtikel.length} artikel`);

  // 3. Proses setiap artikel
  const semuaKandidat = [];

  for (const artikel of daftarArtikel) {
    try {
      await delay(RATE_LIMIT_MS);
      const { title, text, url } = await ambilTeksArtikel(artikel.title);
      stats.artikelDiproses++;

      const tokens = tokenisasiDanFilter(text);
      stats.tokenDitemukan += tokens.length;

      // Filter kata yang sudah ada di kamus
      const tokenBaru = tokens.filter((t) => !kamusSet.has(t.token));
      stats.tokenSudahDiKamus += tokens.length - tokenBaru.length;

      for (const { token, konteks } of tokenBaru) {
        semuaKandidat.push({
          kata: token,
          sumber_scraper: SUMBER_KODE,
          kutipan: konteks,
          sumber_url: url,
          sumber_nama: `Wikipedia: ${title}`,
        });
      }

      if (stats.artikelDiproses % 10 === 0) {
        console.log(`[KADI] Diproses: ${stats.artikelDiproses}/${daftarArtikel.length} artikel`);
      }
    } catch (err) {
      console.error(`[KADI] Error memproses "${artikel.title}": ${err.message}`);
    }
  }

  if (dryRun) {
    console.log(`[KADI] Dry run — tidak menyimpan ke DB`);
    stats.kandidatBaru = semuaKandidat.length;
    return stats;
  }

  // 4. Bulk upsert kandidat
  console.log(`[KADI] Menyimpan ${semuaKandidat.length} kandidat...`);
  const kandidatItems = semuaKandidat.map((k) => ({
    kata: k.kata,
    sumber_scraper: k.sumber_scraper,
  }));

  // Deduplicate by kata before upserting
  const uniqueKandidat = [...new Map(kandidatItems.map((k) => [k.kata.toLowerCase(), k])).values()];
  const kandidatMap = await ModelKandidatEntri.bulkUpsertDariScraper(uniqueKandidat);

  // Count truly new vs already existing
  // (bulkUpsertDariScraper returns all, but ON CONFLICT DO NOTHING means only new are inserted)
  stats.kandidatBaru = kandidatMap.size;

  // 5. Bulk insert atestasi
  const atestasiRows = [];
  for (const k of semuaKandidat) {
    const kandidatId = kandidatMap.get(k.kata.toLowerCase());
    if (!kandidatId) continue;

    atestasiRows.push({
      kandidat_id: kandidatId,
      kutipan: k.kutipan,
      sumber_tipe: 'ensiklopedia',
      sumber_url: k.sumber_url,
      sumber_nama: k.sumber_nama,
      crawler_id: `wiki-${new Date().toISOString().slice(0, 10)}`,
    });
  }

  if (atestasiRows.length) {
    // Insert in batches to avoid overly long SQL
    const batchSize = 200;
    for (let i = 0; i < atestasiRows.length; i += batchSize) {
      const batch = atestasiRows.slice(i, i + batchSize);
      const inserted = await ModelKandidatEntri.tambahBanyakAtestasi(batch);
      stats.atestasiDitambah += inserted;
    }
  }

  console.log(`[KADI] Selesai:`, stats);
  return stats;
}

module.exports = {
  jalankanProsesWikipedia,
  ambilDaftarArtikelPilihan,
  ambilTeksArtikel,
  tokenisasiDanFilter,
  STOPWORDS,
  __private: {
    delay,
    fetchJson,
    ambilDaftarArtikelPilihanDenganFetcher,
    RATE_LIMIT_MS,
  },
};
