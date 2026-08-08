import type { CampaignMaster } from '../../types/campaign';
import { formatINR } from '../../utils/campaignUtils';
import { Sparkles, TrendingUp } from 'lucide-react';

interface RoiTabProps {
  campaign: CampaignMaster;
}

export default function RoiTab({ campaign }: RoiTabProps) {
  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Campaign Cost (Spend)
          </span>
          <span className="text-lg font-bold text-slate-900 mt-1 block">
            {formatINR(campaign.actualSpend)}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Leads Generated
          </span>
          <span className="text-lg font-bold text-blue-700 mt-1 block">
            {campaign.actualLeads.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Candidates Joined
          </span>
          <span className="text-lg font-bold text-emerald-700 mt-1 block">
            {campaign.actualJoins.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Cost Per Lead (CPL)
          </span>
          <span className="text-lg font-bold text-purple-700 mt-1 block">
            {formatINR(campaign.costPerLead)}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Cost Per Join (CPJ)
          </span>
          <span className="text-lg font-bold text-indigo-700 mt-1 block">
            {formatINR(campaign.costPerJoin)}
          </span>
        </div>
      </div>

      {/* ROI & ORBIT Extension Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Version 1 ROI Architecture */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-600" size={16} />
              <h3 className="font-bold text-slate-900 text-xs">ROI & Acquisition Efficiency (V1)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Version 1 Approved
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Conversion Efficiency Ratio</span>
              <span className="font-bold text-slate-900">{campaign.conversionRate}%</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Blended Acquisition Cost per Join</span>
              <span className="font-bold text-emerald-700">{formatINR(campaign.costPerJoin)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Lead Generation Efficiency</span>
              <span className="font-bold text-purple-700">{formatINR(campaign.costPerLead)} / lead</span>
            </div>
          </div>
        </div>

        {/* ORBIT Extension Point */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-900 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={16} />
              <h3 className="font-bold text-white text-xs">ORBIT Retention Engine Architecture</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Future Ready
            </span>
          </div>

          <p className="text-indigo-200 text-[11px] leading-relaxed">
            Prepared extension point for upcoming ORBIT retention metrics and lifetime value (LTV) revenue attribution algorithms.
          </p>

          <div className="pt-2 border-t border-indigo-900/60 flex items-center justify-between text-[11px]">
            <span className="text-indigo-300 font-semibold">Attribution Engine Status:</span>
            <span className="font-mono text-amber-300 font-bold">Ready for Integration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
