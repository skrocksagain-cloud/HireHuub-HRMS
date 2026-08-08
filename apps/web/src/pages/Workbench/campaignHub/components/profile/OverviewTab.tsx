import type { CampaignMaster } from '../../types/campaign';
import { formatDate } from '../../utils/campaignUtils';

interface OverviewTabProps {
  campaign: CampaignMaster;
}

export default function OverviewTab({ campaign }: OverviewTabProps) {
  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Campaign Details Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Campaign Master Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Campaign ID
            </span>
            <span className="font-mono font-bold text-slate-900 text-xs block mt-1">
              {campaign.campaignNumber}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Campaign Name
            </span>
            <span className="font-bold text-slate-900 text-xs block mt-1">
              {campaign.campaignName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Campaign Owner
            </span>
            <span className="font-semibold text-slate-800 text-xs block mt-1">
              {campaign.owner}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Campaign Type
            </span>
            <span className="font-semibold text-slate-800 text-xs block mt-1">
              {campaign.campaignType}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Campaign Source
            </span>
            <span className="font-semibold text-slate-800 text-xs block mt-1">
              {campaign.campaignSource}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Campaign Status
            </span>
            <span className="font-semibold text-emerald-700 text-xs block mt-1">
              {campaign.status}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Start Date
            </span>
            <span className="font-medium text-slate-700 text-xs block mt-1">
              {formatDate(campaign.startDate)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              End Date
            </span>
            <span className="font-medium text-slate-700 text-xs block mt-1">
              {formatDate(campaign.endDate)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
              Primary Location
            </span>
            <span className="font-medium text-slate-700 text-xs block mt-1">
              {campaign.primaryCity}, {campaign.primaryState} ({campaign.primaryArea})
            </span>
          </div>
        </div>
      </div>

      {/* Online / Offline Specifics */}
      {campaign.campaignType === 'Online' && campaign.onlineDetails && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Online Campaign Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 font-semibold text-[10px] block">Ad Platform / Channel</span>
              <span className="font-semibold text-slate-800 text-xs mt-1 block">
                {campaign.onlineDetails.platform}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold text-[10px] block">Campaign Target URL</span>
              <a
                href={campaign.onlineDetails.campaignUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-600 hover:underline text-xs mt-1 block truncate"
              >
                {campaign.onlineDetails.campaignUrl || 'N/A'}
              </a>
            </div>
          </div>
        </div>
      )}

      {campaign.campaignType === 'Offline' && campaign.offlineDetails && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Offline Print & Ground Material Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-slate-400 font-semibold text-[10px] block">Material Type</span>
              <span className="font-semibold text-slate-800 text-xs mt-1 block">
                {campaign.offlineDetails.materialType}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold text-[10px] block">Vendor / Printing Agency</span>
              <span className="font-semibold text-slate-800 text-xs mt-1 block">
                {campaign.offlineDetails.vendor || 'In-House'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold text-[10px] block">Quantity Distributed</span>
              <span className="font-semibold text-slate-800 text-xs mt-1 block">
                {(campaign.offlineDetails.quantity || 0).toLocaleString('en-IN')} units
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Description & Marketing Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <h4 className="font-bold text-slate-900 text-xs">Campaign Description</h4>
          <p className="text-slate-600 leading-relaxed text-xs">
            {campaign.description || 'No detailed description provided for this campaign.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
          <h4 className="font-bold text-slate-900 text-xs">Marketing Strategy Notes</h4>
          <p className="text-slate-600 leading-relaxed text-xs">
            {campaign.marketingNotes || 'Standard marketing strategy executed.'}
          </p>
        </div>
      </div>

      {/* Campaign Outcome */}
      <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200/80 shadow-xs space-y-2">
        <h4 className="font-bold text-emerald-900 text-xs">Campaign Outcome & Performance Summary</h4>
        <p className="text-emerald-800 font-medium leading-relaxed text-xs">
          {campaign.campaignOutcome || 'Campaign execution is ongoing.'}
        </p>
      </div>
    </div>
  );
}
