import { useAuth } from '../../context/AuthContext';
import { AttendanceRequestForm } from './components/AttendanceRequestForm';
import { AttendanceSummary } from './components/AttendanceSummary';
import { useAttendance } from './hooks/useAttendance';
import type { AttendanceEmployee, AttendanceRole } from './types/attendance';

const roles: AttendanceRole[] = ['Recruiter', 'Team Leader', 'Manager', 'HR', 'Accounts', 'Admin', 'Super Admin'];
const asRole = (role: string): AttendanceRole => roles.includes(role as AttendanceRole) ? role as AttendanceRole : 'Recruiter';

export default function AttendancePage() {
  const { user } = useAuth();
  const employee: AttendanceEmployee | null = user ? { employeeId: user.employeeId, name: user.name, role: asRole(user.role), department: '' } : null;
  const { data, isLoading, isSaving, error, success, start, end, request } = useAttendance(employee);
  if (!employee) return <section><h1 className="text-2xl font-semibold text-slate-900">Attendance</h1><p className="mt-3 text-slate-600">Sign in to access your attendance.</p></section>;
  return <section className="mx-auto max-w-6xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-slate-900">Attendance</h1><p className="mt-1 text-sm text-slate-600">{employee.name} · {employee.role}</p></div><button onClick={data.openSession ? end : start} disabled={isSaving || isLoading} className="bg-green-700 px-4 py-2 font-medium text-white disabled:opacity-50">{data.openSession ? 'Logout' : 'Start attendance'}</button></div>
    {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{success && <p className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
    {isLoading ? <p className="text-slate-600">Loading attendance...</p> : <><AttendanceSummary data={data} /><div className="grid gap-6 lg:grid-cols-2"><AttendanceRequestForm disabled={isSaving} onSubmit={request} /><div className="border border-slate-200 bg-white p-5"><h2 className="text-base font-semibold text-slate-900">Monthly attendance</h2>{data.monthlyDays.length === 0 ? <p className="mt-4 text-sm text-slate-500">No attendance records for this month.</p> : <ul className="mt-4 divide-y divide-slate-100">{data.monthlyDays.map((day) => <li key={day.id} className="flex justify-between py-2 text-sm"><span>{day.attendanceDate}</span><span>{day.status}</span></li>)}</ul>}</div></div></>}
  </section>;
}
