import { CalendarOff, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaveBalanceWidgetProps {
  leaveBalance: { remainingDays: number; label: string };
}

export default function LeaveBalanceWidget({ leaveBalance }: LeaveBalanceWidgetProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200/60">
          <CalendarOff size={22} />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Remaining Leave Balance
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
            {leaveBalance.label}
          </div>
        </div>
      </div>

      <Link
        to="/leave"
        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl transition"
      >
        <span>Apply Leave</span>
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
