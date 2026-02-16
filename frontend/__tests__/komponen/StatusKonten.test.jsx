import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  QueryFeedback,
  EmptyInfoCard,
  EmptyResultText,
  PesanTidakDitemukan,
  TableResultCard,
} from '../../src/komponen/StatusKonten';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('StatusKonten', () => {
  it('QueryFeedback menampilkan loading dan error sesuai flag', () => {
    const { rerender } = render(
      <QueryFeedback
        isLoading
        isError={false}
        loadingText="Memuat..."
        errorText="Error..."
      />
    );

    expect(screen.getByText('Memuat...')).toBeInTheDocument();
    expect(screen.queryByText('Error...')).not.toBeInTheDocument();

    rerender(
      <QueryFeedback
        isLoading={false}
        isError
        loadingText="Memuat..."
        errorText="Error..."
      />
    );

    expect(screen.getByText('Error...')).toBeInTheDocument();
    expect(screen.queryByText('Memuat...')).not.toBeInTheDocument();
  });

  it('QueryFeedback menampilkan pesan khusus saat status 429', () => {
    render(
      <QueryFeedback
        isLoading={false}
        isError
        error={{ response: { status: 429 } }}
        loadingText="Memuat..."
        errorText="Error fallback"
      />
    );

    expect(screen.getByText(/permintaan per pengguna dibatasi 60 kali\/15 menit/i)).toBeInTheDocument();
  });

  it('QueryFeedback menampilkan pesan offset saat status 400 + pesan offset maksimal', () => {
    render(
      <QueryFeedback
        isLoading={false}
        isError
        error={{
          response: {
            status: 400,
            data: { message: 'Offset maksimal adalah 1000' },
          },
        }}
        loadingText="Memuat..."
        errorText="Error fallback"
      />
    );

    expect(screen.getByText(/jangkauan halaman sudah melebihi batas/i)).toBeInTheDocument();
  });

  it('QueryFeedback mengutamakan pesan server yang valid', () => {
    render(
      <QueryFeedback
        isLoading={false}
        isError
        error={{
          response: {
            status: 500,
            data: { message: 'Pesan dari server' },
          },
        }}
        loadingText="Memuat..."
        errorText="Error fallback"
      />
    );

    expect(screen.getByText('Pesan dari server')).toBeInTheDocument();
  });

  it('EmptyInfoCard menampilkan teks info', () => {
    render(<EmptyInfoCard text="Belum ada data" />);
    expect(screen.getByText('Belum ada data')).toBeInTheDocument();
  });

  it('EmptyResultText menambahkan padding opsional', () => {
    const { rerender } = render(<EmptyResultText text="Kosong" />);
    expect(screen.getByText('Kosong')).toHaveClass('muted-text');
    expect(screen.getByText('Kosong')).not.toHaveClass('p-4');

    rerender(<EmptyResultText text="Kosong" padded />);
    expect(screen.getByText('Kosong')).toHaveClass('p-4');
  });

  it('TableResultCard menampilkan empty state atau konten + footer', () => {
    const { rerender } = render(
      <TableResultCard isEmpty emptyText="Tidak ada hasil" footer={<div>Footer</div>}>
        <div>Konten</div>
      </TableResultCard>
    );

    expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
    expect(screen.queryByText('Konten')).not.toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();

    rerender(
      <TableResultCard isEmpty={false} emptyText="Tidak ada hasil" footer={<div>Footer</div>}>
        <div>Konten</div>
      </TableResultCard>
    );

    expect(screen.getByText('Konten')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('PesanTidakDitemukan menampilkan pesan dasar tanpa saran', () => {
    render(<PesanTidakDitemukan />);
    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
  });

  it('PesanTidakDitemukan menampilkan tautan saran', () => {
    render(<PesanTidakDitemukan saran={['kata', 'kota']} />);
    expect(screen.getByText(/belum tersedia di Kateglo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kata' })).toHaveAttribute('href', '/kamus/detail/kata');
    expect(screen.getByRole('link', { name: 'kota' })).toHaveAttribute('href', '/kamus/detail/kota');
  });
});