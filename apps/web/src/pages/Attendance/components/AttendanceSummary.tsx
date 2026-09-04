import {
  UserCheck,
  Briefcase,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Moon,
} from 'lucide-react';
import type { AttendanceMonthSummary } from '../utils/attendanceResolutionEngine';

interface Props {
  summary: AttendanceMonthSummary;
}

export const AttendanceSummary = ({ summary }: Props) => {
  const cards = [
    {
      label: 'Present Days',
      value: summary.presentDays,
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      label: 'WFH Days',
      value: summary.wfhDays,
      icon: Briefcase,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
    },
    {
      label: 'Leave Days',
      value: summary.leaveDays,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    {
      label: 'Holidays',
      value: summary.holidays,
      icon: Calendar,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    {
      label: 'Week Offs',
      value: summary.weekOffs,
      icon: Moon,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    {
      label: 'Late Days',
      value: summary.lateDays,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'Regularized Days',
      value: summary.regularizedDays,
      icon: CheckCircle2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      label: 'Absent Days',
      value: summary.absentDays,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 bg-white shadow-xs flex items-center justify-between transition hover:shadow-md ${card.border}`}
          >
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{card.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <IconComponent size={20} className={card.color} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
