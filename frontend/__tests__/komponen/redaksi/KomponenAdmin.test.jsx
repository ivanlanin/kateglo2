import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  BadgeStatus,
  InfoTotal,
  KotakCariAdmin,
  TabelAdmin,
  potongTeks,
  usePencarianAdmin,
} from '../../../src/komponen/redaksi/KomponenAdmin';

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onChange }) => (
    <button onClick={() => onChange(20)} data-testid="paginasi-mock">
      Paginasi
    </button>
  ),
}));

function HarnessPencarian() {
  const state = usePencarianAdmin(25);
  return (
    <div>
      <div data-testid="state">{JSON.stringify(state)}</div>
      <button onClick={() => state.setCari('tes')}>set-cari</button>
      <button onClick={() => state.kirimCari()}>kirim-cari</button>
      <button onClick={() => state.hapusCari()}>hapus-cari</button>
      <button onClick={() => state.setOffset(10)}>set-offset</button>
    </div>
  );
}

describe('KomponenAdmin', () => {
  it('potongTeks menangani teks kosong, pendek, dan panjang', () => {
    expect(potongTeks('')).toBe('—');
    expect(potongTeks('pendek', 10)).toBe('pendek');
    expect(potongTeks('teks sangat panjang sekali', 4)).toBe('teks …');
  });

  it('usePencarianAdmin mengelola state pencarian', () => {
    render(<HarnessPencarian />);

    fireEvent.click(screen.getByText('set-cari'));
    fireEvent.click(screen.getByText('kirim-cari'));
    expect(screen.getByTestId('state').textContent).toContain('"q":"tes"');
    expect(screen.getByTestId('state').textContent).toContain('"limit":25');

    fireEvent.click(screen.getByText('set-offset'));
    expect(screen.getByTestId('state').textContent).toContain('"offset":10');

    fireEvent.click(screen.getByText('hapus-cari'));
    expect(screen.getByTestId('state').textContent).toContain('"q":""');
    expect(screen.getByTestId('state').textContent).toContain('"cari":""');
  });

  it('KotakCariAdmin submit dan hapus berjalan', () => {
    const onCari = vi.fn();
    const onHapus = vi.fn();
    const onChange = vi.fn();

    render(
      <KotakCariAdmin
        nilai="aku"
        onChange={onChange}
        onCari={onCari}
        onHapus={onHapus}
        placeholder="Cari admin"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Cari admin'), { target: { value: 'kami' } });
    expect(onChange).toHaveBeenCalledWith('kami');

    fireEvent.click(screen.getByText('Cari'));
    expect(onCari).toHaveBeenCalledWith('aku');

    fireEvent.click(screen.getByText('✕'));
    expect(onHapus).toHaveBeenCalled();
  });

  it('InfoTotal dan BadgeStatus merender teks dengan benar', () => {
    const { rerender } = render(<InfoTotal q="kata" total={10} label="data" />);
    expect(screen.getByText('Pencarian "kata":', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    rerender(<InfoTotal q="" total={3} label="entri" />);
    expect(screen.getByText('Total:', { exact: false })).toBeInTheDocument();

    rerender(<BadgeStatus aktif={1} />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();
    rerender(<BadgeStatus aktif={0} />);
    expect(screen.getByText('Nonaktif')).toBeInTheDocument();
  });

  it('TabelAdmin menampilkan state loading, error, dan empty', () => {
    const { rerender } = render(
      <TabelAdmin kolom={[]} data={[]} isLoading isError={false} limit={10} offset={0} />
    );
    expect(screen.getByText('Memuat data …')).toBeInTheDocument();

    rerender(<TabelAdmin kolom={[]} data={[]} isLoading={false} isError limit={10} offset={0} />);
    expect(screen.getByText('Gagal memuat data.')).toBeInTheDocument();

    rerender(<TabelAdmin kolom={[]} data={[]} isLoading={false} isError={false} limit={10} offset={0} />);
    expect(screen.getByText('Tidak ada data.')).toBeInTheDocument();
  });

  it('TabelAdmin menampilkan data, klik baris, dan paginasi', () => {
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

    fireEvent.click(screen.getByTestId('paginasi-mock'));
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
    rerender(<div />);
  });
});