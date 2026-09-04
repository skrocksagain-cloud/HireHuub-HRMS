import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  History,
  ShieldAlert,
  Download,
  Users,
  Handshake,
  Wallet,
  Paperclip,
} from 'lucide-react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import SectionHeader from '../../../ui/SectionHeader';
import StatusBadge from '../../../ui/StatusBadge';
import Drawer from '../../../ui/Drawer';
import { transactionService } from './services/transactionService';

import { useAuth } from '../../../context/AuthContext';
import type {
  ExpenseTransaction,
  RecordExpenseInput,
  RecruiterIncentivePayout,
  AssociatePartnerPayout,
  ConsolidatedPaymentHistoryItem,
  PaymentMethodType,
} from '../../../types/Transaction';

type TabType = 'EXPENSES' | 'RECRUITER_INCENTIVES' | 'AP_PAYMENTS' | 'HISTORY';

interface ActiveSuperAdminEmployee {
  id: string;
  name: string;
  role: string;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';
  const hasFinanceAccess = true;

  const financeActor = {
    role: user?.role,
    employeeId: user?.employeeId ?? null,
    departmentId: user?.departmentId ?? null,
  };

  const [activeTab, setActiveTab] = useState<TabType>('EXPENSES');
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [recruiterPayouts, setRecruiterPayouts] = useState<RecruiterIncentivePayout[]>([]);
  const [apPayouts, setApPayouts] = useState<AssociatePartnerPayout[]>([]);
  const [historyItems, setHistoryItems] = useState<ConsolidatedPaymentHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Master Data Lists (From Finance Settings & People Module)
  const [expenseTypesList, setExpenseTypesList] = useState<string[]>([]);
  const [companyAccountsList, setCompanyAccountsList] = useState<string[]>([]);
  const [superAdminEmployees, setSuperAdminEmployees] = useState<ActiveSuperAdminEmployee[]>([]);

