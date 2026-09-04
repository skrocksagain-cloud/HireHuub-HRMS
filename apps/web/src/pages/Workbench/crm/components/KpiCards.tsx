import {
  Users,
  CalendarCheck,
  UserCheck,
  PhoneCall,
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
      key: 'Calls Today',
      title: 'Today\'s Calls',
      value: summary.callsToday,
      icon: PhoneCall,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: "Today's Interview",
      title: "Today's Line Up",
      value: summary.todaysLineUp,
      icon: UserCheck,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      key: "Today's Follow Up",
      title: "Today's Follow Up",
      value: summary.todaysFollowUp,
      icon: CalendarCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      key: 'New Leads',
      title: 'New Leads',
      value: summary.newLeads,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
    </div>
  );
}
