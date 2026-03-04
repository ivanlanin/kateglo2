import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PencarianAdmin, { formatTanggalSingkat } from '../../../src/halaman/redaksi/PencarianAdmin';
import { formatLocalDateTime } from '../../../src/utils/formatUtils';

const mockUseStatistikPencarianAdmin = vi.fn();
const mockUseDaftarPencarianHitamAdmin = vi.fn();
const mockUseSimpanPencarianHitamAdmin = vi.fn();
const mockUseHapusPencarianHitamAdmin = vi.fn();
const mutateSimpanHitam = vi.fn();
const mutateHapusHitam = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useStatistikPencarianAdmin: (...args) => mockUseStatistikPencarianAdmin(...args),
  useDaftarPencarianHitamAdmin: (...args) => mockUseDaftarPencarianHitamAdmin(...args),
  useSimpanPencarianHitamAdmin: (...args) => mockUseSimpanPencarianHitamAdmin(...args),
  useHapusPencarianHitamAdmin: (...args) => mockUseHapusPencarianHitamAdmin(...args),
}));

vi.mock('../../../src/komponen/bersama/TataLetak', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('PencarianAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [], total: 0, pageInfo: {} },
    });
    mockUseSimpanPencarianHitamAdmin.mockReturnValue({
      mutate: mutateSimpanHitam,
      isPending: false,
    });
    mockUseHapusPencarianHitamAdmin.mockReturnValue({
      mutate: mutateHapusHitam,
      isPending: false,
    });
    global.confirm = vi.fn(() => true);
  });

  it('helper formatTanggalSingkat memakai format dd mmm yyyy', () => {
    expect(formatTanggalSingkat('2026-03-01')).toBe(formatLocalDateTime('2026-03-01', { fallback: '—', separator: ', ' }));
    expect(formatTanggalSingkat('2026-03-01T10:20:00Z')).toBe(formatLocalDateTime('2026-03-01T10:20:00Z', { fallback: '—', separator: ', ' }));
    expect(formatTanggalSingkat('2026-03-01 10:20:00')).toBe(formatLocalDateTime('2026-03-01 10:20:00', { fallback: '—', separator: ', ' }));
    expect(formatTanggalSingkat('bukan-tanggal')).toBe('—');
    expect(formatTanggalSingkat('')).toBe('—');
  });

  it('menampilkan loading state', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: true,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Pencarian')).toBeInTheDocument();
    expect(screen.getAllByText('Memuat data …').length).toBeGreaterThanOrEqual(1);
  });

  it('menampilkan ringkasan dan tabel saat data tersedia', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        ringkasanDomain: [{ domain: 1, domain_nama: 'kamus', jumlah: 123 }],
        data: [
          {
            domain: 1,
            domain_nama: 'kamus',
            kata: 'air',
            jumlah: 50,
            tanggal_awal: '2026-02-20 08:15:00',
            tanggal_akhir: '2026-02-28 23:30:00',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('air')).toBeInTheDocument();
    expect(screen.queryByText(formatLocalDateTime('2026-03-01', { fallback: '—', separator: ', ' }))).not.toBeInTheDocument();
    expect(screen.getByText(formatLocalDateTime('2026-02-20 08:15:00', { fallback: '—', separator: ', ' }))).toBeInTheDocument();
    expect(screen.getByText(formatLocalDateTime('2026-02-28 23:30:00', { fallback: '—', separator: ', ' }))).toBeInTheDocument();
  });

  it('menampilkan state error saat query gagal', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: true,
      data: { ringkasanDomain: [], data: [] },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Gagal memuat statistik pencarian.')).toBeInTheDocument();
  });

  it('menampilkan fallback kosong saat data undefined', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Belum ada data.')).toBeInTheDocument();
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('menampilkan jumlah fallback 0 untuk ringkasan dan tabel', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        ringkasanDomain: [{ domain: 1, domain_nama: 'kamus', jumlah: 0 }],
        data: [
          {
            domain: 1,
            domain_nama: 'kamus',
            kata: 'nol',
            jumlah: 0,
            tanggal_awal: '2026-02-20',
            tanggal_akhir: '2026-02-20',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
  });

  it('menerapkan filter saat submit dan reset ke default', () => {
    mockUseStatistikPencarianAdmin
      .mockReturnValueOnce({ isLoading: false, isError: false, data: { ringkasanDomain: [], data: [] } })
      .mockReturnValue({ isLoading: false, isError: false, data: { ringkasanDomain: [], data: [] } });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Domain'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Periode'), { target: { value: '30hari' } });
    fireEvent.change(screen.getByLabelText('Tanggal Mulai'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('Tanggal Selesai'), { target: { value: '2026-02-28' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Terapkan' }).closest('form'));

    const lastCallAfterSubmit = mockUseStatistikPencarianAdmin.mock.calls.at(-1)?.[0];
    expect(lastCallAfterSubmit).toEqual(expect.objectContaining({
      domain: '3',
      periode: '30hari',
      limit: 200,
      tanggalMulai: '2026-02-01',
      tanggalSelesai: '2026-02-28',
      cursor: null,
      direction: 'next',
      lastPage: false,
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    const lastCallAfterReset = mockUseStatistikPencarianAdmin.mock.calls.at(-1)?.[0];
    expect(lastCallAfterReset).toEqual(expect.objectContaining({
      domain: '',
      periode: '7hari',
      limit: 200,
      tanggalMulai: '',
      tanggalSelesai: '',
      cursor: null,
      direction: 'next',
      lastPage: false,
    }));
  });

  it('membuka panel daftar hitam dari tombol aksi', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    expect(screen.getByText('Daftar Hitam Pencarian')).toBeInTheDocument();
  });

  it('menutup cabang badge diblokir/normal dan fallback domain-kata', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        ringkasanDomain: [],
        data: [
          { domain: 1, domain_nama: '', kata: '', diblokir: true, jumlah: 0, tanggal_awal: null, tanggal_akhir: null },
          { domain: 2, domain_nama: 'tesaurus', kata: 'air', diblokir: false, jumlah: 1, tanggal_awal: null, tanggal_akhir: null },
        ],
      },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Diblokir')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('mengelola panel daftar hitam: cari, reset, simpan, sunting, dan hapus', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        pageInfo: {},
        data: [{ id: 7, kata: 'spam', aktif: 1, catatan: 'uji', updated_at: '2026-03-01 10:00:00' }],
      },
    });
    mutateSimpanHitam
      .mockImplementationOnce((_data, opts) => opts.onError?.({ response: { data: { message: 'Err simpan hitam' } } }))
      .mockImplementationOnce((_data, opts) => opts.onSuccess?.());
    mutateHapusHitam
      .mockImplementationOnce((_id, opts) => opts.onError?.({ response: { data: { message: 'Err hapus hitam' } } }))
      .mockImplementationOnce((_id, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tutup panel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    fireEvent.change(screen.getByPlaceholderText('Cari kata daftar hitam …'), { target: { value: 'spam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    fireEvent.click(screen.getAllByRole('button', { name: 'Reset' }).at(-1));

    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(screen.getByText('Kata wajib diisi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Kata*'), { target: { value: 'promo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(screen.getByText('Err simpan hitam')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(screen.getByText('Tersimpan!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('spam'));
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(screen.getByText('Err hapus hitam')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(screen.getByText('Berhasil dihapus.')).toBeInTheDocument();
  });

  it('menutup guard konfirmasi hapus saat dibatalkan', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        pageInfo: {},
        data: [{ id: 99, kata: 'promo', aktif: 1, catatan: '', updated_at: '2026-03-01 10:00:00' }],
      },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    fireEvent.click(screen.getByText('promo'));

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(global.confirm).toHaveBeenCalled();
    expect(mutateHapusHitam).not.toHaveBeenCalled();
  });

  it('menutup fallback kolom daftar hitam dan guard hapus', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        pageInfo: {},
        data: [{ id: null, kata: '', aktif: 0, catatan: '', updated_at: '' }],
      },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    expect(screen.getByRole('cell', { name: 'Nonaktif' })).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('cell', { name: 'Nonaktif' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(mutateHapusHitam).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Kata*'), { target: { value: 'spam' } });
    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(mutateHapusHitam).not.toHaveBeenCalled();
  });

  it('menutup fallback daftar hitam saat respons belum memuat data', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    expect(screen.getAllByText('Tidak ada data.').length).toBeGreaterThan(0);
  });

  it('menjalankan aksi +Tambah Kata, perubahan filter status panel, dan tombol Batal form', () => {
    mockUseStatistikPencarianAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { ringkasanDomain: [], data: [] },
    });
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        pageInfo: {},
        data: [{ id: 4, kata: 'uji', aktif: 1, catatan: '', updated_at: '2026-03-01 10:00:00' }],
      },
    });

    render(
      <MemoryRouter>
        <PencarianAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Hitam' }));
    fireEvent.change(screen.getByPlaceholderText('Cari kata daftar hitam …'), { target: { value: 'uji' } });
    fireEvent.change(screen.getAllByRole('combobox').at(-1), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Tambah Kata' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));

    expect(screen.getByLabelText('Kata*')).toHaveValue('');
  });
});
