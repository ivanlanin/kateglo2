import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PanelGeser from '../../../src/komponen/redaksi/PanelGeser';

describe('PanelGeser', () => {
  it('merender panel tertutup dan tidak merender children', () => {
    const onTutup = vi.fn();
    render(
      <PanelGeser buka={false} onTutup={onTutup} judul="Panel">
        <div>Isi panel</div>
      </PanelGeser>
    );

    expect(screen.queryByText('Isi panel')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('merender panel terbuka, tutup via backdrop, tombol, dan Escape', () => {
    const onTutup = vi.fn();
    const { container, rerender } = render(
      <PanelGeser buka onTutup={onTutup} judul="Panel">
        <div>Isi panel</div>
      </PanelGeser>
    );

    expect(screen.getByText('Isi panel')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    const backdrop = container.querySelector('.panel-geser-backdrop');
    fireEvent.click(backdrop);
    fireEvent.click(screen.getByLabelText('Tutup panel'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onTutup).toHaveBeenCalledTimes(3);

    rerender(
      <PanelGeser buka={false} onTutup={onTutup} judul="Panel">
        <div>Isi panel</div>
      </PanelGeser>
    );
    expect(document.body.style.overflow).toBe('');
  });
});