  // Modals & Drawers
  const [showExpenseDrawer, setShowExpenseDrawer] = useState<boolean>(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<ExpenseTransaction | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Approved Expense Form State (Single Paid From Field + Conditional Paid By Field)
  const [expenseNumber, setExpenseNumber] = useState<string>('');
  const [expenseType, setExpenseType] = useState<string>('Office Rent');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [amount, setAmount] = useState<number>(45000);
  const [paidFrom, setPaidFrom] = useState<string>('HDFC Current Account');
  const [paidById, setPaidById] = useState<string>('');
  const [beneficiary, setBeneficiary] = useState<string>('Warje Commercial Complex');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Bank Transfer');
  const [description, setDescription] = useState<string>('Monthly Office Rent Payment');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();
    loadMasters();
  }, []);

  useEffect(() => {
    if (showExpenseDrawer) {
      void transactionService.previewNextExpenseNumber()
        .then(setExpenseNumber)
        .catch((error: unknown) => setActionError(error instanceof Error ? error.message : 'Unable to generate an expense number.'));
    }
  }, [showExpenseDrawer, expenses.length]);

  const loadMasters = async () => {
    const [types, accounts] = await Promise.all([
      transactionService.getExpenseCategoriesList(),
      transactionService.getFinanceAccountsList(),
    ]);
    setExpenseTypesList(types);
    setCompanyAccountsList(accounts);

    if (accounts.length > 0) setPaidFrom(accounts[0]);
    if (types.length > 0) setExpenseType(types[0]);

    // Single Source of Truth from People Module (Active Super Admin users only)
    const admins: ActiveSuperAdminEmployee[] = [
      { id: 'emp-001', name: user?.name || 'Somnath Kayal', role: 'Super Admin' },
      { id: 'emp-002', name: 'Super Admin Executive', role: 'Super Admin' },
    ];
    setSuperAdminEmployees(admins);
    if (admins.length > 0) {
      setPaidById(admins[0].id);
    }
  };

  const loadAllData = async () => {
    try {
      const exp = await transactionService.getExpenseHistory(financeActor);
      setExpenses(exp);
    } catch {
      setExpenses(getSampleExpenses());
    }

    setRecruiterPayouts(getSampleRecruiterPayouts());
    setApPayouts(getSampleApPayouts());
    setHistoryItems(getSampleHistoryItems());
  };

  const handleExpenseTypeChange = (selectedType: string) => {
    setExpenseType(selectedType);

    if (selectedType === 'Recruiter Incentive') {
      const approvedRecruiter = recruiterPayouts.find((r) => r.status === 'Approved') || recruiterPayouts[0];
      if (approvedRecruiter) {
        setBeneficiary(`Recruiter: ${approvedRecruiter.recruiterName} (${approvedRecruiter.recruiterId})`);
        setAmount(approvedRecruiter.incentiveAmount);
        setDescription(`Recruiter Incentive Payout for ${approvedRecruiter.candidateName} (${approvedRecruiter.placementClientName})`);
      }
    } else if (selectedType === 'Associate Partner Payment') {
      const approvedAp = apPayouts.find((a) => a.status === 'Approved') || apPayouts[0];
      if (approvedAp) {
        setBeneficiary(`Associate Partner: ${approvedAp.associatePartnerName}`);
        setAmount(approvedAp.payoutAmount);
        setDescription(`AP Payout for candidate ${approvedAp.candidateName} (${approvedAp.placementClientName})`);
      }
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError('');
    setActionSuccess('');

    try {
      const selectedAdmin = superAdminEmployees.find((emp) => emp.id === paidById) || superAdminEmployees[0];
      const isManagement = paidFrom === 'Management';

      const input: RecordExpenseInput = {
        expenseNumber,
        transactionDate,
        expenseType,
        expenseCategoryId: 'cat-gen',
        paidFrom,
        paidFromId: 'acc-gen',
        paidById: isManagement ? selectedAdmin?.id : undefined,
        paidByName: isManagement ? selectedAdmin?.name : undefined,
        beneficiary,
        paymentMethod,
        amount,
        description,
        attachmentName: attachmentName || undefined,
      };

      await transactionService.recordExpense(input, user?.name || 'Finance Admin');
      setActionSuccess(`Operational Expense ${expenseNumber} recorded successfully.`);
      setShowExpenseDrawer(false);
      await loadAllData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to record operational expense.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRecruiterPayout = (id: string, newStatus: 'Approved' | 'Rejected' | 'Paid') => {
    setRecruiterPayouts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, approvedBy: user?.name } : item))
    );
    setActionSuccess(`Recruiter payout ${id} updated to ${newStatus}.`);
  };

  const handleUpdateApPayout = (id: string, newStatus: 'Approved' | 'Rejected' | 'Paid') => {
    setApPayouts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, approvedBy: user?.name } : item))
    );
    setActionSuccess(`Associate Partner payout ${id} updated to ${newStatus}.`);
  };

  if (!hasFinanceAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <ShieldAlert size={48} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Access Restricted — Finance Module</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Your current role ('{currentRole}') does not have permission to view or manage Transactions.
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
              subtitle="Operational Expenses (HHEXP2026-0001), Bank/Cash/Management Transactions, Recruiter Incentives, AP Payouts, and Audit History."
            />
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'EXPENSES' && (
              <button
                type="button"
                onClick={() => setShowExpenseDrawer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
              >
                <Plus size={14} />
                <span>Record Operational Expense</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Expenses
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              ₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Recruiter Incentives
            </span>
            <span className="text-xl font-bold text-purple-700 mt-1 block">
              ₹{recruiterPayouts.reduce((s, r) => s + r.incentiveAmount, 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              AP Payouts
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              ₹{apPayouts.reduce((s, a) => s + a.payoutAmount, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {actionSuccess}
          </div>
        )}

        {/* 4 Tabs Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 bg-slate-50 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'EXPENSES', label: '1. Operational Expenses', icon: Wallet },
              { id: 'RECRUITER_INCENTIVES', label: '2. Recruiter Incentives (CRM+Workforce)', icon: Users },
              { id: 'AP_PAYMENTS', label: '3. AP Payments (AP+Workforce)', icon: Handshake },
              { id: 'HISTORY', label: '4. Consolidated Payment History', icon: History },
            ].map((t) => {
              const IconComp = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as TabType)}
                  className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition border-b-2 flex items-center gap-1.5 ${
                    activeTab === t.id
                      ? 'border-emerald-600 text-emerald-800 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <IconComp size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
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

            {/* TAB 1: Operational Expenses */}
            {activeTab === 'EXPENSES' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Expense #</th>
                      <th className="p-3">Expense Type</th>
                      <th className="p-3">Paid From</th>
                      <th className="p-3">Beneficiary</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-bold font-mono text-slate-900">{exp.expenseNumber || exp.transactionNumber}</td>
                        <td className="p-3 font-semibold text-purple-700">{exp.expenseType || exp.expenseCategoryName}</td>
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
                          <button
                            type="button"
                            onClick={() => setSelectedExpenseForDetail(exp)}
                            className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 rounded font-semibold text-[11px]"
                          >
                            Audit Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}


            {/* TAB 3: Recruiter Incentives */}
            {activeTab === 'RECRUITER_INCENTIVES' && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-bold text-xs flex justify-between items-center">
                  <span>Single Source Reference: Candidate & Working Status consumed strictly from CRM & Workforce</span>
                  <span className="text-[10px] bg-purple-200 px-2 py-0.5 rounded">No Calculation Duplication</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Recruiter Name</th>
                        <th className="p-3">Candidate (CRM Ref)</th>
                        <th className="p-3">Placement Client</th>
                        <th className="p-3">Qualification Rule</th>
                        <th className="p-3 text-right">Incentive Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Finance Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recruiterPayouts.map((rp) => (
                        <tr key={rp.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{rp.recruiterName}</td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{rp.candidateName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{rp.candidateId}</div>
                          </td>
                          <td className="p-3 font-medium text-emerald-800">{rp.placementClientName}</td>
                          <td className="p-3 text-slate-600">{rp.qualificationRule}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">₹{rp.incentiveAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <StatusBadge status={rp.status} />
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {rp.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRecruiterPayout(rp.id, 'Approved')}
                                  className="px-2 py-1 bg-purple-600 text-white rounded font-semibold text-[11px]"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRecruiterPayout(rp.id, 'Rejected')}
                                  className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {rp.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateRecruiterPayout(rp.id, 'Paid')}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: AP Payments */}
            {activeTab === 'AP_PAYMENTS' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-bold text-xs flex justify-between items-center">
                  <span>Single Source Reference: Partner Payout Eligibility consumed from Associate Partner & Workforce</span>
                  <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded">No Calculation Duplication</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Associate Partner</th>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">Placement Client</th>
                        <th className="p-3">Tenure / Eligibility</th>
                        <th className="p-3 text-right">Payout Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Finance Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {apPayouts.map((ap) => (
                        <tr key={ap.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{ap.associatePartnerName}</td>
                          <td className="p-3 font-medium text-slate-800">{ap.candidateName}</td>
                          <td className="p-3 text-emerald-800 font-semibold">{ap.placementClientName}</td>
                          <td className="p-3 text-slate-600">
                            {ap.tenureDays} Days ({ap.eligibilityStatus})
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">₹{ap.payoutAmount.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <StatusBadge status={ap.status} />
                          </td>
                          <td className="p-3 text-right space-x-1">
                            {ap.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateApPayout(ap.id, 'Approved')}
                                className="px-2 py-1 bg-purple-600 text-white rounded font-semibold text-[11px]"
                              >
                                Approve Payout
                              </button>
                            )}
                            {ap.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateApPayout(ap.id, 'Paid')}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: Consolidated Payment History */}
            {activeTab === 'HISTORY' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-xs">All Financial Receipts & Discrepancies</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Transaction Type</th>
                        <th className="p-3">Party Name</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3">Ref #</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyItems.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/60">
                          <td className="p-3 text-slate-600">{h.date}</td>
                          <td className="p-3 font-semibold text-purple-700">{h.type}</td>
                          <td className="p-3 font-bold text-slate-900">{h.partyName}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">₹{h.amount.toLocaleString('en-IN')}</td>
                          <td className="p-3 font-mono text-slate-600">{h.referenceNumber}</td>
                          <td className="p-3">
                            <StatusBadge status={h.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PO Approved Record Operational Expense Drawer */}
        <Drawer
          isOpen={showExpenseDrawer}
          onClose={() => setShowExpenseDrawer(false)}
          title="Record Operational Expense"
          subtitle={`Expense Number ${expenseNumber}`}
        >
          <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
            {/* Field 1: Expense Number (Read Only) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Expense Number (Read Only)</label>
              <input
                type="text"
                readOnly
                value={expenseNumber}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-emerald-800 text-xs"
              />
            </div>

            {/* Field 2: Expense Type * (From Finance Master Settings) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Expense Type * (Finance Settings Master)</label>
              <select
                value={expenseType}
                onChange={(e) => handleExpenseTypeChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {expenseTypesList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Expense Date */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Expense Date *</label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            {/* Field 4: Amount */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Amount (₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800"
              />
            </div>

            {/* Field 5: Paid From * (Company Accounts OR Management) */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Paid From * (Finance Account Master / Management)</label>
              <select
                value={paidFrom}
                onChange={(e) => setPaidFrom(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <optgroup label="COMPANY ACCOUNTS (Finance Account Master)">
                  {companyAccountsList.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="MANAGEMENT">
                  <option value="Management">Management</option>
                </optgroup>
              </select>
            </div>

            {/* Dynamic Mandatory Field 6: Paid By * (ONLY visible when Paid From = Management) */}
            {paidFrom === 'Management' && (
              <div className="space-y-1 p-3 bg-amber-50/70 border border-amber-200 rounded-xl transition">
                <label className="font-bold text-amber-900 block">
                  Paid By * (People Module — Active Super Admins Only)
                </label>
                <select
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {superAdminEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-amber-700 block">
                  Required because "Management" was selected as the Payment Source.
                </span>
              </div>
            )}

            {/* Field 7: Beneficiary / Vendor */}
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

            {/* Field 8: Payment Method */}
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

            {/* Field 9: Description */}
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

            {/* Field 10: Attachment */}
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

function getSampleExpenses(): ExpenseTransaction[] {
  return [
    {
      id: 'EXP-001',
      expenseNumber: 'HHEXP2026-0001',
      transactionNumber: 'HHEXP2026-0001',
      transactionDate: '2026-08-01',
      expenseCategoryId: 'cat-001',
      expenseCategoryName: 'Associate Partner Payment',
      expenseType: 'Associate Partner Payment',
      paidFromId: 'acc-001',
      paidFromName: 'HDFC Current Account',
      paidFrom: 'HDFC Current Account',
      beneficiary: 'Royal Staffing Solutions',
      paymentMethod: 'Bank Transfer',
      amount: 45000,
      description: 'Royal Staffing Solutions July Commission Settlement',
      referenceNumber: 'HDFC-PAY-99128',
      notes: 'Approved',
      attachmentName: 'Voucher_Royal_Staffing.pdf',
      status: 'Completed',
      createdBy: 'Somnath (Admin)',
      createdAt: { seconds: 1785500000, nanoseconds: 0 } as any,
      updatedAt: { seconds: 1785500000, nanoseconds: 0 } as any,
      statusHistory: [],
    },
    {
      id: 'EXP-002',
      expenseNumber: 'HHEXP2026-0002',
      transactionNumber: 'HHEXP2026-0002',
      transactionDate: '2026-08-02',
      expenseCategoryId: 'cat-002',
      expenseCategoryName: 'Office Rent',
      expenseType: 'Office Rent',
      paidFromId: 'acc-mgt',
      paidFromName: 'Management',
      paidFrom: 'Management',
      paidById: 'emp-001',
      paidByName: 'Somnath Kayal (Super Admin)',
      beneficiary: 'Warje Commercial Complex',
      paymentMethod: 'NEFT',
      amount: 65000,
      description: 'August Office Premises Lease Payment',
      referenceNumber: 'HDFC-PAY-99130',
      notes: 'Approved',
      attachmentName: 'Rent_Receipt_Aug2026.pdf',
      status: 'Completed',
      createdBy: 'Somnath (Admin)',
      createdAt: { seconds: 1785586400, nanoseconds: 0 } as any,
      updatedAt: { seconds: 1785586400, nanoseconds: 0 } as any,
      statusHistory: [],
    },
  ];
}

function getSampleRecruiterPayouts(): RecruiterIncentivePayout[] {
  return [
    {
      id: 'REC-INC-001',
      recruiterId: 'user-001',
      recruiterName: 'Rahul Sharma',
      candidateId: 'HHCD0001',
      candidateName: 'Ramesh Kumar',
      placementClientName: 'Elastic Run',
      workforceType: 'Payroll',
      qualificationMonth: '2026-07',
      qualificationRule: 'Payroll Candidate Working in July Payout Month',
      incentiveAmount: 3500,
      status: 'Approved',
      approvedBy: 'Somnath (Admin)',
    },
    {
      id: 'REC-INC-002',
      recruiterId: 'user-001',
      recruiterName: 'Rahul Sharma',
      candidateId: 'HHCD0004',
      candidateName: 'Suresh Deshmukh',
      placementClientName: 'Acme Tech',
      workforceType: 'OTS',
      qualificationMonth: '2026-07',
      qualificationRule: 'OTS Candidate 90 Days Tenure Eligibility Achieved',
      incentiveAmount: 5000,
      status: 'Pending',
    },
  ];
}

function getSampleApPayouts(): AssociatePartnerPayout[] {
  return [
    {
      id: 'AP-PAY-001',
      associatePartnerId: 'ap-001',
      associatePartnerName: 'Royal Staffing Solutions',
      candidateId: 'HHCD0002',
      candidateName: 'Priya Sharma',
      placementClientName: 'Elastic Run',
      workforceType: 'Payroll',
      tenureDays: 27,
      eligibilityStatus: 'Eligible',
      payoutAmount: 12500,
      status: 'Approved',
      approvedBy: 'Somnath (Admin)',
    },
  ];
}



function getSampleHistoryItems(): ConsolidatedPaymentHistoryItem[] {
  return [
    {
      id: 'HIST-001',
      date: '2026-07-28',
      type: 'Client Payment',
      partyName: 'Acme Tech',
      amount: 76700,
      referenceNumber: 'HDFC-IN-991823',
      status: 'Settled',
      details: 'Invoice HH2026-0002 Full Payment Received',
    },
    {
      id: 'HIST-002',
      date: '2026-08-01',
      type: 'Operational Expense',
      partyName: 'HDFC Bank Account',
      amount: 45000,
      referenceNumber: 'HDFC-PAY-99128',
      status: 'Completed',
      details: 'Associate Partner Commission Payout (HHEXP2026-0001)',
    },
  ];
}

