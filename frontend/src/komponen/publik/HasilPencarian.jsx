/**
 * @fileoverview Komponen pembungkus hasil pencarian dengan paginasi atas-bawah
 */

import Paginasi from '../bersama/Paginasi';

function HasilPencarian({
  results = [],
  emptyState = null,
  total = 0,
  limit,
  pageInfo,
  currentPage = 1,
  onNavigateCursor,
  containerClassName = '',
  renderItems,
}) {
  if (results.length === 0) {
    return emptyState;
  }

  return (
    <>
      <div className="mb-4">
        <Paginasi
          total={total}
          limit={limit}
          pageInfo={pageInfo}
          currentPage={currentPage}
          onNavigateCursor={onNavigateCursor}
        />
      </div>
      <div className={containerClassName}>
        {renderItems(results)}
      </div>
      <div className="mt-4">
        <Paginasi
          total={total}
          limit={limit}
          pageInfo={pageInfo}
          currentPage={currentPage}
          onNavigateCursor={onNavigateCursor}
        />
      </div>
    </>
  );
}

export default HasilPencarian;
