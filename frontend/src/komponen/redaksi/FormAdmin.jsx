/**
 * @fileoverview Komponen formulir bersama untuk panel admin
 * Menyediakan input, select, textarea, dan hook useFormPanel
 */

import { useCallback, useState } from 'react';

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Hook untuk mengelola state panel formulir (buka/tutup, data, mode tambah/sunting)
 * @param {Object} nilaiAwal - Objek default untuk formulir baru
 */
export function useFormPanel(nilaiAwal = {}) {
  const [buka, setBuka] = useState(false);
  const [data, setData] = useState(nilaiAwal);
  const [modeTambah, setModeTambah] = useState(true);

  const bukaUntukTambah = useCallback(() => {
    setData({ ...nilaiAwal });
    setModeTambah(true);
    setBuka(true);
  }, [nilaiAwal]);

  const bukaUntukSunting = useCallback((item) => {
    setData({ ...item });
    setModeTambah(false);
    setBuka(true);
  }, []);

  const tutup = useCallback(() => {
    setBuka(false);
  }, []);

  const ubahField = useCallback((field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  return { buka, data, modeTambah, bukaUntukTambah, bukaUntukSunting, tutup, ubahField, setData };
}

// ─── Komponen ────────────────────────────────────────────────────────────────

/**
 * Grup input teks
 */
export function InputField({ label, name, value, onChange, placeholder, required, disabled, type = 'text' }) {
  return (
    <div className="form-admin-group">
      <label htmlFor={`field-${name}`} className="form-admin-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={`field-${name}`}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="form-admin-input"
      />
    </div>
  );
}

/**
 * Grup textarea
 */
export function TextareaField({ label, name, value, onChange, placeholder, rows = 3, disabled }) {
  return (
    <div className="form-admin-group">
      <label htmlFor={`field-${name}`} className="form-admin-label">{label}</label>
      <textarea
        id={`field-${name}`}
        value={value ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="form-admin-textarea"
      />
    </div>
  );
}

/**
 * Grup select
 */
export function SelectField({ label, name, value, onChange, options, disabled }) {
  return (
    <div className="form-admin-group">
      <label htmlFor={`field-${name}`} className="form-admin-label">{label}</label>
      <select
        id={`field-${name}`}
        value={value ?? ''}
        onChange={(e) => onChange(name, e.target.value)}
        disabled={disabled}
        className="form-admin-select"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Toggle aktif/nonaktif
 */
export function ToggleAktif({ value, onChange, disabled }) {
  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Status</label>
      <button
        type="button"
        onClick={() => onChange('aktif', value ? 0 : 1)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
        {value ? 'Aktif' : 'Nonaktif'}
      </span>
    </div>
  );
}

/**
 * Footer formulir dengan tombol Simpan, Batal, dan Hapus (opsional)
 */
export function FormFooter({ onSimpan, onBatal, onHapus, isPending, modeTambah }) {
  return (
    <div className="form-admin-footer">
      <button
        type="button"
        onClick={onSimpan}
        disabled={isPending}
        className="form-admin-btn-simpan"
      >
        {isPending ? 'Menyimpan …' : 'Simpan'}
      </button>
      <button
        type="button"
        onClick={onBatal}
        disabled={isPending}
        className="form-admin-btn-batal"
      >
        Batal
      </button>
      {!modeTambah && onHapus && (
        <button
          type="button"
          onClick={onHapus}
          disabled={isPending}
          className="form-admin-btn-hapus"
        >
          Hapus
        </button>
      )}
    </div>
  );
}

/**
 * Pesan error/sukses
 */
export function PesanForm({ error, sukses }) {
  return (
    <>
      {error && <div className="form-admin-error">{error}</div>}
      {sukses && <div className="form-admin-sukses">{sukses}</div>}
    </>
  );
}
