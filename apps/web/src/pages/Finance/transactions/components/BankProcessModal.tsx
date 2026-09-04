import { useState, useEffect, useMemo } from 'react';
import { X, Building2, Calendar, CreditCard, CheckSquare, Square, AlertTriangle, ShieldCheck, Download, Loader2, CheckCircle2 } from 'lucide-react';
import ExcelJS from 'exceljs';

import type { CompanySettings } from '../../../../types/Admin';
import type { Employee } from '../../../Employee/types/Employee';
import { employeeRepository } from '../../../Employee/repositories/employeeRepository';
import { payrollEngineService } from '../../../../services/payroll/payrollEngineService';
import { AutomationService } from '../../../../services/automation/automationService';
import { transactionService } from '../services/transactionService';
import { db } from '../../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface BankProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  companySettings: CompanySettings | null;
  onSuccess?: () => void;
}

interface EligibleEmployeeItem {
  employee: Employee;
  netSalary: number;
  basicPay: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  grossEarnings: number;
  pfDeduction: number;
  esicDeduction: number;
  ptDeduction: number;
  totalDeductions: number;
  isEligible: boolean;
  ineligibilityReason?: string;
  isAlreadyReleased?: boolean;
}

export default function BankProcessModal({
  isOpen,
  onClose,
  companySettings,
  onSuccess,
}: BankProcessModalProps) {
  const brandList = useMemo(() => {
    return (companySettings?.brandProfilesList || []).filter((b) => b.isActive !== false);
  }, [companySettings]);

  const bankAccounts = useMemo(() => {
    const bankList: Array<{ accountName: string; accountNumber: string; bankName: string; ifscCode: string; isPrimary?: boolean }> = [];
    if (!companySettings) return bankList;

    // 1. Check bankAccountsV2 (Primary Company Settings Bank Accounts structure)
    const v2Banks = (companySettings as any)?.bankAccountsV2 || [];
    v2Banks.forEach((acc: any) => {
      if (acc && acc.isActive !== false && acc.accountNumber && acc.accountNumber.trim()) {
        const cleanAcc = acc.accountNumber.trim();
        if (!bankList.some((b) => b.accountNumber === cleanAcc)) {
          bankList.push({
            accountName: acc.accountName || acc.bankName || 'Company Bank',
            accountNumber: cleanAcc,
            bankName: acc.bankName || 'Bank',
            ifscCode: acc.ifsc || acc.ifscCode || '',
            isPrimary: Boolean(acc.isPrimary),
          });
        }
      }
    });

    // 2. Check companyBankDetails
    const compBank = (companySettings as any)?.companyBankDetails;
    if (compBank?.accountNumber && compBank.accountNumber.trim()) {
      const cleanAcc = compBank.accountNumber.trim();
      if (!bankList.some((b) => b.accountNumber === cleanAcc)) {
        bankList.push({
          accountName: compBank.accountName || companySettings.companyName || 'Company Bank',
          accountNumber: cleanAcc,
          bankName: compBank.bankName || 'Bank',
          ifscCode: compBank.ifscCode || compBank.ifsc || '',
          isPrimary: true,
        });
      }
    }

    // 3. Check legacy bankAccounts array
    const extraAccounts = (companySettings as any)?.bankAccounts || [];
    extraAccounts.forEach((acc: any) => {
      if (acc && acc.isActive !== false && acc.accountNumber && acc.accountNumber.trim()) {
        const cleanAcc = acc.accountNumber.trim();
        if (!bankList.some((b) => b.accountNumber === cleanAcc)) {
          bankList.push({
            accountName: acc.accountName || acc.bankName || 'Company Bank',
            accountNumber: cleanAcc,
            bankName: acc.bankName || 'Bank',
            ifscCode: acc.ifscCode || acc.ifsc || '',
            isPrimary: false,
          });
        }
      }
    });

    return bankList;
  }, [companySettings]);

  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedDebitAccount, setSelectedDebitAccount] = useState<string>('');

  const [items, setItems] = useState<EligibleEmployeeItem[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  useEffect(() => {
    if (brandList.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brandList[0].id);
    }
  }, [brandList, selectedBrandId]);

  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedDebitAccount) {
      setSelectedDebitAccount(bankAccounts[0].accountNumber);
    }
  }, [bankAccounts, selectedDebitAccount]);

  // Load employees & verify eligibility when modal opens or brand/month changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    async function evaluateEligibility() {
      try {
        const emps = await employeeRepository.getEmployees();
        if (!isMounted) return;

        // Fetch already released records for selected month & brand
        const releasedQuery = query(
          collection(db, 'finance_transactions'),
          where('salaryMonth', '==', selectedMonth),
          where('brandId', '==', selectedBrandId)
        );
        const releasedSnap = await getDocs(releasedQuery).catch(() => ({ docs: [] } as any));
        const releasedEmpIds = new Set(releasedSnap.docs.map((d: any) => d.data()?.employeeId));

        const [yearStr] = selectedMonth.split('-');
        const yearNum = parseInt(yearStr, 10);

        // Execute Payroll Engine to get authoritative salary & attendance calculations
        const runRecord = await payrollEngineService.executePayrollRun(selectedMonth, yearNum, selectedBrandId);
        const resultMap = new Map(runRecord.employeeResults.map((r) => [r.employeeId, r]));

        const processedItems: EligibleEmployeeItem[] = [];
        const eligibleIds: string[] = [];

        for (const emp of emps) {
          const empId = emp.id || emp.employeeId;
          const isAlreadyReleased = releasedEmpIds.has(empId);

          // Canonical Active representation
          const isStatusActive =
            (emp.employmentStatus === 'Active' || emp.status === 'Active') &&
            emp.employmentStatus !== 'Inactive' &&
            emp.employmentStatus !== 'Terminated' &&
            emp.employmentStatus !== 'Notice Period';
          const isNotExited = !emp.exitRecord || emp.exitRecord.exitStatus !== 'Exit Completed';

          let isEligible = isStatusActive && isNotExited;
          let ineligibilityReason = '';

          if (!isStatusActive) {
            ineligibilityReason = `Status '${emp.employmentStatus || 'Inactive'}' excluded`;
          } else if (!isNotExited) {
            ineligibilityReason = 'Completed Exit';
          }

          // Rule: Joining date must be on or before the 20th of the selected payroll month (and NOT in a future month)
          if (isEligible && emp.joiningDate) {
            if (emp.joiningDate > `${selectedMonth}-20`) {
              isEligible = false;
              ineligibilityReason = `Joined after 20th of ${selectedMonth} (Date: ${emp.joiningDate})`;
            }
          }

          // Fetch Authoritative Payroll Engine Calculation Result
          const payrollRes = resultMap.get(empId);
          const hasValidStructure = Boolean((emp as any).monthlyGross || (emp as any).salary || (emp as any).ctc || payrollRes?.monthlyCtc);

          if (isEligible && (!hasValidStructure || !payrollRes || payrollRes.monthlyCtc <= 0)) {
            isEligible = false;
            ineligibilityReason = 'Salary structure not defined';
          }

          const basic = payrollRes?.earningsBreakdown?.find((e) => e.componentId === 'comp-basic')?.amount ?? 0;
          const hra = payrollRes?.earningsBreakdown?.find((e) => e.componentId === 'comp-hra')?.amount ?? 0;
          const conv = payrollRes?.earningsBreakdown?.find((e) => e.componentId === 'comp-conveyance')?.amount ?? 0;
          const special = payrollRes?.earningsBreakdown?.find((e) => e.componentId === 'comp-special')?.amount ?? 0;
          const gross = payrollRes?.grossEarnings ?? 0;

          const pf = payrollRes?.deductionsBreakdown?.find((d) => d.componentId === 'comp-pf-ded')?.amount ?? 0;
          const esic = payrollRes?.deductionsBreakdown?.find((d) => d.componentId === 'comp-esic-ded')?.amount ?? 0;
          const pt = payrollRes?.deductionsBreakdown?.find((d) => d.componentId === 'comp-pt-ded')?.amount ?? 0;
          const totDed = payrollRes?.totalDeductions ?? 0;
          const net = payrollRes?.netSalary ?? 0;

          // Bank Info Validation
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

          if (isEligible) {
            eligibleIds.push(empId);
          }

          processedItems.push({
            employee: emp,
            netSalary: net,
            basicPay: basic,
            hra,
            conveyance: conv,
            specialAllowance: special,
            grossEarnings: gross,
            pfDeduction: pf,
            esicDeduction: esic,
            ptDeduction: pt,
            totalDeductions: totDed,
            isEligible,
            ineligibilityReason,
            isAlreadyReleased,
          });
        }

        setItems(processedItems);
        setSelectedEmpIds(eligibleIds);
      } catch (err: unknown) {
        if (isMounted) setErrorMessage('Failed to load eligible employees.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void evaluateEligibility();
  }, [isOpen, selectedBrandId, selectedMonth]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedEmpIds.includes(item.employee.id || item.employee.employeeId));
  }, [items, selectedEmpIds]);

  const totalReleaseAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.netSalary, 0);
  }, [selectedItems]);

  const handleToggleSelectAll = () => {
    const eligibleEmpIds = items.filter((i) => i.isEligible).map((i) => i.employee.id || i.employee.employeeId);
    if (selectedEmpIds.length === eligibleEmpIds.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmpIds);
    }
  };

  const handleToggleEmployee = (empId: string) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter((id) => id !== empId));
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  const handleValidateAndOpenConfirm = () => {
    setErrorMessage(null);
    if (bankAccounts.length === 0 || !selectedDebitAccount) {
      setErrorMessage('No active company bank account is configured in Company Settings.');
      return;
    }
    if (selectedEmpIds.length === 0) {
      setErrorMessage('Please select at least one eligible employee for salary release.');
      return;
    }

    // Validate every selected employee
    const invalidItems = selectedItems.filter((item) => {
      const eAcc = (item.employee as any).accountNumber || (item.employee as any).bankAccount;
      const eIfsc = (item.employee as any).ifscCode || (item.employee as any).ifsc;
      return !eAcc || !eIfsc || item.netSalary <= 0;
    });

    if (invalidItems.length > 0) {
      const names = invalidItems.map((i) => i.employee.fullName).join(', ');
      setErrorMessage(`Cannot release salary: The following selected employees have invalid bank details or zero net pay: [${names}]`);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleExecuteGenerateAndRelease = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowConfirmDialog(false);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const activeBrandObj = brandList.find((b) => b.id === selectedBrandId) || brandList[0];
      const selectedBankObj = bankAccounts.find((b) => b.accountNumber === selectedDebitAccount);

      if (!selectedBankObj) {
        throw new Error('No active company bank account is configured in Company Settings.');
      }

      // 1. Re-use Payroll Engine to execute run record
      const [yearStr, monthStr] = selectedMonth.split('-');
      const yearNum = parseInt(yearStr, 10);
      const runRecord = await payrollEngineService.executePayrollRun(selectedMonth, yearNum, selectedBrandId);

      // 2. Generate immutable snapshot
      await payrollEngineService.generatePayslipSnapshotsForRun(runRecord, 'Super Admin');

      // 3. Generate Bank Excel with EXACTLY 10 COLUMNS
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = parseInt(monthStr, 10) - 1;
      const fullMonthName = monthNames[monthIndex] || 'Month';

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Salary Disbursement');

      // EXACT APPROVED 10 COLUMNS IN EXACT ORDER
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

      for (const item of selectedItems) {
        const emp = item.employee;
        const eAcc = (emp as any).accountNumber || (emp as any).bankAccount || '';
        const eIfsc = (emp as any).ifscCode || (emp as any).ifsc || '';
        const eBank = (emp as any).bankName || 'HDFC Bank';

        const firstNameClean = (emp.firstName || emp.fullName.split(' ')[0] || 'Employee').replace(/[^a-zA-Z]/g, '');
        const empCodeClean = (emp.employeeCode || emp.employeeId || 'HH0001').replace(/[^a-zA-Z0-9]/g, '');
        // EXACT FORMAT: FirstName + FullSalaryMonth + EmployeeID (NO spaces, NO hyphens)
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

        // 4. Generate Native Payslip PDF for each released employee using canonical payslipId as entityId
        const payslipPayload = {
          brandId: selectedBrandId,
          documentType: 'PAYSLIP',
          entityId: payslipId,
          data: {
            legalName: companySettings?.companyName || 'Hire Huub People Solution Private Limited',
            brandName: activeBrandObj?.brandName || 'Hire Huub',
            brandAddress: activeBrandObj?.address || companySettings?.address || '',
            brandEmail: activeBrandObj?.email || companySettings?.email || '',
            brandPhone: activeBrandObj?.phone || companySettings?.phone || '',
            brandWebsite: activeBrandObj?.website || companySettings?.website || '',

            salaryMonth: `${fullMonthName} ${yearNum}`,
            employeeName: emp.fullName,
            employeeCode: emp.employeeCode || emp.employeeId,
            designation: emp.designation,
            department: emp.department,
            joiningDate: emp.joiningDate,
            workLocation: (emp as any).workLocation || (emp as any).location || (emp as any).branch || 'Head Office',
            bankName: eBank,
            accountNumber: eAcc,
            ifscCode: eIfsc,
            pan: (emp as any).pan || '',
            payslipId,
            generatedOn: releaseDate,

            basicPay: `₹${item.basicPay.toLocaleString('en-IN')}`,
            hra: `₹${item.hra.toLocaleString('en-IN')}`,
            conveyance: `₹${item.conveyance.toLocaleString('en-IN')}`,
            specialAllowance: `₹${item.specialAllowance.toLocaleString('en-IN')}`,
            grossEarnings: `₹${item.grossEarnings.toLocaleString('en-IN')}`,

            pfDeduction: `₹${item.pfDeduction.toLocaleString('en-IN')}`,
            esicDeduction: `₹${item.esicDeduction.toLocaleString('en-IN')}`,
            ptDeduction: `₹${item.ptDeduction.toLocaleString('en-IN')}`,
            totalDeductions: `₹${item.totalDeductions.toLocaleString('en-IN')}`,
            netPay: `₹${item.netSalary.toLocaleString('en-IN')}`,
            netPayWords: `Rupees ${item.netSalary.toLocaleString('en-IN')} Only`,
          },
        };

        const docRes = await AutomationService.requestDocumentGeneration(payslipPayload);
        const payslipStoragePath = docRes?.fileUrl || (docRes?.fileName ? `hr/payslips/${docRes.fileName}` : '');

        if (!docRes?.success || !payslipStoragePath) {
          const errDetail = docRes?.error?.message || 'Storage path missing after document generation.';
          throw new Error(`Payslip generation failed for ${emp.fullName}: ${errDetail}`);
        }

        const documentId = docRes.documentId || undefined;

        // 5. Record Finance Transaction Record with direct Payslip linkage
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
            description: `Salary Release for ${fullMonthName} ${yearNum} (${activeBrandObj?.brandName})`,
            payrollRunId: runRecord.id,
            payslipId,
            documentId,
            employeeId: empCodeClean,
            salaryMonth: selectedMonth,
            payslipStoragePath,
          },
          'Super Admin'
        );
      }

      // Format header row bold in Excel
      worksheet.getRow(1).font = { bold: true };

      // Generate Buffer and Download File
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

      setSuccessMessage(`Successfully released salary for ${selectedItems.length} employees totaling ₹${totalReleaseAmount.toLocaleString('en-IN')}. Bank Excel and Payslips generated.`);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bank Process release failed.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end font-sans">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-4xl h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Bank Process — Salary Release</h2>
              <p className="text-xs text-slate-400">
                Execute bank disbursement file generation, payslips, and transaction records.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Step 1: Processing Details & Bank Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Brand Profile *</span>
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {brandList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salary Month *</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salary Processing Bank *</span>
              </label>
              {bankAccounts.length === 0 ? (
                <select
                  disabled
                  value=""
                  className="w-full bg-slate-900 border border-rose-900/50 rounded-xl px-3 py-2 text-xs text-rose-400 opacity-80 cursor-not-allowed"
                >
                  <option value="">No active company bank account is configured in Company Settings.</option>
                </select>
              ) : (
                <select
                  value={selectedDebitAccount}
                  onChange={(e) => setSelectedDebitAccount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.accountNumber} value={acc.accountNumber}>
                      {acc.bankName} — {acc.accountNumber} {acc.isPrimary ? '(Primary)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Step 2: Employee Eligibility Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                Employee Bank Eligibility List
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">Eligible: <strong className="text-slate-200">{items.filter((i) => i.isEligible).length}</strong></span>
                <span className="text-slate-400">Selected: <strong className="text-emerald-400">{selectedEmpIds.length}</strong></span>
                <span className="text-slate-400">Release Amount: <strong className="text-emerald-400">₹{totalReleaseAmount.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Evaluating employee bank eligibility...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No employees found in People → Employees master for the selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <button type="button" onClick={handleToggleSelectAll} className="text-slate-400 hover:text-white">
                          {selectedEmpIds.length === items.filter((i) => i.isEligible).length && selectedEmpIds.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Joining Date</th>
                      <th className="p-3">Bank & Account</th>
                      <th className="p-3">IFSC</th>
                      <th className="p-3 text-right">Net Salary</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {items.map((item) => {
                      const empId = item.employee.id || item.employee.employeeId;
                      const isSelected = selectedEmpIds.includes(empId);
                      const isEligible = item.isEligible;

                      return (
                        <tr key={empId} className={`hover:bg-slate-900/40 ${!isEligible ? 'opacity-50 bg-slate-950/40' : ''}`}>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              disabled={!isEligible}
                              onClick={() => handleToggleEmployee(empId)}
                              className="text-slate-400 hover:text-white disabled:opacity-30"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-600" />
                              )}
                            </button>
                          </td>
                          <td className="p-3 font-bold text-slate-100">{item.employee.fullName}</td>
                          <td className="p-3 font-mono text-slate-400">{item.employee.employeeCode || item.employee.employeeId}</td>
                          <td className="p-3 text-slate-300">{item.employee.department}</td>
                          <td className="p-3 font-mono text-slate-400">{item.employee.joiningDate}</td>
                          <td className="p-3 font-mono text-slate-300">
                            {(item.employee as any).bankName || 'HDFC'} • {(item.employee as any).accountNumber ? `••••${(item.employee as any).accountNumber.slice(-4)}` : 'N/A'}
                          </td>
                          <td className="p-3 font-mono text-slate-400">{(item.employee as any).ifscCode || 'N/A'}</td>
                          <td className="p-3 text-right font-bold font-mono text-emerald-400">
                            ₹{item.netSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            {isEligible ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Eligible
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800" title={item.ineligibilityReason}>
                                Excluded
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal Overlay */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-950 border border-amber-800 text-amber-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Confirm Salary Release</h3>
                  <p className="text-xs text-slate-400">Irreversible Action</p>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                You are about to release salary for <strong className="text-emerald-400">{selectedEmpIds.length}</strong> employees totaling <strong className="text-emerald-400">₹{totalReleaseAmount.toLocaleString('en-IN')}</strong>. This will generate the bank disbursement Excel and official Payslips.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecuteGenerateAndRelease}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Confirm & Release</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs text-slate-400 font-mono">
            Selected: <strong className="text-emerald-400">{selectedEmpIds.length}</strong> | Total: <strong className="text-emerald-400">₹{totalReleaseAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || selectedEmpIds.length === 0 || bankAccounts.length === 0}
              onClick={handleValidateAndOpenConfirm}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Release & Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate & Release</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
