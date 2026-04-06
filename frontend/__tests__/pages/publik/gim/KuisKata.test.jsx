import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KuisKataPage from '../../../../src/pages/publik/gim/KuisKata';

const mockApiPublik = vi.hoisted(() => ({
  ambilKlasemenKuisKata: vi.fn().mockResolvedValue({ data: [] }),
}));

const originalError = console.error;

vi.mock('../../../../src/components/gim/KuisKata', () => ({
  default: () => <div>Komponen Kuis Kata</div>,
}));

vi.mock('../../../../src/components/tampilan/HalamanPublik', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilKlasemenKuisKata: mockApiPublik.ambilKlasemenKuisKata,
}));

describe('KuisKataPage', () => {
  beforeEach(() => {
    mockApiPublik.ambilKlasemenKuisKata.mockReset();
    mockApiPublik.ambilKlasemenKuisKata.mockResolvedValue({ data: [] });
    global.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue([
        '# Kuis Kata',
        '',
        'Kuis Kata adalah gim pilihan ganda untuk menebak arti, sinonim, padanan, makna, dan rima kata bahasa Indonesia langsung di Kateglo.',
      ].join('\n')),
    });
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('mengizinkan berpindah ke info atau klasemen lalu kembali ke gim', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <KuisKataPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: 'Kuis Kata' })).toBeInTheDocument();
    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat petunjuk gim' }));

    expect(await screen.findByText(/kuis kata adalah gim pilihan ganda/i)).toBeInTheDocument();
    expect(screen.queryByText('Komponen Kuis Kata')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kembali ke kuis kata' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke kuis kata' }));
    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke permainan kuis kata' }));

    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));

    expect(screen.queryByText('Komponen Kuis Kata')).not.toBeInTheDocument();
    expect(mockApiPublik.ambilKlasemenKuisKata).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Kembali ke kuis kata' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke kuis kata' }));
    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke permainan kuis kata' }));

    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();
  });

  it('menampilkan state loading, error, berisi, dan kosong pada panel klasemen', async () => {
    const loadingClient = new QueryClient();
    mockApiPublik.ambilKlasemenKuisKata.mockImplementation(() => new Promise(() => {}));

    const loadingView = render(
      <QueryClientProvider client={loadingClient}>
        <MemoryRouter>
          <KuisKataPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    expect(screen.getByText('Memuat klasemen harian …')).toBeInTheDocument();
    loadingView.unmount();

    const errorClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockApiPublik.ambilKlasemenKuisKata.mockRejectedValueOnce(new Error('gagal'));

    render(
      <QueryClientProvider client={errorClient}>
        <MemoryRouter>
          <KuisKataPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));
    await screen.findByText('Gagal memuat klasemen harian.');

    const filledClient = new QueryClient();
    mockApiPublik.ambilKlasemenKuisKata.mockResolvedValueOnce({
      data: [{ pengguna_id: 7, nama: 'Budi', skor_total: 0, jumlah_main: 0 }],
    });

    render(
      <QueryClientProvider client={filledClient}>
        <MemoryRouter>
          <KuisKataPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Lihat klasemen harian' }).at(-1));
    await screen.findByText('Budi');
    expect(screen.getByText('0 poin; 0x main')).toBeInTheDocument();

    const emptyClient = new QueryClient();
    mockApiPublik.ambilKlasemenKuisKata.mockResolvedValueOnce({ data: [] });

    render(
      <QueryClientProvider client={emptyClient}>
        <MemoryRouter>
          <KuisKataPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Lihat klasemen harian' }).at(-1));
    await screen.findByText('Belum ada skor kuis kata hari ini.');
  });
});