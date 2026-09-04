import { PhoneCall, UserCheck, ShieldAlert, Activity } from 'lucide-react';
import type { Candidate } from '../types/crm';

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  selectedCandidateIds: string[];
  onToggleCandidateSelect: (id: string) => void;
  onSelectAll: (selectAll: boolean) => void;
}

export default function CandidateTable({
  candidates,
  onSelectCandidate,
  selectedCandidateIds,
  onToggleCandidateSelect,
  onSelectAll,
}: CandidateTableProps) {
  const isAllSelected = candidates.length > 0 && selectedCandidateIds.length === candidates.length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'Line Up':
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Line Up</span>;
      case 'Interested':
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Interested</span>;
      case 'Call Back Later':
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Call Back Later</span>;
      case 'Doc / Vehicle / Vacancy Issue':
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Issue</span>;
      case 'Wrong Number':
      case 'Not Interested':
      case 'Inactive':
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const recentUpdates: any[] = [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Candidate Table */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-600" /> CRM Leads ({candidates.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">Click candidate or client to view details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Called Date</th>
                <th className="p-3">Follow Up Date</th>
                <th className="p-3">Interview Date</th>
                <th className="p-3">Assignee Name</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    No candidates found matching the active criteria.
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => {
                  const isChecked = selectedCandidateIds.includes(cand.id);
                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleCandidateSelect(cand.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Candidate Name */}
                      <td className="p-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => onSelectCandidate(cand)}
                          className="text-slate-900 hover:text-emerald-600 transition text-left cursor-pointer flex items-center gap-1.5"
                        >
                          {cand.name}
                          {cand.isBlacklisted && (
                            <span title={`Blacklisted: ${cand.blacklistReason}`}>
                              <ShieldAlert size={14} className="text-red-600" />
                            </span>
                          )}
                        </button>
                        <span className="block text-[10px] font-mono text-slate-400 font-normal"></span>
                      </td>

                      {/* Phone Number */}
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{cand.phone}</td>

                      {/* Status */}
                      <td className="p-3">{getStatusBadge(cand.currentCrmStatus ?? 'Not Contacted')}</td>

                      {/* Last Called Date */}
                      <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                        {cand.lastCalledAt ? new Date(cand.lastCalledAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }) : (cand.callsCount > 0 ? new Date(cand.updatedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'short', day: 'numeric' }) : '—')}
                      </td>

                      {/* Follow Up Date */}
                      <td className="p-3 text-[11px] whitespace-nowrap font-mono">{cand.followUpDate || '—'}</td>

                      {/* Interview Date */}
                      <td className="p-3 text-[11px] whitespace-nowrap font-mono">{cand.interviewDate || '—'}</td>

                      {/* Assignee Name */}
                      <td className="p-3 text-[11px] font-medium text-slate-700">{cand.assignedRecruiterName || 'Unassigned'}</td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => onSelectCandidate(cand)}
                            title="Call & Update Candidate"
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                          >
                            <PhoneCall size={14} /> Call
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Recruiter Updates Side Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
          <Activity size={16} className="text-emerald-600" />
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recent Recruiter Updates</h4>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
          {recentUpdates.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No recent timeline logs available.</p>
          ) : (
            recentUpdates.map((up) => (
              <div key={up.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{up.candidateName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(up.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-700 font-semibold">{up.status}</span>
                  <span className="text-slate-500">by {up.recruiterName.split(' ')[0]}</span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 italic font-sans">{up.notes}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
