/**
 * @fileoverview Tata letak publik untuk route utama Kateglo
 */

import { Outlet, useLocation } from 'react-router-dom';
import NavbarPublik from '../navigasi/NavbarPublik';
import { useAuthOptional } from '../../context/authContext';
import HalamanDasar from './HalamanDasar';

function TataLetakPublik() {
  const location = useLocation();
  const auth = useAuthOptional();
  const adalahRedaksi = Boolean(auth?.adalahRedaksi);
  const adalahBeranda = location.pathname === '/';

  return (
    <HalamanDasar
      mode="publik"
      adalahRedaksi={adalahRedaksi}
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
