import { jsPDF } from 'jspdf';

import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable/types';
import { LeaveApprovalQueue } from './components/LeaveApprovalQueue';
import { LeaveApplicationForm } from './components/LeaveApplicationForm';
import { LeaveBalances } from './components/LeaveBalances';
import { LeaveCalendar } from './components/LeaveCalendar';
import { LeaveCancellationList } from './components/LeaveCancellationList';
import { LeaveSummary } from './components/LeaveSummary';
import { LEAVE_STATUS_STYLES } from './constants/leave';
import { useLeave } from './hooks/useLeave';
import type { LeaveActor, LeaveRequest, LeaveStatus } from './types/leave';

const columns: DataTableColumn<LeaveRequest>[] = [
  { key: 'startDate', title: 'Start', sortable: true }, { key: 'endDate', title: 'End', sortable: true }, { key: 'employeeName', title: 'Employee', sortable: true }, { key: 'leaveType', title: 'Leave type', sortable: true }, { key: 'days', title: 'Days', sortable: true },
  { key: 'status', title: 'Status', sortable: true, render: (value) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${LEAVE_STATUS_STYLES[value as LeaveStatus]}`}>{String(value)}</span> },
];

const exportCsv = (requests: LeaveRequest[]): void => {
  const rows = [['Employee', 'Type', 'Start', 'End', 'Days', 'Status'], ...requests.map((request) => [request.employeeName, request.leaveType, request.startDate, request.endDate, String(request.days), request.status])];
  const url = URL.createObjectURL(new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' }));
  const link = document.createElement('a'); link.href = url; link.download = 'leave-report.csv'; link.click(); URL.revokeObjectURL(url);
};

const exportPdf = (requests: LeaveRequest[]): void => {
  const report = new jsPDF(); report.setFontSize(16); report.text('HireHuub Leave Report', 14, 18); report.setFontSize(9);
  requests.slice(0, 30).forEach((request, index) => report.text(`${request.employeeName}  ${request.leaveType}  ${request.startDate} - ${request.endDate}  ${request.status}`, 14, 30 + index * 7));
  report.save('leave-report.pdf');
};

export default function LeavePage() {
  const { user } = useAuth();
  const actor: LeaveActor | null = user ? { employeeId: user.employeeId, name: user.name, role: user.role, department: '' } : null;
  const leave = useLeave(actor);
  if (!actor) return <section><h1 className="text-2xl font-semibold text-slate-900">Leave</h1><p className="mt-3 text-slate-600">Sign in to access leave.</p></section>;
  const canApprove = ['Admin', 'Super Admin'].includes(actor.role);
  return <section className="mx-auto max-w-7xl space-y-6">
    <div><h1 className="text-2xl font-semibold text-slate-900">Leave</h1><p className="mt-1 text-sm text-slate-600">Balance, requests, approvals and reports</p></div>
    {leave.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{leave.error}</p>}
    {leave.success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{leave.success}</p>}
    <LeaveSummary data={leave.data} />
    <LeaveBalances balances={leave.data.balances} canManage={canApprove} disabled={leave.isSaving} onCarryForward={(balanceId, days) => leave.carryForward({ balanceId, days })} />
    <div className="grid gap-6 lg:grid-cols-2"><LeaveApplicationForm disabled={leave.isSaving} onSubmit={leave.apply} /><LeaveCalendar requests={leave.data.requests} /></div>
    <LeaveCancellationList requests={leave.data.requests} disabled={leave.isSaving} onCancel={leave.cancel} />
    {canApprove && <LeaveApprovalQueue requests={leave.data.approvalRequests} disabled={leave.isSaving} onDecision={leave.decide} />}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold text-slate-900">Leave history & reports</h2><div className="flex gap-2"><button type="button" onClick={() => exportCsv(leave.requests)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Export Excel</button><button type="button" onClick={() => exportPdf(leave.requests)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Export PDF</button></div></div><div className="mt-4"><DataTable data={leave.requests} columns={columns} loading={leave.isLoading} onRefresh={() => void leave.refresh()} onExport={() => exportCsv(leave.requests)} emptyTitle="No leave history" emptyDescription="No leave requests are available." /></div></section>
  </section>;
}
