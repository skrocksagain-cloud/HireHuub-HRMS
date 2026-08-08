import { ListOrdered, AlertTriangle, Calendar, UserCheck, Sparkles, ChevronRight, PhoneCall } from 'lucide-react';
import type { Candidate } from '../types/crm';

interface TodaysWorkQueueProps {
  queue: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onQuickUpdate: (candidate: Candidate) => void;
}

export default function TodaysWorkQueue({ queue, onSelectCandidate, onQuickUpdate }: TodaysWorkQueueProps) {
  const today = new Date().toISOString().split('T')[0];

  const getPriorityBadge = (c: Candidate) => {
    if (c.followUpDate && c.followUpDate < today && c.status !== 'Active' && c.status !== 'Inactive') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
          <AlertTriangle size={10} /> Overdue
        </span>
      );
    }
    if (c.followUpDate === today) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <Calendar size={10} /> Today's Follow Up
        </span>
      );
    }
    if (c.interviewDate === today && c.status === 'Line Up') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
          <UserCheck size={10} /> Today's Interview
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
        <Sparkles size={10} /> New Assignment
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <ListOrdered size={18} className="text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-sm">Today's Work Queue</h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full">
            {queue.length} Tasks
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Priority: Overdue → Follow Up → Interview → New Lead</span>
      </div>

      {queue.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs italic">
          No pending items in today's work queue. Great job!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {queue.slice(0, 8).map((cand) => (
            <div
              key={cand.id}
              className="p-3 border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-xs transition bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  {getPriorityBadge(cand)}
                  <span className="text-[10px] font-mono text-slate-400">{cand.id}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectCandidate(cand)}
                  className="font-bold text-slate-800 text-xs hover:text-emerald-600 transition flex items-center gap-1 text-left w-full cursor-pointer"
                >
                  {cand.name} <ChevronRight size={12} className="text-slate-400" />
                </button>

                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {cand.role} • {cand.phone}
                </p>

                {cand.currentClientName && (
                  <p className="text-[11px] font-medium text-emerald-700 mt-1">Client: {cand.currentClientName}</p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Recruiter: {cand.assignedRecruiterName.split(' ')[0]}</span>
                <button
                  type="button"
                  onClick={() => onQuickUpdate(cand)}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <PhoneCall size={10} /> Quick Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
