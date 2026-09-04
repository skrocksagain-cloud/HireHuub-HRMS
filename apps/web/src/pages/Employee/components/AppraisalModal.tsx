import { useState, useEffect, useMemo } from 'react';
import {
  X,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  FileCheck2,
  DollarSign,
} from 'lucide-react';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import { adminService } from '../../../services/admin/adminService';
import { AutomationService } from '../../../services/automation/automationService';
import { documentService } from '../../../services/document/documentService';
import { employeeRepository } from '../repositories/employeeRepository';
import { AppraisalService } from '../../../services/appraisal/appraisalService';
import { IncrementNumberService } from '../../../services/payroll/incrementNumberService';
import { storageService } from '../../../services/document/storageService';
import type { BrandProfile } from '../../../types/Admin';
import type { Employee } from '../types/Employee';
import type { AppraisalRecord, AppraisalStatus, IncrementType } from '../../../types/Appraisal';

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEmployeeId?: string;
  onSuccess?: () => void;
}

export default function AppraisalModal({
  isOpen,
  onClose,
  preselectedEmployeeId,
  onSuccess,
}: AppraisalModalProps) {
  const { company } = useAdminCompany();

  const brandList: BrandProfile[] = (company?.brandProfilesList || []).filter(
    (b) => b.isActive !== false
  );

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);

  const [selectedBrandId, setSelectedBrandId] = useState<string>(brandList[0]?.id || '');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(preselectedEmployeeId || '');

  // Form State
  const [currentAppraisal, setCurrentAppraisal] = useState<AppraisalRecord | null>(null);
  const [reviewDate, setReviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [performanceRating, setPerformanceRating] = useState<string>('Exceeds Expectations');
  const [performanceRemarks, setPerformanceRemarks] = useState<string>('');
  const [appraisalDecision, setAppraisalDecision] = useState<string>('Salary Increment');

  const [incrementType, setIncrementType] = useState<IncrementType>('Percentage');
  const [incrementValue, setIncrementValue] = useState<number>(10);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load real employees from Firestore (Active employees ONLY) - Single Source of Truth from People -> Employees
  useEffect(() => {
    if (isOpen) {
      setIsLoadingEmployees(true);
      employeeRepository
        .getEmployees()
        .then((emps: Employee[]) => {
          // CANONICAL ACTIVE FILTER: Same source & representation as People -> Employees
          const activeEmps = emps.filter(
            (e) =>
              (e.employmentStatus === 'Active' || e.status === 'Active') &&
              e.employmentStatus !== 'Inactive' &&
              e.employmentStatus !== 'Terminated' &&
              (!e.exitRecord || e.exitRecord.exitStatus !== 'Exit Completed')
          );

          setEmployees(activeEmps);

          if (activeEmps.length > 0) {
            setSelectedEmployeeId((prev) => {
              const stillValid = activeEmps.find(
                (emp) => (emp.id && emp.id === prev) || emp.employeeId === prev
              );
              return stillValid ? prev : activeEmps[0].id || activeEmps[0].employeeId;
            });
          } else {
            setSelectedEmployeeId('');
          }
        })
        .catch(() => setEmployees([]))
        .finally(() => setIsLoadingEmployees(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (brandList.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brandList[0].id);
    }
  }, [brandList]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmployeeId || e.employeeId === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  // Derive Current Monthly & Annual Gross from real Employee data
  const currentMonthlyGross = useMemo(() => {
    if (!selectedEmployee) return 0;
    if (selectedEmployee.monthlyGross && selectedEmployee.monthlyGross > 0) {
      return selectedEmployee.monthlyGross;
    }
    // Fallback to basic salary if monthly gross not directly set
    if (selectedEmployee.salary) return selectedEmployee.salary;
    return 50000; // Default placeholder for zero-salary records in dev
  }, [selectedEmployee]);

  const currentAnnualGross = currentMonthlyGross * 12;

  // Calculate Revised Compensation
  const revisedMonthlyGross = useMemo(() => {
    const val = Number(incrementValue) || 0;
    if (incrementType === 'Percentage') {
      return Math.round(currentMonthlyGross * (1 + val / 100));
    } else {
      return Math.round(currentMonthlyGross + val);
    }
  }, [currentMonthlyGross, incrementType, incrementValue]);

  const revisedAnnualGross = revisedMonthlyGross * 12;

  // Load Existing Appraisal when Employee Changes
  useEffect(() => {
    if (selectedEmployeeId) {
      AppraisalService.getAppraisalsByEmployeeId(selectedEmployeeId).then((records) => {
        if (records.length > 0) {
          const latest = records[0];
          setCurrentAppraisal(latest);
          setReviewDate(latest.reviewDate);
          setPerformanceRating(latest.performanceRating || 'Exceeds Expectations');
          setPerformanceRemarks(latest.performanceRemarks || '');
          setAppraisalDecision(latest.appraisalDecision || 'Salary Increment');
          setIncrementType(latest.incrementType || 'Percentage');
          setIncrementValue(latest.incrementValue ?? 10);
          setEffectiveDate(latest.effectiveDate || new Date().toISOString().split('T')[0]);
        } else {
          setCurrentAppraisal(null);
        }
      });
    }
  }, [selectedEmployeeId]);

  if (!isOpen) return null;

  const currentStatus: AppraisalStatus = currentAppraisal?.status || 'Draft';

  const handleSaveAppraisal = async (targetStatus: AppraisalStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedEmployee) {
      setErrorMessage('Please select a valid Employee.');
      return;
    }

    setIsProcessing(true);

    try {
      const record = await AppraisalService.saveAppraisal({
        id: currentAppraisal?.id,
        employeeId: selectedEmployee.id || selectedEmployee.employeeId,
        employeeCode: selectedEmployee.employeeCode || selectedEmployee.employeeId,
        employeeName: selectedEmployee.fullName,
        department: selectedEmployee.department,
        designation: selectedEmployee.designation,
        employmentStatus: selectedEmployee.employmentStatus || 'Active',

        currentMonthlyGross,
        currentAnnualGross,

        reviewDate,
        performanceRating,
        performanceRemarks,
        appraisalDecision,

        incrementType,
        incrementValue: Number(incrementValue) || 0,
        revisedMonthlyGross,
        revisedAnnualGross,
        effectiveDate,

        status: targetStatus,
        approverName: targetStatus === 'Approved' ? 'Super Admin' : currentAppraisal?.approverName || '',
        approvalDate: targetStatus === 'Approved' ? new Date().toISOString().split('T')[0] : currentAppraisal?.approvalDate || '',
      });

      setCurrentAppraisal(record);
      setSuccessMessage(
        targetStatus === 'Draft'
          ? 'Appraisal saved as Draft.'
          : targetStatus === 'Pending Approval'
          ? 'Appraisal submitted for Approval!'
          : 'Appraisal Approved successfully!'
      );

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save appraisal record.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateIncrementLetter = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedBrandId) {
      setErrorMessage('Please select a Target Brand Profile.');
      return;
    }

    if (!selectedEmployee) {
      setErrorMessage('Please select an Employee.');
      return;
    }

    if (currentStatus !== 'Approved') {
      setErrorMessage('Increment Letter generation requires an Approved appraisal record.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Verify Published Increment Letter Template exists for Brand
      const defaultTemplateConfig = await adminService
        .getPublishedBrandDefaultTemplate(selectedBrandId, 'INCREMENT_LETTER')
        .catch(() => null);

      if (!defaultTemplateConfig || defaultTemplateConfig.lifecycleState !== 'Published') {
        setErrorMessage(
          'No published Increment Letter template is configured for this Brand. Please publish an Increment Letter template in Document Template Designer.'
        );
        setIsProcessing(false);
        return;
      }

      // 2. Allocate sequence atomically upon generation
      const incrementRef = await IncrementNumberService.generateIncrementReference();

      const selectedBrandObj = (company?.brandProfilesList || []).find((b) => b.id === selectedBrandId);
      const legalNameVal = company?.companyName || (company as any)?.legalName || '';
      const brandNameVal = selectedBrandObj?.brandName || '';

      // 2. Construct Payload
      const automationPayload = {
        brandId: selectedBrandId,
        documentType: 'INCREMENT_LETTER',
        entityId: incrementRef,
        data: {
          incrementRef,
          legalName: legalNameVal,
          companyName: legalNameVal,
          brandName: brandNameVal,
          brandAddress: selectedBrandObj?.address || company?.address || '',
          brandEmail: selectedBrandObj?.email || company?.email || '',
          brandPhone: selectedBrandObj?.phone || company?.phone || '',
          brandWebsite: selectedBrandObj?.website || company?.website || '',
          issuanceDate: new Date().toISOString().split('T')[0],
          employeeName: selectedEmployee.fullName,
          employeeCode: selectedEmployee.employeeCode || selectedEmployee.employeeId,
          designation: selectedEmployee.designation,
          department: selectedEmployee.department,
          joiningDate: selectedEmployee.joiningDate,
          effectiveDate,
          currentMonthlyGross,
          currentAnnualGross,
          revisedMonthlyGross,
          revisedAnnualGross,
          incrementType,
          incrementValue,
          candidateEmail: selectedEmployee.email || '',
        },
      };

      // 3. Trigger Native PDF generation
      const response = await AutomationService.requestDocumentGeneration(automationPayload);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to generate Increment Letter PDF.');
      }

      const generatedUrl = response.fileUrl || '';

      // 4. Record Document Metadata
      await documentService.create({
        id: `doc-increment-${Date.now()}`,
        documentId: response.documentId || incrementRef,
        companyId: selectedBrandId,
        branchId: '',
        category: 'HR',
        module: 'Employee',
        documentType: 'Increment Letter',
        referenceId: incrementRef,
        title: `Increment Letter - ${selectedEmployee.fullName} (${incrementRef})`,
        fileName: response.fileName || `Increment_Letter_${incrementRef.replace(/\//g, '_')}.pdf`,
        version: 1,
        status: 'Generated',
        storagePath: `hr/increment-letters/${incrementRef.replace(/\//g, '_')}.pdf`,
        downloadUrl: generatedUrl,
        fileUrl: generatedUrl,
        fileSize: 0,
        mimeType: 'application/pdf',
        requiresSignature: true,
        isSigned: false,
        signedBy: '',
        qrCodeUrl: '',
        isLocked: true,
        generatedBy: 'Super Admin',
        generatedAt: new Date().toISOString(),
        emailed: false,
        emailedTo: selectedEmployee.email || '',
        downloadCount: 0,
        archived: false,
        remarks: `Generated for ${selectedEmployee.fullName}`,
        createdBy: 'Super Admin',
        updatedBy: 'Super Admin',
        tags: ['IncrementLetter', 'Appraisal'],
      });

      // 5. Deliver PDF via authenticated Storage URL
      let authenticatedUrl = generatedUrl;
      if (authenticatedUrl && !authenticatedUrl.startsWith('http://') && !authenticatedUrl.startsWith('https://')) {
        try {
          authenticatedUrl = await storageService.getDownloadUrl(authenticatedUrl);
        } catch {
          // Fallback to raw path if storage resolution fails
        }
      }

      if (authenticatedUrl) {
        const link = document.createElement('a');
        link.href = authenticatedUrl;
        link.target = '_blank';
        link.rel = 'noopener,noreferrer';
        link.download = `Increment_Letter_${incrementRef.replace(/\//g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 6. Refresh state and clear generation processing state cleanly
      const updatedAppraisals = await AppraisalService.getAppraisalsByEmployeeId(
        selectedEmployee.id || selectedEmployee.employeeId
      );
      if (updatedAppraisals.length > 0) {
        const latestApproved = updatedAppraisals.find((a) => a.status === 'Approved') || updatedAppraisals[0];
        setCurrentAppraisal(latestApproved);
      }

      setSuccessMessage(`Increment Letter ${incrementRef} generated successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Increment Letter generation failed.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end font-sans">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Employee Appraisal & Increment</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    currentStatus === 'Approved'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : currentStatus === 'Pending Approval'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {currentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage performance reviews, salary increments, and generate approved Increment Letters.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* 1. Target Brand Profile */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Target Brand Profile *</span>
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {brandList.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Employee Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Select Employee *</span>
            </label>
            {isLoadingEmployees ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-xs flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading real ERP employees from Firestore...</span>
              </div>
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id || emp.employeeId} value={emp.id || emp.employeeId}>
                    {emp.fullName} ({emp.employeeCode || emp.employeeId}) — {emp.designation} [{emp.employmentStatus || 'Active'}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Employee Real Details Card */}
          {selectedEmployee && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">{selectedEmployee.fullName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {selectedEmployee.employmentStatus || 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div><span className="text-slate-500">Employee Code:</span> {selectedEmployee.employeeCode || selectedEmployee.employeeId}</div>
                <div><span className="text-slate-500">Department:</span> {selectedEmployee.department}</div>
                <div><span className="text-slate-500">Designation:</span> {selectedEmployee.designation}</div>
                <div><span className="text-slate-500">Joining Date:</span> {selectedEmployee.joiningDate}</div>
                <div>
                  <span className="text-slate-500">Current Monthly Gross:</span>{' '}
                  <span className="text-emerald-400 font-mono font-bold">₹{currentMonthlyGross.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-500">Current Annual Gross:</span>{' '}
                  <span className="text-slate-200 font-mono font-bold">₹{currentAnnualGross.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Appraisal Review Details */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Appraisal Review Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">Review Date *</label>
                <input
                  type="date"
                  value={reviewDate}
                  disabled={currentStatus === 'Approved'}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">Appraisal Decision *</label>
                <select
                  value={appraisalDecision}
                  disabled={currentStatus === 'Approved'}
                  onChange={(e) => setAppraisalDecision(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Salary Increment">Salary Increment</option>
                  <option value="Salary Increment & Promotion">Salary Increment & Promotion</option>
                  <option value="Merit Increase">Merit Increase</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">Performance Rating *</label>
              <select
                value={performanceRating}
                disabled={currentStatus === 'Approved'}
                onChange={(e) => setPerformanceRating(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="Exceeds Expectations">Exceeds Expectations</option>
                <option value="Meets Expectations">Meets Expectations</option>
                <option value="Needs Improvement">Needs Improvement</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">Performance Remarks</label>
              <textarea
                rows={2}
                value={performanceRemarks}
                disabled={currentStatus === 'Approved'}
                onChange={(e) => setPerformanceRemarks(e.target.value)}
                placeholder="Enter appraisal evaluation remarks..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 5. Increment Configuration & Calculation */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Increment Configuration</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">Increment Type *</label>
                <select
                  value={incrementType}
                  disabled={currentStatus === 'Approved'}
                  onChange={(e) => setIncrementType(e.target.value as IncrementType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed Amount">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  {incrementType === 'Percentage' ? 'Increment (%) *' : 'Increment Amount (₹) *'}
                </label>
                <input
                  type="number"
                  disabled={currentStatus === 'Approved'}
                  value={incrementValue}
                  onChange={(e) => setIncrementValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300">Effective Date *</label>
                <input
                  type="date"
                  disabled={currentStatus === 'Approved'}
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Revised Calculation Card */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Revised Monthly Gross:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ₹{revisedMonthlyGross.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-500 block mt-0.5 font-mono">
                  (+₹{(revisedMonthlyGross - currentMonthlyGross).toLocaleString('en-IN')}/mo)
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Revised Annual CTC:</span>
                <span className="text-base font-bold font-mono text-slate-100">
                  ₹{revisedAnnualGross.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                  (+₹{(revisedAnnualGross - currentAnnualGross).toLocaleString('en-IN')}/yr)
                </span>
              </div>
            </div>
          </div>

          {/* 6. Approval Information (If Approved) */}
          {currentStatus === 'Approved' && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Appraisal Approved & Finalized</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Approved by <strong className="text-slate-100">{currentAppraisal?.approverName || 'Super Admin'}</strong> on{' '}
                <span className="font-mono">{currentAppraisal?.approvalDate || new Date().toISOString().split('T')[0]}</span>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>

          {currentStatus === 'Draft' && (
            <>
              <button
                type="button"
                disabled={isProcessing || !selectedEmployee}
                onClick={() => handleSaveAppraisal('Draft')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Draft</span>}
              </button>

              <button
                type="button"
                disabled={isProcessing || !selectedEmployee}
                onClick={() => handleSaveAppraisal('Pending Approval')}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit for Approval</span>}
              </button>
            </>
          )}

          {currentStatus === 'Pending Approval' && (
            <button
              type="button"
              disabled={isProcessing || !selectedEmployee}
              onClick={() => handleSaveAppraisal('Approved')}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Approve Appraisal</span>}
            </button>
          )}

          {currentStatus === 'Approved' && (
            <button
              type="button"
              disabled={isProcessing || !selectedEmployee}
              onClick={handleGenerateIncrementLetter}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Increment Letter...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Generate Increment Letter</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
