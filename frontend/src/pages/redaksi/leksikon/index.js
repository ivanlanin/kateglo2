import { lazy } from 'react';

const KamusAdmin = lazy(() => import('./KamusAdmin'));
const KataHariIniAdmin = lazy(() => import('./KataHariIniAdmin'));
const TesaurusAdmin = lazy(() => import('./TesaurusAdmin'));
const GlosariumAdmin = lazy(() => import('./GlosariumAdmin'));
const EtimologiAdmin = lazy(() => import('./EtimologiAdmin'));

export {
  EtimologiAdmin,
  GlosariumAdmin,
  KamusAdmin,
  KataHariIniAdmin,
  TesaurusAdmin,
};