import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PenghitungHuruf from '../../../../src/pages/publik/alat/PenghitungHuruf';

const { chartDestroy, chartMock, chartRegister } = vi.hoisted(() => {
  const destroy = vi.fn();
  const mock = vi.fn(() => ({ destroy }));
  const register = vi.fn();

  return {
    chartDestroy: destroy,
    chartMock: mock,
    chartRegister: register,
  };
});

vi.mock('chart.js/auto', () => ({
  default: Object.assign(chartMock, { register: chartRegister }),
}));

vi.mock('chartjs-plugin-datalabels', () => ({
  default: {},
}));

describe('PenghitungHuruf', () => {
  beforeEach(() => {
    chartMock.mockClear();
    chartDestroy.mockClear();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}));
  });

  it('menghitung frekuensi huruf dan menampilkan tabel hasil', () => {
    render(
      <MemoryRouter>
        <PenghitungHuruf />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Teks untuk dihitung hurufnya'), {
      target: { value: 'Baba c' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hitung' }));

    expect(screen.getByText('Total huruf')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getAllByText('40.00%')).toHaveLength(2);
    expect(chartMock).toHaveBeenCalled();
  });

  it('berpindah ke pill grafik dan mengisi contoh', () => {
    render(
      <MemoryRouter>
        <PenghitungHuruf />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Isi contoh' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Grafik' }));
    expect(screen.getByRole('tab', { name: 'Grafik' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Grafik frekuensi huruf')).toBeInTheDocument();
  });

  it('menampilkan validasi saat input kosong', () => {
    render(
      <MemoryRouter>
        <PenghitungHuruf />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hitung' }));
    expect(screen.getByText('Silakan masukkan teks terlebih dahulu.')).toBeInTheDocument();
  });
});