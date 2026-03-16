import { lazy } from 'react';

const KamusAdmin = lazy(() => import('./KamusAdmin'));
const TesaurusAdmin = lazy(() => import('./TesaurusAdmin'));
const GlosariumAdmin = lazy(() => import('./GlosariumAdmin'));
const EtimologiAdmin = lazy(() => import('./EtimologiAdmin'));

export {
  EtimologiAdmin,
  GlosariumAdmin,
  KamusAdmin,
  TesaurusAdmin,
};