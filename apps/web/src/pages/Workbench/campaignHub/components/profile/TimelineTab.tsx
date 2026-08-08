import type { CampaignMaster, CampaignStatus } from '../../types/campaign';
import { CAMPAIGN_STATUSES } from '../../constants/campaignConstants';
import { CheckCircle2, Clock } from 'lucide-react';

interface TimelineTabProps {
  campaign: CampaignMaster;
}

export default function TimelineTab({ campaign }: TimelineTabProps) {
  const currentStatus = campaign.status;

  const getStatusStepState = (status: CampaignStatus) => {
    if (status === currentStatus) return 'active';
    const statusOrder: CampaignStatus[] = ['Draft', 'Running', 'Completed'];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(status);

    if (currentIdx !== -1 && stepIdx !== -1 && stepIdx < currentIdx) {
      return 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">
          Campaign Lifecycle Timeline
        </h3>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {CAMPAIGN_STATUSES.map((st) => {
            const stepState = getStatusStepState(st);
            const isCurrent = st === currentStatus;
            return (
              <div key={st} className="relative flex items-start gap-4">
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] font-bold transition ${
                    isCurrent
                      ? 'bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100'
                      : stepState === 'completed'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCurrent || stepState === 'completed' ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={10} />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-xs ${isCurrent ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}`}>
                      {st} Stage
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                        Current Lifecycle State
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {st === 'Draft' && 'Campaign planning, budget allocation, and collateral prep.'}
                    {st === 'Running' && 'Active ground & digital marketing acquisition in progress.'}
                    {st === 'Completed' && 'Target candidate throughput achieved and campaign closed.'}
                    {st === 'Cancelled' && 'Campaign terminated prior to completion.'}
                    {st === 'Archived' && 'Campaign archived for historical ROI compliance.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
