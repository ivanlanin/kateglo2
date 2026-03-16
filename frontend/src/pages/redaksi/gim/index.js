import { lazy } from 'react';

const KuisKataAdmin = lazy(() => import('./KuisKataAdmin'));
const SusunKataBebasAdmin = lazy(() => import('./SusunKataBebasAdmin'));
const SusunKataHarianAdmin = lazy(() => import('./SusunKataHarianAdmin'));

export {
  KuisKataAdmin,
  SusunKataBebasAdmin,
  SusunKataHarianAdmin,
};