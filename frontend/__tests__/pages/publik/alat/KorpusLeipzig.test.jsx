import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KorpusLeipzig, { __private } from '../../../../src/pages/publik/alat/KorpusLeipzig';

const mockApi = vi.hoisted(() => ({
  ambilDaftarKorpusLeipzig: vi.fn(),
  ambilInfoKataLeipzig: vi.fn(),
  ambilPeringkatKataLeipzig: vi.fn(),
  ambilContohKataLeipzig: vi.fn(),
  ambilKookurensiSekalimatLeipzig: vi.fn(),
  ambilKookurensiTetanggaLeipzig: vi.fn(),
}));

vi.mock('../../../../src/api/apiPublik', () => mockApi);

function renderPage(initialEntry = '/alat/analisis-korpus') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/alat/analisis-korpus" element={<KorpusLeipzig />} />
          <Route path="/alat/analisis-korpus/:kata" element={<KorpusLeipzig />} />
          <Route path="/alat/analisis-korpus/:kata/:korpus" element={<KorpusLeipzig />} />
          <Route path="/alat/korpus-leipzig" element={<KorpusLeipzig />} />
          <Route path="/alat/korpus-leipzig/:kata" element={<KorpusLeipzig />} />
          <Route path="/alat/korpus-leipzig/:kata/:korpus" element={<KorpusLeipzig />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('KorpusLeipzig', () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('menyembunyikan boks contoh saat belum ada kata aktif', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        domain: 'news',
        size: '10K',
        hasSqlite: true,
        stats: { sentences: 10000, wordTypes: 8000, wordTokens: 190000 },
      }],
    });

    renderPage('/alat/analisis-korpus');

    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Contoh' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tampilkan sumber' })).not.toBeInTheDocument();
  });

  it('merender hasil Leipzig setelah submit pencarian', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        domain: 'news',
        size: '10K',
        hasSqlite: true,
        stats: { sentences: 10000, wordTypes: 8000, wordTokens: 190000 },
      }],
    });
    mockApi.ambilInfoKataLeipzig.mockResolvedValue({
      kata: 'indonesia',
      frekuensi: 13,
      rank: 2,
      kelasFrekuensi: 0,
      bentuk: [
        { kata: 'indonesia', frekuensi: 5, wordId: 1 },
        { kata: 'Indonesia', frekuensi: 8, wordId: 2 },
      ],
    });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({
      limit: 10,
      data: [{
        sentenceId: 1,
        sentence: 'Indonesia sedang dibahas dalam berita.',
        matchCount: 1,
        sourceDate: '2024-03-05',
        sourceUrl: 'https://example.com',
      }],
      bentuk: [{ kata: 'Indonesia', frekuensi: 8, wordId: 2 }],
    });
    mockApi.ambilKookurensiSekalimatLeipzig.mockResolvedValue({
      data: [{ kata: 'berita', frekuensi: 7, signifikansi: 0.9 }],
    });
    mockApi.ambilKookurensiTetanggaLeipzig.mockResolvedValue({
      kiri: [{ kata: 'tentang', frekuensi: 3 }],
      kanan: [{ kata: 'sedang', frekuensi: 2 }],
    });
    renderPage('/alat/analisis-korpus/indonesia/ind_news_2024_10K');

    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();

    expect(await screen.findByText('Contoh')).toBeInTheDocument();
    expect(screen.getByLabelText('Kata yang ingin ditelusuri')).toBeInTheDocument();
    expect(screen.getAllByText('Kata')).toHaveLength(2);
    expect(screen.getByText('Kemunculan')).toBeInTheDocument();
    expect(screen.getByText('Urutan')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kata dalam Satu Kalimat' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kata di Kiri' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kata di Kanan' })).toBeInTheDocument();
    expect(screen.queryByText('Kata dengan konteks mirip')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'indonesia', level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText('indonesia')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText(/Proporsi:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kelas frekuensi:/)).not.toBeInTheDocument();
    expect(screen.queryByText('Lihat juga:')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tampilkan sumber' })).toBeInTheDocument();
    expect(screen.queryByText(/example.com/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+10' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+25' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+50' })).not.toBeInTheDocument();
    expect(screen.getByText('Contoh')).toBeInTheDocument();
    expect(screen.getByText((_, node) => {
      if (!node?.classList?.contains('korpus-leipzig-contoh-kalimat')) {
        return false;
      }

      const teks = node.textContent?.replace(/\s+/g, ' ').trim() || '';
      return teks.includes('Indonesia sedang dibahas dalam berita.');
    })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'berita' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'tentang' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'sedang' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan sumber' }));
    expect(await screen.findByText(/example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sembunyikan sumber' })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia');
      expect(mockApi.ambilKookurensiSekalimatLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 20, offset: 0 });
      expect(mockApi.ambilKookurensiTetanggaLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 20 });
    });

    expect(mockApi.ambilContohKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 10, offset: 0 });
  });

  it('helper privat merangkum statistik dan tata letak graf', () => {
    expect(__private.ambilPesanGalat({ response: { data: { message: 'galat api' } } }, 'fallback')).toBe('galat api');
    expect(__private.ambilPesanGalat(null, 'fallback')).toBe('fallback');
    expect(__private.escapeRegExp('a+b?')).toBe('a\\+b\\?');
    expect(__private.escapeRegExp()).toBe('');
    expect(__private.formatStatKorpus({ sentences: 12, wordTypes: 9, wordTokens: 100 })).toContain('12 kalimat');
    expect(__private.formatStatKorpus(null)).toBe('Statistik korpus belum tersedia');
    expect(__private.formatTanggalAman('')).toBe('Tanggal tidak tersedia');
    expect(__private.formatKemunculanRingkas(12, { wordTokens: 100 })).toBe('12');
    expect(__private.formatPersenKemunculan(12, { wordTokens: 100 })).toBe('12,0%');
    expect(__private.formatPersenKemunculan(undefined, { wordTokens: 100 })).toBe('0,0%');
    expect(__private.formatPersenPerbandingan(12, 22)).toBe('54,5%');
    expect(__private.formatPersenPerbandingan(undefined, 22)).toBe('0,0%');
    expect(__private.formatPersenKemunculan(12, { wordTokens: 0 })).toBe('N/A');
    expect(__private.formatPersenPerbandingan(12, 0)).toBe('N/A');
    expect(__private.formatPersenKemunculanTanpaSimbol(12, { wordTokens: 0 })).toBe('N/A');
    expect(__private.getKelasFrekuensiLabel(null)).toBe('Belum dihitung');
    expect(__private.getKelasFrekuensiLabel(1)).toContain('Sangat umum');
    expect(__private.getKelasFrekuensiLabel(2)).toContain('Umum');
    expect(__private.getKelasFrekuensiLabel(5)).toContain('Menengah');
    expect(__private.getKelasFrekuensiLabel(8)).toContain('Jarang');
    expect(__private.formatKelasFrekuensiRingkas(null)).toBe('N/A');
    expect(__private.formatKelasFrekuensiRingkas(7)).toBe('Kelas 7');
    expect(__private.getLabelTombolSubmit('bandingkan')).toBe('Bandingkan');
    expect(__private.getLabelTombolSubmit('peringkat')).toBe('Tampilkan');
    expect(__private.adalahGalat404({ response: { status: 404 } })).toBe(true);
    expect(__private.adalahTokenTampil('Indonesia')).toBe(true);
    expect(__private.adalahTokenTampil('...')).toBe(false);
    expect(__private.adalahTokenTampil()).toBe(false);
    expect(__private.saringTokenTampil(['kata', { label: 'label' }, { kata: '...' }, { label: '!!!' }])).toEqual(['kata', { label: 'label' }]);
    expect(__private.normalisasiSegmenPath('  kata ')).toBe('kata');
    expect(__private.normalisasiOffset('abc')).toBe(0);
    expect(__private.ambilDaftarKataBanding(new URLSearchParams('kata1=satu&kata2=dua'))).toEqual(['satu', 'dua', '', '']);
    expect(__private.resolveFormKorpusId('', 'aktif', 'default')).toBe('aktif');
    expect(__private.resolveFormKorpusId('tersimpan', '', 'default')).toBe('tersimpan');
    expect(__private.resolveFormKorpusId('', '', 'default')).toBe('default');
    expect(__private.perluRedirectLegacyPath('/alat/korpus-leipzig', 'kata', '', '/alat/korpus-leipzig/kata', '/alat/analisis-korpus?kata=kata')).toBe(true);
    expect(__private.perluRedirectLegacyPath('/alat/analisis-korpus', '', '', '/alat/analisis-korpus', '/alat/analisis-korpus')).toBe(false);
    expect(__private.resolveBentukKata(undefined, [{ kata: 'indonesia' }])).toEqual([{ kata: 'indonesia' }]);
    expect(__private.compareDataPerbandingan({ kata: 'alpha', frekuensi: 0, rank: null }, { kata: 'beta', frekuensi: 0, rank: 2 })).toBeGreaterThan(0);
    expect(__private.compareDataPerbandingan({ kata: 'beta', frekuensi: 0, rank: 2 }, { kata: 'alpha', frekuensi: 0, rank: null })).toBeLessThan(0);
    expect(__private.compareDataPerbandingan({ kata: 'zeta', frekuensi: 4, rank: 5 }, { kata: 'alfa', frekuensi: 4, rank: 5 })).toBeGreaterThan(0);
    expect(__private.resolveKataTampil(null, 'indonesia')).toBe('indonesia');
    expect(__private.resolveKataTampil(null, '')).toBe('N/A');
    expect(__private.resolveKorpusTujuan('', 'ind_news_2024_10K')).toBe('ind_news_2024_10K');
    expect(__private.resolveKorpusTujuan('manual', 'ind_news_2024_10K')).toBe('manual');
    expect(__private.resolveTotalPeringkat(undefined)).toBe(0);
    expect(__private.resolveTotalPeringkat({ total: 25 })).toBe(25);
    expect(__private.formatRentangData(25, 10, 80)).toBe('Menampilkan 26-35 dari 80 kata.');
    expect(__private.formatRentangData(0, 0, 0)).toBe('Belum ada data kata.');
    expect(__private.formatHostSumber('https://www.example.com/path')).toBe('example.com');
    expect(__private.formatHostSumber('bad-url')).toBe('bad-url');

    const layout = __private.bangunTataLetakGraf([
      { id: 'pusat', label: 'pusat', weight: 10, isCenter: true },
      { id: 'node-a', label: 'Node A', weight: 4, isCenter: false },
    ]);

    expect(layout).toHaveLength(2);
    expect(layout[0]).toMatchObject({ x: 360, y: 180 });
    expect(__private.bangunTataLetakGraf([], 100, 100)).toEqual([]);
    expect(__private.bangunTataLetakGraf([{ id: 'pusat', label: 'pusat', weight: 0, isCenter: true }], 100, 100)[0]).toMatchObject({ x: 50, y: 50 });
    expect(__private.formatTanggalAman('2024-03-05')).toContain('2024');
    expect(__private.formatTanggalAman('teks-apa-adanya')).toBe('teks-apa-adanya');
    expect(__private.normalisasiMode('Bandingkan')).toBe('bandingkan');
    expect(__private.buildPathAnalisisKorpus({ kata: 'indonesia', korpus: 'ind_news_2024_10K' })).toBe('/alat/analisis-korpus?korpus=ind_news_2024_10K&kata=indonesia');
    expect(__private.buildPathAnalisisKorpus({ korpus: 'ind_news_2024_10K', kataBanding: ['subjek', 'subyek', 'tema', 'topik'], mode: 'bandingkan' })).toBe('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek&kata2=subyek&kata3=tema&kata4=topik');
    expect(__private.buildPathAnalisisKorpus({ mode: 'peringkat', korpus: 'ind_news_2024_10K', offset: 25 })).toBe('/alat/analisis-korpus?mode=peringkat&korpus=ind_news_2024_10K&offset=25');
    expect(__private.hitungRingkasanPerbandingan({ kata: 'subjek', frekuensi: 10, rank: 5 }, { kata: 'subyek', frekuensi: 2, rank: 15 })).toMatchObject({
      selisihFrekuensi: 8,
      selisihRank: 10,
    });
    expect(__private.hitungRingkasanPerbandingan({ kata: 'subjek', frekuensi: 4, rank: 5 }, { kata: 'subyek', frekuensi: 4, rank: 7 })).toMatchObject({
      labelDominan: 'subjek dan subyek muncul dengan frekuensi yang sama.',
      rasio: 1,
      selisihRank: 2,
    });
    expect(__private.hitungRingkasanPerbandingan(null, { kata: 'dua', frekuensi: 2, rank: 1 })).toMatchObject({
      labelDominan: 'dua lebih sering muncul pada korpus ini.',
      rasio: null,
      selisihRank: null,
    });
    expect(__private.hitungRingkasanPerbandingan({ kata: 'satu', frekuensi: 2, rank: 1 }, null)).toMatchObject({
      labelDominan: 'satu lebih sering muncul pada korpus ini.',
      rasio: null,
      selisihRank: null,
    });
    expect(__private.hitungRingkasanPerbandingan({ kata: 'satu', frekuensi: 0 }, { kata: 'dua', frekuensi: 0 })).toMatchObject({ selisihFrekuensi: 0, rasio: null });
    expect(__private.sorotKataDalamKalimat('Indonesia maju', [{}, { kata: 'Indonesia' }])).not.toBeNull();
  });

  it('merender helper token dan panel contoh untuk cabang kosong, galat, dan klik item', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(__private.renderTokenList([{ kata: '...', frekuensi: 2 }], 'Kosong', onSelect));
    expect(screen.getByText('Kosong')).toBeInTheDocument();

    rerender(__private.renderTokenList([{ kata: 'kata', frekuensi: 4 }], 'Kosong', onSelect, (item) => `${item.frekuensi}x`));
    fireEvent.click(screen.getByRole('button', { name: 'kata' }));
    expect(onSelect).toHaveBeenCalledWith('kata');
    expect(screen.getByText('(4x)')).toBeInTheDocument();

    rerender(__private.renderTokenList([{ kata: 'alfa', frekuensi: 2 }, { kata: 'beta', frekuensi: 1 }], 'Kosong'));
    expect(screen.getByRole('button', { name: 'alfa' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'beta' }).parentElement?.textContent).toContain(',');

    rerender(__private.renderMetaContoh({ sourceUrl: 'https://www.example.com/path', sourceDate: '2024-03-05' }));
    expect(screen.getByRole('link', { name: 'example.com' })).toHaveAttribute('href', 'https://www.example.com/path');

    rerender(__private.renderMetaContoh({ sourceUrl: '', sourceDate: '2024-03-05' }));
    expect(screen.getByText(/dikumpulkan/i)).toBeInTheDocument();

    rerender(__private.renderMetaContoh({ sourceUrl: 'https://www.example.com/path', sourceDate: null }));
    expect(screen.getByRole('link', { name: 'example.com' })).toBeInTheDocument();

    rerender(
      <__private.PanelContohKata
        kataAktif=""
        query={{ isLoading: false, isError: false, data: { data: [] } }}
        bentuk={[]}
      />
    );
    expect(screen.getByText('Masukkan kata untuk melihat contoh pemakaian dari korpus terpilih.')).toBeInTheDocument();

    rerender(
      <__private.PanelContohKata
        kataAktif="kata"
        query={{ isLoading: false, isError: true, error: { response: { status: 404 } } }}
        bentuk={[]}
      />
    );
    expect(screen.getByText('Contoh kalimat tidak dapat dimuat.')).toBeInTheDocument();

    rerender(
      <__private.PanelContohKata
        kataAktif="kata"
        query={{ isLoading: false, isError: false, data: { data: [] } }}
        bentuk={[]}
        emptyText="Contoh kosong"
      />
    );
    expect(screen.getByText('Contoh kosong')).toBeInTheDocument();
  });

  it('menangani interaksi form untuk ubah mode, submit, pilih contoh, paging, dan bersihkan', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        domain: 'news',
        size: '10K',
        hasSqlite: true,
        stats: { sentences: 10000, wordTypes: 8000, wordTokens: 190000 },
      }],
    });
    mockApi.ambilInfoKataLeipzig
      .mockResolvedValueOnce({ kata: 'subjek', frekuensi: 12, rank: 10, kelasFrekuensi: 1, bentuk: [] })
      .mockResolvedValueOnce({ kata: 'subyek', frekuensi: 4, rank: 80, kelasFrekuensi: 4, bentuk: [] })
      .mockResolvedValueOnce({ kata: 'berita', frekuensi: 7, rank: 5, kelasFrekuensi: 2, bentuk: [] });
    mockApi.ambilContohKataLeipzig
      .mockResolvedValueOnce({ data: [{ sentenceId: 1, sentence: 'Subjek penelitian dibahas.', sourceUrl: '', sourceDate: null }], bentuk: [] })
      .mockResolvedValueOnce({ data: [{ sentenceId: 2, sentence: 'Ejaan subyek muncul.', sourceUrl: '', sourceDate: null }], bentuk: [] })
      .mockResolvedValueOnce({ data: [], bentuk: [] });
    mockApi.ambilPeringkatKataLeipzig
      .mockResolvedValueOnce({ total: 40, limit: 25, offset: 0, hasMore: true, data: [{ kata: 'yang', frekuensi: 812, rank: 1, kelasFrekuensi: 0 }] })
      .mockResolvedValueOnce({ total: 40, limit: 25, offset: 25, hasMore: false, data: [{ kata: 'itu', frekuensi: 200, rank: 26, kelasFrekuensi: 1 }] });
    mockApi.ambilKookurensiSekalimatLeipzig.mockResolvedValue({ data: [{ kata: 'berita', frekuensi: 3 }] });
    mockApi.ambilKookurensiTetanggaLeipzig.mockResolvedValue({ kiri: [], kanan: [] });

    renderPage('/alat/analisis-korpus');

    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat informasi alat' }));
    expect(screen.getByRole('button', { name: 'Tutup informasi alat' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup informasi alat' }));

    fireEvent.change(screen.getByLabelText('Pilih korpus Leipzig'), { target: { value: 'ind_news_2024_10K' } });

    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'bandingkan' } });
    fireEvent.change(screen.getByLabelText('Kata ke-1 yang ingin dibandingkan'), { target: { value: 'subjek' } });
    fireEvent.change(screen.getByLabelText('Kata ke-2 yang ingin dibandingkan'), { target: { value: 'subyek' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bandingkan' }));

    expect(await screen.findByRole('button', { name: 'subjek' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Tampilkan sumber' })[0]);
    expect(screen.getAllByRole('button', { name: 'Sembunyikan sumber' }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'subjek' }));

    expect(await screen.findByLabelText('Kata yang ingin ditelusuri')).toHaveValue('subjek');
    fireEvent.change(screen.getByLabelText('Kata yang ingin ditelusuri'), { target: { value: 'berita' } });
    expect(screen.getByLabelText('Kata yang ingin ditelusuri')).toHaveValue('berita');

    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'peringkat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(await screen.findByRole('button', { name: 'yang' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'yang' }));
    expect(await screen.findByLabelText('Kata yang ingin ditelusuri')).toHaveValue('yang');

    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'peringkat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    fireEvent.click(screen.getByLabelText('Halaman berikutnya'));

    await waitFor(() => {
      expect(mockApi.ambilPeringkatKataLeipzig).toHaveBeenNthCalledWith(2, 'ind_news_2024_10K', { limit: 25, offset: 25 });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan' }));
    expect(screen.queryByLabelText('Kata yang ingin ditelusuri')).not.toBeInTheDocument();
  });

  it('memakai korpus pertama saat path hanya memuat kata', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        domain: 'news',
        size: '10K',
        hasSqlite: true,
        stats: { sentences: 10000 },
      }],
    });
    mockApi.ambilInfoKataLeipzig.mockResolvedValue({
      kata: 'indonesia',
      frekuensi: 13,
      rank: 2,
      kelasFrekuensi: 0,
      bentuk: [{ kata: 'Indonesia', frekuensi: 8, wordId: 2 }],
    });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });
    mockApi.ambilKookurensiSekalimatLeipzig.mockResolvedValue({ data: [] });
    mockApi.ambilKookurensiTetanggaLeipzig.mockResolvedValue({ kiri: [], kanan: [] });

    renderPage('/alat/analisis-korpus/indonesia');

    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia');
    });
  });

  it('menampilkan state loading dan galat pada panel tetangga telusuri', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilInfoKataLeipzig.mockResolvedValue({ kata: 'indonesia', frekuensi: 1, rank: 1, kelasFrekuensi: 1, bentuk: [] });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });
    mockApi.ambilKookurensiSekalimatLeipzig.mockImplementationOnce(() => new Promise(() => {}));
    mockApi.ambilKookurensiTetanggaLeipzig.mockImplementationOnce(() => new Promise(() => {}));

    renderPage('/alat/analisis-korpus/indonesia/ind_news_2024_10K');
    expect(await screen.findByText('Memuat kata di kiri ...')).toBeInTheDocument();
    expect(screen.getByText('Memuat kata di kanan ...')).toBeInTheDocument();
    expect(screen.getByText('Memuat kata dalam satu kalimat ...')).toBeInTheDocument();

    cleanup();
    mockApi.ambilKookurensiSekalimatLeipzig.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Galat sekalimat' } } });
    mockApi.ambilKookurensiTetanggaLeipzig.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Galat tetangga' } } });
    renderPage('/alat/analisis-korpus/indonesia/ind_news_2024_10K');
    expect(await screen.findByText('Galat sekalimat')).toBeInTheDocument();
    expect(await screen.findAllByText('Galat tetangga')).not.toHaveLength(0);
  });

  it('menampilkan state mode bandingkan untuk input kurang, loading, dan data kosong', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });

    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek');
    expect(await screen.findByText(/Masukkan minimal dua kata/)).toBeInTheDocument();

  cleanup();
    mockApi.ambilInfoKataLeipzig.mockImplementationOnce(() => new Promise(() => {})).mockImplementationOnce(() => new Promise(() => {}));
    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek&kata2=subyek');
    expect(await screen.findByText('Memuat statistik kata ...')).toBeInTheDocument();

  cleanup();
    mockApi.ambilInfoKataLeipzig.mockResolvedValue(null);
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });
    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek&kata2=subyek');
    expect(await screen.findByText('Belum ada data perbandingan yang dapat ditampilkan.')).toBeInTheDocument();

  cleanup();
    mockApi.ambilInfoKataLeipzig.mockRejectedValue({ response: { status: 500, data: { message: 'Galat banding' } } });
    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek&kata2=subyek');
    expect(await screen.findAllByText('Galat banding')).not.toHaveLength(0);
  });

  it('menampilkan state kosong mode peringkat ketika korpus belum memiliki data frekuensi', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilPeringkatKataLeipzig.mockResolvedValue({ total: 0, limit: 25, offset: 0, hasMore: false, data: [] });

    renderPage('/alat/analisis-korpus?mode=peringkat&korpus=ind_news_2024_10K');
    expect(await screen.findByText('Belum ada data frekuensi kata untuk korpus ini.')).toBeInTheDocument();
  });

  it('menampilkan validasi submit untuk korpus kosong, kata kosong, dan banding kurang dari dua kata', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({ data: [] });
    renderPage('/alat/analisis-korpus');
    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(screen.getByText('Korpus belum tersedia.')).toBeInTheDocument();

    cleanup();
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    renderPage('/alat/analisis-korpus');
    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Berita 2024' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));
    expect(screen.getByText('Masukkan kata yang ingin ditelusuri.')).toBeInTheDocument();

    cleanup();
    renderPage('/alat/analisis-korpus');
    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Berita 2024' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'bandingkan' } });
    fireEvent.change(screen.getByLabelText('Kata ke-1 yang ingin dibandingkan'), { target: { value: 'subjek' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bandingkan' }));
    expect(screen.getByText('Masukkan minimal dua kata yang ingin dibandingkan.')).toBeInTheDocument();
  });

  it('menampilkan galat mode peringkat saat API gagal', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilPeringkatKataLeipzig.mockRejectedValue({ response: { status: 500, data: { message: 'Galat peringkat' } } });

    renderPage('/alat/analisis-korpus?mode=peringkat&korpus=ind_news_2024_10K');
    expect(await screen.findByText('Galat peringkat')).toBeInTheDocument();
  });

  it('menampilkan state 404 untuk daftar korpus dan semua panel telusuri', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Galat korpus' } } });
    renderPage('/alat/analisis-korpus');
    expect(await screen.findByText('Galat korpus')).toBeInTheDocument();

    cleanup();
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: false, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilInfoKataLeipzig.mockRejectedValueOnce({ response: { status: 404, data: { message: 'Tidak ada kata' } } });
    renderPage('/alat/analisis-korpus/indonesia');
    const galatKata = await screen.findByText('Tidak ada kata');
    expect(galatKata.closest('p')).not.toHaveClass('alat-error-text');

    cleanup();
    mockApi.ambilInfoKataLeipzig.mockResolvedValue({ kata: '', frekuensi: 0, rank: 0, bentuk: [] });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });
    mockApi.ambilKookurensiSekalimatLeipzig.mockRejectedValueOnce({ response: { status: 404, data: { message: 'Tidak ada sekalimat' } } });
    mockApi.ambilKookurensiTetanggaLeipzig.mockRejectedValueOnce({ response: { status: 404, data: { message: 'Tidak ada tetangga' } } });
    renderPage('/alat/analisis-korpus/indonesia');
    const galatSekalimat = await screen.findByText('Tidak ada sekalimat');
    expect(galatSekalimat.closest('p')).toHaveClass('alat-empty-text');
    const galatTetangga = await screen.findAllByText('Tidak ada tetangga');
    galatTetangga.forEach((node) => expect(node.closest('p')).toHaveClass('alat-empty-text'));
    expect(mockApi.ambilInfoKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia');
  });

  it('mengurutkan perbandingan berdasarkan rank lalu abjad dan memindahkan kata pertama saat kembali ke mode telusuri', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilInfoKataLeipzig
      .mockResolvedValueOnce({ kata: 'zeta', frekuensi: 10, rank: 5, bentuk: [] })
      .mockResolvedValueOnce({ kata: 'alfa', frekuensi: 10, rank: 5, bentuk: [] })
      .mockResolvedValueOnce({ kata: 'beta', frekuensi: 10, rank: 3, bentuk: [] });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });

    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=zeta&kata2=alfa&kata3=beta');

    expect(await screen.findByRole('button', { name: 'beta' })).toBeInTheDocument();
    const tombolKata = ['beta', 'alfa', 'zeta'].map((nama) => screen.getByRole('button', { name: nama }));
    expect(tombolKata.map((node) => node.textContent)).toEqual(['beta', 'alfa', 'zeta']);

    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'telusuri' } });
    expect(screen.getByLabelText('Kata yang ingin ditelusuri')).toHaveValue('zeta');
  });

  it('memakai fallback formKata saat kembali ke telusuri tanpa kata banding aktif', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });

    renderPage('/alat/analisis-korpus');
    expect(await screen.findByRole('option', { name: 'Berita 2024' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Kata yang ingin ditelusuri'), { target: { value: 'indonesia' } });
    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'bandingkan' } });
    fireEvent.change(screen.getByLabelText('Kata ke-1 yang ingin dibandingkan'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Pilih mode analisis korpus'), { target: { value: 'telusuri' } });
    expect(screen.getByLabelText('Kata yang ingin ditelusuri')).toHaveValue('indonesia');
  });

  it('memakai fallback nilai data perbandingan dan menampilkan N/A saat rank atau total tidak tersedia', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilInfoKataLeipzig
      .mockResolvedValueOnce({ kata: '', frekuensi: 0, rank: null, bentuk: [] })
      .mockResolvedValueOnce({ kata: 'beta', frekuensi: 0, rank: 2, bentuk: [] });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });

    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=alpha&kata2=beta');
    expect(await screen.findByRole('button', { name: 'beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'alpha' })).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });

  it('menampilkan state 404 pada perbandingan agar pesan diperlakukan sebagai kosong', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{ id: 'ind_news_2024_10K', label: 'Berita 2024', hasSqlite: true, stats: { wordTokens: 10 } }],
    });
    mockApi.ambilInfoKataLeipzig.mockRejectedValue({ response: { status: 404, data: { message: 'Tidak ada data banding' } } });
    mockApi.ambilContohKataLeipzig.mockResolvedValue({ data: [], bentuk: [] });

    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek&kata2=subyek');
    const pesan = await screen.findAllByText('Tidak ada data banding');
    pesan.forEach((node) => expect(node.closest('p')).toHaveClass('alat-empty-text'));
  });

  it('merender mode bandingkan dengan dua query statistik kata', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        domain: 'news',
        size: '10K',
        hasSqlite: true,
        stats: { sentences: 10000, wordTypes: 8000, wordTokens: 190000 },
      }],
    });
    mockApi.ambilInfoKataLeipzig
      .mockResolvedValueOnce({ kata: 'subjek', frekuensi: 12, rank: 10, kelasFrekuensi: 1, bentuk: [] })
      .mockResolvedValueOnce({ kata: 'subyek', frekuensi: 4, rank: 80, kelasFrekuensi: 4, bentuk: [] });
    mockApi.ambilContohKataLeipzig
      .mockResolvedValueOnce({ data: [{ sentenceId: 1, sentence: 'Subjek penelitian dibahas.', sourceUrl: '', sourceDate: null }], bentuk: [] })
      .mockResolvedValueOnce({ data: [{ sentenceId: 2, sentence: 'Ejaan subyek muncul pada naskah lama.', sourceUrl: '', sourceDate: null }], bentuk: [] });

    renderPage('/alat/analisis-korpus?mode=bandingkan&korpus=ind_news_2024_10K&kata1=subjek&kata2=subyek');

    expect(await screen.findByLabelText('Kata ke-1 yang ingin dibandingkan')).toHaveValue('subjek');
    expect(screen.getByLabelText('Kata ke-2 yang ingin dibandingkan')).toHaveValue('subyek');
    expect(screen.getByLabelText('Kata ke-3 yang ingin dibandingkan')).toHaveValue('');
    expect(screen.getByLabelText('Kata ke-4 yang ingin dibandingkan')).toHaveValue('');
    expect((await screen.findByRole('columnheader', { name: 'Kemunculan' })).className).toContain('korpus-leipzig-ranking-col-number');
    expect(screen.getByRole('columnheader', { name: 'Urutan' }).className).toContain('korpus-leipzig-ranking-col-number');
    expect(screen.getByRole('columnheader', { name: 'Persentase' }).className).toContain('korpus-leipzig-ranking-col-number');
    expect(screen.getByRole('cell', { name: '1.' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contoh "subjek"' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contoh "subyek"' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tampilkan sumber' })).toHaveLength(2);

    await waitFor(() => {
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenNthCalledWith(1, 'ind_news_2024_10K', 'subjek');
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenNthCalledWith(2, 'ind_news_2024_10K', 'subyek');
      expect(screen.getAllByRole('button', { name: 'subjek' })).toHaveLength(1);
      expect(screen.getAllByRole('button', { name: 'subyek' })).toHaveLength(1);
      expect(screen.getByRole('cell', { name: '12' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '75,0%' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '25,0%' })).toBeInTheDocument();
    });
  });

  it('merender mode peringkat dengan daftar frekuensi dan paging', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'Berita 2024',
        domain: 'news',
        size: '10K',
        hasSqlite: true,
        stats: { sentences: 10000, wordTypes: 8000, wordTokens: 190000 },
      }],
    });
    mockApi.ambilPeringkatKataLeipzig.mockResolvedValue({
      total: 40,
      limit: 25,
      offset: 0,
      hasMore: true,
      data: [
        { kata: 'yang', frekuensi: 812, rank: 1, kelasFrekuensi: 0 },
        { kata: 'dan', frekuensi: 700, rank: 2, kelasFrekuensi: 0 },
      ],
    });

    renderPage('/alat/analisis-korpus?mode=peringkat&korpus=ind_news_2024_10K');

    expect(await screen.findByRole('button', { name: 'yang' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1.' })).toBeInTheDocument();
    expect(screen.getAllByText('0,4')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Jumlah' }).className).toContain('korpus-leipzig-ranking-col-number');
    expect(screen.getByRole('columnheader', { name: '%Frekuensi' }).className).toContain('korpus-leipzig-ranking-col-number');
    expect(screen.queryByRole('heading', { name: 'Peringkat Kata' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Halaman berikutnya')).toBeEnabled();
    expect(screen.getByText(/Halaman 1 \(1–25 dari 40 entri\)/).closest('div')?.className).toContain('korpus-leipzig-pagination');

    await waitFor(() => {
      expect(mockApi.ambilPeringkatKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', { limit: 25, offset: 0 });
    });
  });
});