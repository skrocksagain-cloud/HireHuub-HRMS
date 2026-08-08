import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface CareerJourneyTabProps {
  candidate: Candidate;
}

export default function CareerJourneyTab({ candidate }: CareerJourneyTabProps) {
  const steps = [
    {
      stage: 'Lead Created',
      completed: true,
      date: new Date(candidate.createdAt).toLocaleDateString(),
      details: `Source: ${candidate.source.category}`,
    },
    {
      stage: 'Interested',
      completed: ['Interested', 'Line Up', 'Active'].includes(candidate.status) || candidate.placementHistory.length > 0,
      date: candidate.createdAt.split('T')[0],
      details: 'Candidate screened and interested',
    },
    {
      stage: 'Interview',
      completed: ['Line Up', 'Active'].includes(candidate.status) || candidate.placementHistory.length > 0,
      date: candidate.interviewDate || '—',
      details: candidate.currentClientName ? `Interview with ${candidate.currentClientName}` : 'Line up phase',
    },
    {
      stage: 'Joined',
      completed: candidate.status === 'Active' || candidate.placementHistory.length > 0,
      date: candidate.activeDate || '—',
      details: candidate.currentPlacement ? `Joined ${candidate.currentPlacement.clientName}` : 'Placement active',
    },
    {
      stage: 'Client Change',
      completed: candidate.placementHistory.length > 1,
      date: candidate.placementHistory[1]?.activeDate || '—',
      details: candidate.placementHistory.length > 1 ? `Moved to ${candidate.placementHistory[0]?.clientName}` : 'Multiple client tenure',
    },
    {
      stage: 'Rejoined',
      completed: candidate.placementHistory.length > 2,
      date: '—',
      details: 'Lifetime candidate relationship',
    },
  ];

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
          Visual Lifetime Career Journey
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">One Candidate = One Lifetime Profile</span>
      </div>

      {/* Visual Timeline Pipeline Horizontal Nodes */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          {steps.map((stg, i) => (
            <div key={stg.stage} className="flex-1 flex flex-col items-center text-center relative z-10">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold mb-2 transition ${
                  stg.completed ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {stg.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </div>

              <span className={`font-bold text-xs ${stg.completed ? 'text-emerald-900' : 'text-slate-500'}`}>
                {stg.stage}
              </span>

              <span className="text-[10px] font-mono text-slate-400 mt-0.5">{stg.date}</span>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[120px]">{stg.details}</p>

              {i < steps.length - 1 && (
                <ArrowRight size={14} className="hidden sm:block absolute -right-3 top-3 text-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
