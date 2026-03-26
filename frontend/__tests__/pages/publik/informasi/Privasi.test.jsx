import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Privasi from '../../../../src/pages/publik/informasi/Privasi';

describe('Privasi', () => {
  beforeEach(() => {
    global.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue([
        '# Kebijakan Privasi',
        '',
        '## Data yang Diproses',
        '',
        '## Tujuan Penggunaan',
        '',
        '## Penyimpanan',
        '',
        '## Hak Pengguna',
        '',
        'Terakhir diperbarui: 26 Maret 2026',
      ].join('\n')),
    });
  });

  it('menampilkan isi kebijakan privasi', async () => {
    render(
      <MemoryRouter>
        <Privasi />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Kebijakan Privasi' })).toBeInTheDocument();
    expect(await screen.findByText('Data yang Diproses')).toBeInTheDocument();
    expect(screen.getByText('Tujuan Penggunaan')).toBeInTheDocument();
    expect(screen.getByText('Penyimpanan')).toBeInTheDocument();
    expect(screen.getByText('Hak Pengguna')).toBeInTheDocument();
    expect(screen.getByText('Terakhir diperbarui: 26 Maret 2026')).toBeInTheDocument();
  });
});