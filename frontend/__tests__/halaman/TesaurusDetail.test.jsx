import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TesaurusDetail from '../../src/halaman/TesaurusDetail';
import { ambilDetailTesaurus } from '../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = { kata: 'kata' };

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../src/api/apiPublik', () => ({
  ambilDetailTesaurus: vi.fn().mockResolvedValue(null),
}));

describe('TesaurusDetail', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    ambilDetailTesaurus.mockClear();
    mockParams = { kata: 'kata' };
    document.title = 'Awal';
  });

  it('menampilkan loading state', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return { data: null, isLoading: true, isError: false };
    });

    render(<TesaurusDetail />);
    expect(screen.getByText(/Memuat detail/i)).toBeInTheDocument();
    expect(document.title).toContain('kata — Tesaurus — Kateglo');
    expect(ambilDetailTesaurus).toHaveBeenCalledWith('kata');
  });

  it('menampilkan state error saat data tidak ada', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return { data: null, isLoading: false, isError: true };
    });

    render(<TesaurusDetail />);
    expect(screen.getByText(/Entri tesaurus tidak ditemukan/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Kembali ke pencarian/i })).toHaveAttribute('href', '/tesaurus');
  });

  it('menampilkan detail sinonim/antonim dan menyembunyikan daftar kosong', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      return {
        data: {
          lema: 'kata',
          sinonim: ['diksi', 'term'],
          antonim: ['diam'],
          turunan: [],
          gabungan: ['kata kerja'],
          berkaitan: [],
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<TesaurusDetail />);

    expect(screen.getByRole('heading', { name: 'kata' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lihat di Kamus/i })).toHaveAttribute('href', '/kamus/detail/kata');
    expect(screen.getByText('Sinonim')).toBeInTheDocument();
    expect(screen.getByText('Antonim')).toBeInTheDocument();
    expect(screen.getByText('Gabungan')).toBeInTheDocument();
    expect(screen.queryByText('Turunan')).not.toBeInTheDocument();
    expect(screen.queryByText('Berkaitan')).not.toBeInTheDocument();
    expect(screen.getAllByText(';').length).toBeGreaterThan(0);
  });

  it('mengatur judul default saat parameter kata tidak ada', () => {
    mockParams = {};
    mockUseQuery.mockReturnValue({ data: null, isLoading: false, isError: true });

    render(<TesaurusDetail />);
    expect(document.title).toBe('Tesaurus — Kateglo');
  });
});