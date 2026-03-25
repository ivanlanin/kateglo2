import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Gramatika, { __private } from '../../../../src/pages/publik/kamus/Gramatika';
import { SsrPrefetchProvider } from '../../../../src/context/ssrPrefetchContext';

vi.mock('../../../../src/constants/gramatikaData', () => {
  const daftarIsiGramatika = [
    {
      slug: 'kata-tugas',
      judul: 'Kata Tugas',
      items: [
        { slug: 'batasan-dan-ciri-kata-tugas', judul: 'Batasan dan Ciri Kata Tugas' },
        {
          slug: 'preposisi',
          judul: 'Preposisi',
          turunan: [
            { slug: 'preposisi-dasar', judul: 'Preposisi Dasar' },
          ],
        },
        { slug: 'tanpa-dok', judul: 'Tanpa Dokumen' },
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
    {
      judul: 'Preposisi Dasar',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      slug: 'preposisi-dasar',
      dokumen: 'kata-tugas/preposisi-dasar.md',
      tipe: 'subitem',
      parentSlug: 'preposisi',
      parentJudul: 'Preposisi',
    },
    {
      judul: 'Tanpa Dokumen',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      slug: 'tanpa-dok',
      dokumen: '',
      tipe: 'item',
    },
  ];

  const daftarHalamanReferensiGramatika = [];

  return {
    daftarIsiGramatika,
    daftarItemGramatika,
    daftarHalamanReferensiGramatika,
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
      markdown: '# Preposisi SSR\n\n## Jenis Preposisi\n\nPreposisi adalah kata tugas.',
      description: 'Preposisi adalah kata tugas.',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByText('Preposisi SSR')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('details[open]')).not.toBeNull();
  });

  it('mode daftar isi menampilkan grid sumber tanpa fetch', () => {
    renderHalaman('/gramatika');

    expect(screen.getByRole('heading', { name: 'Gramatika' })).toBeInTheDocument();
    expect(screen.getByText('Tata Bahasa Baku Bahasa Indonesia')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('menyediakan toggle untuk menciutkan dan meluaskan semua heading', async () => {
    renderHalaman('/gramatika/preposisi', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'preposisi',
      markdown: '# Preposisi SSR\n\n## Jenis Preposisi\n\n### Preposisi Dasar\n\nPreposisi adalah kata tugas.',
      description: 'Preposisi adalah kata tugas.',
      notFound: false,
    });

    const tombolToggle = await screen.findByRole('button', { name: 'Ciutkan' });
    expect(document.querySelectorAll('details[open]')).toHaveLength(2);

    fireEvent.click(tombolToggle);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Luaskan' })).toBeInTheDocument();
    });

    expect(document.querySelectorAll('details[open]')).toHaveLength(0);
  });

  it('slug tidak valid menampilkan halaman tidak ditemukan', async () => {
    renderHalaman('/gramatika/slug-tidak-ada');

    await waitFor(() => {
      expect(screen.getByText('Halaman gramatika tidak ditemukan.')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('helper internal gramatika menutup frontmatter, heading lipat, dan breadcrumb', () => {
    expect(__private.bacaIsiMarkdown('---\njudul: Tes\n---\n# Isi')).toBe('# Isi');
    expect(__private.bacaIsiMarkdown('# Tanpa Frontmatter')).toBe('# Tanpa Frontmatter');

    const container = document.createElement('div');
    container.innerHTML = '<details open><summary>A</summary></details><details><summary>B</summary></details>';

    expect(__private.setStatusHeadingLipat(container, false)).toBe(2);
    expect(container.querySelectorAll('details[open]')).toHaveLength(0);
    expect(__private.setStatusHeadingLipat(container, true)).toBe(2);
    expect(container.querySelectorAll('details[open]')).toHaveLength(2);
    expect(__private.setStatusHeadingLipat(null, true)).toBe(0);

    expect(__private.buildBreadcrumbGramatika(null)).toEqual([{ label: 'Gramatika', to: '/gramatika' }]);
    expect(__private.buildBreadcrumbGramatika({ tipe: 'bab', judul: 'Kata Tugas', babSlug: 'kata-tugas' })).toEqual([{ label: 'Gramatika', to: '/gramatika' }]);
    expect(__private.buildBreadcrumbGramatika({
      tipe: 'subitem',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      parentJudul: 'Preposisi',
      parentSlug: 'preposisi',
    })).toEqual([
      { label: 'Gramatika', to: '/gramatika' },
      { label: 'Kata Tugas', to: '/gramatika/kata-tugas' },
      { label: 'Preposisi', to: '/gramatika/preposisi' },
    ]);
    expect(__private.buildBreadcrumbGramatika({
      tipe: 'item',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      ancestorTrail: [
        { judul: 'Akar', slug: 'akar' },
        { judul: 'Cabang', slug: 'cabang' },
      ],
    })).toEqual([
      { label: 'Gramatika', to: '/gramatika' },
      { label: 'Kata Tugas', to: '/gramatika/kata-tugas' },
      { label: 'Akar', to: '/gramatika/akar' },
      { label: 'Cabang', to: '/gramatika/cabang' },
    ]);
    expect(__private.buildBreadcrumbGramatika({
      tipe: 'item',
      judulBab: 'Kata Tugas',
      babSlug: 'kata-tugas',
      ancestorTrail: [],
    })).toEqual([
      { label: 'Gramatika', to: '/gramatika' },
      { label: 'Kata Tugas', to: '/gramatika/kata-tugas' },
    ]);
  });

  it('mengabaikan SSR yang slug-nya tidak cocok lalu memuat dokumen dari fetch', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => '# Preposisi dari Fetch',
    });

    renderHalaman('/gramatika/preposisi', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'preposisi-dasar',
      markdown: '# Salah Halaman',
      description: 'Salah halaman.',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByText('Preposisi dari Fetch')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/gramatika/kata-tugas/preposisi.md', expect.any(Object));
  });

  it('mengabaikan SSR dengan section salah dan menerima markdown SSR kosong untuk bab', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '# Preposisi dari Fetch Lagi',
    });

    const view = renderHalaman('/gramatika/preposisi', {
      type: 'static-markdown',
      section: 'ejaan',
      slug: 'preposisi',
      markdown: '# Salah Section',
      description: 'Salah section.',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByText('Preposisi dari Fetch Lagi')).toBeInTheDocument();
    });

    view.unmount();

    renderHalaman('/gramatika/kata-tugas', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'kata-tugas',
      markdown: '',
      description: '',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Kata Tugas' })).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Gramatika' })).toHaveAttribute('href', '/gramatika');
  });

  it('mengabaikan SSR saat slug SSR kosong dan tetap menandai parent sidebar untuk subitem', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '# Preposisi Dasar dari Fetch',
    });

    renderHalaman('/gramatika/preposisi-dasar', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: '',
      markdown: '# SSR Kosong',
      description: '',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Preposisi Dasar' })).toBeInTheDocument();
    });

    const parentLink = screen.getAllByRole('link', { name: 'Preposisi' })
      .find((element) => element.getAttribute('aria-current') === 'page');
    expect(parentLink).toBeDefined();
    expect(parentLink).toHaveAttribute('href', '/gramatika/preposisi');
  });

  it('mode daftar isi tetap stabil saat SSR static-markdown memakai slug kosong', () => {
    renderHalaman('/gramatika', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: '',
      markdown: '# Daftar Isi SSR',
      description: 'Tidak dipakai pada mode daftar isi.',
      notFound: false,
    });

    expect(screen.getByRole('heading', { name: 'Gramatika' })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('halaman bab memakai markdown SSR tanpa fetch ulang', async () => {
    renderHalaman('/gramatika/kata-tugas', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'kata-tugas',
      markdown: '1. [Batasan dan Ciri Kata Tugas](/gramatika/batasan-dan-ciri-kata-tugas)\n2. [Preposisi](/gramatika/preposisi)\n   1. [Preposisi Dasar](/gramatika/preposisi-dasar)',
      description: 'Ikhtisar bab Kata Tugas.',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Kata Tugas' })).toBeInTheDocument();
    });

    const konten = document.querySelector('.gramatika-markdown-content');
    const daftarTingkatAtas = konten?.querySelector('ol');
    const itemPreposisi = within(konten).getByRole('link', { name: 'Preposisi' });
    const itemPreposisiDasar = within(konten).getByRole('link', { name: 'Preposisi Dasar' });
    const nestedList = itemPreposisi.closest('li')?.querySelector('ol');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(konten).not.toBeNull();
    expect(daftarTingkatAtas).not.toBeNull();
    expect(itemPreposisi).toHaveAttribute('href', '/gramatika/preposisi');
    expect(itemPreposisiDasar).toHaveAttribute('href', '/gramatika/preposisi-dasar');
    expect(nestedList).not.toBeNull();
    expect(within(nestedList).getByRole('link', { name: 'Preposisi Dasar' })).toBeInTheDocument();
  });

  it('memuat markdown via fetch dan menangani galat dokumen serta abort error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => '---\njudul: Preposisi\n---\n# Preposisi\n\nIsi dokumen',
    });

    const tampilanAwal = renderHalaman('/gramatika/preposisi');

    expect(screen.getByText('Memuat dokumen gramatika …')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Isi dokumen')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/gramatika/kata-tugas/preposisi.md', expect.any(Object));

    tampilanAwal.unmount();

    global.fetch.mockResolvedValueOnce({ ok: false, text: async () => '' });
    renderHalaman('/gramatika/preposisi-dasar');

    await waitFor(() => {
      expect(screen.getByText('Gagal memuat dokumen gramatika.')).toBeInTheDocument();
    });

    global.fetch.mockRejectedValueOnce({ name: 'AbortError' });
    const tampilanAbort = renderHalaman('/gramatika/preposisi');
    tampilanAbort.unmount();
  });

  it('menampilkan galat saat metadata dokumen ada tetapi path dokumen kosong', async () => {
    renderHalaman('/gramatika/tanpa-dok');

    await waitFor(() => {
      expect(screen.getByText('Dokumen gramatika tidak tersedia.')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('subhalaman mengikuti urutan prev next dan menyorot item induk di sidebar', async () => {
    renderHalaman('/gramatika/preposisi-dasar', {
      type: 'static-markdown',
      section: 'gramatika',
      slug: 'preposisi-dasar',
      markdown: 'Preposisi dasar adalah bentuk paling sederhana.',
      description: 'Preposisi dasar adalah bentuk paling sederhana.',
      notFound: false,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Preposisi Dasar' })).toBeInTheDocument();
    });

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb gramatika' });
    const breadcrumbLinks = within(breadcrumb).getAllByRole('link');
    const prevLink = screen.getByRole('link', { name: '‹ Preposisi' });
    const parentLink = within(breadcrumb).getByRole('link', { name: 'Preposisi' });
    const sidebarParentLink = screen.getAllByRole('link', { name: 'Preposisi' })
      .find((element) => element.getAttribute('aria-current') === 'page');

    expect(prevLink).toHaveAttribute('href', '/gramatika/preposisi');
    expect(parentLink).toHaveAttribute('href', '/gramatika/preposisi');
    expect(sidebarParentLink).toBeDefined();
    expect(sidebarParentLink).toHaveAttribute('href', '/gramatika/preposisi');
    expect(sidebarParentLink).toHaveAttribute('aria-current', 'page');
    expect(breadcrumbLinks).toHaveLength(3);
    expect(within(breadcrumb).queryByText('Preposisi Dasar')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Preposisi Dasar' })).not.toBeInTheDocument();
  });

  it('render internal daftar isi dan sidebar aktif sebagai tautan untuk subitem', () => {
    const { rerender } = render(
      <MemoryRouter>
        <__private.DaftarIsiGramatikaGrid />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Kata Tugas' })).toHaveAttribute('href', '/gramatika/kata-tugas');

    rerender(
      <MemoryRouter>
        <__private.DaftarIsiPanel aktifSlug="" aktifSlugSebagaiTautan="preposisi" />
      </MemoryRouter>
    );

    const tautanPreposisi = screen.getAllByRole('link', { name: 'Preposisi' })
      .find((element) => element.getAttribute('aria-current') === 'page');
    expect(tautanPreposisi).toBeDefined();
    expect(tautanPreposisi).toHaveAttribute('href', '/gramatika/preposisi');
  });
});