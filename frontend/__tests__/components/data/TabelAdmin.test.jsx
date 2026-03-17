import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TabelAdmin from '../../../src/components/data/TabelAdmin';

vi.mock('../../../src/components/navigasi/Paginasi', () => ({
  default: ({ onChange, onNavigateCursor }) => (
    <button onClick={() => (onNavigateCursor ? onNavigateCursor('next') : onChange(20))} data-testid="paginasi-mock">
      Paginasi
    </button>
  ),
}));

describe('TabelAdmin', () => {
  it('menampilkan state loading, error, dan empty', () => {
    const { rerender } = render(
      <TabelAdmin kolom={[]} data={[]} isLoading isError={false} limit={10} offset={0} />
    );
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    rerender(<TabelAdmin kolom={[]} data={[]} isLoading={false} isError limit={10} offset={0} />);
    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument();

    rerender(<TabelAdmin kolom={[]} data={[]} isLoading={false} isError={false} limit={10} offset={0} />);
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('menampilkan data, klik baris, dan paginasi', () => {
    const onKlikBaris = vi.fn();
    const onOffset = vi.fn();
    const kolom = [
      { key: 'nama', label: 'Nama' },
      { key: 'kosong', label: 'Kosong' },
      { key: 'nilai', label: 'Nilai', render: (item) => <b>{item.nilai}</b> },
    ];
    const data = [{ id: 1, nama: 'A', kosong: null, nilai: 20 }];

    const { rerender } = render(
      <TabelAdmin
        kolom={kolom}
        data={data}
        isLoading={false}
        isError={false}
        total={100}
        limit={10}
        offset={0}
        onOffset={onOffset}
        onKlikBaris={onKlikBaris}
      />
    );

    fireEvent.click(screen.getByText('A'));
    expect(onKlikBaris).toHaveBeenCalledWith(data[0]);

    fireEvent.click(screen.getAllByTestId('paginasi-mock')[0]);
    expect(onOffset).toHaveBeenCalledWith(20);

    rerender(
      <TabelAdmin
        kolom={kolom}
        data={data}
        isLoading={false}
        isError={false}
        total={0}
        limit={10}
        offset={0}
      />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('mode cursor meneruskan action dengan pageInfo dan total', () => {
    const onNavigateCursor = vi.fn();

    render(
      <TabelAdmin
        kolom={[{ key: 'nama', label: 'Nama' }]}
        data={[{ id: 1, nama: 'Admin' }]}
        isLoading={false}
        isError={false}
        total={100}
        limit={10}
        offset={0}
        pageInfo={{ hasPrev: false, hasNext: true, nextCursor: 'cursor-2' }}
        currentPage={1}
        onNavigateCursor={onNavigateCursor}
      />
    );

    fireEvent.click(screen.getAllByTestId('paginasi-mock')[0]);
    expect(onNavigateCursor).toHaveBeenCalledWith('next', {
      pageInfo: { hasPrev: false, hasNext: true, nextCursor: 'cursor-2' },
      total: 100,
    });
  });

  it('mode cursor fallback memakai onOffset saat pageInfo ada tetapi handler cursor tidak diberikan', () => {
    const onOffset = vi.fn();

    render(
      <TabelAdmin
        kolom={[{ key: 'nama', label: 'Nama' }]}
        data={[{ id: 1, nama: 'Admin' }]}
        isLoading={false}
        isError={false}
        total={100}
        limit={10}
        offset={0}
        onOffset={onOffset}
        pageInfo={{ hasPrev: false, hasNext: true, nextCursor: 'cursor-2' }}
        currentPage={1}
      />
    );

    fireEvent.click(screen.getAllByTestId('paginasi-mock')[0]);
    expect(onOffset).toHaveBeenCalledWith('next');
  });
});