/**
 * @fileoverview Tata letak publik untuk route utama Kateglo
 */

import { useEffect } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import NavbarPublik from '../navigasi/NavbarPublik';
import HalamanDasar from './HalamanDasar';

function TataLetakPublik() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const adalahBeranda = location.pathname === '/';

  useEffect(() => {
    if (navigationType === 'POP' || location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.hash, location.pathname, location.search, navigationType]);

  return (
    <HalamanDasar
      mode="publik"
      navbar={<NavbarPublik />}
      konten={(
          <main className={`kateglo-main-content ${adalahBeranda ? 'kateglo-main-content-beranda' : ''}`}>
            <Outlet />
          </main>
      )}
    />
  );
}

export default TataLetakPublik;
