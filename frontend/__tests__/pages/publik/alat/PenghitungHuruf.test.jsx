import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PenghitungHuruf, { __private } from '../../../../src/pages/publik/alat/PenghitungHuruf';

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

  it('helper hitungFrekuensiHuruf menghitung hanya huruf latin dan fallback kosong', () => {
    expect(__private.hitungFrekuensiHuruf('Abba 123!?')).toEqual({
      totalChars: 4,
      uniqueChars: 2,
      items: [
        { char: 'a', count: 2, percentage: 50 },
        { char: 'b', count: 2, percentage: 50 },
      ],
    });

    expect(__private.hitungFrekuensiHuruf('123!?')).toEqual({
      totalChars: 0,
      uniqueChars: 0,
      items: [],
    });
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

    fireEvent.click(screen.getByRole('tab', { name: 'Tabel' }));
    expect(screen.getByRole('tab', { name: 'Tabel' })).toHaveAttribute('aria-selected', 'true');
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

  it('menutup semua callback chart, membersihkan hasil, dan aman saat context null', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValue({});

    const { unmount } = render(
      <MemoryRouter>
        <PenghitungHuruf />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Isi contoh' }));
    expect(chartMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Teks untuk dihitung hurufnya'), {
      target: { value: 'Huruf baru' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hitung' }));
    expect(chartMock).toHaveBeenCalledTimes(1);

    const config = chartMock.mock.calls[0][1];
    expect(config.options.scales.y.ticks.callback(12)).toBe('12%');
    expect(config.options.plugins.tooltip.callbacks.label({ raw: 33.5 })).toBe('33.5%');
    expect(config.options.plugins.datalabels.formatter(21)).toBe('21%');

    fireEvent.change(screen.getByLabelText('Teks untuk dihitung hurufnya'), {
      target: { value: 'Huruf kedua' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Hitung' }));
    expect(chartDestroy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Bersihkan' }));
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
    expect(screen.getByText('Belum ada data huruf untuk ditampilkan.')).toBeInTheDocument();
    expect(screen.getByText('Belum ada grafik yang ditampilkan.')).toBeInTheDocument();

    unmount();
    expect(chartDestroy).toHaveBeenCalled();
  });

  it('tidak membuat chart saat belum ada hasil meski canvas tersedia', () => {
    render(
      <MemoryRouter>
        <PenghitungHuruf />
      </MemoryRouter>
    );

    expect(chartMock).not.toHaveBeenCalled();
  });
});