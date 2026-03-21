import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Gramatika from '../../../../src/pages/publik/kamus/Gramatika';
import { SsrPrefetchProvider } from '../../../../src/context/ssrPrefetchContext';

vi.mock('../../../../src/constants/gramatikData', () => {
  const daftarIsiGramatika = [
    {
      slug: 'kata-tugas',
      judul: 'Kata Tugas',
      items: [
        { slug: 'batasan-dan-ciri-kata-tugas', judul: 'Batasan dan Ciri Kata Tugas' },
        { slug: 'preposisi', judul: 'Preposisi' },
      ],
    },
  ];

  const daftarItemGramatika = [
    {
      judul: 'Kata Tugas',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      slug: 'kata-tugas',
      dokumen: 'kata-tugas/kata-tugas.md',
      tipe: 'bab',
    },
    {
      judul: 'Preposisi',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      slug: 'preposisi',
      dokumen: 'kata-tugas/preposisi.md',
      tipe: 'item',
    },
  ];

  return {
    daftarIsiGramatika,
    daftarItemGramatika,
  };
});

function renderHalaman(pathname = '/gramatika', ssrData = null) {
  return render(
    <SsrPrefetchProvider value={ssrData}>
      <MemoryRouter initialEntries={[pathname]}>
        <Routes>
          <Route path="/gramatika" element={<Gramatika />} />
          <Route path="/gramatika/:slug" element={<Gramatika />} />
        </Routes>
      </MemoryRouter>
    </SsrPrefetchProvider>
  );
}

describe('Gramatika', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('mode detail memakai markdown dari SSR tanpa fetch ulang', async () => {
    renderHalaman('/gramatika/preposisi', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'preposisi',
      markdown: '# Preposisi SSR\n\nPreposisi adalah kata tugas.',
      description: 'Preposisi adalah kata tugas.',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByText('Preposisi SSR')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('slug tidak valid menampilkan halaman tidak ditemukan', async () => {
    renderHalaman('/gramatika/slug-tidak-ada');

    await waitFor(() => {
      expect(screen.getByText('Halaman gramatika tidak ditemukan.')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});