import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getSimplifiedModuleScope } from '../../core/authorization/authorizationResolver';
import DashboardLayout from '../../layouts/DashboardLayout';
import SectionHeader from '../../ui/SectionHeader';
import { AttendanceApprovalQueue } from './components/AttendanceApprovalQueue';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { AttendanceRequestForm } from './components/AttendanceRequestForm';
import { AttendanceSummary } from './components/AttendanceSummary';
import { useAttendance } from './hooks/useAttendance';
import { formatDuration } from './utils/attendance';
import type { AttendanceActor } from './types/attendance';
import { Smartphone, User } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();

  const actor: AttendanceActor & { assignedRole?: string } = {
    employeeId: user?.employeeId || user?.id || '',
    name: user?.name || '',
    role: user?.role || '',
    department: user?.department || '',
    assignedRole: (user as any)?.authorization?.role || user?.assignedRole,
  };

  const { canApprove: checkCanApprove } = usePermissions();
  const attendance = useAttendance(actor);
  const canApprove = checkCanApprove('attendance');
  
  const activeScope = getSimplifiedModuleScope(actor.assignedRole);
  const isOrganizationAdmin = activeScope === 'GLOBAL' || activeScope === 'DEPARTMENT';

  const todayRecord = attendance.data.today;
  const currentStatus = !todayRecord?.loginTime
    ? 'Not Signed In'
    : todayRecord?.logoutTime
    ? 'Signed Out'
    : 'Working';

  const selectedEmployeeObj = attendance.employeesList.find(
    (e) => e.employeeId === attendance.selectedEmployeeId || e.id === attendance.selectedEmployeeId
  );
  const activeEmployeeName = selectedEmployeeObj
    ? selectedEmployeeObj.fullName || `${selectedEmployeeObj.firstName} ${selectedEmployeeObj.lastName}`
    : actor.name;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader
            title="Attendance Workspace"
            subtitle={`${activeEmployeeName} • ${actor.role} • ${actor.department || 'Hire Huub ERP'}`}
          />
          <div className="flex flex-wrap items-center gap-3">
            {/* Employee Selector for Admins / Managers */}
            {isOrganizationAdmin && attendance.employeesList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                <User size={14} className="text-slate-500" />
                <select
                  aria-label="Select Employee"
                  value={attendance.selectedEmployeeId}
                  onChange={(e) => attendance.setSelectedEmployeeId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value={actor.employeeId}>Self: {actor.name}</option>
                  {attendance.employeesList
                    .filter((e) => e.employeeId !== actor.employeeId && e.id !== actor.employeeId)
                    .map((emp) => (
                      <option key={emp.id || emp.employeeId} value={emp.employeeId || emp.id}>
                        {emp.employeeCode || emp.employeeId} — {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                      </option>
                    ))}
                </select>
              </div>
            )}

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

        {/* Monthly Summary Statistics Cards */}
        <AttendanceSummary summary={attendance.summaryMetrics} />

        {/* Request Form & Redesigned Keka-style Attendance Calendar */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <AttendanceRequestForm disabled={attendance.isSaving} onSubmit={attendance.submitRequest} />
          </div>
          <div className="lg:col-span-8">
            <AttendanceCalendar
              month={attendance.filters.month}
              resolvedDays={attendance.resolvedDays}
              onMonthChange={(newMonth) => attendance.setFilters({ ...attendance.filters, month: newMonth })}
            />
          </div>
        </div>

        {/* Approval Queue for Managers/Admins */}
        {canApprove && (
          <AttendanceApprovalQueue
            requests={attendance.data.requests}
            disabled={attendance.isSaving}
            onDecision={attendance.decideRequest}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
