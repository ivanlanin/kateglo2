import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CursorNavButton from '../../../src/komponen/publik/CursorNavButton';

describe('CursorNavButton', () => {
  it('merender simbol dan menjalankan onClick saat tidak loading', () => {
    const onClick = vi.fn();

    render(<CursorNavButton symbol="»" onClick={onClick} />);

    const tombol = screen.getByRole('button', { name: '»' });
    fireEvent.click(tombol);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(tombol).toHaveClass('kamus-detail-subentry-link');
    expect(tombol).not.toBeDisabled();
  });

  it('menampilkan spinner saat loading dan menghormati disabled + className custom', () => {
    render(
      <CursorNavButton
        symbol="«"
        onClick={() => {}}
        isLoading={true}
        disabled={true}
        className="custom-class"
      />
    );

    const tombol = screen.getByRole('button');
    expect(tombol).toBeDisabled();
    expect(tombol).toHaveClass('custom-class');
    expect(tombol.querySelector('svg.animate-spin')).not.toBeNull();
  });
});
