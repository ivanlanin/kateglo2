/**
 * @fileoverview Navbar navigasi utama dengan pencarian global
 */

import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { buatUrlLoginGoogle, simpanReturnTo } from '../../api/apiAuth';
import KotakCariPublik from '../formulir/KotakCariPublik';

const minimumSearchWidth = 240;
const layoutGapAllowance = 64;
const durasiAnimasiDrawer = 260;

export const menuItems = [
  { path: '/kamus', label: 'Kamus' },
  { path: '/glosarium', label: 'Glosarium' },
  {
    label: 'Referensi',
    submenu: [
      { path: '/artikel', label: 'Artikel' },
      { path: '/gramatika', label: 'Gramatika' },
      { path: '/ejaan', label: 'Ejaan' },
    ],
    pemisahSetelah: true,
  },
  { path: '/alat', label: 'Alat' },
  { path: '/gim', label: 'Gim' },
];

function buatInisial(nama = '') {
  return String(nama || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() || '')
    .join('');
}

function hitungKebutuhanHamburger({
  lebarNavbar = 0,
  lebarLogo = 0,
  lebarMenu = 0,
  tampilkanKotakCari = false,
  elemenBarisUtama = [],
}) {
  const ruangPencarian = tampilkanKotakCari ? minimumSearchWidth : 0;
  const topDasar = elemenBarisUtama[0]?.offsetTop ?? 0;
  const adaWrap = elemenBarisUtama.some((elemen) => elemen.offsetTop > topDasar);

  return adaWrap || (lebarLogo + lebarMenu + ruangPencarian + layoutGapAllowance) > lebarNavbar;
}

function buatKelasNavbar({ adalahBeranda, gunakanHamburger }) {
  return [
    'navbar-inner',
    adalahBeranda && !gunakanHamburger ? 'navbar-inner-beranda' : '',
    adalahBeranda && gunakanHamburger ? 'navbar-inner-beranda-collapsed' : '',
    gunakanHamburger ? 'navbar-inner-collapsed' : 'navbar-inner-compact',
  ].filter(Boolean).join(' ');
}

