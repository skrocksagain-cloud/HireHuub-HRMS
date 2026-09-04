import { useState, useEffect } from 'react';
import {
  LogOut,
  CheckCircle2,
  XCircle,
  UserCheck,
  FileCheck2,
  Clock,
  Loader2,
} from 'lucide-react';
import type { Employee, ExitType } from '../types/Employee';
import { employeeService } from '../services/employeeService';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../context/AuthContext';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import GenerateRelievingDrawer from './GenerateRelievingDrawer';
import RehireDrawer from './RehireDrawer';

interface ExitTabProps {
  employee: Employee;
  onRefresh?: () => void;
}

export default function ExitTab({ employee, onRefresh }: ExitTabProps) {
  const { user } = useAuth();
  const { isSuperAdmin, canApprove } = usePermissions();
  const { company } = useAdminCompany();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMarkExitModalOpen, setIsMarkExitModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRelievingDrawerOpen, setIsRelievingDrawerOpen] = useState(false);
  const [isRehireDrawerOpen, setIsRehireDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for Resignation Submission
  const [resignationDate, setResignationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(
    company?.noticePeriod || 30
  );

  useEffect(() => {
    if (company?.noticePeriod) {
      setNoticePeriodDays(company.noticePeriod);
    }
  }, [company?.noticePeriod]);
  const [exitReason, setExitReason] = useState<string>('Career Opportunity');
  const [exitRemarks, setExitRemarks] = useState<string>('');

  // Form states for Direct Mark Exit
  const [directExitType, setDirectExitType] = useState<ExitType>('Manager Initiated');
  const [directLastWorkingDate, setDirectLastWorkingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [directExitReason, setDirectExitReason] = useState<string>('Operational Separation');
  const [directExitRemarks, setDirectExitRemarks] = useState<string>('');
  const [directExitTarget, setDirectExitTarget] = useState<'Exit Completed' | 'Notice Period'>('Exit Completed');

  // Form states for Rejection
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const exit = employee.exitRecord;
  const currentStatus = employee.employmentStatus;

  // Determine user authority
  const isManager =
    user?.name &&
    employee.reportingManager &&
    employee.reportingManager.toLowerCase().trim() === user.name.toLowerCase().trim();

  // "Admin -> Team", "Master Admin -> Department", "Super Admin -> All"
  // handled by canApprove hook, but here we can check the exit scope specifically.
  // Using canApprove('Employees') to check scope
  const canApproveOrManageExit = isSuperAdmin || isManager || canApprove('Employees');
  const canGenerateRelieving = isSuperAdmin || canApprove('Employees');

  // Eligibility calculation for Relieving Letter: Must have lastWorkingDate AND (Inactive | Terminated | Exit Completed)
  const hasValidExit =
    !!employee.lastWorkingDate &&
    (currentStatus === 'Inactive' ||
      currentStatus === 'Terminated' ||
      exit?.exitStatus === 'Exit Completed');

  // Calculate expected last working date for resignation form
  const calcLastWorkingDate = () => {
    if (!resignationDate) return '';
    const date = new Date(resignationDate);
    date.setDate(date.getDate() + (Number(noticePeriodDays) || 0));
    return date.toISOString().split('T')[0];
  };

  const handleResignationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const actor = {
        name: user?.name || employee.fullName,
        role: user?.role || 'Employee',
      };

      await employeeService.submitResignation(
        employee.id || '',
        {
          resignationDate,
          noticePeriodDays,
          exitReason,
          exitRemarks,
        },
        actor
      );

      setSuccessMessage('Resignation submitted successfully. Pending Manager Approval.');
      setIsSubmitModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit resignation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveResignation = async () => {
    if (!exit) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const actor = {
        name: user?.name || 'Reporting Manager',
        role: user?.role || 'Manager',
      };

      await employeeService.approveResignation(employee.id || '', exit, actor);
      setSuccessMessage('Resignation approved. Employee is now serving Notice Period.');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to approve resignation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exit || !rejectionReason.trim()) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const actor = {
        name: user?.name || 'Reporting Manager',
        role: user?.role || 'Manager',
      };

      await employeeService.rejectResignation(employee.id || '', exit, rejectionReason, actor);
      setSuccessMessage('Resignation rejected.');
      setIsRejectModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reject resignation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkExitDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const actor = {
        name: user?.name || 'HR Admin',
        role: user?.role || 'HR',
      };

      await employeeService.markExitDirectly(
        employee.id || '',
        {
          exitType: directExitType,
          lastWorkingDate: directLastWorkingDate,
          exitReason: directExitReason,
          exitRemarks: directExitRemarks,
          exitStatus: directExitTarget,
        },
        actor
      );

      setSuccessMessage(`Employee exit marked as ${directExitTarget}.`);
      setIsMarkExitModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to mark exit.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-2">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Main Exit Status Banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Employee Exit & Separation Lifecycle</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative Exit Record & Relieving Letter Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                currentStatus === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : currentStatus === 'Notice Period'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              Employment: {currentStatus}
            </span>
            {exit?.exitStatus && (
              <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-mono font-bold">
                Exit: {exit.exitStatus}
              </span>
            )}
          </div>
        </div>

        {/* Current Exit Details Grid */}
        {exit ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Exit Type</span>
              <span className="font-bold text-slate-800">{exit.exitType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Initiated By</span>
              <span className="font-bold text-slate-800">{exit.initiatedBy} ({exit.initiatedByRole || 'User'})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Initiated Date</span>
              <span className="font-bold text-slate-800 font-mono">
                {exit.initiatedAt ? new Date(exit.initiatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {exit.resignationDate && (
              <div>
                <span className="text-slate-500 block">Resignation Date</span>
                <span className="font-bold text-slate-800 font-mono">{exit.resignationDate}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Last Working Date</span>
              <span className="font-bold text-sky-700 font-mono">{employee.lastWorkingDate || exit.lastWorkingDate || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Exit Reason</span>
              <span className="font-bold text-slate-800">{exit.exitReason}</span>
            </div>
            {exit.exitRemarks && (
              <div className="md:col-span-3">
                <span className="text-slate-500 block">Remarks</span>
                <span className="text-slate-700">{exit.exitRemarks}</span>
              </div>
            )}
            {exit.rejectionReason && (
              <div className="md:col-span-3 p-2 bg-rose-100/60 border border-rose-200 rounded-lg text-rose-800">
                <span className="font-bold">Rejection Reason:</span> {exit.rejectionReason}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No formal exit or resignation record has been filed for this employee.</p>
        )}

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Employee Resignation Trigger */}
          {currentStatus === 'Active' && (!exit || exit.exitStatus === 'Rejected') && (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Submit Resignation</span>
            </button>
          )}

          {/* Reporting Manager Pending Approval Box */}
          {exit?.exitStatus === 'Pending Manager Approval' && canApproveOrManageExit && (
            <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <Clock className="w-4 h-4" />
                <span>Pending Resignation Approval Request</span>
              </div>
              <p className="text-xs text-amber-700">
                {exit.initiatedBy} submitted a resignation on {exit.resignationDate}. Expected Last Working Date: <strong className="font-mono">{exit.lastWorkingDate}</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApproveResignation}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Start Notice Period</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsRejectModalOpen(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Resignation</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Mark Exit (Manager / HR / Super Admin) */}
          {canApproveOrManageExit && (
            <button
              type="button"
              onClick={() => setIsMarkExitModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
            >
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>Mark Exit Directly</span>
            </button>
          )}

          {/* Rehire Employee (HR / Admin / Super Admin for Resigned/Terminated/Inactive) */}
          {canApproveOrManageExit && (currentStatus === 'Resigned' || currentStatus === 'Terminated' || currentStatus === 'Inactive') && (
            <button
              type="button"
              onClick={() => setIsRehireDrawerOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Rehire Employee</span>
            </button>
          )}

          {/* Official Relieving Letter Generation Button */}
          {canGenerateRelieving && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={!hasValidExit}
                onClick={() => setIsRelievingDrawerOpen(true)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition ${
                  hasValidExit
                    ? 'bg-sky-600 hover:bg-sky-500 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Generate Relieving Letter</span>
              </button>
            </div>
          )}
        </div>

        {!hasValidExit && (
          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
            ℹ️ Relieving Letter generation becomes active ONLY after an exit is completed with a valid Last Working Date. Active or Notice Period employees are not eligible for final relieving letters.
          </p>
        )}
      </div>

      {/* MODAL 1: Submit Resignation */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <LogOut className="w-5 h-5 text-amber-600" />
                <span>Submit Employee Resignation</span>
              </h3>
              <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleResignationSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Resignation Date *</label>
                  <input
                    type="date"
                    required
                    value={resignationDate}
                    onChange={(e) => setResignationDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Notice Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 space-y-1">
                <span className="block text-[11px] text-sky-700 font-semibold">Calculated Last Working Date:</span>
                <span className="text-sm font-bold font-mono text-sky-950">{calcLastWorkingDate()}</span>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Reason for Resignation *</label>
                <select
                  value={exitReason}
                  onChange={(e) => setExitReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="Career Opportunity">Career Opportunity</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Higher Education">Higher Education</option>
                  <option value="Better Compensation">Better Compensation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Remarks / Additional Notes</label>
                <textarea
                  rows={3}
                  value={exitRemarks}
                  onChange={(e) => setExitRemarks(e.target.value)}
                  placeholder="Provide any handover details or remarks..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Resignation</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Direct Mark Exit */}
      {isMarkExitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600" />
                <span>Mark Employee Exit Directly</span>
              </h3>
              <button type="button" onClick={() => setIsMarkExitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleMarkExitDirectly} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Exit Type *</label>
                  <select
                    value={directExitType}
                    onChange={(e) => setDirectExitType(e.target.value as ExitType)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="Manager Initiated">Manager Initiated</option>
                    <option value="Resignation">Resignation</option>
                    <option value="Termination">Termination</option>
                    <option value="Mutual Separation">Mutual Separation</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Last Working Date *</label>
                  <input
                    type="date"
                    required
                    value={directLastWorkingDate}
                    onChange={(e) => setDirectLastWorkingDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Lifecycle State Target *</label>
                <select
                  value={directExitTarget}
                  onChange={(e) => setDirectExitTarget(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="Exit Completed">Exit Completed (Inactive / Terminated)</option>
                  <option value="Notice Period">Notice Period (Serving Notice)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Exit Reason *</label>
                <input
                  type="text"
                  required
                  value={directExitReason}
                  onChange={(e) => setDirectExitReason(e.target.value)}
                  placeholder="Reason for exit..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Remarks / Documentation Notes</label>
                <textarea
                  rows={3}
                  value={directExitRemarks}
                  onChange={(e) => setDirectExitRemarks(e.target.value)}
                  placeholder="Internal exit notes..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMarkExitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm & Mark Exit</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection Reason */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Reject Resignation</h3>
            <form onSubmit={handleRejectResignation} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State rejection reason..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relieving Letter Drawer Modal */}
      {isRelievingDrawerOpen && (
        <GenerateRelievingDrawer
          isOpen={isRelievingDrawerOpen}
          onClose={() => setIsRelievingDrawerOpen(false)}
          employees={[
            {
              id: employee.id || '',
              employeeCode: employee.employeeCode || employee.employeeId,
              fullName: employee.fullName,
              designation: employee.designation,
              department: employee.department,
              joiningDate: employee.joiningDate,
              lastWorkingDate: employee.lastWorkingDate || exit?.lastWorkingDate,
              employmentStatus: currentStatus,
              workLocation: employee.workLocation,
              reportingManager: employee.reportingManager,
              email: employee.email,
            },
          ]}
          preselectedEmployeeId={employee.id}
          onSuccess={() => {
            setIsRelievingDrawerOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Rehire Employee Drawer Modal */}
      {isRehireDrawerOpen && (
        <RehireDrawer
          isOpen={isRehireDrawerOpen}
          onClose={() => setIsRehireDrawerOpen(false)}
          employee={employee}
          onSuccess={() => {
            setSuccessMessage('Employee successfully rehired and reactivated.');
            setIsRehireDrawerOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
