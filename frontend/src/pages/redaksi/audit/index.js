import { lazy } from 'react';

const AuditMaknaAdmin = lazy(() => import('./AuditMaknaAdmin'));
const AuditTagarAdmin = lazy(() => import('./AuditTagarAdmin'));

export {
  AuditMaknaAdmin,
  AuditTagarAdmin,
};