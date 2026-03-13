import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuditMaknaAdmin from '../../../src/halaman/redaksi/AuditMaknaAdmin';

const mockUseDaftarAuditMaknaAdmin = vi.fn();
const mutateSimpanAudit = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useDaftarAuditMaknaAdmin: (...args) => mockUseDaftarAuditMaknaAdmin(...args),
  useSimpanAuditMaknaAdmin: () => ({ mutate: mutateSimpanAudit, isPending: false }),
}));

vi.mock('../../../src/komponen/redaksi/HalamanAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('AuditMaknaAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDaftarAuditMaknaAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 1,
        data: [
          {
            id: 3,
            indeks: 'abstrak',
            jumlah: 7,
            entri_id: 10,
            makna_id: 20,
            entri_sumber: 'abstrak',
            makna_sumber: 'bersifat ringkasan',
            status: 'tinjau',
            catatan: '',
          },
        ],
      },
    });
  });

  it('menampilkan daftar audit, cari, dan reset filter', () => {
    render(
      <MemoryRouter>
        <AuditMaknaAdmin />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Audit Makna' })).toBeInTheDocument();
    expect(screen.getAllByText('abstrak').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Cari indeks …'), { target: { value: 'ab' } });
    fireEvent.change(screen.getByLabelText('Filter status audit'), { target: { value: 'salah' } });
    fireEvent.click(screen.getByText('Cari'));

    let panggilanTerakhir = mockUseDaftarAuditMaknaAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('ab');
    expect(panggilanTerakhir.status).toBe('salah');

    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);
    panggilanTerakhir = mockUseDaftarAuditMaknaAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.q).toBe('');
    expect(panggilanTerakhir.status).toBe('');
  });

  it('tetap mengirim cari dan reset saat status draft kosong', () => {
    render(
      <MemoryRouter>
        <AuditMaknaAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Cari'));
    let panggilanTerakhir = mockUseDaftarAuditMaknaAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.status).toBe('');

    fireEvent.change(screen.getByLabelText('Filter status audit'), { target: { value: 'tinjau' } });
    fireEvent.click(screen.getByText('Cari'));
    fireEvent.click(screen.getByRole('button', { name: '✕' }));
    panggilanTerakhir = mockUseDaftarAuditMaknaAdmin.mock.calls.at(-1)?.[0] || {};
    expect(panggilanTerakhir.status).toBe('');
  });

  it('memakai fallback daftar kosong saat respons belum tersedia', () => {
    mockUseDaftarAuditMaknaAdmin.mockReturnValueOnce({
      isLoading: false,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <AuditMaknaAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('membuka panel saat klik baris lalu menyimpan sukses', () => {
    vi.useFakeTimers();
    mutateSimpanAudit.mockImplementation((_data, opts) => opts.onSuccess?.());

    render(
      <MemoryRouter>
        <AuditMaknaAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByText('abstrak')[0]);
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'salah' } });
    fireEvent.change(screen.getByLabelText('Catatan'), { target: { value: 'cek manual' } });
    fireEvent.click(screen.getByText('Simpan'));

    expect(mutateSimpanAudit).toHaveBeenCalledWith(
      { id: 3, status: 'salah', catatan: 'cek manual' },
      expect.any(Object)
    );
    expect(screen.getByText('Status audit berhasil disimpan')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(600);
    });
    vi.useRealTimers();
  });

  it('menampilkan fallback error saat simpan gagal dan status badge fallback', () => {
    mockUseDaftarAuditMaknaAdmin.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        total: 2,
        data: [
          {
            id: 4,
            indeks: 'uji',
            jumlah: 1,
            entri_id: null,
            makna_id: null,
            entri_sumber: '',
            makna_sumber: '',
            status: 'tak-dikenal',
            catatan: '',
          },
          {
            id: 5,
            indeks: 'uji-2',
            jumlah: 2,
            entri_id: null,
            makna_id: null,
            entri_sumber: '',
            makna_sumber: '',
            status: '',
            catatan: '',
          },
        ],
      },
    });

    mutateSimpanAudit.mockImplementation((_data, opts) => opts.onError?.({}));

    render(
      <MemoryRouter>
        <AuditMaknaAdmin />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('uji'));
    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText('Gagal menyimpan status audit')).toBeInTheDocument();

    fireEvent.click(screen.getByText('uji-2'));

    expect(screen.getAllByText('tak-dikenal').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Status')).toHaveValue('tinjau');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
