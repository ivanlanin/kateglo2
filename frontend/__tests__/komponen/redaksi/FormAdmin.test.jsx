import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  FormFooter,
  InputField,
  PesanForm,
  SelectField,
  TextareaField,
  ToggleAktif,
  useFormPanel,
} from '../../../src/komponen/redaksi/FormAdmin';

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

describe('FormAdmin', () => {
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

  it('InputField, TextareaField, SelectField, ToggleAktif, FormFooter, PesanForm berfungsi', () => {
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
        <ToggleAktif value={1} onChange={onChange} />
        <FormFooter onSimpan={onSimpan} onBatal={onBatal} onHapus={onHapus} isPending={false} modeTambah={false} />
        <PesanForm error="Err" sukses="Ok" />
      </div>
    );

    fireEvent.change(screen.getByLabelText(/Nama/), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/Catatan/), { target: { value: 'Y' } });
    fireEvent.change(screen.getByLabelText(/Peran/), { target: { value: 'admin' } });
    fireEvent.click(screen.getAllByRole('button')[0]);
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
        <ToggleAktif value={0} onChange={onChange} disabled />
        <FormFooter onSimpan={onSimpan} onBatal={onBatal} isPending={false} modeTambah />
      </div>
    );

    expect(screen.getByText('Nonaktif')).toBeInTheDocument();
    expect(screen.queryByText('Hapus')).not.toBeInTheDocument();

    rerender(<ToggleAktif value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
  });
});