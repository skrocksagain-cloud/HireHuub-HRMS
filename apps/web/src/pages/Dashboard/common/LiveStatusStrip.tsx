import { Users, CalendarCheck, CalendarOff, Video, Gift, CheckCircle2 } from 'lucide-react';

interface LiveStatusStripProps {
  metrics?: {
    workingToday: number;
    present: number;
    onLeave: number;
    meetingsToday: number;
    birthdays: number;
    pendingApprovals: number;
  };
}

export default function LiveStatusStrip({ metrics }: LiveStatusStripProps) {
  const data = metrics || {
    workingToday: 0,
    present: 0,
    onLeave: 0,
    meetingsToday: 0,
    birthdays: 0,
    pendingApprovals: 0,
  };

  return (
    <div className="bg-slate-900 text-slate-300 rounded-2xl p-3 px-5 border border-slate-800 flex items-center justify-between overflow-x-auto text-xs font-mono shadow-md">
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-emerald-400" />
          <span>Working Today: <strong className="text-white">{data.workingToday}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarCheck size={14} className="text-teal-400" />
          <span>Present: <strong className="text-emerald-400">{data.present}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarOff size={14} className="text-amber-400" />
          <span>On Leave: <strong className="text-amber-300">{data.onLeave}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Video size={14} className="text-cyan-400" />
          <span>Meetings Today: <strong className="text-white">{data.meetingsToday}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Gift size={14} className="text-rose-400" />
          <span>Birthdays: <strong className="text-rose-300">{data.birthdays}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-indigo-400" />
          <span>Pending Approvals: <strong className="text-amber-400">{data.pendingApprovals}</strong></span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold shrink-0 ml-4">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        LIVE SYNC
      </div>
    </div>
  );
}
