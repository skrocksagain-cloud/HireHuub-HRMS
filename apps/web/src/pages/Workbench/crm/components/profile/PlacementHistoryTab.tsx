import { Building2, Award } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface PlacementHistoryTabProps {
  candidate: Candidate;
}

export default function PlacementHistoryTab({ candidate }: PlacementHistoryTabProps) {
  const placements = candidate.placementHistory || [];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Building2 size={16} className="text-emerald-600" /> Lifetime Placement History ({placements.length})
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Unlimited placements preserved across client tenures</span>
      </div>

      {placements.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 italic">
          No active or historical placement records found for this candidate.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="p-3">Placement ID</th>
                <th className="p-3">Client Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Opening Position</th>
                <th className="p-3">Active Date</th>
                <th className="p-3">Payroll Employee ID</th>
                <th className="p-3">Placement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {placements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-semibold text-emerald-800">{p.id}</td>
                  <td className="p-3 font-bold text-slate-900">{p.clientName}</td>
                  <td className="p-3 font-semibold text-emerald-700">{p.clientType}</td>
                  <td className="p-3">{p.openingTitle || '—'}</td>
                  <td className="p-3 font-mono">{p.activeDate}</td>
                  <td className="p-3 font-mono font-bold text-indigo-700">{p.payrollEmployeeId || '—'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                      <Award size={10} /> {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
