import { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { getSimplifiedModuleScope } from '../../core/authorization/authorizationResolver';
import DashboardLayout from '../../layouts/DashboardLayout';
import SectionHeader from '../../ui/SectionHeader';
import KpiCard from '../../ui/KpiCard';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable/types';
import { LeaveApprovalQueue } from './components/LeaveApprovalQueue';
import { LeaveApplicationForm } from './components/LeaveApplicationForm';
import { LeaveBalances } from './components/LeaveBalances';
import { LeaveCalendar } from './components/LeaveCalendar';
import { LeaveCancellationList } from './components/LeaveCancellationList';
import { LEAVE_STATUS_STYLES } from './constants/leave';
import { useLeave } from './hooks/useLeave';
import type { LeaveActor, LeaveRequest, LeaveStatus } from './types/leave';
import { Calendar, Clock, Award, CheckCircle2, RefreshCw } from 'lucide-react';

const columns: DataTableColumn<LeaveRequest>[] = [
  { key: 'employeeName', title: 'Employee Name', sortable: true },
  { key: 'leaveType', title: 'Leave Type', sortable: true },
  { key: 'startDate', title: 'Start Date', sortable: true },
  { key: 'endDate', title: 'End Date', sortable: true },
  { key: 'days', title: 'Days', sortable: true },
  { key: 'reason', title: 'Reason', sortable: false },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (value) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${LEAVE_STATUS_STYLES[value as LeaveStatus] || 'bg-slate-100 text-slate-800'}`}>
        {String(value)}
      </span>
    ),
  },
];

const exportCsv = (requests: LeaveRequest[]): void => {
  if (!requests || requests.length === 0) return;
  const rows = [
    ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'],
    ...requests.map((request) => [
      request.employeeName,
      request.leaveType,
      request.startDate,
      request.endDate,
      String(request.days),
      request.reason,
      request.status,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')], {
      type: 'text/csv',
    })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leave-history-report.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const exportPdf = (requests: LeaveRequest[]): void => {
  if (!requests || requests.length === 0) return;
  const report = new jsPDF();
  report.setFontSize(16);
  report.text('HireHuub Leave History Report', 14, 18);
  report.setFontSize(9);
  requests.slice(0, 30).forEach((request, index) =>
    report.text(
      `${request.employeeName} | ${request.leaveType} | ${request.startDate} - ${request.endDate} | ${request.status}`,
      14,
      30 + index * 7
    )
  );
  report.save('leave-history-report.pdf');
};

export default function LeavePage() {
  const { user } = useAuth();

  // Stable memoized LeaveActor to prevent infinite refresh cycles
  const actor: LeaveActor & { assignedRole?: string } = useMemo(
    () => ({
      employeeId: user?.employeeId || user?.id || '',
      name: user?.name || '',
      role: user?.role || '',
      department: user?.department || '',
      assignedRole: (user as any)?.authorization?.role || user?.assignedRole,
    }),
    [user?.employeeId, user?.id, user?.name, user?.role, user?.department, user?.assignedRole, (user as any)?.authorization?.role]
  );

  const leave = useLeave(actor);
  const scope = getSimplifiedModuleScope(actor.assignedRole);
  const canApprove = scope === 'GLOBAL' || scope === 'DEPARTMENT';

  const totalRemaining = leave.data.balances.reduce((acc, b) => acc + b.available, 0);
  const totalUsed = leave.data.balances.reduce((acc, b) => acc + b.used, 0);
  const pendingCount = leave.data.approvalRequests.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SectionHeader
          title="Leave Management Workspace"
          subtitle={`${actor.name} • ${actor.role}`}
        />

        {leave.error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
            <span>{leave.error}</span>
            <button
              type="button"
              onClick={() => void leave.refresh()}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 transition flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        )}
        {leave.success && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {leave.success}
          </p>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KpiCard
            metric={{
              id: 'rem-leave',
              title: 'Leave Balance',
              value: `${totalRemaining} Days`,
              subtext: 'Available Balance',
              change: 'Active',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Calendar size={18} />}
            badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
          <KpiCard
            metric={{
              id: 'used-leave',
              title: 'Used Leaves',
              value: `${totalUsed} Days`,
              subtext: 'Taken This Year',
              change: 'Used',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Clock size={18} />}
            badgeBg="bg-blue-50 text-blue-700 border-blue-200"
          />
          <KpiCard
            metric={{
              id: 'pend-appr',
              title: 'Pending Approvals',
              value: `${pendingCount} Requests`,
              subtext: 'Awaiting Action',
              change: 'Pending',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Award size={18} />}
            badgeBg="bg-amber-50 text-amber-700 border-amber-200"
          />
          <KpiCard
            metric={{
              id: 'approval-status',
              title: 'Approval Status',
              value: 'Active',
              subtext: 'Leave Workspace',
              change: 'Active',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<CheckCircle2 size={18} />}
            badgeBg="bg-purple-50 text-purple-700 border-purple-200"
          />
        </div>

        {/* Leave Balances Grid */}
        <LeaveBalances
          balances={leave.data.balances}
          canManage={canApprove}
          disabled={leave.isSaving}
          onCarryForward={(balanceId, days) => leave.carryForward({ balanceId, days })}
        />

        {/* Application Form & Calendar */}
        <div className="grid gap-6 lg:grid-cols-2">
          <LeaveApplicationForm disabled={leave.isSaving} onSubmit={leave.apply} />
          <LeaveCalendar requests={leave.data.requests} />
        </div>

        {/* Cancellation List */}
        <LeaveCancellationList requests={leave.data.requests} disabled={leave.isSaving} onCancel={leave.cancel} />

        {/* Approval Queue for Managers / Admins */}
        {canApprove && (
          <LeaveApprovalQueue
            requests={leave.data.approvalRequests}
            disabled={leave.isSaving}
            onDecision={leave.decide}
          />
        )}

        {/* History & Reports Table */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Leave History</h2>
              <p className="mt-1 text-xs text-slate-500">
                Filtered leave requests history for {actor.name || 'employee'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportCsv(leave.requests)}
                disabled={leave.requests.length === 0}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => exportPdf(leave.requests)}
                disabled={leave.requests.length === 0}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Export PDF
              </button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable
              data={leave.requests}
              columns={columns}
              loading={leave.isLoading}
              searchable={true}
              searchPlaceholder="Search leave history by name, type, reason..."
              onRefresh={() => void leave.refresh()}
              onExport={() => exportCsv(leave.requests)}
              emptyTitle="No leave history"
              emptyDescription="No leave requests are available."
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
