import { getAuthorizationScope, type CanonicalRole, type SimplifiedModuleScope } from './authorizationResolver';

export interface FinanceAuthorizationContext {
  role?: CanonicalRole | string | null;
  employeeId?: string | null;
  departmentId?: string | null;
}

/** Finance has no verified department key for invoices, credit notes, or payroll runs. */
export const getFinanceScope = (actor?: FinanceAuthorizationContext): SimplifiedModuleScope => {
  if (getAuthorizationScope(actor?.role) === 'GLOBAL') return 'GLOBAL';
  if (getAuthorizationScope(actor?.role) === 'DEPARTMENT') return 'DEPARTMENT';
  return 'SELF';
};

export const canReadFinanceGlobally = (actor?: FinanceAuthorizationContext): boolean =>
  getFinanceScope(actor) === 'GLOBAL';
