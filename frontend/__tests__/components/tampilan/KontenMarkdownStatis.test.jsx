import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import KontenMarkdownStatis, { hapusFrontmatter } from '../../../src/components/tampilan/KontenMarkdownStatis';

describe('KontenMarkdownStatis', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('menghapus frontmatter dan merender markdown dengan class serta komponen custom', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('---\ntitle: Halo\n---\n# Judul\n\n**isi**'),
    });

    render(
      <KontenMarkdownStatis
        src="/docs/halaman.md"
        className="markdown-kustom"
        components={{ strong: ({ children }) => <mark>{children}</mark> }}
      />
    );

    expect(screen.getByText('Memuat dokumen …')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Judul')).toBeInTheDocument();
    });

    expect(screen.getByText('isi').tagName).toBe('MARK');
    expect(document.querySelector('.markdown-kustom')).not.toBeNull();
    expect(screen.queryByText('title: Halo')).not.toBeInTheDocument();
  });

  it('menampilkan galat saat src kosong atau fetch gagal', async () => {
    const viewKosong = render(<KontenMarkdownStatis src="" errorText="Dokumen hilang." />);
    expect(screen.getByText('Dokumen hilang.')).toBeInTheDocument();
    viewKosong.unmount();

    global.fetch.mockResolvedValue({ ok: false, text: vi.fn() });
    render(<KontenMarkdownStatis src="/docs/gagal.md" errorText="Gagal custom." />);

    await waitFor(() => {
      expect(screen.getByText('Gagal custom.')).toBeInTheDocument();
    });
  });

  it('mengabaikan AbortError tanpa menampilkan galat', async () => {
    global.fetch.mockRejectedValue({ name: 'AbortError' });

    render(<KontenMarkdownStatis src="/docs/abort.md" />);

    await waitFor(() => {
      expect(screen.queryByText('Memuat dokumen …')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Gagal memuat dokumen.')).not.toBeInTheDocument();
  });

  it('helper hapusFrontmatter menangani input kosong dan biasa', () => {
    expect(hapusFrontmatter()).toBe('');
    expect(hapusFrontmatter('# Isi')).toBe('# Isi');
    expect(hapusFrontmatter('---\nfoo: bar\n---\n# Isi')).toBe('# Isi');
  });
});