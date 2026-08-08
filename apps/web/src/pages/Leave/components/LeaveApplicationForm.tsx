import { useState, type FormEvent } from 'react';
import type { LeaveApplicationInput } from '../types/leave';

interface Props {
  disabled: boolean;
  onSubmit: (input: LeaveApplicationInput) => void;
}

export const LeaveApplicationForm = ({ disabled, onSubmit }: Props) => {
  const [input, setInput] = useState<LeaveApplicationInput>({
    requestType: 'Leave',
    leaveType: 'Sick Leave (SL)',
    startDate: '',
    endDate: '',
    reason: '',
    medicalCertificateReference: '',
  });

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(input);
    setInput({ ...input, reason: '', medicalCertificateReference: '' });
  };

  const update = (changes: Partial<LeaveApplicationInput>): void => setInput({ ...input, ...changes });

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Apply for Leave</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          aria-label="Request type"
          value={input.requestType}
          onChange={(event) => update({ requestType: event.target.value as LeaveApplicationInput['requestType'] })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
          disabled={disabled}
        >
          <option>Leave</option>
          <option>Comp Off</option>
        </select>

        {/* PO Approved Dropdown for Leave Type */}
        <select
          aria-label="Leave type"
          value={input.leaveType}
          onChange={(event) => update({ leaveType: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
          disabled={disabled}
        >
          <option value="Sick Leave (SL)">Sick Leave (SL)</option>
          <option value="Casual Leave (CL)">Casual Leave (CL)</option>
          <option value="Paid Leave (PL)">Paid Leave (PL)</option>
          <option value="Leave Without Pay (LWP)">Leave Without Pay (LWP)</option>
        </select>

        <input
          aria-label="Start date"
          type="date"
          value={input.startDate}
          onChange={(event) => update({ startDate: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          disabled={disabled}
          required
        />
        <input
          aria-label="End date"
          type="date"
          value={input.endDate}
          onChange={(event) => update({ endDate: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
          disabled={disabled}
          required
        />
      </div>

      <input
        aria-label="Medical certificate reference"
        value={input.medicalCertificateReference}
        onChange={(event) => update({ medicalCertificateReference: event.target.value })}
        placeholder="Medical certificate reference (if applicable)"
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
        disabled={disabled}
      />
      <textarea
        aria-label="Leave reason"
        value={input.reason}
        onChange={(event) => update({ reason: event.target.value })}
        placeholder="Reason for leave application"
        className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
        disabled={disabled}
        required
      />
      <button
        type="submit"
        disabled={disabled}
        className="mt-3 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition"
      >
        Submit Request
      </button>
    </form>
  );
};
