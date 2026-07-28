import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';

import { auth } from '../../../firebase/firebase';
import DashboardLayout from '../../../layouts/DashboardLayout';
import PageHeader from '../../../ui/PageHeader';
import type { CreditNoteReportFilters, ExpenseReportFilters, FinanceReportType, InvoiceReportFilters, OutstandingReportFilters } from '../../../types/FinanceReport';
import { reportService } from './services/reportService';

type Option = { id: string; name: string };
type ReportRow = Record<string, string | number | undefined>;
type Filters = { startDate: string; endDate: string; clientId: string; status: string; expenseCategoryId: string; paidFromId: string; associatePartnerId: string };

const initialFilters: Filters = { startDate: '', endDate: '', clientId: '', status: '', expenseCategoryId: '', paidFromId: '', associatePartnerId: '' };
const reportTabs: Array<{ id: FinanceReportType; label: string }> = [
  { id: 'invoice', label: 'Invoices' }, { id: 'credit-note', label: 'Credit Notes' }, { id: 'expense', label: 'Expenses' }, { id: 'outstanding', label: 'Outstanding' }, { id: 'summary', label: 'Summary' },
];
const money = (value: string | number | undefined) => `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function FinanceReportsPage() {
  const [activeReport, setActiveReport] = useState<FinanceReportType>('invoice');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportRow | null>(null);
  const [options, setOptions] = useState<{ clients: Option[]; expenseCategories: Option[]; paymentSources: Option[]; associatePartners: Option[] }>({ clients: [], expenseCategories: [], paymentSources: [], associatePartners: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const reportFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as Filters;
      const [filterOptions, result] = await Promise.all([
        reportService.getFilterOptions(),
        activeReport === 'invoice' ? reportService.getInvoiceReport(reportFilters as InvoiceReportFilters) : activeReport === 'credit-note' ? reportService.getCreditNoteReport(reportFilters as CreditNoteReportFilters) : activeReport === 'expense' ? reportService.getExpenseReport(reportFilters as ExpenseReportFilters) : activeReport === 'outstanding' ? reportService.getOutstandingReport(reportFilters as OutstandingReportFilters) : reportService.getFinanceSummary(),
      ]);
      setOptions(filterOptions);
      if (activeReport === 'summary') { setSummary(result as unknown as ReportRow); setRows([]); } else { setRows(result as unknown as ReportRow[]); setSummary(null); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load the finance report.'); }
    finally { setLoading(false); }
  }, [activeReport, filters]);

  // Loading is an external service synchronization; state is updated when it completes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const setFilter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters(initialFilters);
  const exportPdf = async () => {
    const generatedBy = auth.currentUser?.email ?? auth.currentUser?.uid;
    if (!generatedBy) { setError('Sign in before exporting a report.'); return; }
    setExporting(true); setError('');
    try { await reportService.exportReport(activeReport, generatedBy, Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as InvoiceReportFilters & CreditNoteReportFilters & ExpenseReportFilters & OutstandingReportFilters); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to export the report.'); }
    finally { setExporting(false); }
  };

  const visibleFilters = activeReport !== 'summary' && activeReport !== 'outstanding';
  const columns = activeReport === 'invoice' ? [['invoiceNumber', 'Invoice Number'], ['invoiceDate', 'Date'], ['client', 'Client'], ['gst', 'GST'], ['invoiceAmount', 'Taxable Amount'], ['totalAmount', 'Grand Total'], ['status', 'Status']] : activeReport === 'credit-note' ? [['creditNoteNumber', 'Credit Note Number'], ['creditDate', 'Date'], ['client', 'Client'], ['originalInvoice', 'Original Invoice'], ['creditAmount', 'Credit Amount'], ['reason', 'Reason']] : activeReport === 'expense' ? [['transactionNumber', 'Transaction Number'], ['transactionDate', 'Date'], ['expenseCategory', 'Expense Category'], ['associatePartner', 'Associate Partner'], ['paidFrom', 'Paid From'], ['amount', 'Amount'], ['status', 'Status']] : [['invoiceNumber', 'Invoice Number'], ['client', 'Client'], ['invoiceAmount', 'Invoice Amount'], ['creditNotesApplied', 'Credit Notes'], ['outstandingAmount', 'Outstanding Amount']];
  const currencyKeys = new Set(['gst', 'invoiceAmount', 'totalAmount', 'creditAmount', 'amount', 'creditNotesApplied', 'outstandingAmount']);

  return <DashboardLayout><nav aria-label="breadcrumb" className="mb-4 text-sm text-slate-500">Finance / Reports</nav><PageHeader title="Finance Reports" description="Read-only operational finance reports." action={<button type="button" onClick={() => void exportPdf()} disabled={exporting || loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Download size={16} />{exporting ? 'Exporting…' : 'Export PDF'}</button>} />
    <div className="space-y-6"><div className="flex flex-wrap gap-2">{reportTabs.map((tab) => <button key={tab.id} type="button" onClick={() => { setActiveReport(tab.id); setFilters(initialFilters); }} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeReport === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{tab.label}</button>)}</div>
    {visibleFilters && <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3"><label className="text-sm text-slate-600">From<input type="date" value={filters.startDate} onChange={(event) => setFilter('startDate', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" /></label><label className="text-sm text-slate-600">To<input type="date" value={filters.endDate} onChange={(event) => setFilter('endDate', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" /></label>{activeReport !== 'expense' && <Select label="Client" value={filters.clientId} options={options.clients} onChange={(value) => setFilter('clientId', value)} />}{activeReport === 'invoice' && <label className="text-sm text-slate-600">Status<select value={filters.status} onChange={(event) => setFilter('status', event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2"><option value="">All statuses</option>{['Generated', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></label>}{activeReport === 'expense' && <><Select label="Expense Category" value={filters.expenseCategoryId} options={options.expenseCategories} onChange={(value) => setFilter('expenseCategoryId', value)} /><Select label="Payment Source" value={filters.paidFromId} options={options.paymentSources} onChange={(value) => setFilter('paidFromId', value)} /><Select label="Associate Partner" value={filters.associatePartnerId} options={options.associatePartners} onChange={(value) => setFilter('associatePartnerId', value)} /></>}<button type="button" onClick={clearFilters} className="self-end rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Clear filters</button></div>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <p className="text-sm text-slate-500">Loading report…</p> : summary ? <div className="grid gap-4 md:grid-cols-5">{[['Total Invoices', summary.totalInvoices], ['Invoice Value', money(summary.totalInvoiceAmount)], ['Credit Notes', money(summary.totalCreditNotes)], ['Expenses', money(summary.totalExpenses)], ['Outstanding', money(summary.outstandingAmount)]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-slate-800">{value}</p></div>)}</div> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{columns.map(([, label]) => <th key={label} className="whitespace-nowrap px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)} className="border-t border-slate-100">{columns.map(([key]) => <td key={key} className="whitespace-nowrap px-4 py-3 text-slate-700">{currencyKeys.has(key) ? money(row[key]) : row[key] || '—'}</td>)}</tr>)}{!rows.length && <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">No records match the selected filters.</td></tr>}</tbody></table></div>}</div></DashboardLayout>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) { return <label className="text-sm text-slate-600">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2"><option value="">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>; }
