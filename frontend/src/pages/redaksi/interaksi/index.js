import { lazy } from 'react';

const KomentarAdmin = lazy(() => import('./KomentarAdmin'));
const PencarianAdmin = lazy(() => import('./PencarianAdmin'));
const PencarianHitamAdmin = lazy(() => import('./PencarianHitamAdmin'));

export {
  KomentarAdmin,
  PencarianAdmin,
  PencarianHitamAdmin,
};