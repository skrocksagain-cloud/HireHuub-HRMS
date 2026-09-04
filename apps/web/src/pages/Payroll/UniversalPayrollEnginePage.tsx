/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lock,
  Download,
  DollarSign,
  ChevronRight,
  CreditCard,
  CheckSquare,
  Square,
  ShieldCheck,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import type {
  CompanySettings,
  SalaryComponent,
  BrandSalaryStructure,
  EmployeeSalaryProfile,
  PayrollRunRecord,
  GeneratedPayslipRecord,
} from '../../types/Admin';
import { adminService } from '../../services/admin/adminService';
import { payrollEngineService } from '../../services/payroll/payrollEngineService';
import { payslipService } from '../../services/payroll/payslipService';
import { employeeRepository } from '../Employee/repositories/employeeRepository';
import type { Employee } from '../Employee/types/Employee';
import { db } from '../../firebase/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import ExcelJS from 'exceljs';
import { transactionService } from '../Finance/transactions/services/transactionService';
import { useAuth } from '../../context/AuthContext';
import { canReadFinanceGlobally } from '../../core/authorization/financeAuthorization';

type WorkspaceTab = 'runs' | 'register' | 'payslips' | 'bank_process' | 'components' | 'structures' | 'profiles';

interface EligibleBankEmployeeItem {
  employee: Employee;
  netSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  isEligible: boolean;
  ineligibilityReason?: string;
  isAlreadyReleased?: boolean;
}

