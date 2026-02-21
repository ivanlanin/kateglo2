/**
 * @fileoverview Komponen checklist pilihan untuk panel admin (flat atau berkelompok)
 */

function ItemChecklist({ item, checked, onToggle }) {
  return (
    <label
      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        <span className="font-medium">{item.nama}</span>
      </span>
    </label>
  );
}

function KotakCentang({
  label,
  isLoading = false,
  loadingText,
  groups,
  items,
  hasSelected,
  onToggle,
}) {
  return (
    <div className="form-admin-group">
      <label className="form-admin-label">{label}</label>
      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{loadingText}</p>
      ) : Array.isArray(groups) && groups.length > 0 ? (
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group.key} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{group.title}</p>
              <div className="mt-2 space-y-2">
                {(group.items || []).map((item) => (
                  <ItemChecklist
                    key={item.id}
                    item={item}
                    checked={hasSelected(item.id)}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          {(items || []).map((item) => (
            <ItemChecklist
              key={item.id}
              item={item}
              checked={hasSelected(item.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default KotakCentang;
