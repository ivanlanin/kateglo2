/**
 * @fileoverview Komponen menu navigasi utama (link + auth) yang dapat dipakai ulang
 */

import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { buatUrlLoginGoogle, simpanReturnTo } from '../../api/apiAuth';

export const menuItems = [
  { path: '/kamus', label: 'Kamus' },
  { path: '/tesaurus', label: 'Tesaurus' },
  { path: '/glosarium', label: 'Glosarium' },
  { path: '/makna', label: 'Makna' },
  { path: '/rima', label: 'Rima' },
  { path: '/ejaan', label: 'Ejaan' },
  { path: '/gim/susun-kata', label: 'Gim' },
];

function MenuUtama({
  containerClassName = '',
  linkClassName = '',
  loadingClassName = '',
  onItemClick = () => {},
  tampilkanMenu = true,
  tampilkanAutentikasi = true,
}) {
  const location = useLocation();
  const {
    isLoading,
    isAuthenticated,
    adalahRedaksi,
    logout,
  } = useAuth();
  const loginUrl = buatUrlLoginGoogle('');

  const isActive = (path) => (
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  const handleLoginClick = () => {
    simpanReturnTo(`${location.pathname}${location.search}`);
    onItemClick();
  };

  const handleLogoutClick = () => {
    logout();
    onItemClick();
  };

  return (
    <div className={containerClassName}>
      {tampilkanMenu && menuItems
        .filter((item) => !item.adminSaja || adalahRedaksi)
        .map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={`${linkClassName} ${isActive(item.path) ? 'navbar-menu-link-active' : ''}`.trim()}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}

      {tampilkanAutentikasi && (isLoading ? (
        <span className={loadingClassName}>Memuat …</span>
      ) : isAuthenticated ? (
        <button
          type="button"
          onClick={handleLogoutClick}
          className={linkClassName}
        >
          Keluar
        </button>
      ) : (
        <a
          href={loginUrl}
          onClick={handleLoginClick}
          className={linkClassName}
        >
          Masuk
        </a>
      ))}
    </div>
  );
}

MenuUtama.propTypes = {
  containerClassName: PropTypes.string,
  linkClassName: PropTypes.string,
  loadingClassName: PropTypes.string,
  onItemClick: PropTypes.func,
  tampilkanMenu: PropTypes.bool,
  tampilkanAutentikasi: PropTypes.bool,
};

export default MenuUtama;
