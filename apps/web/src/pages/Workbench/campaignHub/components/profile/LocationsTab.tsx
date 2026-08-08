import type { CampaignMaster } from '../../types/campaign';
import { MapPin } from 'lucide-react';

interface LocationsTabProps {
  campaign: CampaignMaster;
}

export default function LocationsTab({ campaign }: LocationsTabProps) {
  const locations = campaign.locations || [];

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="text-emerald-600" size={16} />
            <h3 className="font-bold text-slate-900 text-xs">Target Geography & Location Analytics</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Location Master Integrated</span>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-3.5">State</th>
              <th className="p-3.5">City</th>
              <th className="p-3.5">Areas / Clusters</th>
              <th className="p-3.5 text-right">Leads</th>
              <th className="p-3.5 text-right">Joined</th>
              <th className="p-3.5 text-right">Active</th>
              <th className="p-3.5 text-right">Conversion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  No location breakdowns available for this campaign.
                </td>
              </tr>
            ) : (
              locations.map((loc, idx) => {
                const leads = loc.leads ?? campaign.actualLeads;
                const joined = loc.joined ?? campaign.actualJoins;
                const active = loc.active ?? campaign.activeCandidatesCount;
                const convRate = loc.conversionRate ?? campaign.conversionRate;
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-bold text-slate-900">{loc.state}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{loc.city}</td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {loc.areas.map((area) => (
                          <span
                            key={area}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                      {leads.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {joined.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                      {active.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">
                      {convRate}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
