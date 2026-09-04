import { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  AlertCircle,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import { adminService } from '../../../services/admin/adminService';
import { AutomationService } from '../../../services/automation/automationService';
import { documentService } from '../../../services/document/documentService';
import { storageService } from '../../../services/document/storageService';
import { RelievingNumberService } from '../../../services/payroll/relievingNumberService';
import type { BrandProfile } from '../../../types/Admin';

export interface EligibleExitedEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  department: string;
  joiningDate: string;
  lastWorkingDate?: string;
  employmentStatus: string;
  workLocation?: string;
  reportingManager?: string;
  tenureDisplay?: string;
  email?: string;
  mobileNumber?: string;
}

interface GenerateRelievingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EligibleExitedEmployee[];
  preselectedEmployeeId?: string;
  onSuccess?: (documentUrl: string, referenceId: string) => void;
}

export default function GenerateRelievingDrawer({
  isOpen,
  onClose,
  employees,
  preselectedEmployeeId,
  onSuccess,
}: GenerateRelievingDrawerProps) {
  const { company } = useAdminCompany();

  const brandList: BrandProfile[] = (company?.brandProfilesList || []).filter(
    (b) => b.isActive !== false
  );

  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    brandList[0]?.id || ''
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    preselectedEmployeeId || ''
  );
  const [relievingReference, setRelievingReference] = useState<string>('');
  const [issuanceDate, setIssuanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Check eligibility: Must have lastWorkingDate and be Inactive or Terminated
  const isEligible =
    !!selectedEmployee?.lastWorkingDate &&
    (selectedEmployee?.employmentStatus === 'Inactive' ||
      selectedEmployee?.employmentStatus === 'Terminated' ||
      selectedEmployee?.employmentStatus === 'Exit Completed');

  useEffect(() => {
    if (isOpen) {
      RelievingNumberService.peekNextReference().then((ref) => {
        setRelievingReference(ref);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (brandList.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brandList[0].id);
    }
  }, [brandList]);

  if (!isOpen) return null;

  const handleGenerateRelievingLetter = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedBrandId) {
      setErrorMessage('Please select a Brand Profile.');
      return;
    }

    if (!selectedEmployee) {
      setErrorMessage('Please select an Exited Employee.');
      return;
    }

    if (!isEligible) {
      setErrorMessage(
        'Relieving Letter generation requires a completed exit with a valid Last Working Date. Active employees or notice period employees are not eligible.'
      );
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Verify Published Relieving Template exists for Brand
      const defaultTemplateConfig = await adminService
        .getPublishedBrandDefaultTemplate(selectedBrandId, 'RELIEVING_LETTER')
        .catch(() => null);

      if (!defaultTemplateConfig || defaultTemplateConfig.lifecycleState !== 'Published') {
        setErrorMessage(
          'No published Relieving Letter template is configured for this Brand. Please publish a Relieving Letter template in Document Template Designer.'
        );
        setIsGenerating(false);
        return;
      }

      // 2. Perform Single Atomic Sequence Allocation
      const finalRef = await RelievingNumberService.generateRelievingReference();
      setRelievingReference(finalRef);

      // 3. Calculate Service Tenure if missing
      const calcTenure = (joining?: string, lwd?: string): string => {
        if (!joining || !lwd) return '';
        const d1 = new Date(joining);
        const d2 = new Date(lwd);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
        const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return '0 Days';
        if (diffDays === 1) return '1 Day';
        const years = Math.floor(diffDays / 365);
        const rem = diffDays % 365;
        const months = Math.floor(rem / 30);
        const days = rem % 30;
        const parts: string[] = [];
        if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
        if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
        if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
        return `${parts.join(', ')} (${diffDays} Days)`;
      };

      const computedTenure = selectedEmployee.tenureDisplay || calcTenure(selectedEmployee.joiningDate, selectedEmployee.lastWorkingDate) || 'Service Period Completed';

      // 4. Construct Payload
      const automationPayload = {
        brandId: selectedBrandId,
        documentType: 'RELIEVING_LETTER',
        entityId: finalRef,
        data: {
          relievingRef: finalRef,
          issuanceDate,
          employeeName: selectedEmployee.fullName,
          employeeCode: selectedEmployee.employeeCode,
          joiningDate: selectedEmployee.joiningDate,
          lastWorkingDate: selectedEmployee.lastWorkingDate,
          designation: selectedEmployee.designation,
          department: selectedEmployee.department,
          workLocation: selectedEmployee.workLocation || 'Corporate Office',
          tenureDisplay: computedTenure,
          reportingManager: selectedEmployee.reportingManager || 'Management',
          candidateEmail: selectedEmployee.email || '',
        },
      };

      // 4. Trigger Cloud Function PDF generation
      const response = await AutomationService.requestDocumentGeneration(automationPayload);

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to generate Relieving Letter PDF.');
      }

      const generatedUrl = response.fileUrl || '';

      // 5. Record Document Metadata
      await documentService.create({
        id: `doc-relieving-${Date.now()}`,
        documentId: response.documentId || finalRef,
        companyId: selectedBrandId,
        branchId: '',
        category: 'HR',
        module: 'Employee',
        documentType: 'Relieving Letter',
        referenceId: finalRef,
        title: `Relieving Letter - ${selectedEmployee.fullName} (${finalRef})`,
        fileName: response.fileName || `Relieving_Letter_${finalRef.replace(/\//g, '_')}.pdf`,
        version: 1,
        status: 'Generated',
        storagePath: `hr/relieving-letters/${finalRef.replace(/\//g, '_')}.pdf`,
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
        tags: ['RelievingLetter', 'ExitedEmployee'],
      });

      // 6. Deliver PDF reliably via anchor element using authenticated Firebase Storage URL
      let authenticatedUrl = generatedUrl;
      if (authenticatedUrl && !authenticatedUrl.startsWith('http://') && !authenticatedUrl.startsWith('https://')) {
        try {
          authenticatedUrl = await storageService.getDownloadUrl(authenticatedUrl);
        } catch {
          // Fallback to raw generatedUrl if resolution fails
        }
      }

      if (authenticatedUrl) {
        const link = document.createElement('a');
        link.href = authenticatedUrl;
        link.target = '_blank';
        link.rel = 'noopener,noreferrer';
        link.download = `Relieving_Letter_${finalRef.replace(/\//g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setSuccessMessage(`Relieving Letter ${finalRef} generated successfully!`);
      if (onSuccess) {
        onSuccess(generatedUrl, finalRef);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Relieving Letter generation failed.';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end font-sans">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-950 border border-sky-800 text-sky-400 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Generate Native Relieving Letter</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Atomic Reference: <span className="text-sky-400 font-bold">{relievingReference || 'Loading...'}</span>
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

          {/* 1. Brand Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Target Brand Profile *</span>
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
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
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Select Exited Employee *</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="">-- Choose Exited Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) — {emp.designation} [{emp.employmentStatus}]
                </option>
              ))}
            </select>
          </div>

          {/* 3. Employee Exit Details Card */}
          {selectedEmployee && (
            <div className={`p-4 rounded-xl border space-y-3 text-xs ${isEligible ? 'bg-slate-950 border-slate-800' : 'bg-rose-950/20 border-rose-800/60'}`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">{selectedEmployee.fullName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isEligible ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                  {selectedEmployee.employmentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div><span className="text-slate-500">Employee Code:</span> {selectedEmployee.employeeCode}</div>
                <div><span className="text-slate-500">Department:</span> {selectedEmployee.department}</div>
                <div><span className="text-slate-500">Designation:</span> {selectedEmployee.designation}</div>
                <div><span className="text-slate-500">Joining Date:</span> {selectedEmployee.joiningDate}</div>
                <div>
                  <span className="text-slate-500">Last Working Date:</span>{' '}
                  <span className={selectedEmployee.lastWorkingDate ? 'text-sky-400 font-bold' : 'text-rose-400'}>
                    {selectedEmployee.lastWorkingDate || 'Not Configured'}
                  </span>
                </div>
                <div><span className="text-slate-500">Service Tenure:</span> {selectedEmployee.tenureDisplay || 'N/A'}</div>
              </div>

              {!isEligible && (
                <p className="text-[11px] text-rose-400 font-semibold pt-1 border-t border-rose-900/40">
                  ⚠️ This employee is not eligible. A completed exit with a valid Last Working Date is required.
                </p>
              )}
            </div>
          )}

          {/* 4. Issuance Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Document Issuance Date</span>
            </label>
            <input
              type="date"
              value={issuanceDate}
              onChange={(e) => setIssuanceDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isGenerating || !selectedEmployee || !isEligible}
            onClick={handleGenerateRelievingLetter}
            className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Native PDF...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Generate Relieving Letter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
