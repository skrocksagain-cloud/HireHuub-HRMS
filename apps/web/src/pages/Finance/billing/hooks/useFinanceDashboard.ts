import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../services/invoiceService';
import { creditNoteService } from '../services/creditNoteService';
import { permissionService } from '../../../../core/permissions/permissionService';
import type { Invoice } from '../../../../types/Invoice';
import type { CreditNote } from '../../../../types/CreditNote';

export interface FinanceDashboardKpis {
  totalInvoicesCount: number;
  totalInvoicesAmount: number;
  draftInvoicesCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  outstandingAmount: number;
  totalRevenue: number;
  totalPaymentsReceived: number;
  creditNotesCount: number;
  creditNotesAmount: number;
  pendingCollectionsAmount: number;
}

export interface UseFinanceDashboardReturn {
  kpis: FinanceDashboardKpis;
  invoices: Invoice[];
  creditNotes: CreditNote[];
  loading: boolean;
  error: string;
  hasAccess: boolean;
  refresh: () => Promise<void>;
}

export function useFinanceDashboard(userRole: string): UseFinanceDashboardReturn {
  const hasAccess = permissionService.canAccessFinance(userRole);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [kpis, setKpis] = useState<FinanceDashboardKpis>({
    totalInvoicesCount: 0,
    totalInvoicesAmount: 0,
    draftInvoicesCount: 0,
    partiallyPaidCount: 0,
    paidCount: 0,
    outstandingAmount: 0,
    totalRevenue: 0,
    totalPaymentsReceived: 0,
    creditNotesCount: 0,
    creditNotesAmount: 0,
    pendingCollectionsAmount: 0,
  });

  const refresh = useCallback(async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [invList, cnList] = await Promise.all([
        invoiceService.getInvoiceHistory().catch(() => []),
        creditNoteService.getCreditNoteHistory().catch(() => []),
      ]);

      setInvoices(invList);
      setCreditNotes(cnList);

      const totalInvoicesCount = invList.length;
      const totalInvoicesAmount = invList.reduce((s, i) => s + (i.snapshot?.grandTotal || 0), 0);
      const draftInvoicesCount = invList.filter((i) => i.status === 'Draft').length;
      const partiallyPaidCount = invList.filter((i) => i.status === 'Partially Paid').length;
      const paidCount = invList.filter((i) => i.status === 'Paid').length;

      const totalPaymentsReceived = invList.reduce((s, i) => s + (i.totalAmountReceived || 0), 0);
      const totalRevenue = invList.reduce((s, i) => s + (i.totalRevenue || (i.totalAmountReceived || 0) - (i.totalCandidatePay || 0)), 0);
      const outstandingAmount = invList.reduce((s, i) => s + (i.outstandingAmount || 0), 0);
      const pendingCollectionsAmount = invList
        .filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled')
        .reduce((s, i) => s + (i.outstandingAmount || (i.snapshot?.grandTotal || 0)), 0);

      const creditNotesCount = cnList.length;
      const creditNotesAmount = cnList
        .filter((c) => c.status === 'Applied' || c.status === 'Issued')
        .reduce((s, c) => s + (c.snapshot?.grandTotal || 0), 0);

      setKpis({
        totalInvoicesCount,
        totalInvoicesAmount,
        draftInvoicesCount,
        partiallyPaidCount,
        paidCount,
        outstandingAmount,
        totalRevenue,
        totalPaymentsReceived,
        creditNotesCount,
        creditNotesAmount,
        pendingCollectionsAmount,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load Finance Dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    kpis,
    invoices,
    creditNotes,
    loading,
    error,
    hasAccess,
    refresh,
  };
}
