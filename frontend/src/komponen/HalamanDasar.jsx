/**
 * @fileoverview Komponen layout dasar halaman konten
 */

function HalamanDasar({ judul, children }) {
  return (
    <div className="container mx-auto px-4 py-8">
      {judul && <h1 className="page-title">{judul}</h1>}
      {children}
    </div>
  );
}

export default HalamanDasar;
