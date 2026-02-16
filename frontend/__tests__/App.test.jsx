/**
 * @fileoverview Test App routing
 */

import { render, screen } from '@testing-library/react';
import { describe, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';

vi.mock('../src/komponen/publik/TataLetak', () => ({
  default: () => <div data-testid="layout">Layout</div>,
}));
vi.mock('../src/halaman/publik/Beranda', () => ({ default: () => <div>Hal Beranda</div> }));
vi.mock('../src/halaman/publik/Kamus', () => ({ default: () => <div>Hal Kamus</div> }));
vi.mock('../src/halaman/publik/KamusDetail', () => ({ default: () => <div>Hal Kamus Detail</div> }));
vi.mock('../src/halaman/publik/Glosarium', () => ({ default: () => <div>Hal Glosarium</div> }));
vi.mock('../src/halaman/Peribahasa', () => ({ default: () => <div>Hal Peribahasa</div> }));
vi.mock('../src/halaman/Singkatan', () => ({ default: () => <div>Hal Singkatan</div> }));

describe('App', () => {
  it('merender route layout', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });
});
