import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KuisKataPage from '../../../../src/pages/publik/gim/KuisKata';

const mockApiPublik = vi.hoisted(() => ({
  ambilKlasemenKuisKata: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('../../../../src/components/publik/KuisKata', () => ({
  default: () => <div>Komponen Kuis Kata</div>,
}));

vi.mock('../../../../src/components/publik/HalamanPublik', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../../src/api/apiPublik', () => ({
  ambilKlasemenKuisKata: mockApiPublik.ambilKlasemenKuisKata,
}));

describe('KuisKataPage', () => {
  it('mengizinkan berpindah ke info atau klasemen lalu kembali ke gim', async () => {
    const queryClient = new QueryClient();
    mockApiPublik.ambilKlasemenKuisKata.mockClear();

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

    expect(screen.getByText(/kuis kata adalah gim pilihan ganda/i)).toBeInTheDocument();
    expect(screen.queryByText('Komponen Kuis Kata')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke permainan kuis kata' }));

    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat klasemen harian' }));

    expect(screen.queryByText('Komponen Kuis Kata')).not.toBeInTheDocument();
    expect(mockApiPublik.ambilKlasemenKuisKata).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke permainan kuis kata' }));

    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();
  });
});