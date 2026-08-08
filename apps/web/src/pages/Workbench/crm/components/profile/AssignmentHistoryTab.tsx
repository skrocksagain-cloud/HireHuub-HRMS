import { ArrowRightLeft } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface AssignmentHistoryTabProps {
  candidate: Candidate;
}

export default function AssignmentHistoryTab({ candidate }: AssignmentHistoryTabProps) {
  const history = candidate.assignmentHistory || [];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRightLeft size={16} className="text-emerald-600" /> Recruiter Assignment Audit Log ({history.length})
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Immutable assignment & transfer record</span>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No assignment history records found.</p>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="p-3">Record ID</th>
                <th className="p-3">From Recruiter</th>
                <th className="p-3">To Recruiter</th>
                <th className="p-3">Assigned By</th>
                <th className="p-3">Date</th>
                <th className="p-3">Reason / Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-slate-400 text-[10px]">{h.id}</td>
                  <td className="p-3 font-semibold text-slate-700">{h.fromRecruiterName}</td>
                  <td className="p-3 font-bold text-emerald-800">{h.toRecruiterName}</td>
                  <td className="p-3 font-medium text-slate-600">{h.assignedByUserName}</td>
                  <td className="p-3 font-mono text-[11px]">{new Date(h.assignedAt).toLocaleString()}</td>
                  <td className="p-3 italic text-slate-500">{h.reason || 'Lead Assignment'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
