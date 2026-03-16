import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import usePencarianAdmin from '../../src/hooks/usePencarianAdmin';

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

describe('usePencarianAdmin', () => {
  it('mengelola state pencarian', () => {
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
});