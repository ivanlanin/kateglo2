import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    vi.clearAllMocks();
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
    expect(__private.formatStatKorpus({ sentences: 12, wordTypes: 9, wordTokens: 100 })).toContain('12 kalimat');
    expect(__private.formatStatKorpus(null)).toBe('Statistik korpus belum tersedia');
    expect(__private.formatKemunculanRingkas(12, { wordTokens: 100 })).toBe('12');
    expect(__private.formatPersenKemunculan(12, { wordTokens: 100 })).toBe('12,0%');
    expect(__private.getKelasFrekuensiLabel(5)).toContain('Menengah');
    expect(__private.adalahGalat404({ response: { status: 404 } })).toBe(true);
    expect(__private.adalahTokenTampil('Indonesia')).toBe(true);
    expect(__private.adalahTokenTampil('...')).toBe(false);

    const layout = __private.bangunTataLetakGraf([
      { id: 'pusat', label: 'pusat', weight: 10, isCenter: true },
      { id: 'node-a', label: 'Node A', weight: 4, isCenter: false },
    ]);

    expect(layout).toHaveLength(2);
    expect(layout[0]).toMatchObject({ x: 360, y: 180 });
    expect(__private.formatTanggalAman('2024-03-05')).toContain('2024');
    expect(__private.normalisasiMode('Bandingkan')).toBe('bandingkan');
    expect(__private.buildPathAnalisisKorpus({ kata: 'indonesia', korpus: 'ind_news_2024_10K' })).toBe('/alat/analisis-korpus?korpus=ind_news_2024_10K&kata=indonesia');
    expect(__private.hitungRingkasanPerbandingan({ kata: 'subjek', frekuensi: 10, rank: 5 }, { kata: 'subyek', frekuensi: 2, rank: 15 })).toMatchObject({
      selisihFrekuensi: 8,
      selisihRank: 10,
    });
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

    renderPage('/alat/analisis-korpus/indonesia');

    expect(await screen.findByRole('heading', { name: 'Analisis Korpus' })).toBeInTheDocument();

    await waitFor(() => {
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia');
    });
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

    expect(await screen.findAllByText('Kata 1')).toHaveLength(2);
    expect(screen.getAllByText('Kata 2')).toHaveLength(2);
    expect(screen.getByText('△ Frekuensi')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contoh "subjek"' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contoh "subyek"' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tampilkan sumber' })).toHaveLength(2);

    await waitFor(() => {
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenNthCalledWith(1, 'ind_news_2024_10K', 'subjek');
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenNthCalledWith(2, 'ind_news_2024_10K', 'subyek');
      expect(screen.getByText('subjek').closest('article')?.className).toContain('korpus-leipzig-stat-card-winner');
      expect(screen.getByText('subyek').closest('article')?.className).toContain('korpus-leipzig-stat-card-loser');
      expect(screen.getByText('subjek').className).toContain('korpus-leipzig-stat-value-word');
      expect(screen.getByText('subyek').className).toContain('korpus-leipzig-stat-value-word');
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

    await waitFor(() => {
      expect(mockApi.ambilPeringkatKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', { limit: 25, offset: 0 });
    });
  });
});