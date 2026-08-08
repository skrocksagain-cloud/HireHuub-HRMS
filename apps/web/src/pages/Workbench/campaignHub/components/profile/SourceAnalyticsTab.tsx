import type { CampaignMaster, CampaignSource } from '../../types/campaign';
import { CAMPAIGN_SOURCES } from '../../constants/campaignConstants';
import { Share2 } from 'lucide-react';

interface SourceAnalyticsTabProps {
  campaign: CampaignMaster;
}

export default function SourceAnalyticsTab({ campaign }: SourceAnalyticsTabProps) {
  const existingAnalytics = campaign.sourceAnalytics || [];

  const allSourceMetrics = CAMPAIGN_SOURCES.map((sourceName: CampaignSource) => {
    const found = existingAnalytics.find((sa) => sa.source === sourceName);
    if (found) return found;

    if (sourceName === campaign.campaignSource) {
      return {
        source: sourceName,
        leads: campaign.actualLeads,
        joined: campaign.actualJoins,
        active: campaign.activeCandidatesCount,
        conversionRate: campaign.conversionRate,
      };
    }

    return {
      source: sourceName,
      leads: 0,
      joined: 0,
      active: 0,
      conversionRate: 0,
    };
  });

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="text-emerald-600" size={16} />
            <h3 className="font-bold text-slate-900 text-xs">Marketing Source Performance Breakdown</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">14 Standard Channels</span>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Marketing Source Channel</th>
              <th className="p-3.5 text-right">Leads</th>
              <th className="p-3.5 text-right">Joined</th>
              <th className="p-3.5 text-right">Active</th>
              <th className="p-3.5 text-right">Conversion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allSourceMetrics.map((sa) => (
              <tr key={sa.source} className="hover:bg-slate-50/60 transition">
                <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <span>{sa.source}</span>
                  {sa.source === campaign.campaignSource && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      Primary Source
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                  {sa.leads.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                  {sa.joined.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                  {sa.active.toLocaleString('en-IN')}
                </td>
                <td className="p-3.5 text-right font-bold text-slate-800">
                  {sa.conversionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
