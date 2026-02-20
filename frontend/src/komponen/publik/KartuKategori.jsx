/**
 * @fileoverview Kartu kategori reusable untuk halaman publik
 */

import { Link } from 'react-router-dom';

function KartuKategori({
  judul,
  items = [],
  getKey,
  getTo,
  getLabel,
  className = 'beranda-feature-card text-center',
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="beranda-info-title">{judul}</h3>
      <div className="flex flex-wrap justify-center gap-2">
        {items.map((item, index) => (
          <Link
            key={getKey(item, index)}
            to={getTo(item, index)}
            className="beranda-tag-link"
          >
            {getLabel(item, index)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default KartuKategori;