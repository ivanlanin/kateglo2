import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  BadgeStatus,
  BarisFilterCariAdmin,
  getApiErrorMessage,
  InfoTotal,
  KotakCariAdmin,
  KotakCariTambahAdmin,
  TabelAdmin,
  TombolAksiAdmin,
  potongTeks,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../../src/komponen/redaksi/KomponenAdmin';

vi.mock('../../../src/komponen/bersama/Paginasi', () => ({
  default: ({ onChange, onNavigateCursor }) => (
    <button onClick={() => (onNavigateCursor ? onNavigateCursor('next') : onChange(20))} data-testid="paginasi-mock">
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
      <button
        onClick={() => state.setOffset('next', {
          pageInfo: { hasNext: true, nextCursor: 'cursor-2' },
          total: 100,
        })}
      >
        set-offset
      </button>
    </div>
  );
}

describe('KomponenAdmin', () => {
  it('potongTeks menangani teks kosong, pendek, dan panjang', () => {
    expect(potongTeks('')).toBe('—');
    expect(potongTeks('pendek', 10)).toBe('pendek');
    expect(potongTeks('teks sangat panjang sekali', 4)).toBe('teks …');
  });

  it('validateRequiredFields mengembalikan pesan field wajib pertama yang kosong', () => {
    expect(validateRequiredFields({ nama: '', kode: 'n' }, [
      { name: 'nama', label: 'Nama' },
      { name: 'kode', label: 'Kode' },
    ])).toBe('Nama wajib diisi');

    expect(validateRequiredFields(undefined, [
      { name: 'nama', label: 'Nama' },
    ])).toBe('Nama wajib diisi');

    expect(validateRequiredFields({ nama: 'Ada', kode: 'n' }, [
      { name: 'nama', label: 'Nama' },
      { name: 'kode', label: 'Kode' },
    ])).toBe('');
  });

  it('getApiErrorMessage memprioritaskan error, lalu message, lalu fallback', () => {
    expect(getApiErrorMessage({ response: { data: { error: 'Error utama', message: 'Message kedua' } } }, 'Fallback')).toBe('Error utama');
    expect(getApiErrorMessage({ response: { data: { message: 'Message kedua' } } }, 'Fallback')).toBe('Message kedua');
    expect(getApiErrorMessage({}, 'Fallback')).toBe('Fallback');
  });

  it('usePencarianAdmin mengelola state pencarian', () => {
    render(<HarnessPencarian />);

    fireEvent.click(screen.getByText('set-cari'));
    fireEvent.click(screen.getByText('kirim-cari'));
    expect(screen.getByTestId('state').textContent).toContain('"q":"tes"');
    expect(screen.getByTestId('state').textContent).toContain('"limit":25');

    fireEvent.click(screen.getByText('set-offset'));
    expect(screen.getByTestId('state').textContent).toContain('"offset":25');

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

  it('BarisFilterCariAdmin merender filter, submit, dan hapus', () => {
    const onCari = vi.fn();
    const onHapus = vi.fn();
    const onChange = vi.fn();
    const onChangeFilter = vi.fn();

    render(
      <BarisFilterCariAdmin
        nilai="kata"
        onChange={onChange}
        onCari={onCari}
        onHapus={onHapus}
        placeholder="Cari baris"
        filters={[
          {
            key: 'aktif',
            value: '',
            onChange: onChangeFilter,
            options: [
              { value: '', label: 'Semua' },
              { value: '1', label: 'Aktif' },
            ],
            ariaLabel: 'Filter aktif',
          },
        ]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Cari baris'), { target: { value: 'baru' } });
    expect(onChange).toHaveBeenCalledWith('baru');

    fireEvent.change(screen.getByLabelText('Filter aktif'), { target: { value: '1' } });
    expect(onChangeFilter).toHaveBeenCalledWith('1');

    fireEvent.click(screen.getByText('Cari'));
    expect(onCari).toHaveBeenCalledWith('kata');

    fireEvent.click(screen.getByText('✕'));
    expect(onHapus).toHaveBeenCalled();
  });

  it('BarisFilterCariAdmin tetap aman saat filter tanpa options', () => {
    const onCari = vi.fn();
    const onChange = vi.fn();
    const onChangeFilter = vi.fn();

    render(
      <BarisFilterCariAdmin
        nilai=""
        onChange={onChange}
        onCari={onCari}
        onHapus={vi.fn()}
        filters={[{ key: 'status', value: '', onChange: onChangeFilter }]}
      />
    );

    fireEvent.change(screen.getByLabelText('status'), { target: { value: '' } });
    expect(onChangeFilter).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cari'));
    expect(onCari).toHaveBeenCalledWith('');
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('BarisFilterCariAdmin memakai fallback value kosong saat filter value undefined', () => {
    const onChangeFilter = vi.fn();

    render(
      <BarisFilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={[
          {
            key: 'statusNullish',
            onChange: onChangeFilter,
            options: [{ value: '', label: 'Semua' }],
          },
        ]}
      />
    );

    expect(screen.getByLabelText('statusNullish')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('statusNullish'), { target: { value: '' } });
    expect(onChangeFilter).toHaveBeenCalledWith('');
  });

  it('KotakCariTambahAdmin dan TombolAksiAdmin memanggil callback', () => {
    const onCari = vi.fn();
    const onHapus = vi.fn();
    const onChange = vi.fn();
    const onTambah = vi.fn();
    const onAksi = vi.fn();

    const { rerender } = render(
      <KotakCariTambahAdmin
        nilai="x"
        onChange={onChange}
        onCari={onCari}
        onHapus={onHapus}
        onTambah={onTambah}
        labelTambah="Tambah Data"
      />
    );

    fireEvent.click(screen.getByText('Tambah Data'));
    expect(onTambah).toHaveBeenCalled();

    rerender(<TombolAksiAdmin onClick={onAksi} label="Aksi Utama" />);
    fireEvent.click(screen.getByText('Aksi Utama'));
    expect(onAksi).toHaveBeenCalled();
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
    rerender(<div />);
  });

  it('TabelAdmin mode cursor meneruskan action dengan pageInfo dan total', () => {
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

  it('TabelAdmin memakai onOffset sebagai handler cursor saat pageInfo tersedia', () => {
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
        pageInfo={{ hasPrev: false, hasNext: true }}
        currentPage={1}
        onOffset={onOffset}
      />
    );

    fireEvent.click(screen.getAllByTestId('paginasi-mock')[0]);
    expect(onOffset).toHaveBeenCalledWith('next');
  });

  it('TabelAdmin dapat merender tanpa onKlikBaris dan tanpa paginasi', () => {
    const kolom = [{ key: 'nama', label: 'Nama' }];
    const data = [{ id: 2, nama: 'B' }];

    render(
      <TabelAdmin
        kolom={kolom}
        data={data}
        isLoading={false}
        isError={false}
        total={1}
        limit={0}
        offset={0}
      />
    );

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByTestId('paginasi-mock')).not.toBeInTheDocument();
  });
});