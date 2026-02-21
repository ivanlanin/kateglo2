import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Tesaurus from '../../../src/halaman/publik/Tesaurus';
import { ambilContohTesaurus, cariTesaurus } from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = {};

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/api/apiPublik', () => ({
  cariTesaurus: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilContohTesaurus: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onNavigateCursor }) => (
    <div>
      <button type="button" aria-label="tesaurus-first" onClick={() => onNavigateCursor('first')}>first</button>
      <button type="button" aria-label="tesaurus-prev" onClick={() => onNavigateCursor('prev')}>prev</button>
      <button type="button" aria-label="tesaurus-next" onClick={() => onNavigateCursor('next')}>next</button>
      <button type="button" aria-label="tesaurus-last" onClick={() => onNavigateCursor('last')}>last</button>
    </div>
  ),
}));

describe('Tesaurus.test.jsx', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    cariTesaurus.mockClear();
    ambilContohTesaurus.mockClear();
    mockParams = {};
  });

  it('menampilkan state default saat tanpa kata', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryKey?.[0] === 'tesaurus-contoh') {
        return { data: { data: ['aktif', 'besar', 'indah'] }, isLoading: false, isError: false };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Tesaurus />);

    expect(screen.getByRole('heading', { name: 'Tesaurus' })).toBeInTheDocument();
    expect(screen.getByText(/Gunakan kolom pencarian di atas untuk mencari sinonim, antonim, dan relasi kata/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'aktif' })).toHaveAttribute('href', '/tesaurus/cari/aktif');
    expect(screen.getByRole('link', { name: 'besar' })).toHaveAttribute('href', '/tesaurus/cari/besar');
    expect(screen.getByRole('link', { name: 'indah' })).toHaveAttribute('href', '/tesaurus/cari/indah');
  });

  it('menampilkan loading dan error untuk mode pencarian', () => {
    mockParams = { kata: 'kata' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return { data: undefined, isLoading: true, isError: false };
    });

    const { rerender } = render(<Tesaurus />);
    expect(screen.getByText(/Mencari data/i)).toBeInTheDocument();
    expect(cariTesaurus).toHaveBeenCalledWith('kata', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return { data: undefined, isLoading: false, isError: true };
    });
    rerender(<Tesaurus />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });

  it('menampilkan empty result', () => {
    mockParams = { kata: 'zzz' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: { data: [], total: 0 },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);
    expect(screen.getByText(/Kata tidak ditemukan di tesaurus/i)).toBeInTheDocument();
  });

  it('mengarahkan tautan ke kamus detail dan menampilkan relasi dengan simbol', () => {
    mockParams = { kata: 'anak%20ibu' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            {
              id: 1,
              indeks: 'anak ibu',
              sinonim: 's1;s2;s3;s4',
              antonim: 'a1;a2',
            },
          ],
          total: 120,
          pageInfo: { hasPrev: false, hasNext: true, nextCursor: 'CUR_NEXT' },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByRole('heading', { name: /Hasil Pencarian ["“]anak ibu["”] di Tesaurus/i })).toBeInTheDocument();

    // Tautan mengarah ke kamus detail, bukan tesaurus detail
    expect(screen.getByRole('link', { name: 'anak ibu' })).toHaveAttribute('href', '/kamus/detail/anak%20ibu');

    // Sinonim diringkas maks 2, badge ≈ terpisah dari teks
    expect(screen.getByText('≈')).toBeInTheDocument();
    expect(screen.getByText(/s1; s2; …/)).toBeInTheDocument();
    // Antonim tetap tampil terpisah dengan badge ≠
    expect(screen.getByText('≠')).toBeInTheDocument();
    expect(screen.getByText(/a1; a2/)).toBeInTheDocument();

    const tombolEkspansi = screen.getByRole('button', { name: '»' });
    expect(tombolEkspansi).toHaveAttribute('aria-expanded', 'false');

    // Klik untuk ekspansi — tampilkan semua
    fireEvent.click(tombolEkspansi);
    expect(tombolEkspansi).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/s1; s2; s3; s4/)).toBeInTheDocument();

    // Klik lagi untuk ciutkan
    fireEvent.click(tombolEkspansi);
    expect(tombolEkspansi).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getAllByRole('button', { name: 'tesaurus-next' })[0]);
    expect(cariTesaurus).toHaveBeenCalledWith('anak%20ibu', {
      limit: 100,
      cursor: 'CUR_NEXT',
      direction: 'next',
      lastPage: false,
    });
  });

  it('navigasi cursor first/last/next/prev memperbarui opsi query tesaurus', () => {
    mockParams = { kata: 'aktif' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [{ id: 10, indeks: 'aktif', sinonim: 'giat', antonim: 'pasif' }],
          total: 230,
          pageInfo: { hasPrev: true, hasNext: true, nextCursor: 'CUR_NEXT', prevCursor: 'CUR_PREV' },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    fireEvent.click(screen.getAllByRole('button', { name: 'tesaurus-next' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'tesaurus-prev' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'tesaurus-last' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'tesaurus-first' })[0]);

    expect(cariTesaurus).toHaveBeenCalledWith('aktif', {
      limit: 100,
      cursor: 'CUR_NEXT',
      direction: 'next',
      lastPage: false,
    });
    expect(cariTesaurus).toHaveBeenCalledWith('aktif', {
      limit: 100,
      cursor: 'CUR_PREV',
      direction: 'prev',
      lastPage: false,
    });
    expect(cariTesaurus).toHaveBeenCalledWith('aktif', {
      limit: 100,
      cursor: 'CUR_NEXT',
      direction: 'next',
      lastPage: true,
    });
    expect(cariTesaurus).toHaveBeenCalledWith('aktif', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('aksi last tetap valid saat total 0', () => {
    mockParams = { kata: 'nol' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [{ id: 1, indeks: 'nol', sinonim: null, antonim: null }],
          total: 0,
          pageInfo: { hasPrev: false, hasNext: false },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);
    fireEvent.click(screen.getAllByRole('button', { name: 'tesaurus-last' })[0]);

    expect(cariTesaurus).toHaveBeenCalledWith('nol', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
    });
  });

  it('menampilkan hanya antonim jika sinonim kosong', () => {
    mockParams = { kata: 'besar' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            { id: 2, indeks: 'besar', sinonim: null, antonim: 'kecil;mungil' },
          ],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByText('≠')).toBeInTheDocument();
    expect(screen.getByText(/kecil; mungil/)).toBeInTheDocument();
    expect(screen.queryByText('≈')).not.toBeInTheDocument();
  });

  it('tidak menampilkan relasi saat sinonim dan antonim kosong', () => {
    mockParams = { kata: 'hampa' };
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          data: [
            { id: 3, indeks: 'hampa', sinonim: ' ; ', antonim: '' },
          ],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Tesaurus />);

    expect(screen.getByRole('link', { name: 'hampa' })).toHaveAttribute('href', '/kamus/detail/hampa');
    expect(screen.queryByText('≈')).not.toBeInTheDocument();
    expect(screen.queryByText('≠')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '»' })).not.toBeInTheDocument();
  });
});
