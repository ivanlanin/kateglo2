import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuditTagarAdmin from '../../../src/pages/redaksi/AuditTagarAdmin';

const mockUseDaftarAuditTagarAdmin = vi.fn();
const mockUseDaftarTagarUntukPilih = vi.fn();
const mockUseOpsiLabelRedaksi = vi.fn();
const mockUseTagarEntri = vi.fn();
const mutateSimpanTagarEntri = vi.fn();
let simpanTagarState = { mutate: mutateSimpanTagarEntri, isError: false };

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarAuditTagarAdmin: (...args) => mockUseDaftarAuditTagarAdmin(...args),
  useDaftarTagarUntukPilih: (...args) => mockUseDaftarTagarUntukPilih(...args),
  useOpsiLabelRedaksi: (...args) => mockUseOpsiLabelRedaksi(...args),
  useTagarEntri: (...args) => mockUseTagarEntri(...args),
  useSimpanTagarEntri: () => simpanTagarState,
}));

vi.mock('../../../src/components/redaksi/HalamanAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('AuditTagarAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simpanTagarState = { mutate: mutateSimpanTagarEntri, isError: false };
    mockUseOpsiLabelRedaksi.mockReturnValue({
      data: { data: { 'bentuk-kata': [{ kode: 'dasar', nama: 'Dasar' }, { kode: 'turunan', nama: 'Turunan' }] } },
    });
    mockUseDaftarTagarUntukPilih.mockReturnValue({
      data: {
        data: [
          { id: 1, kode: 'me', nama: 'prefiks me', kategori: 'prefiks' },
          { id: 2, kode: 'an', nama: 'sufiks -an', kategori: 'sufiks' },
        ],
      },
    });
    mockUseDaftarAuditTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          {
            id: 10,
            entri: 'membaca',
            indeks: 'membaca',
            jenis: 'turunan',
            induk_entri: 'baca',
            tagar: [{ id: 1, nama: 'prefiks me', kategori: 'prefiks' }],
          },
        ],
      },
    });
    mockUseTagarEntri.mockReturnValue({ data: { data: [{ id: 1, nama: 'prefiks me', kategori: 'prefiks' }] } });
  });

  it('menampilkan daftar audit, menerapkan filter, dan reset', () => {
    render(
      <MemoryRouter>
        <AuditTagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Audit Tagar')).toBeInTheDocument();
    expect(screen.getByText('membaca')).toBeInTheDocument();
    expect(screen.getAllByText('prefiks me').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Cari entri atau induk …'), { target: { value: 'baca' } });
    fireEvent.change(screen.getByLabelText('Filter jenis entri'), { target: { value: 'dasar' } });
    fireEvent.change(screen.getByLabelText('Filter status tagar'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Filter tagar'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cari' }));

    fireEvent.click(screen.getByRole('link', { name: 'Buka detail kamus membaca' }));
    fireEvent.click(screen.getByRole('link', { name: 'Buka detail kamus baca' }));
    expect(screen.queryByText('Tagar Entri: membaca')).not.toBeInTheDocument();

    let panggilanTerakhir = mockUseDaftarAuditTagarAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('baca');
    expect(panggilanTerakhir.jenis).toBe('dasar');
    expect(panggilanTerakhir.punyaTagar).toBe('1');
    expect(panggilanTerakhir.tagarId).toBe('2');

    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);
    panggilanTerakhir = mockUseDaftarAuditTagarAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.jenis).toBe('');
    expect(panggilanTerakhir.punyaTagar).toBe('');
    expect(panggilanTerakhir.tagarId).toBe('');
  });

  it('menutup fallback map opsi label, opsi tagar kosong, dan path entri tanpa indeks', () => {
    mockUseOpsiLabelRedaksi.mockReturnValue({
      data: { data: { 'bentuk-kata': [{ kode: 'akronim', nama: '' }] } },
    });
    mockUseDaftarTagarUntukPilih.mockReturnValue({ data: { data: undefined } });
    mockUseDaftarAuditTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 12, entri: 'uji', indeks: '', jenis: 'dasar', induk_entri: '', tagar: [] }],
      },
    });
    mockUseTagarEntri.mockReturnValue({ data: { data: [] } });

    render(
      <MemoryRouter>
        <AuditTagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('option', { name: 'akronim' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '—Jenis Tagar—' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buka detail kamus uji' })).toHaveAttribute('href', '/kamus/detail/uji');
  });

  it('membuka editor tagar, menambah dan menghapus tagar entri', () => {
    vi.useFakeTimers();
    mockUseDaftarAuditTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          {
            id: 10,
            entri: 'membaca',
            indeks: 'membaca',
            jenis: 'turunan',
            induk_entri: 'baca',
            tagar: [{ id: 1, nama: 'prefiks me', kategori: 'tak-ada' }],
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AuditTagarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('turunan'));

    expect(screen.getByText('Tagar Entri: membaca')).toBeInTheDocument();
    const inputTambah = screen.getAllByRole('textbox').at(-1);
    fireEvent.focus(inputTambah);

    fireEvent.change(inputTambah, { target: { value: 'kx' } });
    fireEvent.focus(inputTambah);
    fireEvent.blur(inputTambah);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    fireEvent.change(inputTambah, { target: { value: 'an' } });
    fireEvent.focus(inputTambah);
    expect(screen.getByRole('button', { name: 'sufiks -an' })).toBeInTheDocument();
    fireEvent.change(inputTambah, { target: { value: '' } });
    fireEvent.focus(inputTambah);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'sufiks -an' }));
    expect(mutateSimpanTagarEntri).toHaveBeenCalledWith({ entriId: 10, tagar_ids: [1, 2] });

    fireEvent.click(screen.getByLabelText('Hapus tagar prefiks me'));
    expect(mutateSimpanTagarEntri).toHaveBeenCalledWith({ entriId: 10, tagar_ids: [] });

    fireEvent.click(screen.getByLabelText('Tutup panel'));
    expect(screen.queryByText('Tagar Entri: membaca')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('memakai fallback opsi jenis bawaan dan menampilkan panel error simpan', () => {
    simpanTagarState = { mutate: mutateSimpanTagarEntri, isError: true };
    mockUseOpsiLabelRedaksi.mockReturnValue({ data: { data: {} } });
    mockUseDaftarAuditTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 11, entri: '', indeks: '', jenis: '', induk_entri: '', tagar: [] }],
      },
    });
    mockUseTagarEntri.mockReturnValue({ data: { data: [] } });

    render(
      <MemoryRouter>
        <AuditTagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('option', { name: 'Dasar' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('row')[1]);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('Belum ada')).toBeInTheDocument();
    expect(screen.getByText('Gagal menyimpan tagar.')).toBeInTheDocument();
  });

  it('menutup fallback respons undefined untuk daftar audit dan kategori', () => {
    mockUseOpsiLabelRedaksi.mockReturnValue({ data: undefined });
    mockUseDaftarTagarUntukPilih.mockReturnValue({ data: undefined });
    mockUseDaftarAuditTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <AuditTagarAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('option', { name: 'Dasar' })).toBeInTheDocument();
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('menutup cabang nullish map opsi label dan tagar entri undefined', () => {
    mockUseOpsiLabelRedaksi.mockReturnValue({
      data: { data: { 'bentuk-kata': [null] } },
    });
    mockUseDaftarTagarUntukPilih.mockReturnValue({
      data: {
        data: [{ id: 2, kode: 'an', nama: 'sufiks -an', kategori: 'sufiks' }],
      },
    });
    mockUseDaftarAuditTagarAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [{ id: 20, entri: 'uji', indeks: 'uji', jenis: 'dasar', induk_entri: '', tagar: [] }],
      },
    });
    mockUseTagarEntri.mockReturnValue({ data: undefined });

    render(
      <MemoryRouter>
        <AuditTagarAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('dasar'));
    expect(screen.getByPlaceholderText('Tambah tagar …')).toBeInTheDocument();
  });
});
