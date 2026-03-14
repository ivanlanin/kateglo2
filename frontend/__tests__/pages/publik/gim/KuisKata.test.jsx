import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import KuisKataPage from '../../../../src/pages/publik/gim/KuisKata';

vi.mock('../../../../src/components/publik/KuisKata', () => ({
  default: () => <div>Komponen Kuis Kata</div>,
}));

vi.mock('../../../../src/components/publik/HalamanPublik', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe('KuisKataPage', () => {
  it('merender heading terpusat dan menampilkan panel info saat tombol ditekan', () => {
    render(
      <MemoryRouter>
        <KuisKataPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Kuis Kata' })).toBeInTheDocument();
    expect(screen.getByText('Komponen Kuis Kata')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lihat petunjuk gim' }));

    expect(screen.getByText(/kuis kata adalah gim pilihan ganda/i)).toBeInTheDocument();
    expect(screen.queryByText('Komponen Kuis Kata')).not.toBeInTheDocument();
  });
});