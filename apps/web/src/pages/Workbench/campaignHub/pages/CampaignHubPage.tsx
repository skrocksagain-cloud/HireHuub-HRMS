import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Archive,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

import DashboardLayout from '../../../../layouts/DashboardLayout';
import PageHeader from '../../../../ui/PageHeader';
import StatusBadge from '../../../../ui/StatusBadge';
import CreateCampaignDrawer from '../components/CreateCampaignDrawer';
import { useCampaigns } from '../hooks/useCampaigns';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../utils/campaignUtils';
import { CAMPAIGN_SOURCES } from '../constants/campaignConstants';

export default function CampaignHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';

  const { campaigns, loading, canAccess, createCampaign, archiveCampaign } = useCampaigns(currentRole);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');

  // Filtering Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.campaignNumber.toLowerCase().includes(q) ||
        c.campaignName.toLowerCase().includes(q) ||
        c.owner.toLowerCase().includes(q) ||
        c.primaryCity.toLowerCase().includes(q) ||
        c.primaryArea.toLowerCase().includes(q) ||
        c.campaignSource.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q);

      const matchesType = typeFilter === 'ALL' || c.campaignType === typeFilter;
      const matchesSource = sourceFilter === 'ALL' || c.campaignSource === sourceFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesCity = cityFilter === 'ALL' || c.primaryCity === cityFilter;

      return matchesQuery && matchesType && matchesSource && matchesStatus && matchesCity;
    });
  }, [campaigns, searchQuery, typeFilter, sourceFilter, statusFilter, cityFilter]);

  // Unique Cities list for filter
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach((c) => {
      if (c.primaryCity) set.add(c.primaryCity);
    });
    return Array.from(set);
  }, [campaigns]);

  // Aggregate KPI Calculations
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'Running').length;
  const totalLeads = campaigns.reduce((acc, c) => acc + (c.actualLeads || 0), 0);
  const totalJoins = campaigns.reduce((acc, c) => acc + (c.actualJoins || 0), 0);
  const avgConversion = totalLeads > 0 ? Number(((totalJoins / totalLeads) * 100).toFixed(1)) : 0;
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.actualSpend || 0), 0);
  const avgCostPerJoin = totalJoins > 0 ? Math.round(totalSpend / totalJoins) : 0;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Access Restricted View for unauthorized roles
  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200 shadow-xs">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Access Restricted — Campaign Hub</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Campaign Hub access is restricted to authorized <strong className="text-slate-900">Marketing</strong> and <strong className="text-slate-900">Super Admin</strong> personnel only. Please contact system administration if you require access.
            </p>
          </div>
          <div className="pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700">
        {/* Success Alert */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <span className="font-semibold">{actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="text-emerald-600 font-bold text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Campaign Hub"
            description="Marketing Intelligence & Campaign Performance Platform"
          />

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs text-xs shrink-0 self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>+ New Campaign</span>
          </button>
        </div>

        {/* 6 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Campaigns
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">{totalCampaigns}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Campaigns
            </span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{activeCampaigns}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Candidates Gen.
            </span>
            <span className="text-xl font-extrabold text-blue-700 mt-1 block">
              {totalLeads.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Conversion %
            </span>
            <span className="text-xl font-extrabold text-indigo-700 mt-1 block">{avgConversion}%</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Cost / Join
            </span>
            <span className="text-xl font-extrabold text-purple-700 mt-1 block">
              {formatINR(avgCostPerJoin)}
            </span>
          </div>

          {/* ORBIT Retention Future Ready Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider block">
                ORBIT Retention
              </span>
              <Sparkles className="text-amber-400" size={14} />
            </div>
            <span className="text-xs font-extrabold text-amber-300 block mt-1">Future Ready</span>
            <span className="text-[9px] text-indigo-300 block mt-1">Engine Prepared</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search by ID (HHCMP000001), name, source, owner, city, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              {CAMPAIGN_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none"
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Campaign Master Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs">Campaign Master Register</h3>
            <span className="text-[10px] font-semibold text-slate-400">
              Showing {filteredCampaigns.length} of {campaigns.length} campaigns
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3.5">Campaign ID</th>
                  <th className="p-3.5">Campaign Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Source</th>
                  <th className="p-3.5">Owner</th>
                  <th className="p-3.5">City</th>
                  <th className="p-3.5">Area</th>
                  <th className="p-3.5 text-right">Budget (₹)</th>
                  <th className="p-3.5 text-right">Leads</th>
                  <th className="p-3.5 text-right">Joined</th>
                  <th className="p-3.5 text-right">Conversion %</th>
                  <th className="p-3.5 text-right">CPL (₹)</th>
                  <th className="p-3.5 text-right">CPJ (₹)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-slate-400">
                      Loading Campaign Master data...
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-slate-400">
                      No campaigns found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{c.campaignNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900">{c.campaignName}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{c.campaignType}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{c.campaignSource}</td>
                      <td className="p-3.5 font-medium text-slate-800">{c.owner}</td>
                      <td className="p-3.5 text-slate-700">{c.primaryCity}</td>
                      <td className="p-3.5 text-slate-700">{c.primaryArea}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(c.plannedBudget)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                        {c.actualLeads.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                        {c.actualJoins.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900">{c.conversionRate}%</td>
                      <td className="p-3.5 text-right font-mono text-purple-700">{formatINR(c.costPerLead)}</td>
                      <td className="p-3.5 text-right font-mono text-indigo-700">{formatINR(c.costPerJoin)}</td>
                      <td className="p-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/workbench/campaign-hub/${c.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition text-[11px]"
                          >
                            <Eye size={13} />
                            <span>View Profile</span>
                          </button>

                          {c.status !== 'Archived' && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Archive campaign ${c.campaignNumber}?`)) {
                                  await archiveCampaign(c.id, user?.name || 'Admin');
                                  setActionSuccess(`Campaign ${c.campaignNumber} archived.`);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Archive Campaign"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Campaign Drawer */}
      <CreateCampaignDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={async (input) => {
          await createCampaign(input, user?.name || 'Marketing Specialist');
          setActionSuccess('New Campaign Master record created successfully.');
        }}
        creatorName={user?.name || 'Marketing Specialist'}
      />
    </DashboardLayout>
  );
}
