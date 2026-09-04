import { Clock } from 'lucide-react';
import Timeline from '../../../ui/Timeline';

type ActivityCategory = 'Finance' | 'Network' | 'Management' | 'Employee' | 'Client';

interface RecentActivityTimelineProps {
  activities: { id: string; title: string; description: string; timestamp: string; category: string }[];
}

export default function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  const list = activities.map((a) => ({
    ...a,
    category: (['Finance', 'Network', 'Management', 'Employee', 'Client'].includes(a.category)
      ? a.category
      : 'Management') as ActivityCategory,
  }));

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-slate-700" />
          <span className="font-bold text-slate-900 text-xs">Permission-Filtered Recent Activity Log</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Live Audit Feed</span>
      </div>

      {list.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">
          No activity available.
        </div>
      ) : (
        <Timeline items={list} />
      )}
    </div>
  );
}
