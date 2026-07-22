import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable/types';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { AttendanceApprovalQueue } from './components/AttendanceApprovalQueue';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { AttendanceRequestForm } from './components/AttendanceRequestForm';
import { AttendanceSummary } from './components/AttendanceSummary';
import { ATTENDANCE_STATUS_STYLES } from './constants/attendance';
import { useAttendance } from './hooks/useAttendance';
import { formatDuration, getAttendanceSummary } from './utils/attendance';
import type { AttendanceActor, AttendanceStatus, DailyAttendance } from './types/attendance';

const statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half Day', 'Holiday', 'Week Off', 'Leave', 'WFH', 'Regularization Pending'];
const columns: DataTableColumn<DailyAttendance>[] = [
  { key: 'attendanceDate', title: 'Date', sortable: true }, { key: 'employeeName', title: 'Employee', sortable: true }, { key: 'department', title: 'Department', sortable: true }, { key: 'status', title: 'Status', sortable: true, render: (value) => <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ATTENDANCE_STATUS_STYLES[value as AttendanceStatus]}`}>{String(value)}</span> }, { key: 'totalWorkMinutes', title: 'Work time', sortable: true, render: (value) => formatDuration(Number(value)) },
];

const downloadCsv = (records: DailyAttendance[]): void => {
  const rows = [['Date', 'Employee ID', 'Employee', 'Department', 'Status', 'Work minutes'], ...records.map((record) => [record.attendanceDate, record.employeeId, record.employeeName, record.department, record.status, String(record.totalWorkMinutes)])];
  const url = URL.createObjectURL(new Blob([rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' }));
  const link = document.createElement('a'); link.href = url; link.download = 'attendance-report.csv'; link.click(); URL.revokeObjectURL(url);
};

const downloadPdf = (records: DailyAttendance[]): void => {
  const report = new jsPDF();
  report.setFontSize(16); report.text('HireHuub Attendance Report', 14, 18);
  report.setFontSize(9); records.slice(0, 30).forEach((record, index) => report.text(`${record.attendanceDate}  ${record.employeeName}  ${record.department}  ${record.status}  ${formatDuration(record.totalWorkMinutes)}`, 14, 30 + index * 7));
  report.save('attendance-report.pdf');
};

export default function AttendancePage() {
  const { user } = useAuth();
  const actor: AttendanceActor | null = user ? { employeeId: user.employeeId, name: user.name, role: user.role, department: '' } : null;
  const attendance = useAttendance(actor);
  if (!actor) return <section><h1 className="text-2xl font-semibold text-slate-900">Attendance</h1><p className="mt-3 text-slate-600">Sign in to access your attendance.</p></section>;
  const canApprove = ['Admin', 'Super Admin'].includes(actor.role);
  const summary = getAttendanceSummary(attendance.records);
  return <section className="mx-auto max-w-7xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-slate-900">Attendance</h1><p className="mt-1 text-sm text-slate-600">{actor.name} · {actor.role}</p></div><div className="flex gap-3"><button type="button" onClick={attendance.login} disabled={attendance.isLoading || attendance.isSaving || Boolean(attendance.data.today?.loginTime)} className="rounded-lg bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">Login</button><button type="button" onClick={attendance.logout} disabled={attendance.isLoading || attendance.isSaving || !attendance.data.today?.loginTime || Boolean(attendance.data.today?.logoutTime)} className="rounded-lg bg-slate-700 px-4 py-2 font-medium text-white disabled:opacity-50">Logout</button></div></div>
    {attendance.error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{attendance.error}</p>}{attendance.success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{attendance.success}</p>}
    <AttendanceSummary data={attendance.data} />
    <div className="grid gap-6 lg:grid-cols-2"><AttendanceRequestForm disabled={attendance.isSaving} onSubmit={attendance.submitRequest} /><AttendanceCalendar month={attendance.filters.month} records={attendance.data.monthRecords} /></div>
    {canApprove && <AttendanceApprovalQueue requests={attendance.data.requests} disabled={attendance.isSaving} onDecision={attendance.decideRequest} />}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">Attendance history & reports</h2><p className="mt-1 text-sm text-slate-600">Working days: {summary.workingDays} · LOP: {summary.lopDays} · Half days: {summary.halfDayCount}</p></div><div className="flex gap-2"><button type="button" onClick={() => downloadCsv(attendance.records)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Export Excel</button><button type="button" onClick={() => downloadPdf(attendance.records)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Export PDF</button></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><input aria-label="Search attendance" value={attendance.filters.search} onChange={(event) => attendance.setFilters({ ...attendance.filters, search: event.target.value })} placeholder="Search employee, department or date" className="rounded-lg border border-slate-300 px-3 py-2" /><input aria-label="Attendance month" type="month" value={attendance.filters.month} onChange={(event) => attendance.setFilters({ ...attendance.filters, month: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" /><select aria-label="Attendance status" value={attendance.filters.status} onChange={(event) => attendance.setFilters({ ...attendance.filters, status: event.target.value as AttendanceStatus | '' })} className="rounded-lg border border-slate-300 px-3 py-2"><option value="">All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></div><div className="mt-4"><DataTable data={attendance.records} columns={columns} loading={attendance.isLoading} onRefresh={() => void attendance.refresh()} onExport={() => downloadCsv(attendance.records)} searchPlaceholder="Search current attendance" emptyTitle="No attendance records" emptyDescription="There are no attendance records for these filters." /></div></section>
  </section>;
}
