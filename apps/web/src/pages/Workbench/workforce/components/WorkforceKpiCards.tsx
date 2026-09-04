import { Users, Briefcase, Clock } from 'lucide-react';
import KpiCard from '../../../../ui/KpiCard';
import type { WorkforceKpiSummary } from '../types/workforce';

interface WorkforceKpiCardsProps {
  summary: WorkforceKpiSummary;
}

export default function WorkforceKpiCards({ summary }: WorkforceKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        metric={{
          id: 'active-wf',
          title: 'Total Active',
          value: summary.activeWorkforce.toString(),
          change: 'Single Source',
          trend: 'up',
          subtext: 'All Active Candidates',
          category: 'invoices',
        }}
        icon={<Users size={20} className="text-emerald-600" />}
        badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
      />

      <KpiCard
        metric={{
          id: 'payroll-wf',
          title: 'Total Active Payroll',
          value: summary.payrollCount.toString(),
          change: 'Payroll',
          trend: 'neutral',
          subtext: 'Payroll Candidates',
          category: 'invoices',
        }}
        icon={<Briefcase size={20} className="text-teal-600" />}
        badgeBg="bg-teal-50 text-teal-700 border-teal-200"
      />

      <KpiCard
        metric={{
          id: 'ots-wf',
          title: 'Total Active OTS',
          value: summary.otsCount.toString(),
          change: 'OTS',
          trend: 'neutral',
          subtext: 'OTS Candidates',
          category: 'invoices',
        }}
        icon={<Briefcase size={20} className="text-purple-600" />}
        badgeBg="bg-purple-50 text-purple-700 border-purple-200"
      />

      <KpiCard
        metric={{
          id: 'last-month-working',
          title: 'Last Month Working',
          value: summary.lastMonthWorkingCount.toString(),
          change: 'Previous Month',
          trend: 'up',
          subtext: 'Historical payroll working count',
          category: 'invoices',
        }}
        icon={<Clock size={20} className="text-emerald-600" />}
        badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
      />

      <KpiCard
        metric={{
          id: 'rank-1',
          title: 'Payroll Rank #1',
          value: summary.topPerformerName?.split('\n')[0] || 'None',
          change: summary.topPerformerName ? summary.topPerformerName.split('\n')[1] : '0 Orders',
          trend: 'up',
          subtext: 'Highest Orders',
          category: 'invoices',
        }}
        icon={<Users size={20} className="text-blue-600" />}
        badgeBg="bg-blue-50 text-blue-700 border-blue-200"
      />
    </div>
  );
}
