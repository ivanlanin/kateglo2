/**
 * @fileoverview Navbar navigasi utama dengan pencarian global
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import KotakCari from './KotakCari';
import MenuUtama from './MenuUtama';

const minimumSearchWidth = 240;
const layoutGapAllowance = 64;
const durasiAnimasiDrawer = 260;

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
  const location = useLocation();
  const navbarInnerRef = useRef(null);
  const logoRef = useRef(null);
  const searchRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const menuMeasureRef = useRef(null);
  const timerDrawerRef = useRef(null);
  const adalahBeranda = location.pathname === '/';
  const sedangMainSusunKata = location.pathname.startsWith('/gim/susun-kata');
  const tampilkanKotakCari = !adalahBeranda && !sedangMainSusunKata;

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
            <Link ref={logoRef} to="/" className="navbar-logo">
              Kateglo
            </Link>
          )}

          <div ref={menuMeasureRef} className="navbar-menu-measure" aria-hidden="true">
            <MenuUtama
              containerClassName="navbar-menu-measure-inner"
              linkClassName="navbar-menu-link navbar-menu-link-measure"
              loadingClassName="navbar-auth-loading"
            />
          </div>

          {/* Pencarian */}
          {tampilkanKotakCari && (
            <div
              ref={searchRef}
              className={`navbar-search-desktop ${gunakanHamburger ? 'navbar-search-desktop-collapsed' : 'navbar-search-desktop-expanded'}`}
            >
              <KotakCari varian="navbar" />
            </div>
          )}

          {/* Menu (desktop) */}
          <MenuUtama
            ref={desktopMenuRef}
            containerClassName={`navbar-menu-desktop ${gunakanHamburger ? 'navbar-menu-desktop-hidden' : 'navbar-menu-desktop-visible'}`}
            linkClassName="navbar-menu-link"
            loadingClassName="navbar-auth-loading"
          />
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
                <span className="navbar-mobile-title">Menu</span>
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
              <MenuUtama
                containerClassName="navbar-mobile-links"
                linkClassName="navbar-mobile-link"
                loadingClassName="navbar-auth-loading"
                onItemClick={() => setMenuTerbuka(false)}
                tampilkanAutentikasi={false}
              />
              <MenuUtama
                containerClassName="navbar-mobile-auth"
                linkClassName="navbar-mobile-link"
                loadingClassName="navbar-auth-loading"
                onItemClick={() => setMenuTerbuka(false)}
                tampilkanMenu={false}
              />
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
