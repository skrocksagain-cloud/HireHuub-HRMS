import { Eye, ExternalLink, RefreshCw, History, Award } from 'lucide-react';
import type { WorkforceItem } from '../types/workforce';

interface ActiveWorkforceTableProps {
  workforce: WorkforceItem[];
  loading: boolean;
  onSelectCandidate: (item: WorkforceItem) => void;
  onOpenCrmProfile: (candidateId: string) => void;
  onOpenUpdateWorkforce: (item: WorkforceItem) => void;
  onOpenPayoutHistory: (item: WorkforceItem) => void;
}

export default function ActiveWorkforceTable({
  workforce,
  loading,
  onSelectCandidate,
  onOpenCrmProfile,
  onOpenUpdateWorkforce,
  onOpenPayoutHistory,
}: ActiveWorkforceTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          Loading Single Source Workforce Records…
        </div>
      ) : workforce.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          No workforce records found matching the active filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Candidate & Phone</th>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Workforce Type</th>
                <th className="py-3.5 px-4">Recruiter / AP</th>
                <th className="py-3.5 px-4">Working From</th>
                <th className="py-3.5 px-4">Working Status</th>
                <th className="py-3.5 px-4 text-right">Total Earnings</th>
                <th className="py-3.5 px-4 text-center">Total Orders</th>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {workforce.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  {/* Employee ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                      {item.id}
                    </span>
                  </td>

                  {/* Candidate & Phone */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{item.candidateName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.phone}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.area}, {item.city}
                    </div>
                  </td>

                  {/* Client */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-emerald-800">{item.clientName}</div>
                  </td>

                  {/* Workforce Type Badge */}
                  <td className="py-3.5 px-4">
                    {item.workforceType === 'Payroll' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        Payroll
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        OTS
                      </span>
                    )}
                  </td>

                  {/* Recruiter / AP */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{item.recruiterName}</div>
                    {item.associatePartnerName && (
                      <div className="text-[10px] text-purple-600 font-medium">
                        AP: {item.associatePartnerName}
                      </div>
                    )}
                  </td>

                  {/* Working From */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {item.workingFrom}
                  </td>

                  {/* Working Status Badge (Derived strictly from import) */}
                  <td className="py-3.5 px-4">
                    {item.workingStatus === 'Working' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Working
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Not Working
                      </span>
                    )}
                  </td>

                  {/* Total Monthly Earnings */}
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{item.totalEarnings.toLocaleString('en-IN')}
                  </td>

                  {/* Total Orders (Hidden / Dash for unsupported clients) */}
                  <td className="py-3.5 px-4 text-center">
                    {item.supportsOrders && item.totalOrders !== undefined ? (
                      <span className="font-bold text-blue-700">{item.totalOrders}</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Rank (Hidden / Dash for unsupported clients) */}
                  <td className="py-3.5 px-4 text-center">
                    {item.supportsOrders && item.rank !== undefined ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10px]">
                        <Award size={10} className="text-amber-600" /> #{item.rank}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>

                  {/* Actions Dropdown / Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(item)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition text-[11px] font-semibold"
                        title="View Workforce Profile"
                      >
                        <Eye size={12} />
                        <span>Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenCrmProfile(item.candidateId)}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="Open CRM Candidate Profile"
                      >
                        <ExternalLink size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenUpdateWorkforce(item)}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="Update Workforce Assignment / Details"
                      >
                        <RefreshCw size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPayoutHistory(item)}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                        title="View Client Payout History"
                      >
                        <History size={14} />
                      </button>
                    </div>
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
