/**
 * @fileoverview Tata letak publik untuk route utama Kateglo
 */

import { Outlet, useLocation } from 'react-router-dom';
import NavbarPublik from '../publik/NavbarPublik';
import { useAuthOptional } from '../../context/authContext';
import KerangkaKateglo from './KerangkaKateglo';

function TataLetakPublik() {
  const location = useLocation();
  const auth = useAuthOptional();
  const adalahRedaksi = Boolean(auth?.adalahRedaksi);
  const adalahBeranda = location.pathname === '/';

  return (
    <KerangkaKateglo
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
