import { Clock } from 'lucide-react';
import Timeline from '../../../ui/Timeline';

type ActivityCategory = 'Finance' | 'Network' | 'Management' | 'Employee' | 'Client';

interface RecentActivityTimelineProps {
  activities: { id: string; title: string; description: string; timestamp: string; category: string }[];
}

export default function RecentActivityTimeline({ activities }: RecentActivityTimelineProps) {
  const defaultActivities = [
    {
      id: 'act-1',
      title: 'New Client Onboarded',
      description: 'Acme Tech Solutions registered in Workbench Network',
      timestamp: '25 mins ago',
      category: 'Client' as ActivityCategory,
    },
    {
      id: 'act-2',
      title: 'Invoice #HH2026-0004 Generated',
      description: 'Monthly staffing bill generated for Apex Systems (₹3.4L)',
      timestamp: '1 hour ago',
      category: 'Finance' as ActivityCategory,
    },
    {
      id: 'act-3',
      title: 'Offer Letter Released',
      description: 'Offer sent to Senior Frontend Engineer candidate',
      timestamp: '3 hours ago',
      category: 'Employee' as ActivityCategory,
    },
    {
      id: 'act-4',
      title: 'Casual Leave Approved',
      description: 'Leave approved for Amit Kumar (2 Days)',
      timestamp: '5 hours ago',
      category: 'Employee' as ActivityCategory,
    },
  ];

  const rawList = activities.length > 0 ? activities : defaultActivities;
  const list = rawList.map((a) => ({
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

      <Timeline items={list} />
    </div>
  );
}
