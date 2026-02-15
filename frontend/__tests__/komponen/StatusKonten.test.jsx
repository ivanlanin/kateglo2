import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  QueryFeedback,
  EmptyInfoCard,
  EmptyResultText,
  TableResultCard,
} from '../../src/komponen/StatusKonten';

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
});