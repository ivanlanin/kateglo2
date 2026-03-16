import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  CheckboxField,
  FormFooter,
  InputField,
  PesanForm,
  SearchableSelectField,
  SelectField,
  TextareaField,
  ToggleAktif,
  ToggleMeragukan,
  useFormPanel,
} from '../../../src/components/redaksi/FormulirAdmin';

function clickOutside() {
  fireEvent.mouseDown(document.body);
}

function HarnessFormPanel() {
  const form = useFormPanel({ nama: 'awal', aktif: 1 });
  return (
    <div>
      <div data-testid="state">{JSON.stringify(form)}</div>
      <button onClick={form.bukaUntukTambah}>buka-tambah</button>
      <button onClick={() => form.bukaUntukSunting({ id: 2, nama: 'edit' })}>buka-sunting</button>
      <button onClick={() => form.ubahField('nama', 'baru')}>ubah</button>
      <button onClick={form.tutup}>tutup</button>
    </div>
  );
}

describe('FormulirAdmin', () => {
  it('useFormPanel mengelola mode tambah/sunting dan ubah data', () => {
    render(<HarnessFormPanel />);

    fireEvent.click(screen.getByText('buka-tambah'));
    expect(screen.getByTestId('state').textContent).toContain('"buka":true');
    expect(screen.getByTestId('state').textContent).toContain('"modeTambah":true');

    fireEvent.click(screen.getByText('ubah'));
    expect(screen.getByTestId('state').textContent).toContain('"nama":"baru"');

    fireEvent.click(screen.getByText('buka-sunting'));
    expect(screen.getByTestId('state').textContent).toContain('"modeTambah":false');
    expect(screen.getByTestId('state').textContent).toContain('"id":2');

    fireEvent.click(screen.getByText('tutup'));
    expect(screen.getByTestId('state').textContent).toContain('"buka":false');
  });

  it('InputField, TextareaField, SelectField, SearchableSelectField, ToggleAktif, CheckboxField, FormFooter, PesanForm berfungsi', () => {
    const onChange = vi.fn();
    const onSimpan = vi.fn();
    const onBatal = vi.fn();
    const onHapus = vi.fn();

    const { rerender } = render(
      <div>
        <InputField label="Nama" name="nama" value="A" onChange={onChange} required />
        <TextareaField label="Catatan" name="catatan" value="X" onChange={onChange} />
        <SelectField
          label="Peran"
          name="peran"
          value="user"
          onChange={onChange}
          options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]}
        />
        <SearchableSelectField
          label="Bidang"
          name="bidang"
          value="umum"
          onChange={onChange}
          options={[{ value: '', label: 'Semua' }, { value: 'umum', label: 'Umum' }, { value: 'bio', label: 'Biologi' }]}
        />
        <CheckboxField label="Tampilkan" name="tampilkan" value onChange={onChange} />
        <ToggleAktif value={1} onChange={onChange} />
        <ToggleMeragukan value={1} onChange={onChange} />
        <FormFooter onSimpan={onSimpan} onBatal={onBatal} onHapus={onHapus} isPending={false} modeTambah={false} />
        <PesanForm error="Err" sukses="Ok" />
      </div>
    );

    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/Catatan/), { target: { value: 'Y' } });
    fireEvent.change(screen.getByLabelText(/Peran/), { target: { value: 'admin' } });
    fireEvent.click(screen.getByLabelText(/Bidang/));
    fireEvent.change(screen.getByLabelText(/Cari Bidang/), { target: { value: 'bio' } });
    fireEvent.click(screen.getByRole('button', { name: /Biologi/ }));
    fireEvent.click(screen.getByLabelText(/Tampilkan/));
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.click(screen.getByText('Simpan'));
    fireEvent.click(screen.getByText('Batal'));
    fireEvent.click(screen.getByText('Hapus'));

    expect(onChange).toHaveBeenCalled();
    expect(onSimpan).toHaveBeenCalled();
    expect(onBatal).toHaveBeenCalled();
    expect(onHapus).toHaveBeenCalled();
    expect(screen.getByText('Err')).toBeInTheDocument();
    expect(screen.getByText('Ok')).toBeInTheDocument();

    rerender(<FormFooter onSimpan={onSimpan} onBatal={onBatal} isPending modeTambah />);
    expect(screen.getByText('Menyimpan …')).toBeInTheDocument();

    rerender(<FormFooter onSimpan={onSimpan} onBatal={onBatal} isPending={false} modeTambah={false} />);
    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();

    rerender(
      <div>
        <InputField label="Nama" name="nama" value={null} onChange={onChange} disabled />
        <TextareaField label="Catatan" name="catatan" value={null} onChange={onChange} disabled />
        <SelectField
          label="Peran"
          name="peran"
          value={null}
          onChange={onChange}
          options={[{ value: '', label: 'Pilih' }]}
          disabled
        />
        <SearchableSelectField
          label="Bidang"
          name="bidang"
          value={null}
          onChange={onChange}
          options={[{ value: '', label: 'Pilih' }]}
          disabled
        />
        <CheckboxField label="Tampilkan" name="tampilkan" value={false} onChange={onChange} disabled />
        <ToggleAktif value={0} onChange={onChange} disabled />
        <ToggleMeragukan value={0} onChange={onChange} disabled />
        <FormFooter onSimpan={onSimpan} onBatal={onBatal} isPending={false} modeTambah />
      </div>
    );

    expect(screen.getByText('Nonaktif')).toBeInTheDocument();
    expect(screen.getByText('Pasti')).toBeInTheDocument();
    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();

    rerender(<ToggleAktif value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));

    rerender(<ToggleMeragukan value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
  });

  it('SearchableSelectField menangani hideLabel, pencarian kosong, escape, enter, klik luar, dan disabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SearchableSelectField
        label="Bahasa"
        name="bahasa"
        value=""
        onChange={onChange}
        options={[{ value: 'id', label: 'Indonesia' }, { value: 'en', label: 'Inggris' }]}
        hideLabel
        required
        wrapperClassName="wrapper-kustom"
        buttonClassName="button-kustom"
      />
    );

    fireEvent.click(screen.getByLabelText('Bahasa'));
    const inputCari = screen.getByLabelText('Cari Bahasa');
    fireEvent.change(inputCari, { target: { value: 'zzz' } });
    expect(screen.getByText('Tidak ada hasil.')).toBeInTheDocument();

    fireEvent.keyDown(inputCari, { key: 'Escape' });
    expect(screen.queryByText('Tidak ada hasil.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Bahasa'));
    fireEvent.change(screen.getByLabelText('Cari Bahasa'), { target: { value: 'ing' } });
    fireEvent.keyDown(screen.getByLabelText('Cari Bahasa'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('bahasa', 'en');

    fireEvent.click(screen.getByLabelText('Bahasa'));
    clickOutside();
    expect(screen.queryByRole('listbox', { name: 'Opsi Bahasa' })).not.toBeInTheDocument();

    rerender(
      <SearchableSelectField
        label="Bidang"
        name="bidang"
        value=""
        onChange={onChange}
        options={[{ value: 'umum', label: 'Umum' }]}
        disabled
      />
    );

    fireEvent.click(screen.getByLabelText('Bidang'));
    expect(screen.queryByRole('listbox', { name: 'Opsi Bidang' })).not.toBeInTheDocument();
  });

  it('SearchableSelectField memfokuskan input cari saat dropdown dibuka', () => {
    vi.useFakeTimers();
    render(
      <SearchableSelectField
        label="Sumber"
        name="sumber"
        value=""
        onChange={vi.fn()}
        options={[{ value: 'kbbi', label: 'KBBI' }]}
      />
    );

    fireEvent.click(screen.getByLabelText('Sumber'));
    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByLabelText('Cari Sumber')).toHaveFocus();
    vi.useRealTimers();
  });

  it('SearchableSelectField menutup dropdown lewat toggle, memakai fallback label null, dan menjalankan onMouseDown opsi', () => {
    const onChange = vi.fn();

    render(
      <SearchableSelectField
        label="Kategori"
        name="kategori"
        value="pilihan"
        onChange={onChange}
        required
        options={[
          { value: null, label: null },
          { value: 'pilihan', label: 'Pilihan' },
          { value: 'kode-x', label: null },
        ]}
      />
    );

    expect(screen.getByText('Kategori')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Kategori'));
    const inputCari = screen.getByLabelText('Cari Kategori');
    fireEvent.change(inputCari, { target: { value: 'kode-x' } });
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Kategori'));
    expect(screen.queryByRole('listbox', { name: 'Opsi Kategori' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Kategori'));
    const opsiTerpilih = screen.getByRole('button', { name: /Pilihan/ });
    expect(opsiTerpilih.className).toContain('bg-blue-50');

    fireEvent.mouseDown(opsiTerpilih);
    fireEvent.click(opsiTerpilih);
    expect(onChange).toHaveBeenCalledWith('kategori', 'pilihan');
  });

  it('ToggleAktif dan ToggleMeragukan mengirim dua arah nilai 0 dan 1', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ToggleAktif value={1} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('aktif', 0);

    rerender(<ToggleAktif value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('aktif', 1);

    rerender(<ToggleMeragukan value={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('meragukan', 0);

    rerender(<ToggleMeragukan value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('meragukan', 1);
  });

  it('SearchableSelectField memakai fallback nilai kosong saat value null', () => {
    render(
      <SearchableSelectField
        label="Bahasa Asal"
        name="bahasaAsal"
        value={null}
        onChange={vi.fn()}
        options={[
          { value: '', label: 'Belum dipilih' },
          { value: 'id', label: 'Indonesia' },
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText('Bahasa Asal'));
    expect(screen.getByRole('button', { name: /Belum dipilih/ }).className).toContain('bg-blue-50');
  });
});