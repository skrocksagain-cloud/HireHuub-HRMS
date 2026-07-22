import { useState } from 'react';

import { getLocalAttendanceDate } from '../utils/attendance';
import type { AttendanceRequestType } from '../types/attendance';

interface Props { disabled: boolean; onSubmit: (type: AttendanceRequestType, date: string, reason: string) => void; }
const requestTypes: AttendanceRequestType[] = ['Regularisation', 'Work From Home', 'Leave'];

export const AttendanceRequestForm = ({ disabled, onSubmit }: Props) => {
  const [type, setType] = useState<AttendanceRequestType>('Regularisation');
  const [date, setDate] = useState(getLocalAttendanceDate());
  const [reason, setReason] = useState('');
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(type, date, reason); setReason(''); };
  return <form onSubmit={submit} className="border border-slate-200 bg-white p-5">
    <h2 className="text-base font-semibold text-slate-900">Attendance request</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={type} onChange={(event) => setType(event.target.value as AttendanceRequestType)} className="border border-slate-300 px-3 py-2" disabled={disabled}>{requestTypes.map((item) => <option key={item}>{item}</option>)}</select><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border border-slate-300 px-3 py-2" disabled={disabled} /></div>
    <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="mt-3 min-h-24 w-full border border-slate-300 px-3 py-2" disabled={disabled} />
    <button type="submit" disabled={disabled} className="mt-3 bg-green-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Submit request</button>
  </form>;
};
