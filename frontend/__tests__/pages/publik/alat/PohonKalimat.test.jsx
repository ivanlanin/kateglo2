import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PohonKalimat from '../../../../src/pages/publik/alat/PohonKalimat';

describe('PohonKalimat', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('membuka panel informasi markdown alat', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '## Fungsi\n\nAlat ini membantu menyusun pohon kalimat.',
    });

    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Lihat informasi alat' }));

    expect(await screen.findByRole('heading', { name: 'Fungsi' })).toBeInTheDocument();
    expect(await screen.findByText('Alat ini membantu menyusun pohon kalimat.')).toBeInTheDocument();
    expect(screen.queryByText('Pohon akan muncul di sini.')).not.toBeInTheDocument();
  });

  it('merender builder dan memunculkan pohon setelah contoh dipilih', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Pohon Kalimat' })).toBeInTheDocument();
    expect(screen.getByText('Pohon akan muncul di sini.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pilih contoh pohon kalimat'), {
      target: { value: '0' },
    });

    expect(screen.getByLabelText('Pohon sintaksis kalimat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unduh' })).toBeInTheDocument();
  });

  it('dapat menambah klausa kedua', () => {
    render(
      <MemoryRouter>
        <PohonKalimat />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Tambah klausa' }));

    expect(screen.getByLabelText('Konjungsi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '− Hapus klausa terakhir' })).toBeInTheDocument();
  });
});
