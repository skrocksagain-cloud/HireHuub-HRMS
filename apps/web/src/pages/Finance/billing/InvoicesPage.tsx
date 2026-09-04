import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Building2,
  Layers,
  ShieldAlert,
  Download,
  Filter,
} from 'lucide-react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import SectionHeader from '../../../ui/SectionHeader';
import StatusBadge from '../../../ui/StatusBadge';
import Drawer from '../../../ui/Drawer';
import { useInvoices } from './hooks/useInvoices';
import { useAuth } from '../../../context/AuthContext';
import { adminService } from '../../../services/admin/adminService';
import type { CompanySignatoryV2 } from '../../../types/Admin';
import type { CreateInvoiceDraftInput, HireHuubTemplateType } from '../../../types/Invoice';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const actor = { role: user?.authorization?.role || user?.assignedRole, employeeId: user?.employeeId, departmentId: user?.departmentId };

  const {
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
    createDraft,
  } = useInvoices(actor);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Modals & Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);

  // Editable Form Inputs for Invoice Creation
  const [draftInvoiceDate, setDraftInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [poNumber, setPoNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [selectedSignatoryId, setSelectedSignatoryId] = useState<string>('');
  const [companySignatories, setCompanySignatories] = useState<Array<{ id: string; fullName: string; designation: string; isDefault?: boolean }>>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  const [companyBankAccounts, setCompanyBankAccounts] = useState<Array<{ id: string; bankName: string; accountNumber: string; ifscCode: string; branchName?: string; isPrimary?: boolean }>>([]);

  // Elastic Run specific fields
  const [billOfMonth, setBillOfMonth] = useState<string>('');
  const [stationCode, setStationCode] = useState<string>('');
  const [placeOfSupply, setPlaceOfSupply] = useState<string>('');

  // Line items state
  const [lineItems, setLineItems] = useState<
    Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      gstRate: number;
      hsn?: string;
      workDuration?: string;
      unit?: string;
      amount?: number;
    }>
  >([{ description: '', quantity: 1, unitPrice: 0, gstRate: 18, hsn: '998519', unit: '' }]);

  const [creatingDraft, setCreatingDraft] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  useEffect(() => {
    if (location.pathname.includes('new-invoice')) {
      setShowCreateDrawer(true);
    }
  }, [location.pathname]);

  // Fetch Signatories and Bank Accounts from Company Settings
  useEffect(() => {
    adminService.getCompanySettings().then((settings) => {
      // 1. Signatories
      const sigs: CompanySignatoryV2[] = (settings?.signatoriesV2 || []).filter((s: CompanySignatoryV2) => s.isActive !== false);
      setCompanySignatories(sigs.map((s: CompanySignatoryV2) => ({ id: s.id, fullName: s.fullName, designation: s.designation, isDefault: s.isDefault })));
      if (sigs.length > 0 && !selectedSignatoryId) {
        const defaultSig = sigs.find((s: CompanySignatoryV2) => s.isDefault) || sigs[0];
        setSelectedSignatoryId(defaultSig.id);
      }

      // 2. Active Company Bank Accounts
      const v2Banks = (settings as any)?.bankAccountsV2 || [];
      const activeBanks: Array<{ id: string; bankName: string; accountNumber: string; ifscCode: string; branchName?: string; isPrimary?: boolean }> = [];

      v2Banks.forEach((acc: any, idx: number) => {
        if (acc && acc.isActive !== false && acc.accountNumber && String(acc.accountNumber).trim()) {
          const cleanAcc = String(acc.accountNumber).trim();
          if (!activeBanks.some((b) => b.accountNumber === cleanAcc)) {
            activeBanks.push({
              id: acc.id || `bank-v2-${idx}`,
              bankName: acc.bankName || 'Bank',
              accountNumber: cleanAcc,
              ifscCode: acc.ifsc || acc.ifscCode || '',
              branchName: acc.branchName || acc.branch || '',
              isPrimary: Boolean(acc.isPrimary),
            });
          }
        }
      });

      const primaryCompBank = (settings as any)?.companyBankDetails || settings?.bankDetails;
      if (primaryCompBank?.accountNumber && String(primaryCompBank.accountNumber).trim()) {
        const cleanAcc = String(primaryCompBank.accountNumber).trim();
        if (!activeBanks.some((b) => b.accountNumber === cleanAcc)) {
          activeBanks.push({
            id: primaryCompBank.id || 'bank-primary',
            bankName: primaryCompBank.bankName || 'Bank',
            accountNumber: cleanAcc,
            ifscCode: primaryCompBank.ifscCode || primaryCompBank.ifsc || '',
            branchName: primaryCompBank.branchName || primaryCompBank.branch || '',
            isPrimary: true,
          });
        }
      }

      setCompanyBankAccounts(activeBanks);
      if (activeBanks.length > 0 && !selectedBankAccountId) {
        const primaryAcc = activeBanks.find((b) => b.isPrimary) || activeBanks[0];
        setSelectedBankAccountId(primaryAcc.id);
      }
    });
  }, [showCreateDrawer]);

  // Selected Client object & Assigned Template
  const selectedClient = clientMasterList.find((c) => c.id === selectedClientId);
  const hasMultipleGstRecords =
    selectedClient?.gstConfig?.stateGstRecords && selectedClient.gstConfig.stateGstRecords.length > 1;

  // Resolve assigned template from Client Master
  const assignedTemplateRaw =
    resolvedBilling?.templateReference ||
    selectedClient?.invoiceConfig?.templateReference ||
    'All';

  const assignedTemplate: HireHuubTemplateType =
    assignedTemplateRaw === 'Blinkit' || assignedTemplateRaw === 'Elastic Run'
      ? assignedTemplateRaw
      : 'All';

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDraft(true);
    setActionError('');
    setActionSuccess('');

    try {
      // Validate Blinkit/All HSN
      lineItems.forEach((item) => {
        if (item.hsn && item.hsn.trim() && item.hsn.trim() !== '998519') {
          throw new Error('Invalid HSN code. Hire Huub manpower supply invoices require HSN 998519.');
        }
      });

      if (companySignatories.length > 0 && !selectedSignatoryId) {
        throw new Error('Please select an Authorized Signatory for this invoice.');
      }

      if (companyBankAccounts.length > 0 && !selectedBankAccountId) {
        throw new Error('Please select a Company Bank Account for this invoice.');
      }

      const selectedClientObj = clientMasterList.find((c) => c.id === selectedClientId);
      const input: CreateInvoiceDraftInput = {
        clientId: selectedClientId,
        clientName: selectedClientObj?.name,
        invoiceDate: draftInvoiceDate,
        templateType: assignedTemplate,
        billOfMonth: assignedTemplate === 'Elastic Run' ? billOfMonth : undefined,
        stationCode: assignedTemplate === 'Elastic Run' ? stationCode : undefined,
        placeOfSupply: assignedTemplate === 'Elastic Run' ? placeOfSupply : (resolvedBilling?.billingState || selectedStateName),
        signatoryId: selectedSignatoryId || undefined,
        bankAccountId: selectedBankAccountId || undefined,
        lineItems: lineItems.map((item) => ({
          ...item,
          amount: Number(item.quantity || 0) * Number(item.unitPrice || 0),
        })),
        poNumber: poNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
        selectedStateName,
      };

      const res = await createDraft(input, user?.name || 'Finance Admin');
      setActionSuccess(`Invoice Draft ${res.invoiceNumber} created successfully.`);
      setShowCreateDrawer(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to create invoice draft.');
    } finally {
      setCreatingDraft(false);
    }
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unitPrice: 0, gstRate: 18, hsn: '998519', unit: 'MONTHS' },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Subtotal & Calculations for Drawer (Universal: Amount = Qty * Unit Price)
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);

  const totalGst = lineItems.reduce((sum, item) => {
    const lineVal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
    return sum + (lineVal * Number(item.gstRate || 0)) / 100;
  }, 0);

  const grandTotal = subtotal + totalGst;

  // Filtered Invoices for Table
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber || inv.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.snapshot?.client.clientName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClient = clientFilter === 'ALL' || inv.clientId === clientFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesMonth = !monthFilter || inv.invoiceDate.startsWith(monthFilter);
    const matchesStart = !startDateFilter || inv.invoiceDate >= startDateFilter;
    const matchesEnd = !endDateFilter || inv.invoiceDate <= endDateFilter;

    return matchesSearch && matchesClient && matchesStatus && matchesMonth && matchesStart && matchesEnd;
  });

  if (!hasFinanceAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <ShieldAlert size={48} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Access Restricted — Finance Module</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Your canonical authorization role does not have permission to access Finance Invoices.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionHeader
              title="HIRE HUUB INVOICES"
              subtitle="Manage Hire Huub client invoices, GST, payments and credit notes."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/finance/transactions')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-semibold transition"
            >
              <Layers size={14} />
              <span>View Client Ledger</span>
            </button>

            {hasWriteAccess && (
              <button
                type="button"
                onClick={() => setShowCreateDrawer(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
              >
                <Plus size={14} />
                <span>+ Create New Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Invoices
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{invoices.length}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Generated / Approved
            </span>
            <span className="text-xl font-bold text-blue-700 mt-1 block">
              {invoices.filter((i) => i.status === 'Generated' || i.status === 'Approved').length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Paid
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">
              {invoices.filter((i) => i.status === 'Paid').length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Outstanding / Drafts
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {invoices.filter((i) => i.status === 'Draft' || i.status === 'Partially Paid' || i.status === 'Overdue').length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
            <Filter size={14} className="text-emerald-600" />
            <span>Search & Filter Invoices</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="relative col-span-1 sm:col-span-2">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Invoice #, Client Name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              >
                <option value="ALL">All Clients</option>
                {clientMasterList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Generated">Generated</option>
                <option value="Approved">Approved</option>
                <option value="Sent">Sent</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <input
                type="month"
                title="Invoice Month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              />
            </div>

            <div>
              <input
                type="date"
                title="Start Date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              />
            </div>

            <div>
              <input
                type="date"
                title="End Date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
            {actionSuccess}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {/* Invoice Register Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice No.</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Invoice Date</th>
                  <th className="p-3.5 text-right">Taxable Amount</th>
                  <th className="p-3.5 text-right">GST</th>
                  <th className="p-3.5 text-right">Total</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Loading Hire Huub Invoices Register…
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const clientName =
                      inv.clientName ||
                      inv.snapshot?.client.clientName ||
                      clientMasterList.find((c) => c.id === inv.clientId)?.name ||
                      inv.clientId;
                    const taxable = inv.taxableAmount ?? inv.snapshot?.taxableAmount ?? 0;
                    const gstVal = inv.gstAmount ?? inv.snapshot?.gst.totalGstAmount ?? 0;
                    const grand = inv.grandTotal ?? inv.snapshot?.grandTotal ?? 0;
                    const displayInvNo = inv.invoiceNumber || inv.id;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{displayInvNo}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{clientName}</td>
                        <td className="p-3.5 text-slate-600">{inv.invoiceDate}</td>
                        <td className="p-3.5 text-right text-slate-700">₹{taxable.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-right text-slate-700 font-mono">₹{gstVal.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">
                          ₹{grand.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          {inv.status === 'Draft' ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/finance/billing/invoices/${inv.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold transition"
                            >
                              <Eye size={13} />
                              <span>Open Draft</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/finance/billing/invoices/${inv.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold transition"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                          )}

                          {inv.document?.downloadUrl && (
                            <a
                              href={inv.document.downloadUrl}
                              target="_blank"
                              download={inv.document.fileName || `Invoice-${inv.invoiceNumber}.pdf`}
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition"
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Invoice Drawer / Wizard */}
        <Drawer
          isOpen={showCreateDrawer}
          onClose={() => setShowCreateDrawer(false)}
          title="New Invoice Wizard"
          subtitle={`Next Available Number: ${previewInvoiceNumber}`}
        >
          <form onSubmit={handleCreateDraft} className="space-y-5 text-xs text-slate-700">
            {/* Step 1: Select Client */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Step 1. Select Client *</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {clientMasterList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select State / GST Registration */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                Step 2. Select State / GST Registration *
                {!hasMultipleGstRecords && (
                  <span className="text-[10px] text-emerald-700 font-normal ml-2">
                    (Auto-selected from Client Master)
                  </span>
                )}
              </label>
              {hasMultipleGstRecords ? (
                <select
                  value={selectedStateName}
                  onChange={(e) => setSelectedStateName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {selectedClient?.gstConfig?.stateGstRecords.map((r) => (
                    <option key={r.id} value={r.stateName}>
                      {r.stateName} ({r.gstin})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  value={resolvedBilling?.billingState || selectedStateName || 'Auto-Resolved'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 text-xs"
                />
              )}
            </div>

            {/* Step 3: Resolved Client Metadata & Assigned Hire Huub Template */}
            {resolvedBilling && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1">
                  <Building2 size={14} className="text-emerald-700" />
                  <span>Step 3. Auto-Resolved Client & Template Metadata</span>
                </div>
                <div>Billing Name: <strong>{resolvedBilling.billingName || resolvedBilling.clientName}</strong></div>
                <div>Address: <strong>{resolvedBilling.billingAddress.line1}, {resolvedBilling.billingAddress.city}</strong></div>
                <div>GSTIN: <strong className="font-mono">{resolvedBilling.gstin}</strong> • State: <strong className="font-mono">{resolvedBilling.billingState}</strong></div>
                <div className="pt-1">
                  Assigned Template: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold">{assignedTemplate}</span>
                </div>
              </div>
            )}

            {/* Authorized Signatory Selection */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-xs">Authorized Signatory *</label>
              {companySignatories.length > 0 ? (
                <select
                  value={selectedSignatoryId}
                  onChange={(e) => setSelectedSignatoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs"
                  required
                >
                  {companySignatories.map((sig: { id: string; fullName: string; designation: string; isDefault?: boolean }) => (
                    <option key={sig.id} value={sig.id}>
                      {sig.fullName} ({sig.designation}){sig.isDefault ? ' [Default]' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                  No Signatories found in Company Settings. Sourced from Default System Admin.
                </div>
              )}
            </div>

            {/* Company Bank Account Selection */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block text-xs">Company Bank Account *</label>
              {companyBankAccounts.length > 0 ? (
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs font-mono"
                  required
                >
                  {companyBankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} — A/C {acc.accountNumber.length > 4 ? `****${acc.accountNumber.slice(-4)}` : acc.accountNumber} — IFSC {acc.ifscCode}{acc.isPrimary ? ' [Primary]' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                  No active Bank Accounts found in Company Settings. Sourced from Primary Company Details.
                </div>
              )}
            </div>

            {/* Step 4: Invoice Date */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Invoice Date *</label>
              <input
                type="date"
                value={draftInvoiceDate}
                onChange={(e) => setDraftInvoiceDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            {/* Template Specific Top Fields: Elastic Run */}
            {assignedTemplate === 'Elastic Run' && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3">
                <div className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                  Elastic Run Billing Fields
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold block text-slate-700 mb-1">Bill of the Month *</label>
                    <input
                      type="text"
                      placeholder="e.g. August 2026"
                      value={billOfMonth}
                      onChange={(e) => setBillOfMonth(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-slate-700 mb-1">Station Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. STN-CCU-01"
                      value={stationCode}
                      onChange={(e) => setStationCode(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-slate-700 mb-1">Place of Supply</label>
                    <input
                      type="text"
                      placeholder="e.g. Kolkata, West Bengal"
                      value={placeOfSupply}
                      onChange={(e) => setPlaceOfSupply(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4. Render Template Editable Line Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Step 4. Editable Line Items ({assignedTemplate} Template)
                </span>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <Plus size={12} />
                  + Add Line Item
                </button>
              </div>

              {lineItems.map((item, idx) => {
                const lineAmount = Number(item.quantity || 0) * Number(item.unitPrice || 0);

                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px]">Line Item #{idx + 1}</span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Description (e.g., Manpower & Staffing Services)"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                      required
                    />

                    {assignedTemplate === 'Blinkit' ? (
                      /* Blinkit Template Editable Fields */
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">HSN Code (Optional: 998519)</span>
                            <input
                              type="text"
                              placeholder="Optional (e.g. 998519)"
                              value={item.hsn || ''}
                              onChange={(e) => updateLineItem(idx, 'hsn', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">Work Duration</span>
                            <input
                              type="text"
                              placeholder="e.g. 01 Aug 2026 - 31 Aug 2026"
                              value={item.workDuration || ''}
                              onChange={(e) => updateLineItem(idx, 'workDuration', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">Quantity *</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">Unit Price (₹) *</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                              required
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block font-bold text-emerald-800">Amount (₹) [Auto]</span>
                            <input
                              type="text"
                              readOnly
                              value={`₹${lineAmount.toLocaleString('en-IN')}`}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-bold font-mono text-emerald-900 bg-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ) : assignedTemplate === 'Elastic Run' ? (
                      /* Elastic Run Template Editable Fields */
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">HSN/SAC</span>
                          <input
                            type="text"
                            readOnly
                            value="998519"
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-slate-100 font-semibold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Quantity *</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Unit Price (₹) *</span>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold text-emerald-800">Amount (₹) [Auto]</span>
                          <input
                            type="text"
                            readOnly
                            value={`₹${lineAmount.toLocaleString('en-IN')}`}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-bold font-mono text-emerald-900 bg-slate-100"
                          />
                        </div>
                      </div>
                    ) : (
                      /* All / Default Template Editable Fields */
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">HSN/SAC (Optional: 998519)</span>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={item.hsn || ''}
                            onChange={(e) => updateLineItem(idx, 'hsn', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Quantity *</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-semibold">Unit Price (₹) *</span>
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold text-emerald-800">Amount (₹) [Auto]</span>
                          <input
                            type="text"
                            readOnly
                            value={`₹${lineAmount.toLocaleString('en-IN')}`}
                            className="w-full p-1.5 rounded-lg border border-slate-200 text-xs font-bold font-mono text-emerald-900 bg-slate-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PO Number & Remarks */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-800 block mb-1">PO Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PO-998273"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Automatic Calculations Summary */}
            <div className="p-3.5 bg-slate-100 rounded-xl space-y-1.5 font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal (Taxable Amount):</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated GST ({resolvedBilling?.billingState === 'West Bengal' ? 'CGST+SGST 18%' : 'IGST 18%'}):</span>
                <span className="font-mono">₹{totalGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                <span>Grand Total:</span>
                <span className="text-emerald-700 font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold">
                {actionError}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateDrawer(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingDraft}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs disabled:opacity-50"
              >
                {creatingDraft ? 'Saving Draft…' : 'Save Invoice Draft'}
              </button>
            </div>
          </form>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
