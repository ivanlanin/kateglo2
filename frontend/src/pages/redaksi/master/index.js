import { lazy } from 'react';

const BahasaAdmin = lazy(() => import('./BahasaAdmin'));
const BidangAdmin = lazy(() => import('./BidangAdmin'));
const LabelAdmin = lazy(() => import('./LabelAdmin'));
const SumberAdmin = lazy(() => import('./SumberAdmin'));
const TagarAdmin = lazy(() => import('./TagarAdmin'));

export {
  BahasaAdmin,
  BidangAdmin,
  LabelAdmin,
  SumberAdmin,
  TagarAdmin,
};