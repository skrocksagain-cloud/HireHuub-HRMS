import { useState, useMemo } from 'react';
import { X, UserCheck, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import type { Candidate } from '../types/crm';
import type { Employee } from '../../../Employee/types/Employee';

interface AssignmentCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'bulk' | 'transfer';
  selectedCandidateIds: string[];
  candidates: Candidate[];
  onBulkAssign: (toRecruiterId: string, toRecruiterName: string) => Promise<void>;
  onBulkTransfer: (fromRecruiterId: string, toRecruiterId: string, toRecruiterName: string) => Promise<void>;
  userRole: string;
  userAssignedRole?: string;
  assignableEmployees?: Employee[];
  allActiveEmployees?: Employee[];
}

import { getAuthorizationScope } from '../../../../core/authorization/authorizationResolver';

export default function AssignmentCenterModal({
  isOpen,
  onClose,
  mode,
  selectedCandidateIds,
  candidates,
  onBulkAssign,
  onBulkTransfer,
  userRole,
  userAssignedRole,
  assignableEmployees = [],
  allActiveEmployees = [],
}: AssignmentCenterModalProps) {
  // Build active recruiter list from People module
  const recruiters = useMemo(() => {
    const source = assignableEmployees.length > 0 ? assignableEmployees : allActiveEmployees;
    if (source.length === 0) {
      return [
        { id: 'user-001', name: 'Rahul Sharma', team: 'Staffing', workload: 14 },
        { id: 'user-002', name: 'Anita Roy', team: 'Staffing', workload: 18 },
        { id: 'tl-001', name: 'Vikram Patil', team: 'Staffing Lead', workload: 8 },
        { id: 'admin-001', name: 'Sanjay Gupta', team: 'Staffing Admin', workload: 4 },
      ];
    }
    return source.map((emp) => {
      const empId = emp.employeeId || emp.id || '';
      const workload = candidates.filter((c) =>
        c.assignedRecruiterId === empId ||
        c.assignedRecruiterName.toLowerCase() === emp.fullName.toLowerCase()
      ).length;
      return {
        id: empId,
        name: emp.fullName,
        team: emp.department || emp.designation || 'Staffing Team',
        workload,
      };
    });
  }, [assignableEmployees, allActiveEmployees, candidates]);

  const [targetRecruiterId, setTargetRecruiterId] = useState<string>('');
  const [fromRecruiterId, setFromRecruiterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'assign' | 'transfer'>(mode === 'transfer' ? 'transfer' : 'assign');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeTargetId = targetRecruiterId || (recruiters[0]?.id ?? '');
  const activeFromId = fromRecruiterId || (recruiters[0]?.id ?? '');

  const scope = getAuthorizationScope(userAssignedRole || userRole);
  const canAssign = scope !== 'SELF';

  if (!isOpen) return null;

  const targetRecruiter = recruiters.find((r) => r.id === activeTargetId) || recruiters[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRecruiter) return;

    try {
      setIsSubmitting(true);
      if (activeTab === 'transfer') {
        await onBulkTransfer(activeFromId, targetRecruiter.id, targetRecruiter.name);
      } else {
        await onBulkAssign(targetRecruiter.id, targetRecruiter.name);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={20} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Assignment & Reassignment Center</h3>
              <p className="text-[11px] text-slate-500">Manage recruiter portfolio distribution and transfers (People Module Source of Truth)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {!canAssign ? (
          <div className="p-8 text-center space-y-2">
            <ShieldAlert size={36} className="mx-auto text-amber-600 mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">Permission Denied</h4>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Recruiters are not permitted to manually reassign candidates. Only Team Leads (within own team) and Staffing Admins have assignment rights.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('assign')}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  activeTab === 'assign' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Bulk Assignment ({selectedCandidateIds.length} Selected)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transfer')}
                className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${
                  activeTab === 'transfer' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Bulk Recruiter Transfer (Resignation / Restructuring)
              </button>
            </div>

            {activeTab === 'transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer From Recruiter (Resigning / Outgoing Active Employee)</label>
                <select
                  value={activeFromId}
                  onChange={(e) => setFromRecruiterId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
                >
                  {recruiters.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.workload} active candidates)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === 'transfer' ? 'Transfer To Recruiter' : 'Assign Selected Candidates To'} *
              </label>
              <select
                value={activeTargetId}
                onChange={(e) => setTargetRecruiterId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-medium"
              >
                {recruiters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — Current Workload: {r.workload} candidates ({r.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Recruiter Workload Indicator Box */}
            {targetRecruiter && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>Target Active Employee Workload Overview</span>
                  <span className="px-2 py-0.5 bg-emerald-200 rounded text-[10px] text-emerald-900">{targetRecruiter.team}</span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  <strong>{targetRecruiter.name}</strong> currently manages <strong>{targetRecruiter.workload} candidates</strong>.
                </p>
                <p className="text-emerald-700 text-[10px] italic">
                  Assigned candidates will receive fresh lead notifications, while full timeline and placement history are preserved.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck size={16} /> {isSubmitting ? 'Processing...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
