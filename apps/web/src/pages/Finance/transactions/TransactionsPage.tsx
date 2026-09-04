import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  ShieldAlert,
  Paperclip,
  FileText,
} from 'lucide-react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import SectionHeader from '../../../ui/SectionHeader';
import StatusBadge from '../../../ui/StatusBadge';
import Drawer from '../../../ui/Drawer';
import { transactionService } from './services/transactionService';
import { payslipService } from '../../../services/payroll/payslipService';
import { adminService } from '../../../services/admin/adminService';
import { getFinanceScope } from '../../../core/authorization/financeAuthorization';
import { useAuth } from '../../../context/AuthContext';
import type { CompanySettings, BrandProfile } from '../../../types/Admin';
import type {
  ExpenseTransaction,
  RecordExpenseInput,
  PaymentMethodType,
} from '../../../types/Transaction';

interface ActiveSuperAdminEmployee {
  id: string;
  name: string;
  role: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const actor = { role: user?.authorization?.role || user?.assignedRole, employeeId: user?.employeeId, departmentId: user?.departmentId };
  const hasFinanceAccess = getFinanceScope(actor) === 'GLOBAL' || getFinanceScope(actor) === 'SELF';

  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>('All');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('All');

  // Master Data Lists (From Finance Settings & People Module)
  const [expenseTypesList, setExpenseTypesList] = useState<string[]>([]);

  const [superAdminEmployees, setSuperAdminEmployees] = useState<ActiveSuperAdminEmployee[]>([]);

  // Modals & Drawers
  const [showExpenseDrawer, setShowExpenseDrawer] = useState<boolean>(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<ExpenseTransaction | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Approved Expense Form State
  const [expenseNumber, setExpenseNumber] = useState<string>('');
  const [expenseType, setExpenseType] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [manualExpenseType, setManualExpenseType] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paidFromId, setPaidFromId] = useState<string>('Management');
  const [paidById] = useState<string>('');
  const [beneficiary, setBeneficiary] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('');
  const [description, setDescription] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Active Brand Profiles
  const activeBrandProfiles: BrandProfile[] = useMemo(() => {
    return (companySettings?.brandProfilesList || []).filter((b) => b.isActive !== false);
  }, [companySettings]);

  useEffect(() => {
    loadAllData();
    loadMasters();
  }, []);

  useEffect(() => {
    if (activeBrandProfiles.length > 0 && !selectedBrandId) {
      setSelectedBrandId(activeBrandProfiles[0].id);
    }
  }, [activeBrandProfiles, selectedBrandId]);

  useEffect(() => {
    if (showExpenseDrawer) {
      void transactionService.previewNextExpenseNumber()
        .then(setExpenseNumber)
        .catch((error: unknown) => setActionError(error instanceof Error ? error.message : 'Unable to generate an expense number.'));
    }
  }, [showExpenseDrawer]);

  const loadMasters = async () => {
    const [cSettings, types] = await Promise.all([
      adminService.getCompanySettings(),
      transactionService.getExpenseCategoriesList(),
    ]);

    setCompanySettings(cSettings);
    const mergedTypes = [...new Set(['Salary', 'Office Rent', 'Housekeeping', 'CA Fees', 'Office Internet', 'Corporate Mobile Connection', 'Miscellaneous', ...types])];
    setExpenseTypesList(mergedTypes);

    // paidFromId defaults to 'Management', no need to set here
    if (mergedTypes.length > 0) setExpenseType(mergedTypes[0]);

    setSuperAdminEmployees([]);
  };

