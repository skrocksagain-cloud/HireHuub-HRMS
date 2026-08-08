import type { CampaignMaster } from '../../types/campaign';

interface AuditHistoryTabProps {
  campaign: CampaignMaster;
}

export default function AuditHistoryTab({ campaign }: AuditHistoryTabProps) {
  const audit = campaign.auditHistory;

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs">Immutable Audit Log & Change History</h3>
          <span className="text-[10px] text-slate-400 font-semibold">Enterprise System Log</span>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Action Event</th>
              <th className="p-3.5">Performed By</th>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/60 transition">
              <td className="p-3.5 font-bold text-slate-900">Campaign Record Created</td>
              <td className="p-3.5 font-semibold text-slate-800">{audit.createdBy || 'System Administrator'}</td>
              <td className="p-3.5 font-mono text-slate-600">{audit.createdDate || '—'}</td>
              <td className="p-3.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Immutable
                </span>
              </td>
            </tr>

            {audit.updatedDate && (
              <tr className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-slate-900">Campaign Details Updated</td>
                <td className="p-3.5 font-semibold text-slate-800">{audit.updatedBy || 'System'}</td>
                <td className="p-3.5 font-mono text-slate-600">{audit.updatedDate}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Logged
                  </span>
                </td>
              </tr>
            )}

            {audit.archivedDate && (
              <tr className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-red-700">Campaign Archived</td>
                <td className="p-3.5 font-semibold text-slate-800">{audit.archivedBy || 'System'}</td>
                <td className="p-3.5 font-mono text-slate-600">{audit.archivedDate}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                    Archived
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
