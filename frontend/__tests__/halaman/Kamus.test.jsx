import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Kamus from '../../src/halaman/Kamus';

const mockUseQuery = vi.fn();
let mockParams = {};

vi.mock('../../src/api/apiPublik', () => ({
  cariKamus: vi.fn().mockResolvedValue({ data: [] }),
  ambilKategoriKamus: vi.fn().mockResolvedValue({}),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

describe('Kamus', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockParams = {};
  });

  it('menampilkan browse kategori saat tidak ada pencarian', () => {
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'kamus-kategori') {
        return {
          data: { abjad: [{ kode: 'A', nama: 'A' }], jenis: [{ kode: 'dasar', nama: 'dasar' }] },
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });
    render(<Kamus />);
    expect(screen.getByText('Abjad')).toBeInTheDocument();
    expect(screen.getByText('Jenis')).toBeInTheDocument();
  });

  it('menampilkan hasil pencarian dan preview makna', () => {
    mockParams = { kata: 'kata' };
    mockUseQuery.mockReturnValue({
      data: { data: [{ id: 1, lema: 'kata', jenis: 'dasar', preview_kelas_kata: 'n', preview_makna: 'unsur bahasa' }] },
      isLoading: false,
      isError: false,
    });
    render(<Kamus />);
    expect(screen.getByText(/Hasil pencarian/i)).toBeInTheDocument();
    expect(screen.getByText('unsur bahasa')).toBeInTheDocument();
  });

  it('menampilkan pesan kosong saat tidak ditemukan', () => {
    mockParams = { kata: 'zzz' };
    mockUseQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    });
    render(<Kamus />);
    expect(screen.getByText(/Lema yang dicari tidak ditemukan/i)).toBeInTheDocument();
  });

  it('menampilkan tag rujukan', () => {
    mockParams = { kata: 'aktip' };
    mockUseQuery.mockReturnValue({
      data: { data: [{ id: 2, lema: 'aktip', jenis: 'dasar', jenis_rujuk: 'rujuk', lema_rujuk: 'aktif' }] },
      isLoading: false,
      isError: false,
    });
    render(<Kamus />);
    expect(screen.getByText('→ aktif')).toBeInTheDocument();
  });

  it('menampilkan pesan error', () => {
    mockParams = { kata: 'zzz' };
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<Kamus />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });
});
