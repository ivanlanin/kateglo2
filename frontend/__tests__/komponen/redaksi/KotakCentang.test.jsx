import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KotakCentang from '../../../src/komponen/redaksi/KotakCentang';

describe('KotakCentang', () => {
  it('menampilkan loading text saat isLoading=true', () => {
    render(
      <KotakCentang
        label="Izin"
        isLoading={true}
        loadingText="Memuat pilihan ..."
        hasSelected={() => false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Memuat pilihan ...')).toBeInTheDocument();
  });

  it('mode groups tetap aman saat group.items undefined', () => {
    render(
      <KotakCentang
        label="Izin"
        groups={[{ key: 'admin', title: 'Admin' }]}
        hasSelected={() => false}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('mode flat list memakai fallback items kosong dan dapat toggle item', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <KotakCentang
        label="Izin"
        items={undefined}
        hasSelected={() => false}
        onToggle={onToggle}
      />
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    rerender(
      <KotakCentang
        label="Izin"
        items={[{ id: 10, nama: 'Kelola Pengguna' }]}
        hasSelected={(id) => id === 10}
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(10);
  });
});
