import { Sparkles, Building2, Clock, Calendar } from 'lucide-react';
import type { ServerTimeInfo } from '../../../services/dashboard/dashboardService';

interface GreetingHeroCardProps {
  serverTime: ServerTimeInfo;
  employeeName?: string;
  departmentName?: string;
  designation?: string;
  companyName?: string;
}

export default function GreetingHeroCard({
  serverTime,
  employeeName = 'Somnath',
  departmentName = 'Engineering & Talent Operations',
  designation = 'Senior Talent Architect',
  companyName = 'Hire Huub Pvt Ltd',
}: GreetingHeroCardProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles size={14} />
            <span>Hire Huub One Enterprise Workspace</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {serverTime.greeting}, {employeeName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2 font-medium">
            <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Building2 size={14} className="text-emerald-400" /> {companyName}
            </span>
            <span className="text-slate-600">•</span>
            <span>{departmentName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-300 font-mono">{designation}</span>
          </div>
        </div>

        {/* Server Time & Date Badge */}
        <div className="bg-slate-950/60 p-3.5 px-5 rounded-2xl border border-slate-700/80 text-right font-mono text-xs shrink-0 shadow-inner">
          <div className="flex items-center gap-2 justify-end text-emerald-400 font-bold text-sm">
            <Clock size={16} />
            <span>{serverTime.formattedTime}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end text-slate-400 text-[11px] mt-1">
            <Calendar size={13} />
            <span>{serverTime.formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
