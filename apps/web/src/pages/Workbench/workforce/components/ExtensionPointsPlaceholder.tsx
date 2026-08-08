import {
  CreditCard,
  BarChart3,
  Bot,
  CalendarCheck,
  FileCheck,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function ExtensionPointsPlaceholder() {
  return (
    <div className="space-y-6 pt-4 text-xs">
      {/* Payment Ready Queue Prepared Workflow (Payroll Only) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700 flex items-center gap-2">
          <CreditCard size={16} />
          <span>Payment Ready Queue Workflow (Payroll Extension Point)</span>
        </h4>
        <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2 text-teal-950">
          <div className="flex items-center justify-between font-bold">
            <span>Prepared Payment Pipeline:</span>
            <span className="text-[10px] font-bold bg-teal-200 text-teal-900 px-2 py-0.5 rounded">
              Extension Ready
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold pt-1">
            <span className="bg-white px-3 py-1 rounded-lg border border-teal-300">Payment Ready</span>
            <span>→</span>
            <span className="bg-white px-3 py-1 rounded-lg border border-teal-300">Finance Review</span>
            <span>→</span>
            <span className="bg-white px-3 py-1 rounded-lg border border-teal-300">Bank Upload Batch</span>
          </div>
        </div>
      </div>

      {/* Dashboard Widgets Extension Placeholders */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-2">
          <BarChart3 size={16} />
          <span>Dashboard Analytics Widgets (Extension Placeholders Prepared)</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 text-slate-600">
          {[
            'Workforce Growth',
            'Payroll vs OTS',
            'Working vs Not Working',
            'Recruiter Performance',
            'Associate Partner Performance',
            'Billing Forecast',
            'Active Workforce Trend',
            'Client-wise Workforce',
            'City-wise Workforce',
          ].map((widgetName) => (
            <div
              key={widgetName}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
            >
              <span className="font-semibold text-slate-800">{widgetName}</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Extension
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Extension Architecture Integration Points */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-2">
          <Zap size={16} />
          <span>Enterprise Extension Contract Points</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          {[
            { title: 'OCR Reader Engine', icon: Sparkles },
            { title: 'AI Import Detection', icon: Bot },
            { title: 'Attendance Sync', icon: CalendarCheck },
            { title: 'Leave Management', icon: FileCheck },
            { title: 'Payslip Generation', icon: FileCheck },
            { title: 'Bank Upload Module', icon: CreditCard },
            { title: 'ORBIT / WhatsApp Engine', icon: Send },
            { title: 'Analytics Dashboard', icon: BarChart3 },
          ].map((ext) => (
            <div
              key={ext.title}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-700 font-medium"
            >
              <ext.icon size={14} className="text-indigo-600 shrink-0" />
              <span>{ext.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
