import { Calendar, Clock } from 'lucide-react';
import type { DashboardCalendarEvent } from '../../../services/dashboard/repositories/dashboardRepository';

interface MiniCalendarWidgetProps {
  events: DashboardCalendarEvent[];
}

export default function MiniCalendarWidget({ events }: MiniCalendarWidgetProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-cyan-600" />
          <span className="font-bold text-slate-900 text-xs">Mini Enterprise Calendar</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Today & Tomorrow</span>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">
            No upcoming events
          </div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 text-[10px] font-bold">
                  {evt.type}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-cyan-700 font-semibold">
                  <Clock size={12} /> {evt.date}, {evt.startTime}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{evt.visibility} Scope</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