function NavbarPublik() {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [gunakanHamburger, setGunakanHamburger] = useState(false);
  const [renderDrawer, setRenderDrawer] = useState(false);
  const [drawerAktif, setDrawerAktif] = useState(false);
  const [avatarTerbuka, setAvatarTerbuka] = useState(false);
  const location = useLocation();
  const {
    isLoading,
    isAuthenticated,
    adalahRedaksi,
    user,
    logout,
  } = useAuth();
  const navbarInnerRef = useRef(null);
  const logoRef = useRef(null);
  const searchRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const menuMeasureRef = useRef(null);
  const timerDrawerRef = useRef(null);
  const refAvatar = useRef(null);
  const adalahBeranda = location.pathname === '/';
  const sedangMainSusunKata = location.pathname.startsWith('/gim/susun-kata');
  const tampilkanKotakCari = !adalahBeranda && !sedangMainSusunKata;
  const loginUrl = buatUrlLoginGoogle('');

  const isActive = (path) => (
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  const handleLoginClick = () => {
    simpanReturnTo(`${location.pathname}${location.search}`);
  };

  const handleLogoutClick = (onItemClick = null) => {
    logout();
    onItemClick?.();
  };

  const renderMenu = ({
    containerClassName = '',
    linkClassName = '',
    onItemClick = () => {},
    tampilkanMenu = true,
    tampilkanPemisah = false,
    forwardedRef = null,
  } = {}) => (
    <div ref={forwardedRef} className={containerClassName}>
      {tampilkanMenu && menuItems
        .filter((item) => !item.adminSaja || adalahRedaksi)
        .map((item) => {
          if (item.submenu) {
            if (tampilkanPemisah) {
              // Mobile: flat list tanpa label seksi, separator di atas
              return (
                <Fragment key={item.label}>
                  <hr className="navbar-mobile-separator" aria-hidden="true" />
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={onItemClick}
                      className={`${linkClassName} ${isActive(sub.path) ? 'navbar-menu-link-active' : ''}`.trim()}
                      aria-current={isActive(sub.path) ? 'page' : undefined}
                    >
                      {sub.label}
                    </Link>
                  ))}
                  {item.pemisahSetelah && (
                    <hr className="navbar-mobile-separator" aria-hidden="true" />
                  )}
                </Fragment>
              );
            }
            // Desktop: hover dropdown
            const subAktif = item.submenu.some((sub) => isActive(sub.path));
            return (
              <div key={item.label} className="navbar-dropdown-wrapper">
                <button
                  type="button"
                  className={`${linkClassName} navbar-dropdown-trigger ${subAktif ? 'navbar-menu-link-active' : ''}`.trim()}
                >
                  {item.label}
                  <svg className="navbar-dropdown-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="navbar-dropdown-panel">
                  {item.submenu.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={onItemClick}
                      className={`navbar-dropdown-link ${isActive(sub.path) ? 'navbar-dropdown-link-active' : ''}`.trim()}
                      aria-current={isActive(sub.path) ? 'page' : undefined}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <Fragment key={item.path}>
              <Link
                to={item.path}
                onClick={onItemClick}
                className={`${linkClassName} ${isActive(item.path) ? 'navbar-menu-link-active' : ''}`.trim()}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {item.label}
              </Link>
              {tampilkanPemisah && item.pemisahSetelah && (
                <hr className="navbar-mobile-separator" aria-hidden="true" />
              )}
            </Fragment>
          );
        })}
    </div>
  );

  useEffect(() => {
    let frameId = 0;

    const ukurNavbar = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        const lebarNavbar = Number(navbarInnerRef.current?.clientWidth) || 0;

        if (!lebarNavbar) {
          return;
        }

        const elemenBarisUtama = [logoRef.current, searchRef.current, desktopMenuRef.current].filter(Boolean);
        const butuhHamburger = hitungKebutuhanHamburger({
          lebarNavbar,
          lebarLogo: Number(logoRef.current?.offsetWidth) || 0,
          lebarMenu: Number(menuMeasureRef.current?.scrollWidth) || 0,
          tampilkanKotakCari,
          elemenBarisUtama,
        });

        setGunakanHamburger((sebelumnya) => (sebelumnya === butuhHamburger ? sebelumnya : butuhHamburger));
      });
    };

    ukurNavbar();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
        ukurNavbar();
      });

    [navbarInnerRef.current, logoRef.current, menuMeasureRef.current]
      .filter(Boolean)
      .forEach((elemen) => resizeObserver?.observe(elemen));

    window.addEventListener('resize', ukurNavbar);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      window.removeEventListener('resize', ukurNavbar);
    };
  }, [tampilkanKotakCari]);

  useEffect(() => {
    if (!gunakanHamburger && menuTerbuka) {
      setMenuTerbuka(false);
    }
  }, [gunakanHamburger, menuTerbuka]);

  useEffect(() => {
    clearTimeout(timerDrawerRef.current);
    timerDrawerRef.current = null;

    if (gunakanHamburger && menuTerbuka) {
      setRenderDrawer(true);

      let frameIdKedua = 0;
      const frameId = window.requestAnimationFrame(() => {
        frameIdKedua = window.requestAnimationFrame(() => {
          setDrawerAktif(true);
        });
      });

      return () => {
        window.cancelAnimationFrame(frameId);
        window.cancelAnimationFrame(frameIdKedua);
      };
    }

    if (renderDrawer) {
      setDrawerAktif(false);
      timerDrawerRef.current = setTimeout(() => {
        setRenderDrawer(false);
        timerDrawerRef.current = null;
      }, durasiAnimasiDrawer);
    }

    return () => {
      clearTimeout(timerDrawerRef.current);
      timerDrawerRef.current = null;
    };
  }, [gunakanHamburger, menuTerbuka, renderDrawer]);

  useEffect(() => {
    if (!gunakanHamburger || !renderDrawer || typeof document === 'undefined') {
      return undefined;
    }

    const overflowSebelumnya = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuTerbuka(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflowSebelumnya;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gunakanHamburger, renderDrawer]);

  useEffect(() => () => {
    clearTimeout(timerDrawerRef.current);
  }, []);

  useEffect(() => {
    setAvatarTerbuka(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!avatarTerbuka) return undefined;
    const handleClick = (event) => {
      if (refAvatar.current && !refAvatar.current.contains(event.target)) {
        setAvatarTerbuka(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [avatarTerbuka]);

  return (
    <nav className={`navbar-root ${adalahBeranda ? 'navbar-root-beranda' : ''}`}>
      <div className="navbar-container">
        <div
          ref={navbarInnerRef}
          className={buatKelasNavbar({ adalahBeranda, gunakanHamburger })}
        >
          {/* Hamburger (mobile) */}
          {gunakanHamburger && (
            <button
              type="button"
              onClick={() => setMenuTerbuka(!menuTerbuka)}
              className="navbar-toggle navbar-toggle-visible"
              aria-label="Toggle menu"
            >
              <svg className="navbar-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuTerbuka ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}

          {/* Logo */}
          {!adalahBeranda && (
            <Link
              ref={logoRef}
              to="/"
              className={`navbar-logo ${gunakanHamburger ? 'navbar-logo-collapsed' : ''}`.trim()}
              aria-hidden={gunakanHamburger ? 'true' : undefined}
              tabIndex={gunakanHamburger ? -1 : undefined}
            >
              Kateglo
            </Link>
          )}

          <div ref={menuMeasureRef} className="navbar-menu-measure" aria-hidden="true">
            {renderMenu({
              containerClassName: 'navbar-menu-measure-inner',
              linkClassName: 'navbar-menu-link navbar-menu-link-measure',
            })}
          </div>

          {/* Pencarian */}
          {tampilkanKotakCari && (
            <div
              ref={searchRef}
              className={`navbar-search-desktop ${gunakanHamburger ? 'navbar-search-desktop-collapsed' : 'navbar-search-desktop-expanded'}`}
            >
              <KotakCariPublik varian="navbar" />
            </div>
          )}

          {/* Menu (desktop) */}
          {renderMenu({
            forwardedRef: desktopMenuRef,
            containerClassName: `navbar-menu-desktop ${gunakanHamburger ? 'navbar-menu-desktop-hidden' : 'navbar-menu-desktop-visible'}`,
            linkClassName: 'navbar-menu-link',
          })}

          {/* Auth — selalu tampil */}
          {isLoading ? (
            <span className="navbar-auth-loading">Memuat …</span>
          ) : isAuthenticated ? (
            <div ref={refAvatar} className="navbar-avatar-wrapper">
              <button
                type="button"
                className="navbar-avatar-btn"
                aria-label={user?.name || 'Profil'}
                onClick={() => setAvatarTerbuka((v) => !v)}
              >
                {buatInisial(user?.name) ? (
                  <span className="navbar-avatar-fallback" aria-hidden="true">{buatInisial(user?.name)}</span>
                ) : (
                  <svg className="navbar-avatar-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
                {user?.picture && (
                  <img src={user.picture} alt="" className="navbar-avatar-img" referrerPolicy="no-referrer" />
                )}
              </button>
              <div className={`navbar-dropdown-panel ${avatarTerbuka ? 'navbar-dropdown-panel-open' : ''}`}>
                {user?.name && <span className="navbar-avatar-name">{user.name}</span>}
                {adalahRedaksi && (
                  <a href="/redaksi" className="navbar-dropdown-link">Redaksi</a>
                )}
                <button
                  type="button"
                  onClick={() => handleLogoutClick(() => { setAvatarTerbuka(false); setMenuTerbuka(false); })}
                  className="navbar-dropdown-link"
                >
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <a href={loginUrl} onClick={handleLoginClick} className="navbar-masuk-btn" aria-label="Masuk">
              <svg className="navbar-avatar-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </a>
          )}
        </div>

        {/* Menu mobile */}
        {gunakanHamburger && renderDrawer && (
          <div
            className={`navbar-mobile-overlay ${drawerAktif ? 'navbar-mobile-overlay-active' : 'navbar-mobile-overlay-closing'}`}
            onClick={() => setMenuTerbuka(false)}
          >
            <div
              className={`navbar-mobile-panel ${drawerAktif ? 'navbar-mobile-panel-active' : 'navbar-mobile-panel-closing'}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi"
            >
              <div className="navbar-mobile-panel-header">
                <Link
                  to="/"
                  className="navbar-mobile-brand"
                  onClick={() => setMenuTerbuka(false)}
                >
                  Kateglo
                </Link>
                <button
                  type="button"
                  className="navbar-mobile-close"
                  onClick={() => setMenuTerbuka(false)}
                  aria-label="Tutup menu"
                >
                  <svg className="navbar-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {renderMenu({
                containerClassName: 'navbar-mobile-links',
                linkClassName: 'navbar-mobile-link',
                onItemClick: () => setMenuTerbuka(false),
                tampilkanPemisah: true,
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export const __private = {
  hitungKebutuhanHamburger,
  buatKelasNavbar,
};

export default NavbarPublik;
