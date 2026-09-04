import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import type { WorkforceItem } from '../types/workforce';
import ActiveEmployeePicker from '../../../Administration/Announcements/components/ActiveEmployeePicker';
import type { Employee } from '../../../Employee/types/Employee';

interface AssignmentPanelProps {
  item: WorkforceItem;
  userRole: string;
  userSession: { id: string; name: string };
  onUpdateAssignment: (id: string, employee: Employee) => Promise<void>;
}

export default function AssignmentPanel({
  item,
  userRole,
  onUpdateAssignment,
}: AssignmentPanelProps) {
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>(item.recruiterId ? [item.recruiterId] : []);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  // Recruiter/Employee cannot reassign
  const canReassign = userRole !== 'Finance' && userRole !== 'Marketing' && userRole !== 'HR' && userRole !== 'Recruiter' && userRole !== 'Employee';

  const handleReassignSubmit = async () => {
    if (!canReassign || !selectedEmployee) return;

    setUpdating(true);
    try {
      await onUpdateAssignment(item.id, selectedEmployee);
      setShowReassignModal(false);
    } catch {
      // Handled upstream
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectionChange = (employees: Employee[]) => {
    setSelectedEmployee(employees.length > 0 ? employees[0] : null);
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
          <span className="text-[10px] text-slate-400 font-medium">Read Only</span>
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
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-3 mt-2">
          <label className="block text-[11px] font-bold text-slate-800">
            Reassign {item.candidateName} to New Recruiter / Assignee:
          </label>
          
          <ActiveEmployeePicker
            singleSelect={true}
            selectedEmployeeIds={selectedEmployeeIds}
            onChange={setSelectedEmployeeIds}
            onSelectionChange={handleSelectionChange}
          />
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowReassignModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updating || selectedEmployeeIds.length === 0}
              onClick={handleReassignSubmit}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50"
            >
              {updating ? 'Saving…' : 'Save Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
