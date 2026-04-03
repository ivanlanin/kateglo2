/**
 * @fileoverview Tab navigasi antar-mode pencarian kata (Kamus, Tesaurus, Makna, Rima)
 */

import { Link, useLocation, useParams } from 'react-router-dom';

const tabList = [
  { path: '/kamus', label: 'Kamus', searchBase: '/kamus/cari' },
  { path: '/tesaurus', label: 'Tesaurus', searchBase: '/tesaurus/cari' },
  { path: '/makna', label: 'Makna', searchBase: '/makna/cari' },
  { path: '/rima', label: 'Rima', searchBase: '/rima/cari' },
];

function TabKamus() {
  const location = useLocation();
  const { kata, indeks } = useParams();
  const kataAktif = kata || indeks || '';

  const adaCari = location.pathname.includes('/cari/');

  const tabAktif = (tabList.find(
    (tab) => location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`),
  ) || tabList[0]).path;

  if (!adaCari) return null;

  const buatPath = (tab) => (
    kataAktif
      ? `${tab.searchBase}/${encodeURIComponent(kataAktif)}`
      : tab.path
  );

  return (
    <nav className="kamus-tab-nav" aria-label="Mode pencarian kata">
      {tabList.map((tab) => (
        <Link
          key={tab.path}
          to={buatPath(tab)}
          className={`kamus-tab-link ${tabAktif === tab.path ? 'kamus-tab-link-active' : ''}`}
          aria-current={tabAktif === tab.path ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export default TabKamus;
