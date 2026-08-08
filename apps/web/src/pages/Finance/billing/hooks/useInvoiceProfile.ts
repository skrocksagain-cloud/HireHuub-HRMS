import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../services/invoiceService';
import { permissionService } from '../../../../core/permissions/permissionService';
import type { Invoice, InvoiceStatus, RecordClientPaymentInput } from '../../../../types/Invoice';

export interface UseInvoiceProfileReturn {
  invoice: Invoice | null;
  loading: boolean;
  error: string;
  actionSuccess: string;
  actionError: string;
  hasFinanceAccess: boolean;
  hasWriteAccess: boolean;
  reload: () => Promise<void>;
  updateStatus: (newStatus: InvoiceStatus, actorName: string) => Promise<void>;
  recordPayment: (input: RecordClientPaymentInput, actorName: string) => Promise<void>;
}

export function useInvoiceProfile(invoiceId: string | undefined, userRole: string): UseInvoiceProfileReturn {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  const hasFinanceAccess = permissionService.canAccessFinance(userRole);
  const hasWriteAccess = permissionService.canWriteFinance(userRole);

  const reload = useCallback(async () => {
    if (!invoiceId) return;
    if (!hasFinanceAccess) {
      setError('Access Restricted: You do not have permission to view Finance records.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await invoiceService.getInvoice(invoiceId);
      if (!data) {
        setError(`Invoice '${invoiceId}' was not found.`);
      } else {
        setInvoice(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice profile.');
    } finally {
      setLoading(false);
    }
  }, [invoiceId, hasFinanceAccess]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateStatus = async (newStatus: InvoiceStatus, actorName: string): Promise<void> => {
    if (!invoiceId) return;
    if (!hasWriteAccess) throw new Error('Permission Denied: Full Finance Access required to update invoice status.');
    setActionError('');
    setActionSuccess('');
    try {
      await invoiceService.updateStatus(invoiceId, newStatus, actorName);
      setActionSuccess(`Invoice status updated to ${newStatus}.`);
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update invoice status.';
      setActionError(msg);
      throw err;
    }
  };

  const recordPayment = async (input: RecordClientPaymentInput, actorName: string): Promise<void> => {
    if (!invoiceId) return;
    if (!hasWriteAccess) throw new Error('Permission Denied: Full Finance Access required to record client payments.');
    setActionError('');
    setActionSuccess('');
    try {
      await invoiceService.recordClientPayment(invoiceId, input, actorName, userRole);
      setActionSuccess(`Payment of ₹${input.amountReceived.toLocaleString('en-IN')} recorded successfully.`);
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment.';
      setActionError(msg);
      throw err;
    }
  };

  return {
    invoice,
    loading,
    error,
    actionSuccess,
    actionError,
    hasFinanceAccess,
    hasWriteAccess,
    reload,
    updateStatus,
    recordPayment,
  };
}
