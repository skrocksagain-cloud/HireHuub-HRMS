import { useState } from 'react';

import type { AttendanceApprovalInput, AttendanceRequest } from '../types/attendance';

interface Props { requests: AttendanceRequest[]; disabled: boolean; onDecision: (input: AttendanceApprovalInput) => void; }

export const AttendanceApprovalQueue = ({ requests, disabled, onDecision }: Props) => {
  const [reason, setReason] = useState<Record<string, string>>({});
  if (requests.length === 0) return null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-900">Pending attendance approvals</h2><div className="mt-4 space-y-3">{requests.map((request) => <div key={request.id} className="rounded-lg border border-slate-200 p-3"><p className="font-medium text-slate-900">{request.employeeName} · {request.requestType}</p><p className="mt-1 text-sm text-slate-600">{request.attendanceDate} · {request.reason}</p><div className="mt-3 flex flex-wrap gap-2"><input value={reason[request.id] ?? ''} onChange={(event) => setReason({ ...reason, [request.id]: event.target.value })} placeholder="Decision reason" className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" disabled={disabled} /><button type="button" onClick={() => onDecision({ requestId: request.id, decision: 'Approved', reason: reason[request.id] ?? '' })} disabled={disabled} className="rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Approve</button><button type="button" onClick={() => onDecision({ requestId: request.id, decision: 'Rejected', reason: reason[request.id] ?? '' })} disabled={disabled} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Reject</button></div></div>)}</div></section>;
};
