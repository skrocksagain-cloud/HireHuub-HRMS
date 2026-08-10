import { useEffect, useState } from 'react';
import { ListTodo, Calendar, Clock } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { calendarRepository } from '../../../services/calendar/repositories/calendarRepository';
import type { CalendarEventItem } from '../../../types/Calendar';

export default function UpcomingTasksWidget() {
  const { canApprove } = usePermissions();
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = calendarRepository.subscribeToEvents((list) => {
      setEvents(list.slice(0, 5));
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-slate-900 dark:text-white text-xs">Upcoming Action Items & Meetings</span>
        </div>
        <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
          {events.length} Upcoming
        </span>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="p-4 text-center text-slate-400 text-xs">Loading upcoming events…</div>
        ) : events.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">No upcoming meetings or events.</div>
        ) : (
          events.map((task) => (
            <div
              key={task.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between transition"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">{task.title}</span>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Calendar size={12} /> {task.eventType}
                  </span>
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Clock size={12} /> {task.date} ({task.startTime})
                  </span>
                </div>
              </div>

              {canApprove('leave') && (
                <div className="flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold rounded">
                    Scheduled
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
