import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Ihwal from '../../../../src/pages/publik/informasi/Ihwal';

describe('Ihwal', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('---\ntitle: Ihwal\n---\n# Ihwal Kateglo\n\nTentang Kateglo.'),
    });
  });

  it('menampilkan halaman ihwal dan memuat markdown statis', async () => {
    render(
      <MemoryRouter>
        <Ihwal />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Ihwal Kateglo' })).toBeInTheDocument();
    expect(screen.getByText('Memuat ihwal Kateglo …')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tentang Kateglo.')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/halaman/info/ihwal-kateglo.md', expect.any(Object));
  });
});