  const loadAllData = async () => {
    try {
      const exp = await transactionService.getExpenseHistory(actor);
      setExpenses(exp);
    } catch (error) {
      setExpenses([]);
      setActionError(error instanceof Error ? error.message : 'Unable to load finance records.');
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError('');
    setActionSuccess('');

    try {
      if (expenseType === 'Salary' && !brandId) {
        throw new Error('Brand Name is required for Salary expenses.');
      }
      if (expenseType === 'Miscellaneous' && !manualExpenseType.trim()) {
        throw new Error('Manual Expense Type is required for Miscellaneous expenses.');
      }

      const selectedAdmin = superAdminEmployees.find((emp) => emp.id === paidById) || superAdminEmployees[0];
      const isManagement = paidFromId === 'Management';

      let resolvedPaidFrom = 'Management';
      if (!isManagement) {
        const acc = companySettings?.bankAccountsV2?.find(a => a.id === paidFromId);
        if (acc) {
          resolvedPaidFrom = `${acc.bankName} — XXXX${acc.accountNumber.slice(-4)}`;
        }
      }

      const input: RecordExpenseInput = {
        expenseNumber: '', // will be ignored by repository, auto-generated
        transactionDate,
        expenseType,
        expenseCategoryId: expenseType,
        paidFrom: resolvedPaidFrom,
        paidFromId,
        paidById: isManagement ? selectedAdmin?.id : undefined,
        paidByName: isManagement ? selectedAdmin?.name : undefined,
        beneficiary,
        paymentMethod: paymentMethod as PaymentMethodType,
        amount,
        description,
        attachmentName: attachmentName || undefined,
        brandId: expenseType === 'Salary' ? brandId : undefined,
        brandName: expenseType === 'Salary' ? activeBrandProfiles.find(b => b.id === brandId)?.brandName : undefined,
        manualExpenseType: expenseType === 'Miscellaneous' ? manualExpenseType : undefined,
      };

      const finalExpenseNumber = await transactionService.recordExpense(input, user?.name || 'Finance Admin');
      setActionSuccess(`Operational Expense ${finalExpenseNumber} recorded successfully.`);
      setShowExpenseDrawer(false);
      await loadAllData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to record operational expense.');
    } finally {
      setCreating(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return expenses.filter((exp) => {
      // Strictly ignore payroll run outputs to keep this an Operational Expense ledger
      if (exp.expenseType === 'Salary Disbursement' || exp.expenseType === 'OTS Billing') return false;

      let matchesSearch =
        term === '' ||
        [exp.expenseNumber, exp.transactionNumber, exp.beneficiary, exp.expenseType, exp.paidFrom]
          .map((v) => (v || '').toLowerCase())
          .some((val) => val.includes(term));

      let matchesMonth = true;
      if (selectedMonth) {
        const expMonth = exp.transactionDate.substring(0, 7);
        if (expMonth !== selectedMonth) matchesMonth = false;
      }

      let matchesType = true;
      if (selectedExpenseType !== 'All') {
        if ((exp.expenseType || exp.expenseCategoryName) !== selectedExpenseType) matchesType = false;
      }

      let matchesBrand = true;
      if (selectedBrandFilter !== 'All') {
        if (exp.brandId !== selectedBrandFilter) matchesBrand = false;
      }

      return matchesSearch && matchesMonth && matchesType && matchesBrand;
    });
  }, [expenses, searchQuery, selectedMonth, selectedExpenseType, selectedBrandFilter]);

  if (!hasFinanceAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <ShieldAlert size={48} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Access Restricted — Finance Module</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Your canonical authorization role does not have permission to view transactions.
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
              title="Finance Transactions Workspace"
              subtitle="Brand-isolated transactions, operational expenses, bank salary release, and audit history."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExpenseDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-sm"
            >
              <Plus size={14} />
              <span>Record Operational Expense</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Transactions
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {expenses.length} Records
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              TOTAL EXPENSE
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              ₹{filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Brand Profiles
            </span>
            <span className="text-xl font-bold text-sky-600 mt-1 block">
              {activeBrandProfiles.length} Brands
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {actionSuccess}
          </div>
        )}

        {/* Expense Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mb-6">
          <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expense Type</label>
              <select
                value={selectedExpenseType}
                onChange={(e) => {
                  setSelectedExpenseType(e.target.value);
                  if (e.target.value !== 'Salary' && e.target.value !== 'All') {
                    setSelectedBrandFilter('All');
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="All">All Types</option>
                {['Salary', 'Office Rent', 'Housekeeping', 'CA Fees', 'Office Internet', 'Corporate Mobile Connection', 'Miscellaneous'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brand</label>
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                disabled={selectedExpenseType !== 'Salary' && selectedExpenseType !== 'All'}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                <option value="All">All Brands</option>
                {activeBrandProfiles.map((b) => (
                  <option key={b.id} value={b.id}>{b.brandName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-4 relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Brand Transactions Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Expense #</th>
                    <th className="p-3">Expense Type</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Paid From</th>
                    <th className="p-3">Beneficiary</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No transactions found for the selected brand profile.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      let displayDate = exp.transactionDate;
                      if (displayDate && displayDate.includes('-')) {
                        const parts = displayDate.split('-');
                        if (parts.length === 3 && parts[0].length === 4) {
                          displayDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                      }
                      return (
                      <tr key={exp.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold font-mono text-slate-900">{exp.expenseNumber || exp.transactionNumber}</td>
                        <td className="p-3 font-semibold text-purple-700">
                          {exp.expenseType || exp.expenseCategoryName}
                          {exp.expenseType === 'Salary' && exp.brandName && (
                            <span className="block text-[10px] text-slate-500 mt-0.5">{exp.brandName}</span>
                          )}
                          {exp.expenseType === 'Miscellaneous' && exp.manualExpenseType && (
                            <span className="block text-[10px] text-slate-500 mt-0.5">{exp.manualExpenseType}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 font-medium">{displayDate}</td>
                        <td className="p-3 text-slate-700 font-medium">
                          {exp.paidFrom}
                          {exp.paidFrom === 'Management' && exp.paidByName && (
                            <span className="text-[10px] text-emerald-800 font-bold block">
                              By: {exp.paidByName}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-800">{exp.beneficiary}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-slate-600">{exp.paymentMethod || 'NEFT'}</td>
                        <td className="p-3">
                          <StatusBadge status={exp.status} />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(exp.expenseType === 'Salary Disbursement' || exp.expenseCategoryName === 'Salary Disbursement' || exp.payslipId || exp.payslipStoragePath) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const path = await payslipService.resolvePayslipStoragePath(
                                      exp.payslipId || exp.documentId || '',
                                      exp.payslipStoragePath,
                                      exp.employeeId,
                                      exp.salaryMonth
                                    );
                                    await payslipService.downloadPayslipPDF(path, `Payslip_${exp.expenseNumber}.pdf`);
                                  } catch (err: unknown) {
                                    alert(err instanceof Error ? err.message : 'Payslip PDF is unavailable. Please contact HR.');
                                  }
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold text-[11px] flex items-center gap-1"
                              >
                                <FileText size={11} /> View Payslip
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedExpenseForDetail(exp)}
                              className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 rounded font-semibold text-[11px]"
                            >
                              Audit Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Record Operational Expense Drawer */}
        <Drawer
          isOpen={showExpenseDrawer}
          onClose={() => setShowExpenseDrawer(false)}
          title="Record Operational Expense"
          subtitle="Auto-generated on save"
        >
          <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Transaction Number (Read Only)</label>
              <input
                type="text"
                readOnly
                value="Auto-generated on save"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-emerald-800 text-xs text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Expense Type * (Finance Settings Master)</label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {expenseTypesList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {expenseType === 'Salary' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Brand Name *</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select Brand...</option>
                  {activeBrandProfiles.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brandName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {expenseType === 'Miscellaneous' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Manual Expense Type *</label>
                <input
                  type="text"
                  placeholder="e.g. Printer Repair, Stationery..."
                  value={manualExpenseType}
                  onChange={(e) => setManualExpenseType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Expense Date *</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Paid From * (Finance Account Master / Management)</label>
              <select
                value={paidFromId}
                onChange={(e) => setPaidFromId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <optgroup label="MANAGEMENT">
                  <option value="Management">Management</option>
                </optgroup>
                <optgroup label="COMPANY ACCOUNTS (Finance Account Master)">
                  {!companySettings?.bankAccountsV2 || companySettings.bankAccountsV2.length === 0 ? (
                    <option disabled value="">No company bank account configured</option>
                  ) : (
                    companySettings.bankAccountsV2.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} — XXXX{acc.accountNumber.slice(-4)}
                      </option>
                    ))
                  )}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Beneficiary / Vendor *</label>
              <input
                type="text"
                placeholder="e.g. Landlord, Recruiter Name, Vendor, Software Company..."
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Description *</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specific operational expense purpose..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Attachment (Invoice, Bill, Receipt, Voucher)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachmentName(file.name);
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>
              {attachmentName && (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-mono">
                  <Paperclip size={12} />
                  <span>Selected File: {attachmentName}</span>
                </div>
              )}
            </div>

            {actionError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
                {actionError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
            >
              {creating ? 'Recording…' : `Record Operational Expense ${expenseNumber}`}
            </button>
          </form>
        </Drawer>

        {/* Audit Details Modal for Operational Expense */}
        {selectedExpenseForDetail && (
          <Drawer
            isOpen={Boolean(selectedExpenseForDetail)}
            onClose={() => setSelectedExpenseForDetail(null)}
            title={`Expense Details — ${selectedExpenseForDetail.expenseNumber || selectedExpenseForDetail.transactionNumber}`}
            subtitle="Full Financial Audit Record"
          >
            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between font-bold border-b pb-2 text-slate-900 text-sm">
                  <span>{selectedExpenseForDetail.expenseNumber || selectedExpenseForDetail.transactionNumber}</span>
                  <span className="text-emerald-700">₹{selectedExpenseForDetail.amount.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Expense Type</span>
                    <strong className="text-purple-700">{selectedExpenseForDetail.expenseType || selectedExpenseForDetail.expenseCategoryName}</strong>
                  </div>
                  {(selectedExpenseForDetail.expenseType === 'Salary' || selectedExpenseForDetail.expenseCategoryName === 'Salary') && (
                    <div>
                      <span className="text-slate-400 block font-semibold">Brand Name</span>
                      <strong className="text-slate-800">{selectedExpenseForDetail.brandName || 'N/A'}</strong>
                    </div>
                  )}
                  {(selectedExpenseForDetail.expenseType === 'Miscellaneous' || selectedExpenseForDetail.expenseCategoryName === 'Miscellaneous') && (
                    <div>
                      <span className="text-slate-400 block font-semibold">Manual Expense Type</span>
                      <strong className="text-slate-800">{selectedExpenseForDetail.manualExpenseType || 'N/A'}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block font-semibold">Expense Date</span>
                    <strong className="text-slate-800">{selectedExpenseForDetail.transactionDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Paid From</span>
                    <strong className="text-slate-800">{selectedExpenseForDetail.paidFrom}</strong>
                  </div>
                  {selectedExpenseForDetail.paidFrom === 'Management' && (
                    <div>
                      <span className="text-slate-400 block font-semibold">Paid By (Management)</span>
                      <strong className="text-amber-800">{selectedExpenseForDetail.paidByName || 'Super Admin'}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block font-semibold">Beneficiary / Vendor</span>
                    <strong className="text-slate-800">{selectedExpenseForDetail.beneficiary}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Payment Method</span>
                    <strong className="text-slate-800">{selectedExpenseForDetail.paymentMethod || 'NEFT'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t text-[11px]">
                  <span className="text-slate-400 block font-semibold">Description</span>
                  <p className="text-slate-700">{selectedExpenseForDetail.description}</p>
                </div>

                {selectedExpenseForDetail.attachmentName && (
                  <div className="pt-2 border-t text-[11px] flex items-center gap-1.5 text-emerald-700 font-mono">
                    <Paperclip size={14} />
                    <span>Attachment: {selectedExpenseForDetail.attachmentName}</span>
                  </div>
                )}

                <div className="pt-2 border-t text-[10px] text-slate-400 font-mono">
                  Created By: {selectedExpenseForDetail.createdBy} • Status: {selectedExpenseForDetail.status}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedExpenseForDetail(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold"
                >
                  Close Audit Details
                </button>
              </div>
            </div>
          </Drawer>
        )}
      </div>
    </DashboardLayout>
  );
}
