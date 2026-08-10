import { Award, Target } from 'lucide-react';
import type { DepartmentKpiSnapshot, UserRankingInfo } from '../../../services/dashboard/dashboardService';

interface EnterpriseKpiSnapshotWidgetProps {
  kpis: DepartmentKpiSnapshot[];
  ranking: UserRankingInfo;
}

export default function EnterpriseKpiSnapshotWidget({ kpis, ranking }: EnterpriseKpiSnapshotWidgetProps) {
  return (
    <div className="space-y-4">
      {/* Header Ranking Scope Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
            <Award size={22} />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-300 uppercase tracking-wider">
              {ranking.scopeLabel}
            </div>
            <div className="font-black text-lg text-white mt-0.5">
              Rank #{ranking.rank} <span className="text-xs text-amber-400 font-semibold">({ranking.points} points)</span>
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <div className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
            <Target size={14} /> {ranking.achievementPercent}%
          </div>
          <div className="text-slate-400 text-[10px] mt-0.5">
            Target: {ranking.target} pts
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((metric, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>{metric.title}</span>
              {metric.change && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    metric.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : metric.trend === 'action'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {metric.change}
                </span>
              )}
            </div>

            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metric.value}
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {metric.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
