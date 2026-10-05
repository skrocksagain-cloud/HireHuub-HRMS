import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Smartphone,
  X,
  FileText,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import type { ResolvedAttendanceDay, ResolvedStatus } from '../utils/attendanceResolutionEngine';

interface Props {
  month: string; // YYYY-MM
  resolvedDays: ResolvedAttendanceDay[];
  onMonthChange: (newMonth: string) => void;
}

const STATUS_CONFIG: Record<
  ResolvedStatus,
  { bg: string; border: string; text: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  Present: {
    bg: 'bg-emerald-50/60 hover:bg-emerald-100/80',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    dotColor: 'bg-emerald-500',
  },
  Late: {
    bg: 'bg-amber-50/60 hover:bg-amber-100/80',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    dotColor: 'bg-amber-500',
  },
  'Half Day': {
    bg: 'bg-amber-50/60 hover:bg-amber-100/80',
    border: 'border-amber-200',
    text: 'text-amber-900',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    dotColor: 'bg-amber-600',
  },
  WFH: {
    bg: 'bg-sky-50/60 hover:bg-sky-100/80',
    border: 'border-sky-200',
    text: 'text-sky-900',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    dotColor: 'bg-sky-500',
  },
  Leave: {
    bg: 'bg-purple-50/60 hover:bg-purple-100/80',
    border: 'border-purple-200',
    text: 'text-purple-900',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    dotColor: 'bg-purple-500',
  },
  Holiday: {
    bg: 'bg-orange-50/60 hover:bg-orange-100/80',
    border: 'border-orange-200',
    text: 'text-orange-900',
    badgeBg: 'bg-orange-500',
    badgeText: 'text-white',
    dotColor: 'bg-orange-500',
  },
  'Week Off': {
    bg: 'bg-slate-100/70 hover:bg-slate-200/70',
    border: 'border-slate-200',
    text: 'text-slate-600',
    badgeBg: 'bg-slate-500',
    badgeText: 'text-white',
    dotColor: 'bg-slate-400',
  },
  Regularized: {
    bg: 'bg-indigo-50/60 hover:bg-indigo-100/80',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    dotColor: 'bg-indigo-500',
  },
  Absent: {
    bg: 'bg-rose-50/60 hover:bg-rose-100/80',
    border: 'border-rose-200',
    text: 'text-rose-900',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    dotColor: 'bg-rose-500',
  },
  Upcoming: {
    bg: 'bg-white hover:bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-500',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-slate-600',
    dotColor: 'bg-slate-300',
  },
};

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AttendanceCalendar = ({ month, resolvedDays, onMonthChange }: Props) => {
  const [selectedDay, setSelectedDay] = useState<ResolvedAttendanceDay | null>(null);

  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const monthDate = new Date(year, monthIndex, 1);
  const firstDayOfWeek = monthDate.getDay();

  const monthFormatted = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    const d = new Date(year, monthIndex - 1, 1);
    const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const d = new Date(year, monthIndex + 1, 1);
    const nextMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(nextMonth);
  };

  const handleTodayMonth = () => {
    const now = new Date();
    const todayMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(todayMonth);
  };

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      {/* Month Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon size={18} className="text-emerald-600" />
            Attendance Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time resolution of attendance, holidays, leaves, WFH, and regularizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-sm text-slate-800 min-w-32 text-center">{monthFormatted}</span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            title="Next Month"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={handleTodayMonth}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Late</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> WFH</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Approved Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Holiday</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Week Off</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Regularized</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent</span>
      </div>

      {/* Calendar Grid Header */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-xs text-slate-500 pb-1">
        {WEEKDAY_NAMES.map((name, i) => (
          <div key={name} className={i === 0 ? 'text-rose-600 font-bold' : ''}>
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Blank offset padding */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`blank-${idx}`} className="min-h-20 rounded-xl bg-slate-50/40 border border-slate-100/50" />
        ))}

        {/* Month Days */}
        {resolvedDays.map((day) => {
          const cfg = STATUS_CONFIG[day.status];
          const isToday = day.date === todayStr;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`min-h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative ${
                cfg.bg
              } ${cfg.border} ${isToday ? 'ring-2 ring-emerald-500 ring-offset-1 font-bold' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isToday ? 'text-emerald-700 font-black' : 'text-slate-800'}`}>
                  {day.dayNumber}
                </span>
                {isToday && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.2 rounded-md">
                    Today
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-0.5">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide truncate max-w-full ${cfg.badgeBg} ${cfg.badgeText}`}
                >
                  {day.badgeLabel}
                </span>
                <p className="text-[10px] font-medium text-slate-600 truncate leading-tight">
                  {day.subText}
                </p>
              </div>

              {day.details.hasPendingRequest && (
                <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-700 font-bold">
                  <AlertCircle size={10} className="text-amber-600" />
                  <span>Pending Request</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day Detail Modal/Drawer */}
      {selectedDay && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      STATUS_CONFIG[selectedDay.status].badgeBg
                    } ${STATUS_CONFIG[selectedDay.status].badgeText}`}
                  >
                    {selectedDay.badgeLabel}
                  </span>
                  {selectedDay.details.isToday && (
                    <span className="text-[10px] font-bold text-emerald-600">Today's Date</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Session / Leave / Holiday Content */}
            <div className="space-y-3">
              {/* Working Session */}
              {(selectedDay.status === 'Present' || selectedDay.status === 'Late' || selectedDay.status === 'Half Day') && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Clock size={14} className="text-emerald-600" />
                    <span>Attendance Session Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Login Time</span>
                      <span className="font-bold text-slate-800">{selectedDay.details.loginTimeStr || 'Not Recorded'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Logout Time</span>
                      <span className="font-bold text-slate-800">{selectedDay.details.logoutTimeStr || 'In Progress'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Work Duration</span>
                      <span className="font-bold text-emerald-600">
                        {selectedDay.details.totalWorkMinutes
                          ? `${Math.floor(selectedDay.details.totalWorkMinutes / 60)}h ${selectedDay.details.totalWorkMinutes % 60}m`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Device & GPS</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Smartphone size={12} className="text-slate-400" /> {selectedDay.details.deviceType || 'Desktop'}
                      </span>
                    </div>
                  </div>
                  {selectedDay.details.location && (
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                      <MapPin size={12} className="text-slate-400" /> {selectedDay.details.location}
                    </p>
                  )}
                </div>
              )}

              {/* WFH Details */}
              {selectedDay.status === 'WFH' && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2 text-sky-900">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Briefcase size={14} className="text-sky-600" />
                    <span>Approved Work From Home</span>
                  </div>
                  <p className="text-xs">Reason: {selectedDay.details.wfhReason}</p>
                  {selectedDay.details.approver && (
                    <p className="text-[10px] text-sky-700">Approved by Manager: {selectedDay.details.approver}</p>
                  )}
                </div>
              )}

              {/* Leave Details */}
              {selectedDay.status === 'Leave' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-purple-900">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <FileText size={14} className="text-purple-600" />
                    <span>{selectedDay.details.leaveType || 'Approved Leave'}</span>
                  </div>
                  <p className="text-xs">Reason: {selectedDay.details.leaveReason || 'Leave Request Approved'}</p>
                  {selectedDay.details.approver && (
                    <p className="text-[10px] text-purple-700">Approver ID: {selectedDay.details.approver}</p>
                  )}
                </div>
              )}

              {/* Holiday Details */}
              {selectedDay.status === 'Holiday' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-1 text-orange-900">
                  <span className="font-bold text-xs block text-orange-900">Company Declared Holiday</span>
                  <p className="text-sm font-black text-orange-800">{selectedDay.details.holidayName}</p>
                </div>
              )}

              {/* Regularized Details */}
              {selectedDay.status === 'Regularized' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-indigo-900">
                  <span className="font-bold text-xs block">Approved Regularization</span>
                  <p className="text-xs">Reason: {selectedDay.details.regularizationReason}</p>
                  {selectedDay.details.approver && (
                    <p className="text-[10px] text-indigo-700">Approved by Manager: {selectedDay.details.approver}</p>
                  )}
                </div>
              )}

              {/* Week Off Details */}
              {selectedDay.status === 'Week Off' && (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700">
                  <span className="font-bold text-xs block">Sunday Scheduled Week Off</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard non-working weekly off day in company schedule.
                  </p>
                </div>
              )}

              {/* Absent Details */}
              {selectedDay.status === 'Absent' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <span className="font-bold text-xs block">No Attendance Recorded (Absent)</span>
                  <p className="text-[11px] text-rose-700">
                    No punch-in, approved leave, or WFH recorded for this working day.
                  </p>
                </div>
              )}

              {/* Upcoming Details */}
              {selectedDay.status === 'Upcoming' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 space-y-1">
                  <span className="font-bold text-xs block">Upcoming Working Day</span>
                  <p className="text-[11px] text-slate-500">
                    Future scheduled working day. Attendance status will resolve on this date.
                  </p>
                </div>
              )}

              {/* Pending Request Indicator in Modal */}
              {selectedDay.details.hasPendingRequest && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="font-semibold">
                    {selectedDay.details.pendingRequestType} request pending manager decision.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
