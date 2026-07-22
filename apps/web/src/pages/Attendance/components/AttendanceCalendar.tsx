import { ATTENDANCE_STATUS_STYLES } from '../constants/attendance';
import type { DailyAttendance } from '../types/attendance';

interface Props { month: string; records: DailyAttendance[]; }

export const AttendanceCalendar = ({ month, records }: Props) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(year, monthNumber, 0).getDate();
  const recordsByDate = new Map(records.map((record) => [record.attendanceDate, record]));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-900">Attendance calendar</h2><div className="mt-4 grid grid-cols-7 gap-2">{Array.from({ length: days }, (_, index) => { const date = `${month}-${String(index + 1).padStart(2, '0')}`; const record = recordsByDate.get(date); return <div key={date} className={`min-h-16 rounded-lg border p-2 text-xs ${record ? ATTENDANCE_STATUS_STYLES[record.status] : 'border-slate-200 bg-slate-50 text-slate-500'}`}><p className="font-semibold">{index + 1}</p><p className="mt-1 leading-tight">{record?.status ?? '—'}</p></div>; })}</div></section>;
};
