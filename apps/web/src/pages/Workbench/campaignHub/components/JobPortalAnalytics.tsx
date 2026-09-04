import { Calendar, Filter } from 'lucide-react';
import { useCampaignAnalytics } from '../hooks/useCampaignAnalytics';
import type { CampaignMaster } from '../types/campaign';
import { formatINR } from '../utils/campaignUtils';

export default function JobPortalAnalytics({ campaigns }: { campaigns: CampaignMaster[] }) {
  const {
    jobPortalMetrics,
    kpiData,
    loadingAnalytics,
    filters,
    uniquePortals,
    uniqueRecruiters,
    uniqueCampaigns
  } = useCampaignAnalytics(campaigns);

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Leads
          </span>
          <span className="text-xl font-extrabold text-blue-700 mt-1 block">
            {kpiData.totalLeads.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Candidates
          </span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
            {kpiData.activeCandidates.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Overall Conversion
          </span>
          <span className="text-xl font-extrabold text-indigo-700 mt-1 block">
            {kpiData.overallConversion.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Best Portal
          </span>
          <span className="text-xl font-extrabold text-amber-600 mt-1 block truncate" title={kpiData.bestPortal}>
            {kpiData.bestPortal}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Cost / Lead
          </span>
          <span className="text-xl font-extrabold text-purple-700 mt-1 block">
            {formatINR(kpiData.costPerLead)}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Cost / Active
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatINR(kpiData.costPerActive)}
          </span>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Filter size={16} className="text-emerald-600" />
            Job Portal Performance
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => filters.setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="text-xs bg-transparent focus:outline-none"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => filters.setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="text-xs bg-transparent focus:outline-none"
              />
            </div>

            <select
              value={filters.selectedPortal}
              onChange={(e) => filters.setSelectedPortal(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none"
            >
              <option value="ALL">All Portals</option>
              {uniquePortals.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filters.selectedCampaign}
              onChange={(e) => filters.setSelectedCampaign(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none max-w-[150px] truncate"
            >
              <option value="ALL">All Campaigns</option>
              {uniqueCampaigns.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={filters.selectedRecruiter}
              onChange={(e) => filters.setSelectedRecruiter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none max-w-[150px] truncate"
            >
              <option value="ALL">All Recruiters</option>
              {uniqueRecruiters.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5">Job Portal</th>
                <th className="p-3.5 text-right">Total Leads</th>
                <th className="p-3.5 text-right">Active Candidates</th>
                <th className="p-3.5 text-right">Conversion Ratio (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingAnalytics ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">Loading metrics...</td>
                </tr>
              ) : jobPortalMetrics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">No data available.</td>
                </tr>
              ) : (
                jobPortalMetrics.map((m) => (
                  <tr key={m.portalName} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-bold text-slate-900">{m.portalName}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                      {m.totalLeads.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                      {m.activeCandidates.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-900">
                      {m.conversionRatio.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
