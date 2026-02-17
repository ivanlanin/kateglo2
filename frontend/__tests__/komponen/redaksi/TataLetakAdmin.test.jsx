import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TataLetakAdmin from '../../../src/komponen/redaksi/TataLetakAdmin';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockUseAuth = vi.fn(() => ({ user: { email: 'admin@kateglo.id' }, logout: mockLogout }));

vi.mock('../../../src/context/authContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TataLetakAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan judul, user, menu aktif, dan logout', () => {
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin judul="Kamus">Isi Admin</TataLetakAdmin>
      </MemoryRouter>
    );

    expect(document.title).toBe('Kamus — Redaksi Kateglo');
    expect(screen.getByText('admin@kateglo.id')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Redaksi' })).toHaveAttribute('href', '/redaksi');
    expect(screen.getByRole('link', { name: 'Kateglo' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Dasbor' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kamus' }).className).toContain('border-blue-600');
    expect(screen.getByText('Isi Admin')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Keluar'));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('menangani judul kosong dan fallback nama user', () => {
    mockUseAuth.mockReturnValueOnce({ user: { name: 'Redaksi' }, logout: mockLogout });
    render(
      <MemoryRouter initialEntries={['/redaksi/kamus']}>
        <TataLetakAdmin>Konten</TataLetakAdmin>
      </MemoryRouter>
    );

    expect(document.title).toBe('Redaksi Kateglo');
    expect(screen.getByRole('link', { name: 'Redaksi' })).toHaveAttribute('href', '/redaksi');
    expect(screen.getByText('Redaksi', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kamus' }).className).toContain('border-blue-600');
  });
});