import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Ejaan from '../../../src/halaman/publik/Ejaan';

vi.mock('../../../src/constants/ejaanData', () => {
  const daftarIsiEjaan = [
    {
      slug: 'penggunaan-huruf',
      judul: 'Penggunaan Huruf',
      items: [
        { slug: 'huruf-kapital', judul: 'Huruf Kapital' },
        { slug: 'tanpa-dok', judul: 'Tanpa Dokumen' },
        { slug: 'huruf-miring', judul: 'Huruf Miring' },
      ],
    },
  ];

  const daftarItemEjaan = [
    {
      judul: 'Huruf Kapital',
      judulBab: 'Penggunaan Huruf',
      slug: 'huruf-kapital',
      dokumen: 'penggunaan-huruf/huruf-kapital.md',
    },
    {
      judul: 'Tanpa Dokumen',
      judulBab: 'Penggunaan Huruf',
      slug: 'tanpa-dok',
      dokumen: '',
    },
    {
      judul: 'Huruf Miring',
      judulBab: 'Penggunaan Huruf',
      slug: 'huruf-miring',
      dokumen: 'penggunaan-huruf/huruf-miring.md',
    },
  ];

  return {
    daftarIsiEjaan,
    daftarItemEjaan,
  };
});

function renderHalaman(pathname = '/ejaan') {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route path="/ejaan" element={<Ejaan />} />
        <Route path="/ejaan/:slug" element={<Ejaan />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Ejaan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('mode daftar isi menampilkan kartu, panel, dan tautan sumber', () => {
    renderHalaman('/ejaan');

    expect(screen.getByRole('heading', { name: 'Ejaan' })).toBeInTheDocument();
    expect(screen.getAllByText('Huruf Kapital').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Pedoman Umum Ejaan yang Disempurnakan V' })).toHaveAttribute('href', 'https://ejaan.kemendikdasmen.go.id/');
    expect(screen.getByRole('link', { name: 'gipsterya/eyd' })).toHaveAttribute('href', 'https://github.com/gipsterya/eyd');
  });

  it('mode detail memuat markdown, menghapus frontmatter, dan menampilkan navigasi sekuens', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => '---\ntitle: Huruf Kapital\n---\n# Bab Huruf Kapital\nIsi dokumen',
    });

    renderHalaman('/ejaan/huruf-kapital');

    expect(screen.getByText('Memuat dokumen ejaan …')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Bab Huruf Kapital')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/ejaan/penggunaan-huruf/huruf-kapital.md', expect.any(Object));
    expect(screen.queryByText('title: Huruf Kapital')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tanpa Dokumen ›' })).toHaveAttribute('href', '/ejaan/tanpa-dok');
    expect(screen.queryByText(/‹/)).not.toBeInTheDocument();
    expect(document.querySelector('.ejaan-sidebar-pill-active')).toHaveTextContent('Huruf Kapital');
  });

  it('menampilkan galat saat metadata dokumen ada tetapi path dokumen kosong', async () => {
    renderHalaman('/ejaan/tanpa-dok');

    await waitFor(() => {
      expect(screen.getByText('Dokumen ejaan tidak tersedia.')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('menangani fetch gagal dan abort error sesuai cabang', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => '',
    });

    const tampilanAwal = renderHalaman('/ejaan/huruf-kapital');

    await waitFor(() => {
      expect(screen.getByText('Gagal memuat dokumen ejaan.')).toBeInTheDocument();
    });

    tampilanAwal.unmount();

    global.fetch.mockRejectedValueOnce({ name: 'AbortError' });

    renderHalaman('/ejaan/huruf-miring');

    await waitFor(() => {
      expect(screen.queryByText('Gagal memuat dokumen ejaan.')).not.toBeInTheDocument();
    });
  });

  it('slug tidak valid diarahkan kembali ke halaman daftar isi', async () => {
    renderHalaman('/ejaan/slug-tidak-ada');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Ejaan' })).toBeInTheDocument();
    });
  });

  it('panel daftar isi menandai item aktif dan membuka panel saat aktif', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      text: async () => '# Huruf Miring',
    });

    renderHalaman('/ejaan/huruf-miring');

    await waitFor(() => {
      expect(document.querySelector('.ejaan-sidebar-pill-active')).toHaveTextContent('Huruf Miring');
    });

    const current = document.querySelector('.ejaan-sidebar-pill-active');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Huruf Kapital' })).toHaveAttribute('href', '/ejaan/huruf-kapital');
  });
});
