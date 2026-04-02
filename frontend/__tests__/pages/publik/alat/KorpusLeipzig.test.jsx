import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KorpusLeipzig, { __private } from '../../../../src/pages/publik/alat/KorpusLeipzig';

const mockApi = vi.hoisted(() => ({
  ambilDaftarKorpusLeipzig: vi.fn(),
  ambilInfoKataLeipzig: vi.fn(),
  ambilContohKataLeipzig: vi.fn(),
  ambilKookurensiSekalimatLeipzig: vi.fn(),
  ambilKookurensiTetanggaLeipzig: vi.fn(),
  ambilGrafKataLeipzig: vi.fn(),
  ambilMiripKonteksLeipzig: vi.fn(),
}));

vi.mock('../../../../src/api/apiPublik', () => mockApi);

function renderPage(initialEntry = '/alat/korpus-leipzig') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/alat/korpus-leipzig" element={<KorpusLeipzig />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('KorpusLeipzig', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('merender hasil Leipzig setelah submit pencarian', async () => {
    mockApi.ambilDaftarKorpusLeipzig.mockResolvedValue({
      data: [{
        id: 'ind_news_2024_10K',
        label: 'News 2024 (10K)',
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
      limit: 8,
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
    mockApi.ambilGrafKataLeipzig.mockResolvedValue({
      nodes: [
        { id: 'indonesia', label: 'indonesia', weight: 7, isCenter: true },
        { id: 'berita', label: 'berita', weight: 4, isCenter: false },
      ],
      edges: [{ source: 'indonesia', target: 'berita', weight: 4 }],
    });
    mockApi.ambilMiripKonteksLeipzig.mockResolvedValue({
      jumlahKonteksAcuan: 14,
      data: [{ kata: 'Malaysia', skorDice: 0.75, jumlahKonteksSama: 6 }],
    });

    renderPage('/alat/korpus-leipzig?korpus=ind_news_2024_10K&kata=indonesia');

    expect(await screen.findByRole('heading', { name: 'Korpus Leipzig' })).toBeInTheDocument();

    expect(await screen.findByText('Contoh')).toBeInTheDocument();
    expect(screen.getByText('Kemunculan')).toBeInTheDocument();
    expect(screen.getByText('Peringkat')).toBeInTheDocument();
    expect(screen.getByText('Frekuensi')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Kolokasi' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Kiri' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Kanan' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mirip' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Graf' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Kolokasi' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Kata dengan konteks mirip')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'indonesia', level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('kelas 0')).toBeInTheDocument();
    expect(screen.getByText('Contoh')).toBeInTheDocument();
    expect(screen.getByText((_, node) => {
      if (!node?.classList?.contains('korpus-leipzig-contoh-kalimat')) {
        return false;
      }

      const teks = node.textContent?.replace(/\s+/g, ' ').trim() || '';
      return teks.includes('Indonesia sedang dibahas dalam berita.');
    })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Kolokasi' }));
    expect(await screen.findByRole('button', { name: 'berita' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Kiri' }));
    expect(await screen.findByRole('button', { name: 'tentang' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Mirip' }));
    expect(await screen.findByRole('button', { name: /Malaysia/i })).toBeInTheDocument();
    expect(screen.queryByText(/konteks signifikan dengan skor Dice/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Graf' }));
    expect(await screen.findByLabelText('Graf asosiasi kata Leipzig')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockApi.ambilInfoKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia');
      expect(mockApi.ambilKookurensiSekalimatLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 25, offset: 0 });
      expect(mockApi.ambilKookurensiTetanggaLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 25 });
      expect(mockApi.ambilMiripKonteksLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 12, minimumKonteksSama: 3 });
      expect(mockApi.ambilGrafKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 10 });
    });

    expect(mockApi.ambilContohKataLeipzig).toHaveBeenCalledWith('ind_news_2024_10K', 'indonesia', { limit: 8, offset: 0 });
  });

  it('helper privat merangkum statistik dan tata letak graf', () => {
    expect(__private.formatStatKorpus({ sentences: 12, wordTypes: 9, wordTokens: 100 })).toContain('12 kalimat');
    expect(__private.formatStatKorpus(null)).toBe('Statistik korpus belum tersedia');
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
  });
});