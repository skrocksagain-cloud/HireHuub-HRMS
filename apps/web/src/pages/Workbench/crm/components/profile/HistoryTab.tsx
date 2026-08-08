import { ShieldCheck } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface HistoryTabProps {
  candidate: Candidate;
}

export default function HistoryTab({ candidate }: HistoryTabProps) {
  const auditLogs = candidate.systemAudit || [];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-emerald-600" /> System Audit History ({auditLogs.length})
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Immutable system action logs</span>
      </div>

      {auditLogs.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No system audit records logged.</p>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="p-3">Audit ID</th>
                <th className="p-3">Action Type</th>
                <th className="p-3">Performed By</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-[10px] text-slate-400">{log.id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{log.performedBy}</td>
                  <td className="p-3 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-slate-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
