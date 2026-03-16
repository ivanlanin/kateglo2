import { lazy } from 'react';

const IzinAdmin = lazy(() => import('./IzinAdmin'));
const PenggunaAdmin = lazy(() => import('./PenggunaAdmin'));
const PeranAdmin = lazy(() => import('./PeranAdmin'));

export {
  IzinAdmin,
  PenggunaAdmin,
  PeranAdmin,
};