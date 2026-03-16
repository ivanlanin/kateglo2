import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PencarianHitamAdmin, { formatTanggalSingkat } from '../../../src/pages/redaksi/PencarianHitamAdmin';
import { formatLocalDateTime } from '../../../src/utils/formatUtils';

const mockUseDaftarPencarianHitamAdmin = vi.fn();
const mockUseSimpanPencarianHitamAdmin = vi.fn();
const mockUseHapusPencarianHitamAdmin = vi.fn();
const mutateSimpanHitam = vi.fn();
const mutateHapusHitam = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarPencarianHitamAdmin: (...args) => mockUseDaftarPencarianHitamAdmin(...args),
  useSimpanPencarianHitamAdmin: (...args) => mockUseSimpanPencarianHitamAdmin(...args),
  useHapusPencarianHitamAdmin: (...args) => mockUseHapusPencarianHitamAdmin(...args),
}));

vi.mock('../../../src/components/redaksi/HalamanAdmin', () => ({
  default: ({ children, judul, aksiJudul }) => (
    <div>
      <h1>{judul}</h1>
      {aksiJudul}
      {children}
    </div>
  ),
}));

vi.mock('../../../src/components/redaksi/PanelGeser', () => ({
  default: ({ buka, judul, children, onTutup }) => (buka ? (
    <div aria-label={judul} role="dialog">
      <button type="button" onClick={onTutup}>Tutup panel</button>
      {children}
    </div>
  ) : null),
}));

describe('PencarianHitamAdmin', () => {
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
    expect(formatTanggalSingkat('bukan-tanggal')).toBe('—');
  });

  it('menampilkan fallback daftar hitam saat respons belum memuat data', () => {
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Daftar Hitam Pencarian')).toBeInTheDocument();
    expect(screen.getAllByText('Tidak ada data.').length).toBeGreaterThan(0);
  });

  it('mengelola daftar hitam: cari, reset, simpan, sunting, dan hapus', () => {
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
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari kata daftar hitam …'), { target: { value: 'spam' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    fireEvent.click(screen.getByRole('button', { name: '✕' }));

    fireEvent.click(screen.getByRole('button', { name: '+ Tambah Kata' }));
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
    expect(screen.queryByRole('dialog', { name: 'Sunting Kata Daftar Hitam' })).not.toBeInTheDocument();
  });

  it('menutup guard konfirmasi hapus saat dibatalkan', () => {
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
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('promo'));

    global.confirm = vi.fn(() => false);
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(global.confirm).toHaveBeenCalled();
    expect(mutateHapusHitam).not.toHaveBeenCalled();
  });

  it('menutup fallback kolom daftar hitam dan guard hapus', () => {
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
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

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

  it('menjalankan aksi tambah, perubahan filter status, dan tombol batal form', () => {
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
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Cari kata daftar hitam …'), { target: { value: 'uji' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Tambah Kata' }));
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));

    expect(screen.queryByLabelText('Kata*')).not.toBeInTheDocument();
  });

  it('membersihkan timeout sukses saat unmount dan memakai fallback error hapus default', async () => {
    vi.useFakeTimers();
    mockUseDaftarPencarianHitamAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        pageInfo: {},
        data: [{ id: 2, kata: 'bising', aktif: 1, catatan: '', updated_at: '2026-03-01 10:00:00' }],
      },
    });
    mutateSimpanHitam.mockImplementationOnce((_data, opts) => opts.onSuccess?.());

    const view = render(
      <MemoryRouter>
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Tambah Kata' }));
    fireEvent.change(screen.getByLabelText('Kata*'), { target: { value: 'bising' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    view.unmount();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    render(
      <MemoryRouter>
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('bising'));
    mutateHapusHitam.mockImplementationOnce((_id, opts) => opts.onError?.());
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(screen.getByText('Gagal menghapus kata daftar hitam')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('membersihkan timeout simpan saat komponen di-unmount sebelum timer selesai', () => {
    vi.useFakeTimers();
    mutateSimpanHitam.mockImplementationOnce((_data, opts) => opts.onSuccess?.());

    const view = render(
      <MemoryRouter>
        <PencarianHitamAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Tambah Kata' }));
    fireEvent.change(screen.getByLabelText('Kata*'), { target: { value: 'uji' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

    view.unmount();
    expect(() => vi.runAllTimers()).not.toThrow();
    vi.useRealTimers();
  });
});