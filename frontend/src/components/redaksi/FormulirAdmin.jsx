/**
 * @fileoverview Komponen formulir bersama untuk panel admin
 * Menyediakan input, select, textarea, dan hook useFormPanel
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
 * Grup select dengan pencarian lokal untuk daftar opsi panjang
 */
export function SearchableSelectField({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  required = false,
  placeholder = 'Pilih opsi',
  searchPlaceholder = 'Ketik untuk mencari…',
  emptySearchText = 'Tidak ada hasil.',
  hideLabel = false,
  wrapperClassName = '',
  buttonClassName = '',
}) {
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value ?? '')) || null,
    [options, value]
  );
  const [query, setQuery] = useState('');
  const [tampilDropdown, setTampilDropdown] = useState(false);

  useEffect(() => {
    if (!tampilDropdown) return undefined;

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [tampilDropdown]);

  useEffect(() => {
    if (!tampilDropdown) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setTampilDropdown(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [tampilDropdown]);

  const opsiTersaring = useMemo(() => {
    const kataKunci = String(query || '').trim().toLowerCase();
    if (!kataKunci) return options;

    return options.filter((opt) => {
      const labelOpsi = String(opt?.label || '').toLowerCase();
      const valueOpsi = String(opt?.value || '').toLowerCase();
      return labelOpsi.includes(kataKunci) || valueOpsi.includes(kataKunci);
    });
  }, [options, query]);

  const pilihOpsi = (selectedValue) => {
    onChange(name, selectedValue);
    setTampilDropdown(false);
    setQuery('');
  };

  const handleToggleDropdown = () => {
    setTampilDropdown((prev) => {
      const next = !prev;
      if (!next) setQuery('');
      return next;
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setTampilDropdown(false);
      setQuery('');
      return;
    }

    if (event.key === 'Enter' && opsiTersaring.length > 0) {
      event.preventDefault();
      pilihOpsi(opsiTersaring[0].value);
    }
  };

  return (
    <div ref={wrapperRef} className={`form-admin-group relative ${wrapperClassName}`.trim()}>
      {hideLabel ? <span className="sr-only">{label}</span> : <label className="form-admin-label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>}
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={tampilDropdown}
        onClick={handleToggleDropdown}
        disabled={disabled}
        className={`form-admin-select flex w-full items-center justify-between gap-2 text-left ${buttonClassName}`.trim()}
      >
        <span className={selectedOption ? 'text-inherit' : 'text-gray-400 dark:text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{tampilDropdown ? '▴' : '▾'}</span>
      </button>
      {tampilDropdown && !disabled && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-dark-bg-elevated">
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              aria-label={`Cari ${label}`}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="form-admin-input"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1" role="listbox" aria-label={`Opsi ${label}`}>
            {opsiTersaring.length > 0 ? (
              opsiTersaring.map((opt) => {
                const isSelected = String(opt.value) === String(value ?? '');
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pilihOpsi(opt.value)}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptySearchText}</div>
            )}
          </div>
        </div>
      )}
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
 * Toggle meragukan/pasti
 */
export function ToggleMeragukan({ value, onChange, disabled }) {
  return (
    <div className="form-admin-group">
      <label className="form-admin-label">Meragukan</label>
      <button
        type="button"
        onClick={() => onChange('meragukan', value ? 0 : 1)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
        {value ? 'Ragu' : 'Pasti'}
      </span>
    </div>
  );
}

/**
 * Grup checkbox tunggal
 */
export function CheckboxField({ label, name, value, onChange, disabled }) {
  return (
    <div className="form-admin-group flex-row items-center gap-2">
      <input
        type="checkbox"
        id={`field-${name}`}
        checked={Boolean(value)}
        onChange={(e) => onChange(name, e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <label htmlFor={`field-${name}`} className="form-admin-label mb-0 cursor-pointer">
        {label}
      </label>
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
