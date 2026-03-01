import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PencarianAdmin, { formatTanggalSingkat } from '../../../src/halaman/redaksi/PencarianAdmin';

const mockUseStatistikPencarianAdmin = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useStatistikPencarianAdmin: (...args) => mockUseStatistikPencarianAdmin(...args),
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
  });

  it('helper formatTanggalSingkat memakai format dd mmm yyyy', () => {
    expect(formatTanggalSingkat('2026-03-01')).toBe('01 Mar 2026');
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
            tanggal_awal: '2026-02-20',
            tanggal_akhir: '2026-02-28',
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
    expect(screen.queryByText('01 Mar 2026')).not.toBeInTheDocument();
    expect(screen.getByText('20 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('28 Feb 2026')).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '9999' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Terapkan' }).closest('form'));

    const lastCallAfterSubmit = mockUseStatistikPencarianAdmin.mock.calls.at(-1)?.[0];
    expect(lastCallAfterSubmit).toEqual({
      domain: '3',
      periode: '30hari',
      limit: 1000,
      tanggalMulai: '',
      tanggalSelesai: '',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    const lastCallAfterReset = mockUseStatistikPencarianAdmin.mock.calls.at(-1)?.[0];
    expect(lastCallAfterReset).toEqual({
      domain: '',
      periode: '7hari',
      limit: 200,
      tanggalMulai: '',
      tanggalSelesai: '',
    });
  });
});
