import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import type { WorkforceItem } from '../types/workforce';

interface AssignmentPanelProps {
  item: WorkforceItem;
  userRole: string;
  userSession: { id: string; name: string };
  onUpdateAssignment: (id: string, newAssigneeId: string, newAssigneeName: string) => Promise<void>;
}

export default function AssignmentPanel({
  item,
  userRole,
  onUpdateAssignment,
}: AssignmentPanelProps) {
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [newAssigneeName, setNewAssigneeName] = useState<string>(item.currentAssignee);
  const [updating, setUpdating] = useState<boolean>(false);

  const canReassign = userRole !== 'Finance' && userRole !== 'Marketing' && userRole !== 'HR';

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReassign || !newAssigneeName.trim()) return;

    setUpdating(true);
    try {
      await onUpdateAssignment(item.id, `user-${Date.now()}`, newAssigneeName.trim());
      setShowReassignModal(false);
    } catch {
      // Handled upstream
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-center justify-between border-b pb-1">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
          <UserCheck size={14} />
          <span>Workforce Assignment Panel</span>
        </h4>
        {canReassign ? (
          <button
            type="button"
            onClick={() => setShowReassignModal(true)}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline"
          >
            Reassign Candidate
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Read Only (Finance)</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-400 text-[10px] font-semibold block">Activated By</span>
          <span className="font-bold text-slate-900 mt-0.5 block">{item.activatedBy}</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-400 text-[10px] font-semibold block">Current Assignee</span>
          <span className="font-bold text-emerald-800 mt-0.5 block">{item.currentAssignee}</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-400 text-[10px] font-semibold block">Reporting Team Lead</span>
          <span className="font-bold text-slate-900 mt-0.5 block">{item.reportingTeamLead}</span>
        </div>
      </div>

      {showReassignModal && (
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-2 mt-2">
          <label className="block text-[11px] font-bold text-slate-800">
            Reassign {item.candidateName} to New Recruiter / Assignee:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAssigneeName}
              onChange={(e) => setNewAssigneeName(e.target.value)}
              className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              placeholder="Enter recruiter name..."
            />
            <button
              type="button"
              disabled={updating}
              onClick={handleReassignSubmit}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
            >
              {updating ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowReassignModal(false)}
              className="px-3 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
