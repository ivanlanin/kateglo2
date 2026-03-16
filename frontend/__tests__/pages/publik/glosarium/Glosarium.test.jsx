import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Glosarium, { resolveKategoriNama, resolveKategoriItem } from '../../../src/pages/publik/Glosarium';
import { resolveNamaSumberSort } from '../../../src/pages/publik/Glosarium';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../../src/api/apiPublik';

const mockUseQuery = vi.fn();
let mockParams = {};
let mockAuth = { adalahAdmin: false };

vi.mock('../../../src/api/apiPublik', () => ({
  cariGlosarium: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilGlosariumPerBidang: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilGlosariumPerSumber: vi.fn().mockResolvedValue({ data: [], total: 0 }),
  ambilDaftarBidang: vi.fn().mockResolvedValue([]),
  ambilDaftarSumber: vi.fn().mockResolvedValue([]),
}));

  it('helper resolveNamaSumberSort memprioritaskan nama lalu sumber lalu kode', () => {
    expect(resolveNamaSumberSort({ nama: ' KBBI ', sumber: 'Sumber', kode: 'k' })).toBe('KBBI');
    expect(resolveNamaSumberSort({ nama: '', sumber: ' Sumber Utama ', kode: 'k' })).toBe('Sumber Utama');
    expect(resolveNamaSumberSort({ nama: '', sumber: '', kode: ' KODE ' })).toBe('KODE');
    expect(resolveNamaSumberSort({ nama: '', sumber: '', kode: '' })).toBe('');
  });
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => mockParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args) => mockUseQuery(...args),
}));

vi.mock('../../../src/context/authContext', () => ({
  useAuthOptional: () => mockAuth,
}));

vi.mock('../../../src/components/bersama/Paginasi', () => ({
  default: ({ onNavigateCursor }) => (
    <div>
      <button type="button" aria-label="glosarium-first" onClick={() => onNavigateCursor('first')}>first</button>
      <button type="button" aria-label="glosarium-prev" onClick={() => onNavigateCursor('prev')}>prev</button>
      <button type="button" aria-label="glosarium-next" onClick={() => onNavigateCursor('next')}>next</button>
      <button type="button" aria-label="glosarium-last" onClick={() => onNavigateCursor('last')}>last</button>
    </div>
  ),
}));

