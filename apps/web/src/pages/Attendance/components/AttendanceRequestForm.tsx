import { useState, type FormEvent } from 'react';

import { getLocalAttendanceDate } from '../utils/attendance';
import type { AttendanceRequestType } from '../types/attendance';

interface Props { disabled: boolean; onSubmit: (type: AttendanceRequestType, date: string, reason: string) => void; }

export const AttendanceRequestForm = ({ disabled, onSubmit }: Props) => {
  const [type, setType] = useState<AttendanceRequestType>('Regularization');
  const [date, setDate] = useState(getLocalAttendanceDate());
  const [reason, setReason] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); onSubmit(type, date, reason); setReason(''); };
  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-900">Regularization & WFH</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><select aria-label="Request type" value={type} onChange={(event) => setType(event.target.value as AttendanceRequestType)} className="rounded-lg border border-slate-300 px-3 py-2" disabled={disabled}><option value="Regularization">Regularization</option><option value="WFH">Work From Home</option></select><input aria-label="Attendance date" type="date" value={date} max={getLocalAttendanceDate()} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" disabled={disabled} /></div><textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" disabled={disabled} /><button type="submit" disabled={disabled} className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Submit request</button></form>;
};
