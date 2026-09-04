import { useState } from 'react';
import { CheckCircle2, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import type { AttendanceApprovalInput, AttendanceRequest } from '../types/attendance';

interface Props {
  requests: AttendanceRequest[];
  disabled: boolean;
  onDecision: (input: AttendanceApprovalInput) => void;
}

export const AttendanceApprovalQueue = ({ requests, disabled, onDecision }: Props) => {
  const [reason, setReason] = useState<Record<string, string>>({});

  if (requests.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-600" />
          Pending Attendance & Regularization Approvals
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Two-stage authorization: Reporting Manager Approval → Admin / Super Admin Final Approval.
        </p>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const stage = request.approvalStage || (request.managerApproved ? 'Approved by Manager' : 'Pending Manager Approval');
          const isManagerApproved = request.managerApproved || stage === 'Approved by Manager';

          return (
            <div
              key={request.id}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 transition hover:bg-slate-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                <div>
                  <span className="font-bold text-slate-900 text-xs">{request.employeeName}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-slate-600 text-xs font-semibold">{request.department}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 uppercase">
                    {request.requestType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isManagerApproved
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isManagerApproved ? (
                      <>
                        <UserCheck size={12} className="text-indigo-600" />
                        Approved by Manager (Pending Admin Approval)
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={12} className="text-amber-600" />
                        Pending Manager Approval
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Date Requested</span>
                  <span className="font-bold text-slate-800">{request.attendanceDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Reason / Details</span>
                  <span className="font-medium text-slate-700">{request.reason}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  aria-label="Decision remarks"
                  value={reason[request.id] ?? ''}
                  onChange={(event) => setReason({ ...reason, [request.id]: event.target.value })}
                  placeholder="Approval/Rejection remarks"
                  className="min-w-52 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() =>
                    onDecision({
                      requestId: request.id,
                      decision: 'Approved',
                      reason: reason[request.id] ?? '',
                    })
                  }
                  disabled={disabled}
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  {isManagerApproved ? 'Final Approve (Admin)' : 'Approve (Manager / Admin)'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onDecision({
                      requestId: request.id,
                      decision: 'Rejected',
                      reason: reason[request.id] ?? '',
                    })
                  }
                  disabled={disabled}
                  className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