describe('Glosarium', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockParams = {};
    mockAuth = { adalahAdmin: false };
    cariGlosarium.mockClear();
    ambilGlosariumPerBidang.mockClear();
    ambilGlosariumPerSumber.mockClear();
    ambilDaftarBidang.mockClear();
    ambilDaftarSumber.mockClear();
  });

  it('menampilkan browse bidang/sumber saat belum mencari', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: 'Lin', nama: 'Linguistik', slug: 'linguistik' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [{ sumber: 'kbbi', glosarium: true }], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getAllByText('Glosarium').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Linguistik' })).toHaveAttribute('href', '/glosarium/bidang/linguistik');
    expect(ambilDaftarBidang).toHaveBeenCalled();
    expect(ambilDaftarSumber).toHaveBeenCalled();
  });

  it('menampilkan hasil pencarian kata dengan format asing (indonesia)', () => {
    mockParams = { kata: 'istilah' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'istilah; data', asing: 'term' }],
          tautan_indonesia_valid: ['istilah'],
          total: 1,
          pageInfo: { hasPrev: false, hasNext: true, nextCursor: 'CUR_NEXT' },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByText(/Hasil Pencarian/i)).toBeInTheDocument();
    const linksIstilah = screen.getAllByRole('link', { name: 'istilah' });
    expect(linksIstilah.some((el) => el.getAttribute('href') === '/kamus/detail/istilah')).toBe(true);
    expect(linksIstilah.some((el) => el.getAttribute('href') === '/glosarium/detail/istilah')).toBe(true);
    expect(linksIstilah.some((el) => el.className.includes('glosarium-inline-link'))).toBe(true);
    expect(screen.queryByRole('link', { name: 'data' })).toBeNull();
    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('term')).toBeInTheDocument();
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });

    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('menampilkan hasil mode bidang', () => {
    mockParams = { bidang: 'ling' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: 'ling', nama: 'Linguistik' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'fonem', asing: 'phoneme' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Glosarium Linguistik' })).toBeInTheDocument();
    expect(ambilGlosariumPerBidang).toHaveBeenCalledWith('ling', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('mode bidang tetap memakai fallback nama dari param saat daftar tidak cocok', () => {
    mockParams = { bidang: 'tak-ada' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: 'ling', nama: '' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return { data: { data: [], total: 0 }, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Glosarium Tak-ada' })).toBeInTheDocument();
  });

  it('menampilkan hasil mode sumber', () => {
    mockParams = { sumber: 'kbbi-iv' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [{ kode: 'kbbi-iv', nama: 'KBBI IV', glosarium: true }], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'entri', asing: 'entry' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: /KBBI IV/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kbbi-iv' })).toHaveAttribute('href', '/sumber#kbbi-iv');
    expect(ambilGlosariumPerSumber).toHaveBeenCalledWith('kbbi-iv', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('tidak menampilkan blok keterangan sumber di halaman glosarium', () => {
    mockParams = { sumber: 'kbbi-iv' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') {
        return {
          data: [{ kode: 'kbbi-iv', nama: 'KBBI IV', glosarium: true, keterangan: '**Sumber resmi** untuk glosarium.' }],
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: {
          data: [{ id: 1, indonesia: 'entri', asing: 'entry' }],
          total: 1,
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: /KBBI IV/ })).toBeInTheDocument();
    expect(screen.queryByText('Sumber resmi', { selector: 'strong' })).not.toBeInTheDocument();
    expect(document.querySelector('.glosarium-keterangan-sumber')).not.toBeInTheDocument();
  });

  it('browse tanpa daftar bidang/sumber tidak menampilkan kartu kategori', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.queryByText('Bidang')).not.toBeInTheDocument();
    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
  });

  it('browse memfilter sumber glosarium=true dan mengurutkan nama sumber secara alfabetis', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') {
        return {
          data: [
            { id: 1, nama: 'Zulu', glosarium: true, slug: 'zulu' },
            { id: 2, nama: 'Alpha', glosarium: true, slug: 'alpha' },
            { id: 3, nama: 'Bukan Glosarium', glosarium: false, slug: 'bukan' },
          ],
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    const tautanSumber = Array.from(document.querySelectorAll('a[href^="/glosarium/sumber/"]')).map((el) => el.textContent);
    expect(tautanSumber).toEqual(['Alpha', 'Zulu']);
    expect(screen.queryByRole('link', { name: 'Bukan Glosarium' })).not.toBeInTheDocument();
  });

  it('browse aman saat daftar sumber undefined dan fallback label dari sumber/kode tetap terurut', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') {
        return {
          data: [
            { id: 1, nama: '', sumber: 'Zulu Source', kode: 'z', slug: 'zulu-source', glosarium: true },
            { id: 2, nama: '', sumber: '', kode: 'AlphaCode', slug: 'alpha-code', glosarium: true },
            { id: 3, nama: '', sumber: '', kode: '', glosarium: true },
          ],
          isLoading: false,
          isError: false,
        };
      }
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    const hrefSumber = Array.from(document.querySelectorAll('a[href^="/glosarium/sumber/"]')).map((el) => el.getAttribute('href'));
    expect(hrefSumber).toEqual(expect.arrayContaining(['/glosarium/sumber/alpha-code', '/glosarium/sumber/zulu-source']));
  });

  it('browse tetap aman saat query daftar sumber mengembalikan undefined', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: undefined, isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.queryByText('Sumber')).not.toBeInTheDocument();
  });

  it('browse memakai fallback item.nama saat kode/bidang/sumber kosong dan resolve nama dari key alternatif', () => {
    mockParams = { bidang: 'kimia', sumber: 'kbbi' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') {
        return { data: [{ kode: 'kimia', bidang: '', nama: '' }], isLoading: false, isError: false };
      }
      if (key === 'glosarium-sumber') {
        return { data: [{ kode: '', sumber: 'kbbi', nama: '' }], isLoading: false, isError: false };
      }
      return { data: { data: [], total: 0, pageInfo: { hasPrev: false, hasNext: false } }, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByRole('heading', { name: 'Glosarium Kimia' })).toBeInTheDocument();

    mockParams = {};
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ nama: 'Kesehatan' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [{ nama: 'WHO', glosarium: true }], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    render(<Glosarium />);

    expect(screen.getByRole('link', { name: 'Kesehatan' })).toHaveAttribute('href', '/glosarium/bidang/kesehatan');
    expect(screen.getByRole('link', { name: 'WHO' })).toHaveAttribute('href', '/glosarium/sumber/who');
  });

  it('menampilkan tautan edit redaksi saat admin dan data entri lengkap', () => {
    mockParams = { kata: 'istilah' };
    mockAuth = { adalahAdmin: true };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 99, indonesia: 'istilah', asing: 'term' }],
          total: 1,
          pageInfo: { hasPrev: false, hasNext: false },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    const editLinks = screen.getAllByRole('link').filter((el) => el.getAttribute('href') === '/redaksi/glosarium/99');
    expect(editLinks).toHaveLength(1);
  });

  it('hasil kata tanpa indonesia tidak menampilkan pemisah titik dua', () => {
    mockParams = { kata: 'istilah' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 100, indonesia: '', asing: 'alpha term' }],
          total: 1,
          pageInfo: { hasPrev: false, hasNext: false },
        },
        isLoading: false,
        isError: false,
      };
    });

    const { container } = render(<Glosarium />);

    expect(screen.getByRole('link', { name: 'alpha term' })).toHaveAttribute('href', '/glosarium/detail/alpha%20term');
    expect(container.textContent).not.toContain('alpha term:');
  });

  it('menampilkan state kosong, loading, dan error', () => {
    mockParams = { kata: 'kosong' };
    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: { data: [], total: 0 }, isLoading: false, isError: false });

    const { rerender } = render(<Glosarium />);
  expect(screen.getByText(/Tidak ada entri glosarium sama persis yang ditemukan/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'entri yang mirip' })).toHaveAttribute('href', '/glosarium/detail/kosong');

    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false });

    rerender(<Glosarium />);
    expect(screen.getByText(/Mencari data/i)).toBeInTheDocument();

    mockUseQuery
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true });

    rerender(<Glosarium />);
    expect(screen.getByText(/Gagal mengambil data/i)).toBeInTheDocument();
  });

  it('navigasi cursor first/last/next/prev memperbarui opsi query', () => {
    mockParams = { kata: 'istilah' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'istilah', asing: 'term' }],
          total: 230,
          pageInfo: { hasPrev: true, hasNext: true, nextCursor: 'NEXT_CUR', prevCursor: 'PREV_CUR' },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);

    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-next' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-prev' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-last' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-first' })[0]);

    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: 'NEXT_CUR',
      direction: 'next',
      lastPage: false,
    });
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: 'PREV_CUR',
      direction: 'prev',
      lastPage: false,
    });
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: 'NEXT_CUR',
      direction: 'next',
      lastPage: true,
    });
    expect(cariGlosarium).toHaveBeenCalledWith('istilah', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
  });

  it('aksi last tetap valid saat total 0 (fallback targetPage ke 1)', () => {
    mockParams = { kata: 'nol' };

    mockUseQuery.mockImplementation((options) => {
      if (options?.enabled !== false && options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return {
        data: {
          data: [{ id: 1, indonesia: 'nol', asing: null }],
          total: 0,
          pageInfo: { hasPrev: false, hasNext: false },
        },
        isLoading: false,
        isError: false,
      };
    });

    render(<Glosarium />);
    fireEvent.click(screen.getAllByRole('button', { name: 'glosarium-last' })[0]);

    expect(cariGlosarium).toHaveBeenCalledWith('nol', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: true,
    });
  });

  it('helper resolveKategoriNama menutup cabang match dan fallback', () => {
    expect(resolveKategoriNama()).toBe('');
    expect(resolveKategoriNama('', [{ kode: 'x', nama: 'X' }], ['nama'], ['kode'])).toBe('');
    expect(resolveKategoriNama('x', null, ['nama'], ['kode'])).toBe('x');
    expect(resolveKategoriNama('x', [], ['nama'], ['kode'])).toBe('x');
    expect(resolveKategoriNama('abc', [{ kode: 'def', nama: 'Nama' }], ['nama'], ['kode'])).toBe('abc');
    expect(resolveKategoriNama('kim', [{ kode: 'kim', nama: '' }], ['nama', 'bidang'], ['kode'])).toBe('kim');
    expect(resolveKategoriNama('kim', [{ kode: 'kim', nama: 'Kimia' }], ['nama'], ['kode'])).toBe('Kimia');
    expect(resolveKategoriNama('farmasi-dan-farmakologi', [{ kode: 'Far', nama: 'Farmasi dan Farmakologi', slug: 'farmasi-dan-farmakologi' }], ['nama'], ['kode', 'slug'])).toBe('Farmasi dan Farmakologi');
  });

  it('helper resolveKategoriItem menutup cabang validasi list/keys dan fallback null', () => {
    expect(resolveKategoriItem('', [], ['nama'], ['kode'])).toBeNull();
    expect(resolveKategoriItem('kimia', null, ['nama'], ['kode'])).toBeNull();
    expect(resolveKategoriItem('kimia', [], ['nama'], ['kode'])).toBeNull();

    const list = [{ kode: 'kim', nama: 'Kimia', slug: 'kimia' }, { kode: 'bio', nama: 'Biologi' }];
    expect(resolveKategoriItem('kimia', list, ['nama'], ['kode'])).toEqual({ kode: 'kim', nama: 'Kimia', slug: 'kimia' });
    expect(resolveKategoriItem('kimia', list, ['nama'], ['kode', 'slug'])).toEqual({ kode: 'kim', nama: 'Kimia', slug: 'kimia' });
    expect(resolveKategoriItem('kimia', list, null, null)).toBeNull();
  });

  it('browse tetap merender link saat label bidang kosong total', () => {
    mockUseQuery.mockImplementation((options) => {
      if (options?.queryFn) options.queryFn();
      const key = options?.queryKey?.[0];
      if (key === 'glosarium-bidang') return { data: [{ kode: '', bidang: '', nama: '' }], isLoading: false, isError: false };
      if (key === 'glosarium-sumber') return { data: [], isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });

    const { container } = render(<Glosarium />);
    expect(container.querySelector('a[href="/glosarium/bidang/"]')).toBeInTheDocument();
  });
});