export default function UniversalPayrollEnginePage() {
  const { user } = useAuth();
  const canReadPayroll = canReadFinanceGlobally({ role: user?.authorization?.role || user?.assignedRole });
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('runs');

  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [structures, setStructures] = useState<BrandSalaryStructure[]>([]);
  const [profiles, setProfiles] = useState<EmployeeSalaryProfile[]>([]);
  const [currentRunRecord, setCurrentRunRecord] = useState<PayrollRunRecord | null>(null);
  const [allPayslips, setAllPayslips] = useState<GeneratedPayslipRecord[]>([]);

  // Bank Process Tab States
  const [selectedDebitAccount, setSelectedDebitAccount] = useState<string>('');
  const [bankItems, setBankItems] = useState<EligibleBankEmployeeItem[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [isLoadingBankItems, setIsLoadingBankItems] = useState<boolean>(false);
  const [isProcessingRelease, setIsProcessingRelease] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingPayslips, setIsGeneratingPayslips] = useState(false);

  const brandList = useMemo(() => companySettings?.brandProfilesList || [], [companySettings]);
  const activeBrand = useMemo(() => brandList.find((b) => b.id === selectedBrandId) || brandList[0], [brandList, selectedBrandId]);

  const bankAccounts = useMemo(() => {
    const list: Array<{ accountNumber: string; bankName: string; isPrimary?: boolean }> = [];
    if (!companySettings) return list;
    const v2Banks = (companySettings as any)?.bankAccountsV2 || [];
    v2Banks.forEach((acc: any) => {
      if (acc && acc.isActive !== false && acc.accountNumber?.trim()) {
        const clean = acc.accountNumber.trim();
        if (!list.some((b) => b.accountNumber === clean)) {
          list.push({ accountNumber: clean, bankName: acc.bankName || 'Bank', isPrimary: Boolean(acc.isPrimary) });
        }
      }
    });
    const compBank = (companySettings as any)?.companyBankDetails;
    if (compBank?.accountNumber?.trim()) {
      const clean = compBank.accountNumber.trim();
      if (!list.some((b) => b.accountNumber === clean)) {
        list.push({ accountNumber: clean, bankName: compBank.bankName || 'Bank', isPrimary: true });
      }
    }
    return list;
  }, [companySettings]);

  useEffect(() => {
    if (!canReadPayroll) return;
    const initData = async () => {
      const settings = await adminService.getCompanySettings();
      setCompanySettings(settings);
      const bList = settings?.brandProfilesList || [];
      if (bList.length > 0) setSelectedBrandId(bList[0].id);

      const compList = await payrollEngineService.getSalaryComponents();
      setComponents(compList);
    };
    void initData();
  }, [canReadPayroll]);

  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedDebitAccount) {
      setSelectedDebitAccount(bankAccounts[0].accountNumber);
    }
  }, [bankAccounts, selectedDebitAccount]);

  useEffect(() => {
    if (!canReadPayroll || !selectedBrandId) return;
    const loadBrandData = async () => {
      const structList = await payrollEngineService.getBrandSalaryStructures(selectedBrandId);
      setStructures(structList);

      const profList = await payrollEngineService.getEmployeeSalaryProfiles(selectedBrandId);
      setProfiles(profList);

      await loadRunAndPayslips();
    };
    void loadBrandData();
  }, [canReadPayroll, selectedBrandId, selectedMonth]);

  const loadRunAndPayslips = async () => {
    if (!canReadPayroll || !selectedBrandId || !selectedMonth) return;
    try {
      const targetRunId = `prun-${selectedMonth}-${selectedBrandId}`;
      // Direct doc refetch for authoritative post-finalization persistence
      const docRef = doc(db, 'payrollRuns', targetRunId);
      const runSnap = await getDoc(docRef).catch(() => null);

      if (runSnap && runSnap.exists()) {
        setCurrentRunRecord(runSnap.data() as PayrollRunRecord);
      } else {
        const fallbackRef = doc(db, 'payrollRuns', targetRunId);
        const fbSnap = await getDoc(fallbackRef).catch(() => null);
        if (fbSnap && fbSnap.exists()) {
          setCurrentRunRecord(fbSnap.data() as PayrollRunRecord);
        } else {
          setCurrentRunRecord(null);
        }
      }

      // Load all generated payslips for current run
      const payslipQuery = query(collection(db, 'generated_payslips'), where('payrollRunId', '==', targetRunId));
      const payslipSnap = await getDocs(payslipQuery).catch(() => ({ docs: [] } as any));
      const pList = payslipSnap.docs.map((d: any) => d.data() as GeneratedPayslipRecord);
      
      setAllPayslips(pList);
    } catch {
      // Fallthrough
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Step 1: Calculate Monthly Payroll (Draft -> Calculated)
  const handleCalculateMonthlyPayroll = async () => {
    if (!selectedBrandId) return;
    try {
      setIsCalculating(true);
      setErrorMsg(null);

      if (currentRunRecord && (currentRunRecord.status === 'Finalized' || currentRunRecord.status === 'Released')) {
        throw new Error('This payroll run is Finalized/Released and immutable. Recalculation is blocked.');
      }

      const [yStr] = selectedMonth.split('-');
      const record = await payrollEngineService.executePayrollRun(selectedMonth, parseInt(yStr, 10), selectedBrandId);
      setCurrentRunRecord(record);
      await loadRunAndPayslips();
      showToast(`Calculated Payroll for ${selectedMonth} (${record.totalEmployees} Employees Processed)`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Payroll calculation failed.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Step 2: Mark Review State
  const handleReviewPayroll = async () => {
    if (!currentRunRecord) return;
    try {
      setErrorMsg(null);
      await payrollEngineService.updatePayrollRunStatus(currentRunRecord.id, 'Review');
      setCurrentRunRecord({ ...currentRunRecord, status: 'Review', lockedAt: new Date().toISOString() });
      showToast('Payroll Run marked as Review. Verification complete.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to set Review status.');
    }
  };

  // Step 3: Finalize Payroll Run (Calculated / Review -> Finalized)
  const handleFinalizePayroll = async () => {
    if (!currentRunRecord) return;
    try {
      setErrorMsg(null);
      await payrollEngineService.updatePayrollRunStatus(currentRunRecord.id, 'Finalized', 'Super Admin');
      await loadRunAndPayslips();
      showToast('Payroll Run Finalized! Record is now immutable and ready for Payslip Generation.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Finalization failed.');
    }
  };

  // Step 4: Generate Payslips (Finalized Payroll -> generatePayslipSnapshotsForRun -> Storage PDF)
  const handleGeneratePayslips = async () => {
    if (!currentRunRecord) return;
    if (currentRunRecord.status !== 'Finalized' && currentRunRecord.status !== 'Released') {
      setErrorMsg('Payroll run must be Finalized before generating payslips.');
      return;
    }

    try {
      setIsGeneratingPayslips(true);
      setErrorMsg(null);
      const generated = await payrollEngineService.generatePayslipSnapshotsForRun(currentRunRecord);
      setAllPayslips(generated);
      showToast(`Generated ${generated.length} Payslips! PDF files generated and saved to Storage.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Payslip generation failed.');
    } finally {
      setIsGeneratingPayslips(false);
    }
  };

  // Step 5: Release Payslips to Employee Self-Service
  const handleReleasePayslips = async () => {
    if (!currentRunRecord) return;
    try {
      setErrorMsg(null);
      await payrollEngineService.releasePayslipsForRun(currentRunRecord.id);
      setCurrentRunRecord({ ...currentRunRecord, status: 'Released', releasedAt: new Date().toISOString() });
      await loadRunAndPayslips();
      showToast('All Generated Payslips Released! Employees can now view and download statements.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Release failed.');
    }
  };

  // Bank Process Tab: Load Eligible Employees based on FINALIZED payroll
  useEffect(() => {
    if (activeTab !== 'bank_process' || !selectedBrandId || !selectedMonth) return;

    let isMounted = true;
    setIsLoadingBankItems(true);
    setErrorMsg(null);

    async function evaluateBankEligibility() {
      try {
        const emps = await employeeRepository.getEmployees();
        if (!isMounted) return;

        // Released transactions check
        const releasedQuery = query(
          collection(db, 'finance_transactions'),
          where('salaryMonth', '==', selectedMonth),
          where('brandId', '==', selectedBrandId)
        );
        const releasedSnap = await getDocs(releasedQuery).catch(() => ({ docs: [] } as any));
        const releasedEmpIds = new Set(releasedSnap.docs.map((d: any) => d.data()?.employeeId));

        const isRunFinalized = currentRunRecord && (currentRunRecord.status === 'Finalized' || currentRunRecord.status === 'Released');
        const resultMap = new Map((currentRunRecord?.employeeResults || []).map((r) => [r.employeeId, r]));

        const processedItems: EligibleBankEmployeeItem[] = [];
        const eligibleIds: string[] = [];

        for (const emp of emps) {
          const empId = emp.id || emp.employeeId;
          const isAlreadyReleased = releasedEmpIds.has(empId);

          const isStatusActive = (emp.employmentStatus === 'Active' || emp.status === 'Active') &&
            emp.employmentStatus !== 'Inactive' && emp.employmentStatus !== 'Terminated';
          const isNotExited = !emp.exitRecord || emp.exitRecord.exitStatus !== 'Exit Completed';

          let isEligible = Boolean(isRunFinalized && isStatusActive && isNotExited);
          let ineligibilityReason = '';

          if (!isRunFinalized) {
            ineligibilityReason = 'Payroll is not finalized';
          } else if (!isStatusActive) {
            ineligibilityReason = `Status '${emp.employmentStatus || 'Inactive'}' excluded`;
          } else if (!isNotExited) {
            ineligibilityReason = 'Completed Exit';
          }

          const payrollRes = resultMap.get(empId);
          if (isEligible && (!payrollRes || payrollRes.netSalary <= 0)) {
            isEligible = false;
            ineligibilityReason = 'No valid net salary result';
          }

          const empAcc = (emp as any).accountNumber || (emp as any).bankAccount || '';
          const empIfsc = (emp as any).ifscCode || (emp as any).ifsc || '';

          if (isEligible && (!empAcc || !empIfsc)) {
            isEligible = false;
            ineligibilityReason = 'Missing Bank Account or IFSC';
          }

          if (isAlreadyReleased) {
            isEligible = false;
            ineligibilityReason = `Salary already released for ${selectedMonth}`;
          }

          if (isEligible) eligibleIds.push(empId);

          processedItems.push({
            employee: emp,
            netSalary: payrollRes?.netSalary ?? 0,
            grossEarnings: payrollRes?.grossEarnings ?? 0,
            totalDeductions: payrollRes?.totalDeductions ?? 0,
            isEligible,
            ineligibilityReason,
            isAlreadyReleased,
          });
        }

        if (isMounted) {
          setBankItems(processedItems);
          setSelectedEmpIds(eligibleIds);
        }
      } catch {
        if (isMounted) setErrorMsg('Failed to evaluate bank disbursement eligibility.');
      } finally {
        if (isMounted) setIsLoadingBankItems(false);
      }
    }

    void evaluateBankEligibility();
  }, [activeTab, selectedBrandId, selectedMonth, currentRunRecord]);

  const selectedBankItems = useMemo(() => {
    return bankItems.filter((item) => selectedEmpIds.includes(item.employee.id || item.employee.employeeId));
  }, [bankItems, selectedEmpIds]);

  const totalDisbursementAmount = useMemo(() => {
    return selectedBankItems.reduce((sum, item) => sum + item.netSalary, 0);
  }, [selectedBankItems]);

  const handleExecuteBankDisbursement = async () => {
    if (isProcessingRelease) return;
    setIsProcessingRelease(true);
    setShowConfirmModal(false);
    setErrorMsg(null);

    try {
      const selectedBankObj = bankAccounts.find((b) => b.accountNumber === selectedDebitAccount) || bankAccounts[0];
      if (!selectedBankObj) throw new Error('No active company bank account selected.');

      const [yearStr, monthStr] = selectedMonth.split('-');
      const yearNum = parseInt(yearStr, 10);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const fullMonthName = monthNames[parseInt(monthStr, 10) - 1] || 'Month';

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Salary Disbursement');

      worksheet.columns = [
        { header: 'Debit Account Number', key: 'debitAccount', width: 24 },
        { header: 'Transaction Amount', key: 'amount', width: 18 },
        { header: 'Transaction Currency', key: 'currency', width: 18 },
        { header: 'Beneficiary Name', key: 'beneficiaryName', width: 28 },
        { header: 'Beneficiary Account Number', key: 'beneficiaryAccount', width: 26 },
        { header: 'Beneficiary IFSC Code', key: 'ifscCode', width: 20 },
        { header: 'Transaction Date', key: 'transactionDate', width: 16 },
        { header: 'Payment Mode', key: 'paymentMode', width: 16 },
        { header: 'Customer Reference Number', key: 'customerRef', width: 32 },
        { header: 'Beneficiary Nickname/Code', key: 'beneficiaryCode', width: 24 },
      ];

      const releaseDate = new Date().toISOString().split('T')[0];

      for (const item of selectedBankItems) {
        const emp = item.employee;
        const eAcc = (emp as any).accountNumber || (emp as any).bankAccount || '';
        const eIfsc = (emp as any).ifscCode || (emp as any).ifsc || '';

        const firstNameClean = (emp.firstName || emp.fullName.split(' ')[0] || 'Employee').replace(/[^a-zA-Z]/g, '');
        const empCodeClean = (emp.employeeCode || emp.employeeId || 'HH0001').replace(/[^a-zA-Z0-9]/g, '');
        const customerRefNumber = `${firstNameClean}${fullMonthName}${empCodeClean}`;

        worksheet.addRow({
          debitAccount: selectedBankObj.accountNumber,
          amount: item.netSalary,
          currency: 'INR',
          beneficiaryName: emp.fullName,
          beneficiaryAccount: eAcc,
          ifscCode: eIfsc,
          transactionDate: releaseDate,
          paymentMode: 'NEFT',
          customerRef: customerRefNumber,
          beneficiaryCode: empCodeClean,
        });

        const payslipId = `pslip-${selectedMonth}-${empCodeClean}`;

        // Create 1 Idempotent Salary Disbursement Transaction referencing payslipId
        await transactionService.recordExpense(
          {
            expenseNumber: `SAL-${selectedMonth}-${empCodeClean}`,
            transactionDate: releaseDate,
            expenseType: 'Salary Disbursement',
            expenseCategoryId: 'Salary Disbursement',
            paidFrom: selectedBankObj.bankName,
            paidFromId: selectedBankObj.accountNumber,
            beneficiary: `${emp.fullName} (${empCodeClean})`,
            paymentMethod: 'NEFT',
            amount: item.netSalary,
            description: `Salary Release for ${fullMonthName} ${yearNum} (${activeBrand?.brandName})`,
            payrollRunId: currentRunRecord?.id,
            payslipId,
            employeeId: empCodeClean,
            salaryMonth: selectedMonth,
          },
          'Super Admin'
        );
      }

      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary Disbursement - ${fullMonthName} ${yearNum}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Successfully processed bank file and transactions for ${selectedBankItems.length} employees.`);
      await loadRunAndPayslips();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Bank Process release failed.');
    } finally {
      setIsProcessingRelease(false);
    }
  };

  // Compute Register Totals
  const registerTotals = useMemo(() => {
    if (!currentRunRecord) return { count: 0, gross: 0, incentive: 0, deductions: 0, net: 0 };
    const results = currentRunRecord.employeeResults || [];
    return {
      count: results.length,
      gross: results.reduce((s, r) => s + r.grossEarnings, 0),
      incentive: results.reduce((s, r) => s + r.performanceIncentive, 0),
      deductions: results.reduce((s, r) => s + r.totalDeductions, 0),
      net: results.reduce((s, r) => s + r.netSalary, 0),
    };
  }, [currentRunRecord]);

  if (!canReadPayroll) {
    return <DashboardLayout><div className="p-8 text-center text-rose-600 font-bold">Your canonical authorization role cannot access organization payroll data.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans text-slate-100 p-2">
        {/* Top Header & Context */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-950 border border-sky-800/60 text-sky-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-0.5">
                <span>Legal Entity: {companySettings?.companyName || 'Hire Huub ERP'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-sky-400 font-bold">Finance → Internal Payroll</span>
              </div>
              <h1 className="text-xl font-extrabold text-white">Internal Payroll Workspace</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brand:</span>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="bg-slate-950 border border-sky-600/80 rounded-xl px-3.5 py-1.5 text-xs text-sky-300 font-extrabold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-md cursor-pointer"
              >
                {brandList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Salary Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toastMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400" /> {errorMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('runs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'runs' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> Payroll Runs
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'register' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Payroll Register
          </button>

          <button
            onClick={() => setActiveTab('payslips')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'payslips' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Download className="w-4 h-4" /> Payslips ({allPayslips.length})
          </button>

          <button
            onClick={() => setActiveTab('bank_process')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === 'bank_process' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Bank Process
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setActiveTab('components')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs transition ${
              activeTab === 'components' ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Salary Components
          </button>

          <button
            onClick={() => setActiveTab('structures')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs transition ${
              activeTab === 'structures' ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Brand Structures
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-xs transition ${
              activeTab === 'profiles' ? 'bg-slate-800 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Employee Profiles
          </button>
        </div>

        {/* TAB 1: PAYROLL RUNS */}
        {activeTab === 'runs' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-sky-400" /> Payroll Run Workflow ({selectedMonth})
                  </h3>
                  <p className="text-xs text-slate-400">Calculated using real ERP data: Structure + Attendance + Leave + Holidays + Incentives</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isCalculating || (currentRunRecord?.status === 'Finalized' || currentRunRecord?.status === 'Released')}
                    onClick={handleCalculateMonthlyPayroll}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    {isCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>{currentRunRecord ? 'Recalculate Run' : 'Calculate Payroll'}</span>
                  </button>
                </div>
              </div>

              {/* Status Stepper Banner */}
              {currentRunRecord ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">Current Lifecycle State:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
                        {currentRunRecord.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentRunRecord.status === 'Calculated' && (
                        <button
                          onClick={handleReviewPayroll}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" /> Mark Review
                        </button>
                      )}

                      {(currentRunRecord.status === 'Calculated' || currentRunRecord.status === 'Review') && (
                        <button
                          onClick={handleFinalizePayroll}
                          disabled={currentRunRecord.hasErrors}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Finalize Payroll
                        </button>
                      )}

                      {(currentRunRecord.status === 'Finalized' || currentRunRecord.status === 'Released') && (
                        <button
                          onClick={handleGeneratePayslips}
                          disabled={isGeneratingPayslips}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                        >
                          {isGeneratingPayslips ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                          <span>Generate Payslips</span>
                        </button>
                      )}

                      {currentRunRecord.status === 'Finalized' && allPayslips.length > 0 && (
                        <button
                          onClick={handleReleasePayslips}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Release Payslips to Employees
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 border border-slate-800 rounded-xl">
                  No payroll run calculated yet for {activeBrand?.brandName} ({selectedMonth}). Click 'Calculate Payroll' to process.
                </div>
              )}

              {/* Validation Engine Report & Navigation Prompt */}
              {currentRunRecord && currentRunRecord.validationItems && currentRunRecord.validationItems.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mt-4">
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Validation Engine Report
                  </h4>
                  <div className="space-y-2">
                    {currentRunRecord.validationItems.map((val, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          val.type === 'error' ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-amber-950/60 border-amber-800 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{val.message}</span>
                        </div>
                        {val.code === 'MISSING_BRAND_PAYSLIP_TEMPLATE' && (
                          <a
                            href="/settings"
                            className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded text-[11px] font-bold shrink-0 self-start sm:self-auto"
                          >
                            Configure Payslip Template →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PAYROLL REGISTER */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            {/* Totals Summary Card */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-slate-400 text-xs block">Total Employees</span>
                <span className="font-bold text-white text-xl block mt-1">{registerTotals.count}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-slate-400 text-xs block">Total Gross Pay</span>
                <span className="font-bold text-emerald-400 text-xl block mt-1">₹{registerTotals.gross.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-slate-400 text-xs block">Total Incentives</span>
                <span className="font-bold text-amber-400 text-xl block mt-1">₹{registerTotals.incentive.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-slate-400 text-xs block">Total Deductions</span>
                <span className="font-bold text-rose-400 text-xl block mt-1">₹{registerTotals.deductions.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-slate-400 text-xs block">Total Net Payable</span>
                <span className="font-bold text-sky-400 text-xl block mt-1">₹{registerTotals.net.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Employee Level Table */}
            {currentRunRecord ? (
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 overflow-x-auto">
                  <h4 className="font-bold text-sm text-white mb-4">Authoritative Employee Payroll Register</h4>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2">Employee ID</th>
                        <th className="py-2">Employee Name</th>
                        <th className="py-2">Department</th>
                        <th className="py-2">Paid Days</th>
                        <th className="py-2 text-right">Gross Pay</th>
                        <th className="py-2 text-right">Incentive</th>
                        <th className="py-2 text-right">Deductions</th>
                        <th className="py-2 text-right">Net Salary</th>
                        <th className="py-2 text-center">Payroll Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentRunRecord.employeeResults.map((r) => (
                        <tr key={r.employeeId} className="hover:bg-slate-850/50">
                          <td className="py-3 font-mono text-slate-400">{r.employeeCode || r.employeeId}</td>
                          <td className="py-3 font-bold text-white">{r.employeeName}</td>
                          <td className="py-3 text-slate-300">{r.department || 'Engineering'}</td>
                          <td className="py-3 text-slate-300">{r.paidDays} / {r.daysInMonth}</td>
                          <td className="py-3 text-right font-bold text-emerald-400">₹{r.grossEarnings.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right text-amber-400 font-medium">₹{r.performanceIncentive.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right font-bold text-rose-400">₹{r.totalDeductions.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-right font-extrabold text-sky-400">₹{r.netSalary.toLocaleString('en-IN')}</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-950 text-sky-400 border border-sky-800">
                              {currentRunRecord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* PAYROLL EXCEPTIONS SECTION */}
                {currentRunRecord.excludedEmployees && currentRunRecord.excludedEmployees.length > 0 && (
                  <div className="bg-slate-900/80 border border-amber-900/60 rounded-2xl p-5 overflow-x-auto space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>PAYROLL EXCEPTIONS (EXCLUDED EMPLOYEES)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      The following employees are excluded from this payroll run due to missing salary configuration. They receive ₹0 salary, 0 payslips, and 0 bank disbursements.
                    </p>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="py-2">Employee ID</th>
                          <th className="py-2">Employee Name</th>
                          <th className="py-2">Issue / Reason</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {currentRunRecord.excludedEmployees.map((ex) => (
                          <tr key={ex.employeeId} className="hover:bg-slate-850/50">
                            <td className="py-3 font-mono text-slate-400">{ex.employeeCode || ex.employeeId}</td>
                            <td className="py-3 font-bold text-white">{ex.employeeName}</td>
                            <td className="py-3 text-rose-400 font-medium">{ex.reason}</td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setActiveTab('profiles')}
                                className="px-3 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 rounded font-bold text-[11px]"
                              >
                                Configure Salary Profile →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
                No payroll record found for {selectedMonth}. Calculate payroll first.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAYSLIPS */}
        {activeTab === 'payslips' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Generated Payslips Register ({selectedMonth})</h3>
                <p className="text-xs text-slate-400">Authoritative generated_payslips collection records mapped to Firebase Storage PDF.</p>
              </div>

              {currentRunRecord && (currentRunRecord.status === 'Finalized' || currentRunRecord.status === 'Released') && (
                <button
                  onClick={handleGeneratePayslips}
                  disabled={isGeneratingPayslips}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {isGeneratingPayslips ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span>Generate Payslips</span>
                </button>
              )}
            </div>

            {allPayslips.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 border border-slate-800 rounded-xl">
                No generated payslips for {selectedMonth}. Finalize payroll and click 'Generate Payslips'.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2">Payslip ID</th>
                      <th className="py-2">Employee ID</th>
                      <th className="py-2">Employee Name</th>
                      <th className="py-2 text-right">Net Salary</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {allPayslips.map((p: GeneratedPayslipRecord) => (
                      <tr key={p.id} className="hover:bg-slate-850/50">
                        <td className="py-3 font-mono text-sky-400 font-bold">{p.payslipId || p.id}</td>
                        <td className="py-3 font-mono text-slate-400">{p.employeeCode || p.employeeId}</td>
                        <td className="py-3 font-bold text-white">{p.employeeName}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">₹{p.netPay.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            p.status === 'Released' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={async () => {
                              try {
                                const path = await payslipService.resolvePayslipStoragePath(p.id, p.storagePath, p.employeeId, p.month);
                                await payslipService.openPayslipPDF(path);
                              } catch (err: unknown) {
                                alert(err instanceof Error ? err.message : 'Payslip PDF is unavailable.');
                              }
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto"
                          >
                            <Eye size={12} /> View PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BANK PROCESS */}
        {activeTab === 'bank_process' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" /> Bank Process — Payment Disbursement
                </h3>
                <p className="text-xs text-slate-400">
                  Relies ONLY on Finalized payroll net salary. Generates bank file & salary transactions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">Debit Bank Account:</span>
                <select
                  value={selectedDebitAccount}
                  onChange={(e) => setSelectedDebitAccount(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.accountNumber} value={acc.accountNumber}>
                      {acc.bankName} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingBankItems ? (
              <div className="p-8 text-center text-xs text-slate-400">Evaluating bank eligibility from finalized payroll...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Eligible Employees: <strong className="text-white">{bankItems.filter((i) => i.isEligible).length}</strong></span>
                  <span className="text-slate-400">Selected for Release: <strong className="text-emerald-400">{selectedEmpIds.length}</strong></span>
                  <span className="text-slate-400">Total Disbursement Amount: <strong className="text-emerald-400">₹{totalDisbursementAmount.toLocaleString('en-IN')}</strong></span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const eligibleIds = bankItems.filter((i) => i.isEligible).map((i) => i.employee.id || i.employee.employeeId);
                              setSelectedEmpIds(selectedEmpIds.length === eligibleIds.length ? [] : eligibleIds);
                            }}
                          >
                            {selectedEmpIds.length > 0 ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                          </button>
                        </th>
                        <th className="p-3">Employee Name</th>
                        <th className="p-3">Employee ID</th>
                        <th className="p-3">Bank Account</th>
                        <th className="p-3">IFSC</th>
                        <th className="p-3 text-right">Payroll Net Salary</th>
                        <th className="p-3 text-center">Eligibility Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {bankItems.map((item) => {
                        const empId = item.employee.id || item.employee.employeeId;
                        const isSelected = selectedEmpIds.includes(empId);
                        return (
                          <tr key={empId} className={`hover:bg-slate-900/40 ${!item.isEligible ? 'opacity-50' : ''}`}>
                            <td className="p-3 text-center">
                              <button
                                disabled={!item.isEligible}
                                onClick={() => {
                                  setSelectedEmpIds(isSelected ? selectedEmpIds.filter((i) => i !== empId) : [...selectedEmpIds, empId]);
                                }}
                              >
                                {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                              </button>
                            </td>
                            <td className="p-3 font-bold text-white">{item.employee.fullName}</td>
                            <td className="p-3 font-mono text-slate-400">{item.employee.employeeCode || item.employee.employeeId}</td>
                            <td className="p-3 font-mono text-slate-300">{(item.employee as any).accountNumber || 'N/A'}</td>
                            <td className="p-3 font-mono text-slate-400">{(item.employee as any).ifscCode || 'N/A'}</td>
                            <td className="p-3 text-right font-bold text-emerald-400">₹{item.netSalary.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              {item.isEligible ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  Eligible
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800" title={item.ineligibilityReason}>
                                  Excluded ({item.ineligibilityReason})
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    disabled={isProcessingRelease || selectedEmpIds.length === 0}
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" /> Generate Bank File & Create Transactions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SALARY COMPONENT MASTER */}
        {activeTab === 'components' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-base text-white">Salary Component Master</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map((c) => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">{c.name} ({c.code})</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${c.type === 'Earning' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {c.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Formula: {c.formulaString || 'Fixed'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: BRAND SALARY STRUCTURES */}
        {activeTab === 'structures' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-base text-white">Brand Salary Structures ({activeBrand?.brandName})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {structures.map((s) => (
                <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white">{s.name} (v{s.version.toFixed(1)})</h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">Includes {s.componentIds.length} Salary Components</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: EMPLOYEE SALARY PROFILES */}
        {activeTab === 'profiles' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">Employee Salary Profiles ({activeBrand?.brandName})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map((p) => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{p.employeeName}</span>
                    <span className="text-emerald-400">₹{p.monthlyCtc.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                    <p>Bank: {p.bankName} • Acc: {p.accountNumber} ({p.ifscCode})</p>
                    <p>Tax Regime: {p.taxRegime} • Cost Center: {p.costCenter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank Process Confirmation Overlay */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-950 border border-amber-800 text-amber-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Confirm Bank Disbursement</h3>
                  <p className="text-xs text-slate-400">Finalized Payroll Salary Release</p>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Generate bank disbursement file and create salary transactions for <strong className="text-emerald-400">{selectedEmpIds.length}</strong> employees totaling <strong className="text-emerald-400">₹{totalDisbursementAmount.toLocaleString('en-IN')}</strong>.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingRelease}
                  onClick={handleExecuteBankDisbursement}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  {isProcessingRelease ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Confirm & Export</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
