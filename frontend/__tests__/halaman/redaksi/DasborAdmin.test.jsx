import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DasborAdmin from '../../../src/halaman/redaksi/DasborAdmin';

const mockUseStatistikAdmin = vi.fn();

vi.mock('../../../src/api/apiAdmin', () => ({
  useStatistikAdmin: () => mockUseStatistikAdmin(),
}));

vi.mock('../../../src/komponen/redaksi/TataLetakAdmin', () => ({
  default: ({ children, judul }) => (
    <div>
      <h1>{judul}</h1>
      {children}
    </div>
  ),
}));

describe('DasborAdmin', () => {
  it('menampilkan statistik loading', () => {
    mockUseStatistikAdmin.mockReturnValue({ data: null, isLoading: true });
    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('Dasbor')).toBeInTheDocument();
    expect(screen.getAllByText('…')).toHaveLength(4);
  });

  it('menampilkan statistik saat data tersedia', () => {
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: { data: { entri: 1000, tesaurus: 200, glosarium: 50, pengguna: 12 } },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getByText('1.000')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('menampilkan fallback strip saat nilai statistik kosong', () => {
    mockUseStatistikAdmin.mockReturnValue({
      isLoading: false,
      data: { data: { entri: null, tesaurus: undefined, glosarium: undefined, pengguna: undefined } },
    });

    render(
      <MemoryRouter>
        <DasborAdmin />
      </MemoryRouter>
    );

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});