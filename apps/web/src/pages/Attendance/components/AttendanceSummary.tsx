import { getAttendanceSummary, formatDuration } from '../utils/attendance';
import type { AttendanceDashboardData } from '../types/attendance';

interface Props { data: AttendanceDashboardData; }

export const AttendanceSummary = ({ data }: Props) => {
  const summary = getAttendanceSummary(data.monthRecords);
  const cards = [
    ['Today', data.today?.status ?? 'Not marked'], ['Work time', formatDuration(data.today?.totalWorkMinutes ?? 0)], ['Present days', String(summary.presentCount)], ['Late days', String(summary.lateCount)], ['Pending requests', String(data.requests.filter(({ status }) => status === 'Pending').length)], ['WFH days', String(summary.wfhCount)],
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p></div>)}</div>;
};
