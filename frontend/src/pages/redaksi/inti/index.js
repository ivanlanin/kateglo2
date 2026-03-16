import { lazy } from 'react';
import LoginAdmin from './LoginAdmin';

const DasborAdmin = lazy(() => import('./DasborAdmin'));

export {
  DasborAdmin,
  LoginAdmin,
};