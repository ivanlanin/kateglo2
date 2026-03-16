/**
 * @fileoverview Tabel admin generik dengan dukungan paginasi cursor dan offset
 */

import Paginasi from '../navigasi/Paginasi';

function TabelAdmin({
  kolom,
  data,
  isLoading,
  isError,
  kunciId = 'id',
  total = 0,
  limit,
  offset,
  onOffset,
  pageInfo,
  currentPage,
  onNavigateCursor,
  onKlikBaris,
}) {
  const baseThClass =
    'px-6 py-3 text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider';
  const baseTdClass = 'px-6 py-3 text-sm text-gray-700 dark:text-gray-300';
  const getAlignClass = (align) => (align === 'center' ? 'text-center' : 'text-left');
  const handlerCursor = onNavigateCursor
    ? (action) => onNavigateCursor(action, { pageInfo, total })
    : (pageInfo ? onOffset : null);
  const tampilkanPaginasi = total > 0 && limit && (onOffset || handlerCursor);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
        Memuat data …
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-red-600 dark:text-red-400">
        Gagal memuat data.
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400">
        Tidak ada data.
      </div>
    );
  }

  return (
    <>
      {tampilkanPaginasi && (
        <div className="mb-4">
          <Paginasi
            total={total}
            limit={limit}
            offset={offset}
            onChange={handlerCursor ? undefined : onOffset}
            pageInfo={pageInfo}
            currentPage={currentPage}
            onNavigateCursor={handlerCursor || undefined}
          />
        </div>
      )}

      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-dark-bg/80">
              <tr>
                {kolom.map((k) => (
                  <th key={k.key} className={`${baseThClass} ${getAlignClass(k.align)}`}>
                    {k.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-dark-bg-elevated dark:divide-gray-700">
              {data.map((item, index) => (
                <tr
                  key={item[kunciId] ?? `row-${index}`}
                  onClick={onKlikBaris ? () => onKlikBaris(item) : undefined}
                  className={`hover:bg-gray-50 dark:hover:bg-dark-bg${onKlikBaris ? ' cursor-pointer' : ''}`}
                >
                  {kolom.map((k) => (
                    <td key={k.key} className={`${baseTdClass} ${getAlignClass(k.align)}`}>
                      {k.render ? k.render(item) : (item[k.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default TabelAdmin;