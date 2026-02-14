/**
 * @fileoverview Test untuk halaman Dashboard admin
 * @tested_in admin/src/pages/Dashboard.jsx
 */

import { render, screen } from '@testing-library/react';
import Dashboard from '../../src/pages/Dashboard';

describe('Dashboard', () => {
  it('menampilkan judul Admin - Kateglo', () => {
    render(<Dashboard />);
    expect(screen.getByText('Admin - Kateglo')).toBeInTheDocument();
  });

  it('menampilkan kartu statistik', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Lema')).toBeInTheDocument();
    expect(screen.getByText('Total Glosarium')).toBeInTheDocument();
    expect(screen.getByText('Total Peribahasa')).toBeInTheDocument();
  });

  it('menampilkan tombol quick actions', () => {
    render(<Dashboard />);
    expect(screen.getByText('Tambah Lema')).toBeInTheDocument();
    expect(screen.getByText('Tambah Glosarium')).toBeInTheDocument();
    expect(screen.getByText('Tambah Peribahasa')).toBeInTheDocument();
    expect(screen.getByText('Lihat Analytics')).toBeInTheDocument();
  });

  it('menampilkan tombol Logout', () => {
    render(<Dashboard />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
