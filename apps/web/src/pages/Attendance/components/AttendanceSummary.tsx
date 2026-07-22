import { ATTENDANCE_STATUS_STYLES } from '../constants/attendance';
import { formatDuration } from '../utils/attendance';
import type { AttendanceDashboardData } from '../types/attendance';

interface Props { data: AttendanceDashboardData; }

export const AttendanceSummary = ({ data }: Props) => {
  const lateDays = data.monthlyDays.filter((day) => day.status === 'Late').length;
  return <div className="grid gap-4 md:grid-cols-4">
    <div className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Today's status</p><p className={`mt-2 inline-flex rounded px-2 py-1 text-sm font-semibold ${data.today ? ATTENDANCE_STATUS_STYLES[data.today.status] : 'bg-slate-100 text-slate-700'}`}>{data.today?.status ?? 'Not marked'}</p></div>
    <div className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Work time today</p><p className="mt-2 text-2xl font-semibold text-slate-900">{formatDuration(data.today?.totalWorkMinutes ?? 0)}</p></div>
    <div className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Late this month</p><p className="mt-2 text-2xl font-semibold text-slate-900">{lateDays}</p></div>
    <div className="border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Pending requests</p><p className="mt-2 text-2xl font-semibold text-slate-900">{data.pendingRequests.length}</p></div>
  </div>;
};
