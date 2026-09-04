import { Activity } from 'lucide-react';

export default function OrganizationHealthWidget() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-emerald-400" />
          <span className="font-bold text-xs">Organization Health Snapshot</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
          Operational
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1">
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Approvals</span>
          <strong className="text-slate-300">--</strong>
        </div>
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Attendance</span>
          <strong className="text-slate-300">--</strong>
        </div>
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Payroll</span>
          <strong className="text-slate-300">--</strong>
        </div>
        <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-[10px]">Documents</span>
          <strong className="text-slate-300">--</strong>
        </div>
      </div>
    </div>
  );
}
