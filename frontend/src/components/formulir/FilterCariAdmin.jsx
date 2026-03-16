/**
 * @fileoverview Form filter dan pencarian untuk toolbar admin
 */

import { SearchableSelectField } from './FormulirAdmin';

function isActiveFilterValue(item) {
  return String(item?.value ?? '').trim() !== '';
}

function FilterCariAdmin({
  nilai,
  onChange,
  onCari,
  onHapus,
  placeholder = 'Cari …',
  filters = [],
}) {
  const daftarFilter = filters || [];
  const hasActiveFilter = typeof daftarFilter.some === 'function'
    ? daftarFilter.some((item) => isActiveFilterValue(item))
    : false;
  const tampilkanReset = String(nilai ?? '').trim() !== '' || hasActiveFilter;

  const handleSubmit = (event) => {
    event.preventDefault();
    onCari(nilai);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center">
      <input
        type="text"
        value={nilai}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="form-admin-input form-admin-toolbar-search px-4"
      />

      {typeof daftarFilter.map === 'function' && daftarFilter.map((item) => {
        const label = item.ariaLabel || item.key;
        const commonClassName = `form-admin-toolbar-control ${isActiveFilterValue(item) ? 'form-admin-filter-active' : ''}`;

        if (item.searchable) {
          return (
            <SearchableSelectField
              key={item.key}
              label={label}
              name={item.key}
              value={item.value ?? ''}
              onChange={(_name, value) => item.onChange(value)}
              options={item.options || []}
              placeholder={item.placeholder || label}
              searchPlaceholder={item.searchPlaceholder || `Cari ${label.toLowerCase()}…`}
              hideLabel
              wrapperClassName="form-admin-toolbar-item"
              buttonClassName={commonClassName}
              fullWidth={false}
            />
          );
        }

        return (
          <select
            key={item.key}
            value={item.value ?? ''}
            onChange={(event) => item.onChange(event.target.value)}
            className={`form-admin-select ${commonClassName}`}
            aria-label={label}
          >
            {(item.options || []).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      })}

      <button
        type="submit"
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
      >
        Cari
      </button>

      {tampilkanReset && (
        <button
          type="button"
          onClick={onHapus}
          className="px-3 py-2 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-sm"
        >
          ✕
        </button>
      )}
    </form>
  );
}

export { isActiveFilterValue };
export default FilterCariAdmin;