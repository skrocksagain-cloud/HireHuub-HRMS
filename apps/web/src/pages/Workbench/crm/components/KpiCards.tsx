import {
  Users,
  CalendarCheck,
  UserCheck,
  PhoneCall,
  Heart,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type { KpiSummary } from '../services/crmService';

interface KpiCardsProps {
  summary: KpiSummary;
  activeQuickFilter: string;
  onFilterSelect: (filterKey: any) => void;
}

export default function KpiCards({ summary, activeQuickFilter, onFilterSelect }: KpiCardsProps) {
  const cards = [
    {
      key: 'Assigned',
      title: 'Assigned Candidates',
      value: summary.assignedCandidates,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      key: "Today's Follow Up",
      title: "Today's Follow Up",
      value: summary.todaysFollowUp,
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      key: "Today's Interview",
      title: "Today's Line Up",
      value: summary.todaysLineUp,
      icon: UserCheck,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      key: 'Calls Today',
      title: 'Calls Today',
      value: summary.callsToday,
      icon: PhoneCall,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'Interested',
      title: 'Interested',
      value: summary.interested,
      icon: Heart,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      key: 'Active',
      title: 'Active This Month',
      value: summary.activeThisMonth,
      icon: CheckCircle2,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      key: 'Call Back Later',
      title: 'Call Back Later',
      value: summary.callBackLater,
      icon: Clock,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      key: 'Overdue',
      title: 'Overdue Follow Up',
      value: summary.overdueFollowUp,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-700 border-red-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeQuickFilter === card.key;
        return (
          <button
            key={card.title}
            type="button"
            onClick={() => onFilterSelect(card.key)}
            className={`p-3 rounded-2xl border text-left transition hover:shadow-sm cursor-pointer ${card.color} ${
              isActive ? 'ring-2 ring-emerald-600 font-bold shadow-xs' : 'opacity-90 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 truncate">{card.title}</span>
              <Icon size={14} className="shrink-0" />
            </div>
            <div className="text-lg font-bold mt-1 tracking-tight">{card.value}</div>
          </button>
        );
      })}

      {/* Additional Card (Team Lead and Above) */}
      {summary.waitingForUpdate !== undefined && (
        <div className="p-3 rounded-2xl border border-slate-300 bg-slate-100 text-slate-800 text-left shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 truncate">Waiting for Update</span>
            <HelpCircle size={14} className="text-slate-500 shrink-0" />
          </div>
          <div className="text-lg font-bold mt-1 tracking-tight">{summary.waitingForUpdate}</div>
        </div>
      )}
    </div>
  );
}
