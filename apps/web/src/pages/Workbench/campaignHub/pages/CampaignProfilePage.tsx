import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Download,
  Layers,
  MapPin,
  Share2,
  FileText,
  Clock,
  History as HistoryIcon,
  TrendingUp,
} from 'lucide-react';

import DashboardLayout from '../../../../layouts/DashboardLayout';
import StatusBadge from '../../../../ui/StatusBadge';
import { useCampaignProfile } from '../hooks/useCampaigns';
import { formatINR } from '../utils/campaignUtils';

import OverviewTab from '../components/profile/OverviewTab';
import PerformanceTab from '../components/profile/PerformanceTab';
import RoiTab from '../components/profile/RoiTab';
import LocationsTab from '../components/profile/LocationsTab';
import SourceAnalyticsTab from '../components/profile/SourceAnalyticsTab';
import AttachmentsTab from '../components/profile/AttachmentsTab';
import TimelineTab from '../components/profile/TimelineTab';
import AuditHistoryTab from '../components/profile/AuditHistoryTab';

type ProfileTab =
  | 'overview'
  | 'performance'
  | 'roi'
  | 'locations'
  | 'sourceAnalytics'
  | 'attachments'
  | 'timeline'
  | 'audit';

export default function CampaignProfilePage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { campaign, loading, error } = useCampaignProfile(campaignId);

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs">Loading Campaign Master Profile...</div>
      </DashboardLayout>
    );
  }

  if (error || !campaign) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-lg mx-auto text-center space-y-4">
          <p className="text-red-600 font-bold text-xs">{error || 'Campaign Profile Not Found'}</p>
          <button
            onClick={() => navigate('/workbench/campaign-hub')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            <ArrowLeft size={14} /> Back to Campaign Hub
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700">
        {/* Navigation Back Link */}
        <button
          type="button"
          onClick={() => navigate('/workbench/campaign-hub')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Campaign Hub Register</span>
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{campaign.campaignName}</h1>
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg">
                  {campaign.campaignNumber}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={campaign.status} />
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {campaign.campaignType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {campaign.campaignSource}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 font-medium">Owner: {campaign.owner}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition text-xs"
              >
                <Download size={14} />
                <span>Export Report</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition text-xs shadow-xs"
              >
                <Edit2 size={14} />
                <span>Edit Campaign</span>
              </button>
            </div>
          </div>

          {/* 10 Summary Cards (Planned vs Actual) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Planned Budget</span>
              <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                {formatINR(campaign.plannedBudget)}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Actual Spend</span>
              <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
                {formatINR(campaign.actualSpend)}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Exp. Leads</span>
              <span className="text-xs font-extrabold text-blue-700 mt-0.5 block">
                {campaign.expectedLeads.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Actual Leads</span>
              <span className="text-xs font-extrabold text-blue-700 mt-0.5 block">
                {campaign.actualLeads.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Exp. Joins</span>
              <span className="text-xs font-extrabold text-emerald-700 mt-0.5 block">
                {campaign.expectedJoins.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Actual Joins</span>
              <span className="text-xs font-extrabold text-emerald-700 mt-0.5 block">
                {campaign.actualJoins.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Conv. %</span>
              <span className="text-xs font-extrabold text-indigo-700 mt-0.5 block">
                {campaign.conversionRate}%
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Cost / Lead</span>
              <span className="text-xs font-extrabold text-purple-700 mt-0.5 block">
                {formatINR(campaign.costPerLead)}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Cost / Join</span>
              <span className="text-xs font-extrabold text-indigo-700 mt-0.5 block">
                {formatINR(campaign.costPerJoin)}
              </span>
            </div>

            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80">
              <span className="text-[9px] font-bold text-emerald-800 uppercase block">Outcome</span>
              <span className="text-[10px] font-extrabold text-emerald-900 mt-0.5 block truncate">
                Target Met
              </span>
            </div>
          </div>
        </div>

        {/* 8 Dedicated Profile Tabs Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs overflow-x-auto">
          <div className="flex items-center gap-1 whitespace-nowrap min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>1. Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'performance'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers size={13} />
              <span>2. Performance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'roi'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp size={13} />
              <span>3. ROI & Efficiency</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('locations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'locations'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin size={13} />
              <span>4. Locations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sourceAnalytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'sourceAnalytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Share2 size={13} />
              <span>5. Source Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'attachments'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText size={13} />
              <span>6. Attachments ({campaign.documentIds?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock size={13} />
              <span>7. Timeline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HistoryIcon size={13} />
              <span>8. Audit History</span>
            </button>
          </div>
        </div>

        {/* Profile Tab Content */}
        {activeTab === 'overview' && <OverviewTab campaign={campaign} />}
        {activeTab === 'performance' && <PerformanceTab campaign={campaign} />}
        {activeTab === 'roi' && <RoiTab campaign={campaign} />}
        {activeTab === 'locations' && <LocationsTab campaign={campaign} />}
        {activeTab === 'sourceAnalytics' && <SourceAnalyticsTab campaign={campaign} />}
        {activeTab === 'attachments' && <AttachmentsTab campaign={campaign} />}
        {activeTab === 'timeline' && <TimelineTab campaign={campaign} />}
        {activeTab === 'audit' && <AuditHistoryTab campaign={campaign} />}
      </div>
    </DashboardLayout>
  );
}
