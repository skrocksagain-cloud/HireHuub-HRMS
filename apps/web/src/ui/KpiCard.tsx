import type { KpiMetric } from '../types/Dashboard';

export interface KpiCardProps {
  metric: KpiMetric;
  icon: React.ReactNode;
  badgeBg: string;
}

export default function KpiCard({ metric, icon, badgeBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 group flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{metric.title}</span>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{metric.value}</span>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium truncate">{metric.subtext}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
            {metric.change}
          </span>
        </div>
      </div>
    </div>
  );
}
