import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  X,
  IndianRupee,
  Building2,
  Calendar,
  Layers,
  Lock,
  Download,
  Plus,
} from 'lucide-react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import StatusBadge from '../../../../ui/StatusBadge';
import Drawer from '../../../../ui/Drawer';
import { useInvoiceProfile } from '../hooks/useInvoiceProfile';
import { useAuth } from '../../../../context/AuthContext';
import type { InvoiceStatus, PaymentModeType } from '../../../../types/Invoice';

type TabType = 'overview' | 'payments' | 'ledger' | 'history';

export default function InvoiceProfilePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';

  const {
    invoice,
    loading,
    error,
    actionSuccess,
    actionError,
    hasFinanceAccess,
    hasWriteAccess,
    updateStatus,
    recordPayment,
  } = useInvoiceProfile(invoiceId, currentRole);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPaymentDrawer, setShowPaymentDrawer] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  // Record Client Payment Form State
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentModeType>('Bank Transfer');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [candidatePay, setCandidatePay] = useState<number>(0);
  const [paymentRemarks, setPaymentRemarks] = useState<string>('');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs">Loading Invoice Profile…</div>
      </DashboardLayout>
    );
  }

  if (error || !invoice || !hasFinanceAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <div className="font-bold text-rose-900 text-sm">Invoice Access Error</div>
          <div className="text-xs text-rose-700">{error || 'Invoice record not found or access restricted.'}</div>
          <button
            type="button"
            onClick={() => navigate('/finance/billing/invoices')}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Back to Invoices Register
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const snapshot = invoice.snapshot;
  const client = snapshot?.client;
  const grandTotal = snapshot?.grandTotal ?? 0;
  const isLocked = invoice.isLocked || invoice.status === 'Paid';

  // Financial Ledger Computations
  const totalReceived = invoice.totalAmountReceived ?? (invoice.payments ?? []).reduce((s, p) => s + p.amountReceived, 0);
  const totalTds = invoice.totalTdsAmount ?? (invoice.payments ?? []).reduce((s, p) => s + p.tdsAmount, 0);
  const totalSettlement = invoice.totalSettlementValue ?? (invoice.payments ?? []).reduce((s, p) => s + p.settlementValue, 0);
  const totalCandidatePay = invoice.totalCandidatePay ?? (invoice.payments ?? []).reduce((s, p) => s + p.candidatePay, 0);
  const totalRevenue = invoice.totalRevenue ?? (totalReceived - totalCandidatePay);
  const outstandingAmount = invoice.outstandingAmount ?? Math.max(0, grandTotal - totalSettlement);
  const withheldAmount = invoice.withheldAmount ?? Math.max(0, grandTotal - totalSettlement);
  const displayInvoiceNumber = invoice.snapshot?.invoiceNumber || invoice.invoiceNumber || invoice.id;

  // Live Payment Calculations in Modal
  const autoTds = Math.round((grandTotal * 0.02 + Number.EPSILON) * 100) / 100;
  const liveSettlementValue = (amountReceived || 0) + autoTds;
  const liveRevenue = (amountReceived || 0) - (candidatePay || 0);
  const liveOutstanding = Math.max(0, grandTotal - (totalSettlement + liveSettlementValue));
  const liveWithheld = Math.max(0, grandTotal - (totalSettlement + liveSettlementValue));

  const handleUpdateStatus = async (newStatus: InvoiceStatus) => {
    setUpdating(true);
    try {
      await updateStatus(newStatus, user?.name || 'Finance Admin');
    } finally {
      setUpdating(false);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await recordPayment(
        {
          paymentDate: new Date().toISOString().split('T')[0],
          amountReceived,
          candidatePay,
          paymentMode,
          transactionReference,
          remarks: paymentRemarks,
        },
        user?.name || 'Finance Admin'
      );
      setShowPaymentDrawer(false);
      setAmountReceived(0);
      setTransactionReference('');
      setCandidatePay(0);
      setPaymentRemarks('');
    } catch {
      // Error handled inside hook state
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/finance/billing/invoices')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Invoices Register</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs">
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                <Lock size={12} className="text-slate-500" />
                Locked & Immutable
              </span>
            )}
            <span className="text-slate-400">
              Number: <strong className="text-emerald-700">{displayInvoiceNumber}</strong>
            </span>
          </div>
        </div>

        {/* Profile Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{displayInvoiceNumber}</h1>
                <StatusBadge status={invoice.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-slate-500 font-mono text-xs mt-1">
                <span>Client: <strong className="text-slate-900">{client?.clientName || invoice.clientId}</strong></span>
                <span>•</span>
                <span>GSTIN: {client?.gstin || 'N/A'}</span>
                <span>•</span>
                <span>Date: {invoice.invoiceDate}</span>
                <span>•</span>
                <span>State: {client?.billingState || 'N/A'}</span>
                {invoice.poNumber && (
                  <>
                    <span>•</span>
                    <span>PO: <strong className="text-slate-800">{invoice.poNumber}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {invoice.document?.downloadUrl && (
                <a
                  href={invoice.document.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
              )}

              {hasWriteAccess && !isLocked && (
                <>
                  {invoice.status === 'Draft' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('Generated')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
                    >
                      <FileCheck size={14} />
                      <span>Generate Invoice</span>
                    </button>
                  )}

                  {invoice.status === 'Generated' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('Approved')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs"
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve Invoice</span>
                    </button>
                  )}

                  {(invoice.status === 'Generated' || invoice.status === 'Approved' || invoice.status === 'Partially Paid') && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentDrawer(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Record Client Payment</span>
                    </button>
                  )}

                  {invoice.status !== 'Cancelled' && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleUpdateStatus('Cancelled')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-800 font-semibold transition"
                    >
                      <X size={14} />
                      <span>Cancel Invoice</span>
                    </button>
                  )}
                </>
              )}

              {hasWriteAccess && (invoice.status === 'Paid' || invoice.status === 'Partially Paid' || invoice.status === 'Approved') && (
                <button
                  type="button"
                  onClick={() => navigate('/finance/billing/credit-notes')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold transition"
                >
                  <IndianRupee size={14} />
                  <span>Generate Credit Note</span>
                </button>
              )}
            </div>
          </div>

          {actionSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
              {actionSuccess}
            </div>
          )}

          {actionError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {actionError}
            </div>
          )}
        </div>

        {/* Complete Receivable Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Invoice Amount</span>
            <span className="font-bold text-slate-900 text-xs mt-1 block">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Received</span>
            <span className="font-bold text-emerald-700 text-xs mt-1 block">₹{totalReceived.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">TDS (Auto 2%)</span>
            <span className="font-bold text-purple-700 text-xs mt-1 block">₹{totalTds.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Settlement Value</span>
            <span className="font-bold text-blue-700 text-xs mt-1 block">₹{totalSettlement.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Pay</span>
            <span className="font-bold text-amber-700 text-xs mt-1 block">₹{totalCandidatePay.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Revenue</span>
            <span className="font-bold text-emerald-800 text-xs mt-1 block">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Withheld Amount</span>
            <span className="font-bold text-rose-600 text-xs mt-1 block">₹{withheldAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
            <span className={`font-bold text-xs mt-1 block ${outstandingAmount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              ₹{outstandingAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Profile Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 bg-slate-50 flex items-center gap-1">
            {[
              { id: 'overview', label: '1. Invoice Overview & Breakdown' },
              { id: 'payments', label: `2. Payment Ledger (${(invoice.payments || []).length})` },
              { id: 'ledger', label: '3. Running Client Ledger' },
              { id: 'history', label: '4. Audit Timeline' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as TabType)}
                className={`px-4 py-3 text-xs font-bold transition border-b-2 ${
                  activeTab === t.id
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* TAB 1: Invoice Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                      <Building2 size={14} className="text-emerald-700" />
                      Client Master Entity & State GST
                    </span>
                    <div className="text-slate-800 font-bold text-sm">{client?.clientName || invoice.clientId}</div>
                    <div className="text-slate-500 text-[11px]">{client?.billingAddress?.line1}</div>
                    <div className="text-slate-500 text-[11px]">
                      {client?.billingAddress?.city}, {client?.billingState} - {client?.billingAddress?.postalCode}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">GSTIN: <strong>{client?.gstin || 'N/A'}</strong></div>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-700" />
                      Invoice Parameters & Amount in Words
                    </span>
                    <div className="text-slate-700">Invoice Date: <strong>{invoice.invoiceDate}</strong></div>
                    <div className="text-slate-700">
                      PO Number: <strong>{invoice.poNumber || 'N/A'}</strong>
                    </div>
                    <div className="text-slate-700">
                      Amount in Words:{' '}
                      <strong className="text-emerald-800">{snapshot?.amountInWords || 'N/A'}</strong>
                    </div>
                    {invoice.remarks && <div className="text-slate-600 text-[11px]">Remarks: {invoice.remarks}</div>}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
                    Line Items Breakdown
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Item Description</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3 text-right">Rate</th>
                          <th className="p-3 text-right">Taxable</th>
                          <th className="p-3 text-right">GST %</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(snapshot?.lineItems || invoice.lineItems || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-3 font-medium text-slate-900">{item.description}</td>
                            <td className="p-3 text-right">{item.quantity}</td>
                            <td className="p-3 text-right">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right">₹{((item as any).taxableAmount || item.quantity * item.unitPrice).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-purple-700 font-semibold">{item.gstRate}%</td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              ₹{((item as any).totalAmount || (item.quantity * item.unitPrice * (1 + item.gstRate / 100))).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Immutable Payment History Ledger */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
                    Immutable Append-Only Payment Ledger
                  </span>
                  {hasWriteAccess && !isLocked && (
                    <button
                      type="button"
                      onClick={() => setShowPaymentDrawer(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      + Record New Payment
                    </button>
                  )}
                </div>

                {(!invoice.payments || invoice.payments.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border">
                    No client payments recorded yet for this invoice.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3 text-right">Received Amount</th>
                          <th className="p-3 text-right">Candidate Pay</th>
                          <th className="p-3 text-right">TDS (2%)</th>
                          <th className="p-3 text-right">Settlement Value</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Ref #</th>
                          <th className="p-3">Created By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoice.payments.map((p) => (
                          <tr key={p.paymentId} className="hover:bg-slate-50/60">
                            <td className="p-3 font-semibold text-slate-800">{p.paymentDate}</td>
                            <td className="p-3 text-right font-bold text-emerald-700">₹{p.amountReceived.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-amber-700 font-semibold">₹{p.candidatePay.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right text-purple-700 font-semibold">₹{p.tdsAmount.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-bold text-blue-700">₹{p.settlementValue.toLocaleString('en-IN')}</td>
                            <td className="p-3 font-semibold text-slate-700">{p.paymentMode}</td>
                            <td className="p-3 font-mono text-slate-600">{p.transactionReference}</td>
                            <td className="p-3 text-slate-500">{p.createdBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Running Client Ledger */}
            {activeTab === 'ledger' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <Layers size={14} />
                    Running Client Ledger Statement — {client?.clientName || invoice.clientId}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Invoiced</span>
                    <span className="font-bold text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Settled</span>
                    <span className="font-bold text-emerald-700">₹{totalSettlement.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block">Outstanding Balance</span>
                    <span className="font-bold text-amber-600">₹{outstandingAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Audit History */}
            {activeTab === 'history' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Audit History & Status Timeline
                </h4>
                <div className="space-y-2">
                  {(invoice.statusHistory || []).map((history, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Status Changed to {history.status}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {history.changedAt?.seconds
                            ? new Date(history.changedAt.seconds * 1000).toLocaleString('en-GB')
                            : 'Just now'}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{history.remarks}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">By: {history.changedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Record Client Payment Drawer */}
        <Drawer
          isOpen={showPaymentDrawer}
          onClose={() => setShowPaymentDrawer(false)}
          title="Record Client Payment"
          subtitle={`Invoice ${displayInvoiceNumber} • ${client?.clientName}`}
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
            {/* Read-Only 1: Invoice Number */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Invoice Number (Auto Read-Only)</label>
              <input
                type="text"
                readOnly
                value={displayInvoiceNumber}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-800 text-xs"
              />
            </div>

            {/* Read-Only 2: Client Name */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Client Name (Auto Read-Only)</label>
              <input
                type="text"
                readOnly
                value={client?.clientName || invoice.clientId}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-800 text-xs"
              />
            </div>

            {/* Read-Only 3: Invoice Amount */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Invoice Amount (Auto Read-Only)</label>
              <input
                type="text"
                readOnly
                value={`₹${grandTotal.toLocaleString('en-IN')}`}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-emerald-800 text-xs"
              />
            </div>

            {/* Editable Field 4: Amount Received */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Amount Received (₹) *</label>
              <input
                type="number"
                min="1"
                value={amountReceived || ''}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                placeholder="Enter exact amount received..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Editable Field 5: Payment Mode */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Payment Mode *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentModeType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Editable Field 6: Transaction Reference */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Transaction Reference *</label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. UTR / Cheque No / Reference Number"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>

            {/* Editable Field 7: Candidate Pay (NEW FIELD, Optional, Default ₹0) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Candidate Pay (Optional, Default ₹0)</label>
              <input
                type="number"
                min="0"
                value={candidatePay || 0}
                onChange={(e) => setCandidatePay(Number(e.target.value))}
                placeholder="0"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-amber-800"
              />
              <span className="text-[10px] text-slate-500 block">
                Tracked as a separate expense. Revenue = Amount Received - Candidate Pay.
              </span>
            </div>

            {/* Read-Only Field 8: TDS (Automatically 2% of Invoice Amount) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">TDS (Read Only - Auto 2% of Invoice Amount)</label>
              <input
                type="text"
                readOnly
                value={`₹${autoTds.toLocaleString('en-IN')}`}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-purple-800 text-xs"
              />
            </div>

            {/* Editable Field 9: Remarks */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Remarks (Optional)</label>
              <textarea
                rows={2}
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                placeholder="Payment receipt remarks..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Live Calculation Output Card */}
            <div className="p-3 bg-slate-100 rounded-xl space-y-1 font-semibold text-slate-700">
              <div className="flex justify-between text-blue-800 font-bold">
                <span>Settlement Value (Rec'd + TDS):</span>
                <span>₹{liveSettlementValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Calculated Revenue (Rec'd - Candidate):</span>
                <span>₹{liveRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Remaining Outstanding:</span>
                <span>₹{liveOutstanding.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Remaining Withheld:</span>
                <span>₹{liveWithheld.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
                {actionError}
              </div>
            )}

            <button
              type="submit"
              disabled={updating || !amountReceived || !transactionReference}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs text-xs disabled:opacity-50"
            >
              {updating ? 'Recording Payment…' : 'Submit Client Payment Entry'}
            </button>
          </form>
        </Drawer>
      </div>
    </DashboardLayout>
  );
}
