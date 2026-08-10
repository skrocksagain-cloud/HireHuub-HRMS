import { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePermissions } from '../../hooks/usePermissions';

export default function ReportsPage() {
  const { canAccessModule } = usePermissions();
  const [selectedReportType, setSelectedReportType] = useState('attendance');

  if (!canAccessModule('management')) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500 font-bold text-sm">
          Access Denied. You do not have permission to view Enterprise Reports.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <BarChart3 size={14} />
              <span>Executive Reporting Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Enterprise Analytics & Compliance Reports</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Realtime organization performance metrics, attendance summaries, billing registers, and audit log exports.
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={16} /> Export All Reports (CSV)
          </button>
        </div>

        {/* Report Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
          {[
            { id: 'attendance', label: 'Attendance & Compliance Report' },
            { id: 'payroll', label: 'Payroll & TDS Register' },
            { id: 'recruitment', label: 'Recruitment & Placement Funnel' },
            { id: 'audit', label: 'System Audit Log Summary' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedReportType(tab.id)}
              className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                selectedReportType === tab.id
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Content Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-600" />
              Report Dataset: {selectedReportType.toUpperCase()}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Live Firestore Synced</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Export executive summaries and transactional logs for audit compliance and financial reconciliation.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}