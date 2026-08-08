import { History, UserCheck } from 'lucide-react';
import { useAdminAuditLogs } from '../../../hooks/admin/useAdmin';

export default function AuditLogsTab() {
  const { auditLogs, isLoading } = useAdminAuditLogs();

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Audit Logs…</div>;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History size={18} className="text-emerald-600" />
            System Administrative Audit Logs
          </h3>
          <p className="text-slate-500">
            Immutable tracking record of every Admin configuration change, permission update, password reset, and master data edit.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor (Who)</th>
              <th className="py-3 px-4">Action (What)</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Old Value</th>
              <th className="py-3 px-4">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  No audit logs recorded yet. System changes will automatically log here.
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-600" />
                    {log.whoName}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">{log.whatAction}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{log.entityName}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-xs truncate">{log.oldValue || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-emerald-700 max-w-xs truncate">{log.newValue || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
