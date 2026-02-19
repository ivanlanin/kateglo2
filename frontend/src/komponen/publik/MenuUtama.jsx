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
  { path: '/redaksi', label: 'Redaksi', adminSaja: true },
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
            className={linkClassName}
          >
            {item.label}
          </Link>
        ))}

      {tampilkanAutentikasi && (isLoading ? (
        <span className={loadingClassName}>Memuat...</span>
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
