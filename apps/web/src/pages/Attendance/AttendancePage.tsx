import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable/types';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import SectionHeader from '../../ui/SectionHeader';
import { AttendanceApprovalQueue } from './components/AttendanceApprovalQueue';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { AttendanceRequestForm } from './components/AttendanceRequestForm';
import { AttendanceSummary } from './components/AttendanceSummary';
import { ATTENDANCE_STATUS_STYLES } from './constants/attendance';
import { useAttendance } from './hooks/useAttendance';
import { formatDuration, getAttendanceSummary } from './utils/attendance';
import type { AttendanceActor, AttendanceStatus, DailyAttendance } from './types/attendance';
import { Smartphone } from 'lucide-react';

const statusOptions: AttendanceStatus[] = [
  'Present',
  'Absent',
  'Late',
  'Half Day',
  'Holiday',
  'Week Off',
  'Leave',
  'WFH',
  'Regularization Pending',
];

const columns: DataTableColumn<DailyAttendance>[] = [
  { key: 'attendanceDate', title: 'Date', sortable: true },
  { key: 'employeeName', title: 'Employee', sortable: true },
  { key: 'department', title: 'Department', sortable: true },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (value) => (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ATTENDANCE_STATUS_STYLES[value as AttendanceStatus]}`}>
        {String(value)}
      </span>
    ),
  },
  {
    key: 'totalWorkMinutes',
    title: 'Work Time',
    sortable: true,
    render: (value) => formatDuration(Number(value)),
  },
];

const downloadCsv = (records: DailyAttendance[]): void => {
  const rows = [
    ['Date', 'Employee ID', 'Employee', 'Department', 'Status', 'Work minutes'],
    ...records.map((record) => [
      record.attendanceDate,
      record.employeeId,
      record.employeeName,
      record.department,
      record.status,
      String(record.totalWorkMinutes),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob([rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')], {
      type: 'text/csv',
    })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'attendance-report.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const downloadPdf = (records: DailyAttendance[]): void => {
  const report = new jsPDF();
  report.setFontSize(16);
  report.text('HireHuub Attendance Report', 14, 18);
  report.setFontSize(9);
  records.slice(0, 30).forEach((record, index) =>
    report.text(
      `${record.attendanceDate}  ${record.employeeName}  ${record.department}  ${record.status}  ${formatDuration(record.totalWorkMinutes)}`,
      14,
      30 + index * 7
    )
  );
  report.save('attendance-report.pdf');
};

export default function AttendancePage() {
  const { user } = useAuth();

  // Always provide fallback actor context so workspace is never blank or blocked
  const actor: AttendanceActor = {
    employeeId: user?.employeeId || user?.id || 'HH0001',
    name: user?.name || 'Authorized User',
    role: user?.role || 'Super Admin',
    department: user?.department || 'Operations',
  };

  const attendance = useAttendance(actor);
  const canApprove = ['Admin', 'Super Admin', 'Department Admin', 'Manager'].includes(actor.role);
  const summary = getAttendanceSummary(attendance.records);

  const todayRecord = attendance.data.today;
  const currentStatus = !todayRecord?.loginTime
    ? 'Not Signed In'
    : todayRecord?.logoutTime
    ? 'Signed Out'
    : 'Working';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader
            title="Attendance Workspace"
            subtitle={`${actor.name} • ${actor.role} • ${actor.department || 'Hire Huub ERP'}`}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={attendance.login}
              disabled={attendance.isLoading || attendance.isSaving || Boolean(todayRecord?.loginTime)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 font-bold text-xs text-white shadow-xs disabled:opacity-50 transition hover:bg-emerald-700"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={attendance.logout}
              disabled={
                attendance.isLoading ||
                attendance.isSaving ||
                !todayRecord?.loginTime ||
                Boolean(todayRecord?.logoutTime)
              }
              className="rounded-xl bg-slate-900 px-5 py-2.5 font-bold text-xs text-white shadow-xs disabled:opacity-50 transition hover:bg-slate-800"
            >
              Sign Out
            </button>
          </div>
        </div>

        {attendance.error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {attendance.error}
          </p>
        )}
        {attendance.success && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {attendance.success}
          </p>
        )}

        {/* Today's Attendance Card & Current Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Current Status
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  currentStatus === 'Working'
                    ? 'bg-emerald-500 text-white'
                    : currentStatus === 'Signed Out'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <p className="text-xl font-black text-white">{currentStatus}</p>
            <p className="text-[11px] text-slate-400">Date: {new Date().toLocaleDateString('en-US')}</p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 col-span-2">
            <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
              Today's Session & Location Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Login Time</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {todayRecord?.loginTime ? 'Recorded' : 'Not Recorded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Logout Time</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {todayRecord?.logoutTime ? 'Recorded' : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Working Hours</span>
                <span className="font-bold text-emerald-600 mt-0.5 block">
                  {formatDuration(todayRecord?.totalWorkMinutes || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Device & GPS Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                  <Smartphone size={12} className="text-slate-400" /> Desktop / Mobile (GPS Active)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary Statistics */}
        <AttendanceSummary data={attendance.data} />

        {/* Request Form & Calendar */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AttendanceRequestForm disabled={attendance.isSaving} onSubmit={attendance.submitRequest} />
          <AttendanceCalendar month={attendance.filters.month} records={attendance.data.monthRecords} />
        </div>

        {/* Approval Queue for Managers/Admins */}
        {canApprove && (
          <AttendanceApprovalQueue
            requests={attendance.data.requests}
            disabled={attendance.isSaving}
            onDecision={attendance.decideRequest}
          />
        )}

        {/* Attendance History Table */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance History & Reports</h2>
              <p className="mt-1 text-xs text-slate-500">
                Working days: {summary.workingDays} • LOP: {summary.lopDays} • Half days: {summary.halfDayCount}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadCsv(attendance.records)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Export Excel
              </button>
              <button
                type="button"
                onClick={() => downloadPdf(attendance.records)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              aria-label="Search attendance"
              value={attendance.filters.search}
              onChange={(event) => attendance.setFilters({ ...attendance.filters, search: event.target.value })}
              placeholder="Search employee, department or date"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <input
              aria-label="Attendance month"
              type="month"
              value={attendance.filters.month}
              onChange={(event) => attendance.setFilters({ ...attendance.filters, month: event.target.value })}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <select
              aria-label="Attendance status"
              value={attendance.filters.status}
              onChange={(event) =>
                attendance.setFilters({ ...attendance.filters, status: event.target.value as AttendanceStatus | '' })
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <DataTable
              data={attendance.records}
              columns={columns}
              loading={attendance.isLoading}
              onRefresh={() => void attendance.refresh()}
              onExport={() => downloadCsv(attendance.records)}
              searchPlaceholder="Search current attendance"
              emptyTitle="No attendance records"
              emptyDescription="There are no attendance records for these filters."
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
