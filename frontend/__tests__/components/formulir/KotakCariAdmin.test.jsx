import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KotakCariAdmin from '../../../src/components/formulir/KotakCariAdmin';

describe('KotakCariAdmin', () => {
  it('submit dan hapus berjalan', () => {
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

  it('menyembunyikan tombol hapus saat nilai kosong', () => {
    render(
      <KotakCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
      />
    );

    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });
});