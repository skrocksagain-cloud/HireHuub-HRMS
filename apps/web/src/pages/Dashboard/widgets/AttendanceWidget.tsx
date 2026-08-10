import { useState } from 'react';
import { CalendarCheck, AlertTriangle, LogOut, CheckCircle2 } from 'lucide-react';
import type { DashboardAttendanceRecord } from '../../../services/dashboard/repositories/dashboardRepository';

interface AttendanceWidgetProps {
  attendance: DashboardAttendanceRecord | null;
  isSignedIn: boolean;
  isSignedOut: boolean;
  isSuperAdmin: boolean;
  workingDurationFormatted: string;
  expectedLogoutTime: string;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export default function AttendanceWidget({
  attendance,
  isSignedIn,
  isSignedOut,
  isSuperAdmin,
  workingDurationFormatted,
  expectedLogoutTime,
  onSignIn,
  onSignOut,
}: AttendanceWidgetProps) {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hidden for Super Admin
  if (isSuperAdmin) {
    return null;
  }

  const handleConfirmSignOut = async () => {
    setIsSubmitting(true);
    try {
      await onSignOut();
      setShowSignOutModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-emerald-600" />
          <span className="font-bold text-slate-900 text-xs">Today's Attendance Workspace</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {isSignedOut ? 'Finalized' : isSignedIn ? 'Active Session' : 'Not Signed In'}
        </span>
      </div>

      {/* Primary Action Button */}
      <div className="text-center space-y-3">
        {!attendance && (
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
          >
            <span className="text-base">🟢</span> Sign In Today
          </button>
        )}

        {isSignedIn && (
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-2"
          >
            <span className="text-base">🔴</span> Sign Out Today
          </button>
        )}

        {isSignedOut && (
          <div className="py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Attendance Finalized for Today
          </div>
        )}
      </div>

      {/* Signed In & Duration Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
          <span className="text-slate-400 block text-[10px]">Signed In At</span>
          <strong className="text-slate-900">{attendance?.signInTime || '--:--'}</strong>
        </div>

        {isSignedOut ? (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[10px]">Signed Out At</span>
            <strong className="text-slate-900">{attendance?.signOutTime || '--:--'}</strong>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[10px]">Working Duration</span>
            <strong className="text-emerald-700">{workingDurationFormatted}</strong>
          </div>
        )}
      </div>

      {!isSignedOut && (
        <div className="text-[10px] text-slate-400 text-center font-mono">
          Expected Shift Logout: <strong className="text-slate-700">{expectedLogoutTime}</strong>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Confirm Final Attendance Sign Out</h3>
                <p className="text-xs text-rose-600 font-medium">Finalize Today's Shift</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Are you sure you want to <strong>Sign Out</strong>? Your attendance for today will be finalized under official HR ERP records.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSignOut}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <LogOut size={14} />
                {isSubmitting ? 'Signing Out…' : 'Confirm Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
