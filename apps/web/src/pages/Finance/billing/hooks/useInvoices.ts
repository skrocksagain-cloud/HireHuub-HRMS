import { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../services/invoiceService';
import { billingService } from '../services/billingService';
import { clientService, type ResolvedClientBilling } from '../../../Workbench/Network/clients/services/clientService';
import { permissionService } from '../../../../core/permissions/permissionService';
import type { Invoice, CreateInvoiceDraftInput, RecordClientPaymentInput, InvoiceDocumentStorage } from '../../../../types/Invoice';
import type { Client } from '../../../../types/Client';

export interface UseInvoicesReturn {
  invoices: Invoice[];
  loading: boolean;
  error: string;
  clientMasterList: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedStateName: string;
  setSelectedStateName: (state: string) => void;
  resolvedBilling: ResolvedClientBilling | null;
  previewInvoiceNumber: string;
  hasFinanceAccess: boolean;
  hasWriteAccess: boolean;
  hasReportAccess: boolean;
  loadInvoices: () => Promise<void>;
  createDraft: (input: CreateInvoiceDraftInput, actorName: string) => Promise<{ id: string; invoiceNumber: string }>;
  generateInvoice: (invoiceId: string, actorName: string) => Promise<InvoiceDocumentStorage>;
  recordClientPayment: (invoiceId: string, input: RecordClientPaymentInput, actorName: string) => Promise<void>;
}

export function useInvoices(userRole: string, defaultClientId?: string): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [clientMasterList, setClientMasterList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || '');
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [resolvedBilling, setResolvedBilling] = useState<ResolvedClientBilling | null>(null);
  const [previewInvoiceNumber, setPreviewInvoiceNumber] = useState<string>('HH2026-0001');

  const hasFinanceAccess = permissionService.canAccessFinance(userRole);
  const hasWriteAccess = permissionService.canWriteFinance(userRole);
  const hasReportAccess = permissionService.canReadFinanceReports(userRole);

  const loadInvoices = useCallback(async () => {
    if (!hasFinanceAccess) return;
    setLoading(true);
    setError('');
    try {
      const data = await invoiceService.getInvoiceHistory();
      setInvoices(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices register.');
    } finally {
      setLoading(false);
    }
  }, [hasFinanceAccess]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Load Client Master List
  useEffect(() => {
    if (!hasFinanceAccess) return;
    clientService.getClients().then((clients) => {
      setClientMasterList(clients);
      if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }
    });
  }, [hasFinanceAccess, selectedClientId]);

  // Resolve Client Billing when Client or State changes
  const resolveBilling = useCallback(async (clientId: string, stateName?: string) => {
    if (!clientId) return;
    try {
      const res = await clientService.resolveClientBillingForState(clientId, stateName);
      setResolvedBilling(res);
      if (res && res.billingState && !stateName) {
        setSelectedStateName(res.billingState);
      }
    } catch {
      setResolvedBilling(null);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      resolveBilling(selectedClientId, selectedStateName);
    }
  }, [selectedClientId, selectedStateName, resolveBilling]);

  // Preview Invoice Number
  useEffect(() => {
    billingService
      .previewNextInvoiceNumber(new Date(), invoices.length)
      .then((num: string) => {
        setPreviewInvoiceNumber(num);
      })
      .catch(() => {
        const year = new Date().getFullYear();
        setPreviewInvoiceNumber(`HH${year}-${String(invoices.length + 1).padStart(4, '0')}`);
      });
  }, [invoices.length]);

  const createDraft = async (input: CreateInvoiceDraftInput, actorName: string): Promise<{ id: string; invoiceNumber: string }> => {
    if (!hasWriteAccess) throw new Error('Permission Denied: Full Finance Access required to create invoices.');
    const res = await invoiceService.createDraft(input, actorName);
    await loadInvoices();
    return res;
  };

  const generateInvoice = async (invoiceId: string, actorName: string): Promise<InvoiceDocumentStorage> => {
    if (!hasWriteAccess) throw new Error('Permission Denied: Full Finance Access required to generate invoices.');
    const invoice = await invoiceService.getInvoice(invoiceId);
    if (!invoice) throw new Error('Invoice not found.');
    const client = await clientService.resolveClientBillingForState(invoice.clientId, selectedStateName);
    const docInfo = await invoiceService.generate(invoiceId, {
      clientId: client.clientId,
      clientName: client.clientName,
      gstin: client.gstin,
      billingAddress: client.billingAddress,
      billingState: client.billingState,
    }, actorName);
    await loadInvoices();
    return docInfo;
  };

  const recordClientPayment = async (invoiceId: string, input: RecordClientPaymentInput, actorName: string): Promise<void> => {
    if (!hasWriteAccess) throw new Error('Permission Denied: Full Finance Access required to record payments.');
    await invoiceService.recordClientPayment(invoiceId, input, actorName, userRole);
    await loadInvoices();
  };

  return {
    invoices,
    loading,
    error,
    clientMasterList,
    selectedClientId,
    setSelectedClientId,
    selectedStateName,
    setSelectedStateName,
    resolvedBilling,
    previewInvoiceNumber,
    hasFinanceAccess,
    hasWriteAccess,
    hasReportAccess,
    loadInvoices,
    createDraft,
    generateInvoice,
    recordClientPayment,
  };
}
