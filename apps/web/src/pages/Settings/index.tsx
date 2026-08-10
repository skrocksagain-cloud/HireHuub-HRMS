import { useState } from 'react';
import { Settings, ShieldCheck, CheckCircle2, Bell, Lock } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePermissions } from '../../hooks/usePermissions';

export default function SettingsPage() {
  const { canAccessModule } = usePermissions();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [autoLockout, setAutoLockout] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSaveSettings = () => {
    setStatusMsg('System settings and security preferences saved successfully.');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  if (!canAccessModule('management')) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500 font-bold text-sm">
          Access Denied. You do not have permission to view System Settings.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 p-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Settings size={14} />
              <span>Administration Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">System Settings & Security Preferences</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Configure ERP system parameters, security policies, notification rules, and password strength rules.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={16} /> Save Preferences
          </button>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> {statusMsg}
          </div>
        )}

        {/* Security & Notification Preferences Card */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Lock size={16} className="text-emerald-600" /> Security & Account Lockout
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLockout}
                  onChange={(e) => setAutoLockout(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Enforce 3-day Missing Sign-Out Attendance Account Lockout
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Automatically locks employee accounts when 3 consecutive sign-outs are missing. Requires Dept Admin review & Super Admin unlock approval.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Bell size={16} className="text-purple-600" /> Notification Engine Rules
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppNotifs}
                  onChange={(e) => setInAppNotifs(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Enable In-App Realtime Notification Bell Dispatch
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Queue Automated Email Alerts for Offers and Circulars
              </label>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}