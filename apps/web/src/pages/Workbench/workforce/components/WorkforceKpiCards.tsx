import {
  Users,
  Briefcase,
  UserCheck,
  UserX,
  Package,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import KpiCard from '../../../../ui/KpiCard';
import type { WorkforceKpiSummary } from '../types/workforce';

interface WorkforceKpiCardsProps {
  summary: WorkforceKpiSummary;
  userRole: string;
}

export default function WorkforceKpiCards({ summary, userRole }: WorkforceKpiCardsProps) {
  const isFinanceOrAdmin = userRole === 'Finance' || userRole === 'Super Admin';

  return (
    <div className="space-y-4">
      {/* Primary KPI Metrics - Visible to Everyone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          metric={{
            id: 'active-wf',
            title: 'Active Workforce',
            value: summary.activeWorkforce.toString(),
            change: 'Single Source',
            trend: 'up',
            subtext: 'Operational Active Master',
            category: 'invoices',
          }}
          icon={<Users size={20} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />

        <KpiCard
          metric={{
            id: 'payroll-wf',
            title: 'Payroll Candidates',
            value: summary.payrollCount.toString(),
            change: 'Monthly Payout',
            trend: 'neutral',
            subtext: 'Client Employee ID tracking',
            category: 'invoices',
          }}
          icon={<Briefcase size={20} className="text-teal-600" />}
          badgeBg="bg-teal-50 text-teal-700 border-teal-200"
        />

        <KpiCard
          metric={{
            id: 'ots-wf',
            title: 'OTS Candidates',
            value: summary.otsCount.toString(),
            change: 'Settlement',
            trend: 'neutral',
            subtext: 'Auto Tenure & Eligibility',
            category: 'invoices',
          }}
          icon={<Briefcase size={20} className="text-purple-600" />}
          badgeBg="bg-purple-50 text-purple-700 border-purple-200"
        />

        <KpiCard
          metric={{
            id: 'working-wf',
            title: 'Working',
            value: summary.workingCount.toString(),
            change: 'Payout Verified',
            trend: 'up',
            subtext: 'From Client Payout Import',
            category: 'invoices',
          }}
          icon={<UserCheck size={20} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />

        <KpiCard
          metric={{
            id: 'not-working-wf',
            title: 'Not Working',
            value: summary.notWorkingCount.toString(),
            change: 'Unmatched',
            trend: 'down',
            subtext: 'No payout record this month',
            category: 'invoices',
          }}
          icon={<UserX size={20} className="text-rose-600" />}
          badgeBg="bg-rose-50 text-rose-700 border-rose-200"
        />
      </div>

      {/* Conditional Cards: Order Data Metrics & Finance Billing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Order Data Cards: Hidden automatically for clients like Elastic Run */}
        {summary.hasOrderData ? (
          <>
            <KpiCard
              metric={{
                id: 'total-orders',
                title: 'Total Orders',
                value: (summary.totalOrders || 0).toLocaleString('en-IN'),
                change: 'Trip Metrics',
                trend: 'up',
                subtext: 'Aggregated monthly orders',
                category: 'invoices',
              }}
              icon={<Package size={20} className="text-blue-600" />}
              badgeBg="bg-blue-50 text-blue-700 border-blue-200"
            />
            <KpiCard
              metric={{
                id: 'avg-orders',
                title: 'Average Orders',
                value: (summary.averageOrders || 0).toLocaleString('en-IN'),
                change: 'Per Working Candidate',
                trend: 'neutral',
                subtext: 'Monthly average trips',
                category: 'invoices',
              }}
              icon={<TrendingUp size={20} className="text-amber-600" />}
              badgeBg="bg-amber-50 text-amber-700 border-amber-200"
            />
            <KpiCard
              metric={{
                id: 'top-performer',
                title: 'Top Performer',
                value: summary.topPerformerName || 'N/A',
                change: 'Rank #1',
                trend: 'up',
                subtext: 'Highest orders this month',
                category: 'invoices',
              }}
              icon={<Award size={20} className="text-indigo-600" />}
              badgeBg="bg-indigo-50 text-indigo-700 border-indigo-200"
            />
          </>
        ) : null}

        {/* Finance & Super Admin Only: Billing KPI Cards */}
        {isFinanceOrAdmin && (
          <>
            <KpiCard
              metric={{
                id: 'eligible-billing',
                title: 'Eligible for Billing',
                value: summary.eligibleForBilling.toString(),
                change: 'OTS Verified',
                trend: 'up',
                subtext: 'Tenure requirement reached',
                category: 'invoices',
              }}
              icon={<CheckCircle2 size={20} className="text-emerald-600" />}
              badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
            />
            <KpiCard
              metric={{
                id: 'pending-billing',
                title: 'Pending Billing',
                value: summary.pendingBilling.toString(),
                change: 'Action Required',
                trend: 'neutral',
                subtext: 'Eligible OTS pending billing',
                category: 'invoices',
              }}
              icon={<Clock size={20} className="text-amber-600" />}
              badgeBg="bg-amber-50 text-amber-700 border-amber-200"
            />
          </>
        )}
      </div>
    </div>
  );
}
