import type { CampaignMaster } from '../../types/campaign';
import { Layers } from 'lucide-react';

interface PerformanceTabProps {
  campaign: CampaignMaster;
}

export default function PerformanceTab({ campaign }: PerformanceTabProps) {
  const stages = campaign.stagePerformances || [];

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Header Info Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-3">
        <Layers className="text-blue-600 shrink-0" size={18} />
        <div>
          <h4 className="font-bold text-blue-900 text-xs">CRM & Workforce Integrated Funnel Performance</h4>
          <p className="text-blue-700 text-[11px] mt-0.5">
            Aggregated conversion metrics directly derived from CRM candidate journeys and Workforce active status. Candidate PII is protected.
          </p>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stages.map((st) => (
          <div key={st.stage} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {st.stage}
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
              {st.count.toLocaleString('en-IN')}
            </span>
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {st.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* Conversion Funnel Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-xs">Funnel Stage Metrics & Conversion Ratios</h3>
          <span className="text-[10px] text-slate-400 font-semibold">CRM Source Data</span>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Funnel Stage</th>
              <th className="p-3.5 text-right">Candidate Count</th>
              <th className="p-3.5 text-right">Conversion % (vs Total Leads)</th>
              <th className="p-3.5">Stage Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stages.map((st) => (
              <tr key={st.stage} className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-slate-900">{st.stage}</td>
                <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                  {st.count.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-right font-semibold text-emerald-700">
                  {st.percentage}%
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    Aggregated Metric
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
