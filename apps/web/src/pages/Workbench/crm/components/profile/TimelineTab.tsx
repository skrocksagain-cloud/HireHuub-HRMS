import { Clock, PhoneCall, Building2, Calendar } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface TimelineTabProps {
  candidate: Candidate;
}

export default function TimelineTab({ candidate }: TimelineTabProps) {
  const timeline = candidate.interactionTimeline || [];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={16} className="text-emerald-600" /> Interaction Timeline Log ({timeline.length} Records)
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Immutable audit trail of recruiter interactions</span>
      </div>

      {timeline.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No timeline entries available.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timeline.map((entry) => (
            <div key={entry.id} className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="absolute -left-[23px] top-4.5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-white" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {entry.status}
                  </span>
                  {entry.clientName && (
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" /> {entry.clientName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-sans">{entry.notes}</p>

              {entry.issueDescription && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  <strong>Issue Description:</strong> {entry.issueDescription}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-500">
                  <PhoneCall size={10} className="text-emerald-600" /> Recorded by {entry.recruiterName}
                </span>
                {entry.followUpDate && (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Calendar size={10} /> Next Follow Up: {entry.followUpDate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
