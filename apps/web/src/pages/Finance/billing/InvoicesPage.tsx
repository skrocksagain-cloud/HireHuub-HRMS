import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Building2,
  Layers,
  ShieldAlert,
  FileCheck,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import SectionHeader from '../../../ui/SectionHeader';
import StatusBadge from '../../../ui/StatusBadge';
import Drawer from '../../../ui/Drawer';
import InvoiceTemplateLibraryDrawer from './components/InvoiceTemplateLibraryDrawer';
import { useInvoices } from './hooks/useInvoices';
import { useAuth } from '../../../context/AuthContext';
import type { CreateInvoiceDraftInput } from '../../../types/Invoice';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';

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
    generateInvoice,
  } = useInvoices(currentRole);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState<boolean>(false);
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [showTemplateDrawer, setShowTemplateDrawer] = useState<boolean>(false);
  const [ledgerClientId, setLedgerClientId] = useState<string>('');

  // Editable Form Inputs per PO Directive
  const [draftInvoiceDate, setDraftInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [poNumber, setPoNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [lineItems, setLineItems] = useState<
    Array<{ description: string; quantity: number; unitPrice: number; gstRate: number }>
  >([
    { description: 'HR Staffing & Placement Services', quantity: 1, unitPrice: 85000, gstRate: 18 },
  ]);

  const [creatingDraft, setCreatingDraft] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  useEffect(() => {
    if (location.pathname.includes('new-invoice')) {
      setShowCreateDrawer(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (clientMasterList.length > 0 && !ledgerClientId) {
      setLedgerClientId(clientMasterList[0].id);
    }
  }, [clientMasterList, ledgerClientId]);

  // Selected Client object for checking multiple GST registrations
  const selectedClient = clientMasterList.find((c) => c.id === selectedClientId);
  const hasMultipleGstRecords =
    selectedClient?.gstConfig?.stateGstRecords && selectedClient.gstConfig.stateGstRecords.length > 1;

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDraft(true);
    setActionError('');
    setActionSuccess('');

    try {
      const selectedClientObj = clientMasterList.find((c) => c.id === selectedClientId);
      const input: CreateInvoiceDraftInput = {
        clientId: selectedClientId,
        clientName: selectedClientObj?.name,
        invoiceDate: draftInvoiceDate,
        lineItems,
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
      { description: '', quantity: 1, unitPrice: 0, gstRate: 18 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: 'description' | 'quantity' | 'unitPrice' | 'gstRate',
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Automatic Tax & Total Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
    0
  );
  const totalGst = lineItems.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity || 0) * Number(item.unitPrice || 0) * Number(item.gstRate || 0)) / 100,
    0
  );
  const grandTotal = subtotal + totalGst;

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      (inv.invoiceNumber || inv.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.snapshot?.client.clientName || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!hasFinanceAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <ShieldAlert size={48} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Access Restricted — Finance Module</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Your current role ('{currentRole}') does not have permission to access Finance Invoices.
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
              title="Invoices Register"
              subtitle="Client Master integrated Billing, Enterprise Numbering (HH2026-0001), State GST resolution, and Dedicated Profile Pages."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTemplateDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Template Library</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLedgerModal(true)}
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
                <span>Create New Invoice</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Billed Invoices
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
              Total Paid Invoices
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">
              {invoices.filter((i) => i.status === 'Paid').length}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Drafts
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {invoices.filter((i) => i.status === 'Draft').length}
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Invoice #, Client Name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-500">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Generated">Generated</option>
              <option value="Approved">Approved</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {actionSuccess}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Client Account</th>
                  <th className="p-3.5">Invoice Date</th>
                  <th className="p-3.5 text-right">Taxable Subtotal</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading Invoices Register…
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const clientName = inv.clientName || inv.snapshot?.client.clientName || clientMasterList.find((c) => c.id === inv.clientId)?.name || inv.clientId;
                    const taxable = inv.taxableAmount ?? inv.snapshot?.taxableAmount ?? 0;
                    const grand = inv.grandTotal ?? inv.snapshot?.grandTotal ?? 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 font-bold font-mono text-slate-900">{inv.invoiceNumber || inv.id}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{clientName}</td>
                        <td className="p-3.5 text-slate-600">{inv.invoiceDate}</td>
                        <td className="p-3.5 text-right text-slate-700">₹{taxable.toLocaleString('en-IN')}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-700">
                          ₹{grand.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/finance/billing/invoices/${inv.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-semibold transition"
                          >
                            <Eye size={13} />
                            <span>View Profile</span>
                          </button>

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

                          {hasWriteAccess && inv.status === 'Draft' && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setActionSuccess('');
                                  setActionError('');
                                  const docStorage = await generateInvoice(inv.id, user?.name || 'Finance Admin');
                                  setActionSuccess(`Invoice ${inv.invoiceNumber || inv.id} PDF generated successfully.`);
                                  if (docStorage?.downloadUrl) {
                                    window.open(docStorage.downloadUrl, '_blank', 'noopener,noreferrer');
                                  }
                                } catch (err: unknown) {
                                  setActionError(err instanceof Error ? err.message : 'Failed to generate PDF.');
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold transition hover:bg-blue-700 cursor-pointer"
                            >
                              <FileCheck size={13} />
                              <span>Generate PDF</span>
                            </button>
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

        {/* Create Invoice Drawer / Wizard (PO Approved Field Set ONLY) */}
        <Drawer
          isOpen={showCreateDrawer}
          onClose={() => setShowCreateDrawer(false)}
          title="New Invoice Wizard"
          subtitle={`Invoice Number ${previewInvoiceNumber}`}
        >
          <form onSubmit={handleCreateDraft} className="space-y-5 text-xs text-slate-700">
            {/* Editable Field 1: Client (Dropdown) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">1. Client *</label>
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

            {/* Editable Field 2: GST Registration State (Dropdown / Auto-Select) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                2. GST Registration State *
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

            {/* Read-Only Auto Populated Client Master Card */}
            {resolvedBilling && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 size={14} className="text-emerald-700" />
                  Auto-Populated Client & Company Metadata (Read Only)
                </div>
                <div>Billing Name: <strong>{resolvedBilling.billingName || resolvedBilling.clientName}</strong></div>
                <div>Address: <strong>{resolvedBilling.billingAddress.line1}, {resolvedBilling.billingAddress.city} ({resolvedBilling.billingAddress.postalCode})</strong></div>
                <div>GSTIN: <strong className="font-mono">{resolvedBilling.gstin}</strong> • State Code: <strong className="font-mono">{resolvedBilling.billingState}</strong></div>
                <div>Template: <strong className="text-purple-700">Auto-Resolved Standard Template</strong></div>
              </div>
            )}

            {/* Editable Field 3: Invoice Date */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">3. Invoice Date *</label>
              <input
                type="date"
                value={draftInvoiceDate}
                onChange={(e) => setDraftInvoiceDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            {/* Editable Field 4: Line Items Builder */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  4. Line Items *
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

              {lineItems.map((item, idx) => (
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
                    placeholder="Description (e.g., HR Staffing Services)"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Quantity</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Rate (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">GST %</span>
                      <select
                        value={item.gstRate}
                        onChange={(e) => updateLineItem(idx, 'gstRate', Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        <option value={18}>18%</option>
                        <option value={12}>12%</option>
                        <option value={5}>5%</option>
                        <option value={0}>0%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Editable Field 5: PO Number (Optional) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">5. PO Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. PO-998273"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            {/* Editable Field 6: Remarks (Optional) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">6. Remarks (Optional)</label>
              <textarea
                rows={2}
                placeholder="Special billing instructions or notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Automatic Calculations Summary (Read Only) */}
            <div className="p-3 bg-slate-100 rounded-xl space-y-1 font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal (Taxable):</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Calculated GST:</span>
                <span>₹{totalGst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-xs">
                <span>Grand Total:</span>
                <span className="text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
                {actionError}
              </div>
            )}

            <button
              type="submit"
              disabled={creatingDraft}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs text-xs"
            >
              {creatingDraft ? 'Saving Draft…' : `Create Invoice Draft ${previewInvoiceNumber}`}
            </button>
          </form>
        </Drawer>

        {/* Client Ledger Modal */}
        {showLedgerModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers size={18} className="text-emerald-700" />
                  Client Ledger Statement
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Select Client Account</label>
                <select
                  value={ledgerClientId}
                  onChange={(e) => setLedgerClientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  {clientMasterList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Invoiced</span>
                    <span className="font-bold text-slate-900">
                      ₹
                      {invoices
                        .filter((i) => i.clientId === ledgerClientId)
                        .reduce((s, i) => s + (i.snapshot?.grandTotal || 0), 0)
                        .toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Payments Received</span>
                    <span className="font-bold text-emerald-700">
                      ₹
                      {invoices
                        .filter((i) => i.clientId === ledgerClientId)
                        .reduce((s, i) => s + (i.totalAmountReceived || (i.status === 'Paid' ? i.snapshot?.grandTotal || 0 : 0)), 0)
                        .toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Outstanding Balance</span>
                    <span className="font-bold text-amber-600">
                      ₹
                      {invoices
                        .filter(
                          (i) =>
                            i.clientId === ledgerClientId &&
                            i.status !== 'Paid' &&
                            i.status !== 'Cancelled'
                        )
                        .reduce((s, i) => s + (i.outstandingAmount || i.snapshot?.grandTotal || 0), 0)
                        .toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLedgerModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        <InvoiceTemplateLibraryDrawer
          isOpen={showTemplateDrawer}
          onClose={() => setShowTemplateDrawer(false)}
          actorName={user?.name || 'Finance Admin'}
        />
      </div>
    </DashboardLayout>
  );
}
