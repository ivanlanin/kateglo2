/**
 * @fileoverview Kartu kategori reusable untuk halaman publik
 */

import { Link } from 'react-router-dom';

function KartuKategori({
  judul,
  judulTo,
  items = [],
  getKey,
  getTo,
  getLabel,
  className = 'beranda-feature-card text-center',
}) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="beranda-info-title">
        {judulTo ? (
          <Link to={judulTo} className="hover:underline underline-offset-4">
            {judul}
          </Link>
        ) : (
          judul
        )}
      </h3>
      <div className="kategori-card-chip-list">
        {items.map((item, index) => (
          <Link
            key={getKey(item, index)}
            to={getTo(item, index)}
            className="kategori-card-chip-link"
          >
            {getLabel(item, index)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default KartuKategori;