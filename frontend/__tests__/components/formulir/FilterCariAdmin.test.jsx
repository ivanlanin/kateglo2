import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilterCariAdmin, { isActiveFilterValue } from '../../../src/components/formulir/FilterCariAdmin';

describe('FilterCariAdmin', () => {
  it('menilai nilai filter aktif dengan aman', () => {
    expect(isActiveFilterValue(undefined)).toBe(false);
    expect(isActiveFilterValue({ value: null })).toBe(false);
    expect(isActiveFilterValue({ value: '   ' })).toBe(false);
    expect(isActiveFilterValue({ value: '1' })).toBe(true);
  });

  it('merender filter, submit, dan hapus', () => {
    const onCari = vi.fn();
    const onHapus = vi.fn();
    const onChange = vi.fn();
    const onChangeFilter = vi.fn();

    render(
      <FilterCariAdmin
        nilai="kata"
        onChange={onChange}
        onCari={onCari}
        onHapus={onHapus}
        placeholder="Cari baris"
        filters={[
          {
            key: 'aktif',
            value: '',
            onChange: onChangeFilter,
            options: [
              { value: '', label: 'Semua' },
              { value: '1', label: 'Aktif' },
            ],
            ariaLabel: 'Filter aktif',
          },
        ]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Cari baris'), { target: { value: 'baru' } });
    expect(onChange).toHaveBeenCalledWith('baru');

    fireEvent.change(screen.getByLabelText('Filter aktif'), { target: { value: '1' } });
    expect(onChangeFilter).toHaveBeenCalledWith('1');

    fireEvent.click(screen.getByText('Cari'));
    expect(onCari).toHaveBeenCalledWith('kata');

    fireEvent.click(screen.getByText('✕'));
    expect(onHapus).toHaveBeenCalled();
  });

  it('dapat merender filter searchable secara DRY', () => {
    const onChangeFilter = vi.fn();

    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={[
          {
            key: 'bahasa',
            value: '',
            onChange: onChangeFilter,
            options: [
              { value: '', label: '—Bahasa—' },
              { value: 'id', label: 'Indonesia' },
              { value: 'en', label: 'Inggris' },
            ],
            ariaLabel: 'Filter bahasa',
            searchable: true,
            placeholder: '—Bahasa—',
            searchPlaceholder: 'Cari bahasa…',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText('Filter bahasa'));
    fireEvent.change(screen.getByLabelText('Cari Filter bahasa'), { target: { value: 'ing' } });
    fireEvent.click(screen.getByRole('button', { name: /Inggris/ }));

    expect(onChangeFilter).toHaveBeenCalledWith('en');
  });

  it('tetap aman saat filter tanpa options', () => {
    const onCari = vi.fn();
    const onChange = vi.fn();
    const onChangeFilter = vi.fn();

    render(
      <FilterCariAdmin
        nilai=""
        onChange={onChange}
        onCari={onCari}
        onHapus={vi.fn()}
        filters={[{ key: 'status', value: '', onChange: onChangeFilter }]}
      />
    );

    fireEvent.change(screen.getByLabelText('status'), { target: { value: '' } });
    expect(onChangeFilter).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cari'));
    expect(onCari).toHaveBeenCalledWith('');
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('tetap aman saat filters bukan array-mapable', () => {
    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={{}}
      />
    );

    expect(screen.getByText('Cari')).toBeInTheDocument();
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('memakai fallback filters kosong saat null', () => {
    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={null}
      />
    );

    expect(screen.getByText('Cari')).toBeInTheDocument();
  });

  it('searchable memakai fallback nilai, opsi, dan placeholder bawaan', () => {
    const onChangeFilter = vi.fn();

    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={[
          {
            key: 'label',
            onChange: onChangeFilter,
            searchable: true,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText('label'));
    expect(screen.getByText('Tidak ada hasil.')).toBeInTheDocument();
    expect(screen.getByLabelText('Cari label')).toHaveAttribute('placeholder', 'Cari label…');
  });

  it('menampilkan tombol reset saat nilai kosong tapi filter aktif', () => {
    const onHapus = vi.fn();

    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={onHapus}
        filters={[
          {
            key: 'aktif',
            value: '1',
            onChange: vi.fn(),
            options: [
              { value: '', label: 'Semua' },
              { value: '1', label: 'Aktif' },
            ],
          },
        ]}
      />
    );

    fireEvent.click(screen.getByText('✕'));
    expect(onHapus).toHaveBeenCalled();
  });

  it('memakai fallback value kosong saat filter value undefined', () => {
    const onChangeFilter = vi.fn();

    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={[
          {
            key: 'statusNullish',
            onChange: onChangeFilter,
            options: [{ value: '', label: 'Semua' }],
          },
        ]}
      />
    );

    expect(screen.getByLabelText('statusNullish')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('statusNullish'), { target: { value: '' } });
    expect(onChangeFilter).toHaveBeenCalledWith('');
  });

  it('aman saat nilai filter nullish', () => {
    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={[{ key: 'aktif', value: null, onChange: vi.fn(), options: [] }]}
      />
    );

    expect(screen.getByLabelText('aktif')).toBeInTheDocument();
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('menangani filters non-array yang tetap menyediakan some dan map', () => {
    const filtersAneh = {
      some: (callback) => callback(undefined),
      map: () => [],
    };

    render(
      <FilterCariAdmin
        nilai=""
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={filtersAneh}
      />
    );

    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('menangani nilai undefined untuk kalkulasi reset', () => {
    render(
      <FilterCariAdmin
        nilai={undefined}
        onChange={vi.fn()}
        onCari={vi.fn()}
        onHapus={vi.fn()}
        filters={[]}
      />
    );

    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });
});