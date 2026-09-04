import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../services/invoiceService';
import { clientService } from '../../../Workbench/Network/clients/services/clientService';
import { canReadFinanceGlobally, type FinanceAuthorizationContext } from '../../../../core/authorization/financeAuthorization';
import type { Invoice, InvoiceStatus, RecordClientPaymentInput, CreateInvoiceDraftInput, InvoiceDocumentStorage } from '../../../../types/Invoice';

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
  updateDraft: (updates: Partial<Invoice>, actorName: string) => Promise<void>;
  generatePDF: (actorName: string) => Promise<InvoiceDocumentStorage | undefined>;
  approveInvoice: (actorName: string) => Promise<void>;
  recordPayment: (input: RecordClientPaymentInput, actorName: string) => Promise<void>;
}

export function useInvoiceProfile(invoiceId: string | undefined, actor: FinanceAuthorizationContext): UseInvoiceProfileReturn {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  const hasFinanceAccess = canReadFinanceGlobally(actor);
  const hasWriteAccess = canReadFinanceGlobally(actor);

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
      const data = await invoiceService.getInvoice(invoiceId, actor);
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
      await invoiceService.updateStatus(invoiceId, newStatus, actorName, '', actor);
      setActionSuccess(`Invoice status updated to ${newStatus}.`);
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update invoice status.';
      setActionError(msg);
      throw err;
    }
  };

  const updateDraft = async (updates: Partial<Invoice>, actorName: string): Promise<void> => {
    if (!invoiceId || !invoice) return;
    if (!hasWriteAccess) throw new Error('Permission Denied to edit invoice.');
    setActionError('');
    setActionSuccess('');
    try {
      const inputPayload: CreateInvoiceDraftInput = {
        clientId: invoice.clientId,
        clientName: invoice.clientName || invoice.snapshot?.client?.clientName || 'Client Name',
        invoiceDate: updates.invoiceDate || invoice.invoiceDate,
        lineItems: (updates.lineItems || invoice.lineItems).map(item => ({
          description: item.description || (item as any).itemDescription || 'Services Rendered',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
        })),
        poNumber: updates.poNumber ?? invoice.poNumber,
        remarks: updates.remarks ?? invoice.remarks,
        taxableAmount: updates.taxableAmount,
        gstAmount: updates.gstAmount,
        grandTotal: updates.grandTotal,
      };
      await invoiceService.updateDraft(invoiceId, inputPayload, actorName, actor);
      setActionSuccess('Invoice updated successfully.');
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update invoice draft.';
      setActionError(msg);
      throw err;
    }
  };

  const generatePDF = async (actorName: string): Promise<InvoiceDocumentStorage | undefined> => {
    if (!invoiceId || !invoice) return;
    if (!hasWriteAccess) throw new Error('Permission Denied to generate PDF.');
    setActionError('');
    setActionSuccess('');
    try {
      const fetchedClient = await clientService.getClientById(invoice.clientId);
      if (!fetchedClient) throw new Error('Invoice generation requires an active client record from Workbench.');
      const primaryGst = (fetchedClient as any).gstinRecords?.[0];
      const billingAddress = primaryGst?.billingAddress || fetchedClient.billingAddress;
      const gstin = primaryGst?.gstin || fetchedClient.gstin;
      const billingState = primaryGst?.stateName || billingAddress?.state;
      if (!fetchedClient.name || !gstin || !billingAddress?.line1 || !billingState) {
        throw new Error('Invoice generation requires complete client GST and billing-address data in Workbench.');
      }
      const clientPayload = {
        clientId: fetchedClient.id, clientName: fetchedClient.name, gstin,
        billingAddress: { line1: billingAddress.line1, line2: billingAddress.line2 || '', city: billingAddress.city || '', state: billingAddress.state || '', postalCode: billingAddress.postalCode || '', country: billingAddress.country || '' },
        billingState,
      };

      const docStorage = await invoiceService.generate(invoiceId, clientPayload, actorName, actor);
      setActionSuccess('Invoice PDF generated successfully.');
      await reload();
      return docStorage;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF.';
      setActionError(msg);
      throw err;
    }
  };

  const approveInvoice = async (actorName: string): Promise<void> => {
    if (!invoiceId) return;
    if (!hasWriteAccess) throw new Error('Permission Denied: Full Finance Access required to approve invoice.');
    setActionError('');
    setActionSuccess('');
    try {
      await invoiceService.approveInvoice(invoiceId, actorName, actor);
      setActionSuccess('Invoice officially approved and locked.');
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve invoice.';
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
      await invoiceService.recordClientPayment(invoiceId, input, actorName, actor.role || '', actor);
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
    updateDraft,
    generatePDF,
    approveInvoice,
    recordPayment,
  };
}
