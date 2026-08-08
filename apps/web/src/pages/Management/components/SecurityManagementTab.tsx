import { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Unlock, CheckCircle2, XCircle } from 'lucide-react';
import { useAdminSecurity } from '../../../hooks/admin/useAdmin';
import type { SecuritySettings } from '../../../types/Admin';

export default function SecurityManagementTab() {
  const { security, resetRequests, isLoading, updateSecurity, approveReset, rejectReset } = useAdminSecurity();
  const [statusMsg, setStatusMsg] = useState('');
  const [tempPassword, setTempPassword] = useState('HireHuub@2026');

  const [form, setForm] = useState<SecuritySettings>(
    security || {
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30,
      passwordMinLength: 8,
      requireSpecialChar: true,
      sessionTimeoutMinutes: 60,
    }
  );

  if (security && form.maxFailedAttempts !== security.maxFailedAttempts) {
    setForm(security);
  }

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSecurity(form);
    setStatusMsg('Security lock rules updated successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleApprove = async (reqId: string) => {
    await approveReset(reqId, tempPassword);
    setStatusMsg('Password reset request approved!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleReject = async (reqId: string) => {
    await rejectReset(reqId);
    setStatusMsg('Password reset request rejected.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Security Controls…</div>;
  }

  const pendingRequests = resetRequests.filter((r) => r.status === 'Pending');

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldAlert size={18} className="text-emerald-600" />
            Security Governance & Password Reset Requests
          </h3>
          <p className="text-slate-500">
            Only Super Admin can approve password resets, unlock accounts, and modify security policies.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* Password Reset Requests (Super Admin Queue) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <KeyRound size={16} className="text-amber-500" />
            Pending Password Reset Requests ({pendingRequests.length})
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Temp Password to Assign:</span>
            <input
              type="text"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
            />
          </div>
        </div>

        {resetRequests.length === 0 ? (
          <div className="p-6 text-center text-slate-400 font-medium">No password reset requests pending.</div>
        ) : (
          <div className="space-y-3">
            {resetRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    Employee: {req.employeeName} ({req.employeeId})
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Requested At: {req.requestedAt} | Status: <span className="font-bold text-amber-700">{req.status}</span>
                  </div>
                  {req.newTemporaryPassword && (
                    <div className="font-mono text-[11px] text-emerald-700 font-bold mt-1">
                      Assigned Temp Password: {req.newTemporaryPassword}
                    </div>
                  )}
                </div>

                {req.status === 'Pending' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                    >
                      <Unlock size={14} className="inline mr-1" /> Approve & Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl"
                    >
                      <XCircle size={14} className="inline mr-1" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="font-semibold text-slate-400 text-xs">Resolved by {req.resolvedBy || 'Super Admin'}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Central Account Lock Rules */}
      <form onSubmit={handleSaveSecurity} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
          <Lock size={16} /> Central Account Lock & Session Policies
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Max Failed Attempts (Before Lock)</label>
            <input
              type="number"
              value={form.maxFailedAttempts}
              onChange={(e) => setForm({ ...form, maxFailedAttempts: parseInt(e.target.value) || 5 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Lockout Duration (Minutes)</label>
            <input
              type="number"
              value={form.lockoutDurationMinutes}
              onChange={(e) => setForm({ ...form, lockoutDurationMinutes: parseInt(e.target.value) || 30 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Session Timeout (Minutes)</label>
            <input
              type="number"
              value={form.sessionTimeoutMinutes}
              onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
          >
            Save Security Governance
          </button>
        </div>
      </form>
    </div>
  );
}
