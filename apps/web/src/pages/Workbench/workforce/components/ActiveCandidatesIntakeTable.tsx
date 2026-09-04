import { Eye } from 'lucide-react';
import type { Candidate } from '../../crm/types/crm';
import type { Client } from '../../../../types/Client';

interface ActiveCandidatesIntakeTableProps {
  candidates: Candidate[];
  clients: Client[];
  loading: boolean;
  onOpenCrmProfile: (candidateId: string) => void;
}

export default function ActiveCandidatesIntakeTable({
  candidates,
  clients,
  loading,
  onOpenCrmProfile,
}: ActiveCandidatesIntakeTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading Active Candidates (Intake Projection)...
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          No candidates found in "Active" CRM status.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50 border-b border-emerald-200/80 text-emerald-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Candidate ID</th>
                <th className="py-3.5 px-4">Name & Phone</th>
                <th className="py-3.5 px-4">City</th>
                <th className="py-3.5 px-4">Client (Type/Points)</th>
                <th className="py-3.5 px-4">Assigned Recruiter</th>
                <th className="py-3.5 px-4 text-center">CRM Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {candidates.map((c) => {
                const client = clients.find(cl => cl.id === c.currentClientId);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-emerald-700 font-bold">{c.id}</td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-semibold">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.phone}</div>
                    </td>
                    <td className="py-3 px-4">{c.city}</td>
                    <td className="py-3 px-4">
                      {client ? (
                        <>
                          <div className="text-slate-900 font-semibold">{client.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {client.type} • {client.points} pts
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No Client Assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900">{c.assignedRecruiterName}</div>
                      <div className="text-[11px] text-slate-500">ID: {c.assignedRecruiterId}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        {c.currentCrmStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenCrmProfile(c.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="View CRM Profile"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
