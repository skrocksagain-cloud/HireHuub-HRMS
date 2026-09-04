import type { PayoutPayrollRow } from '../types';

export default function PayoutExceptionsTable({ exceptions }: { exceptions: PayoutPayrollRow[] }) {
  return (
    <div className="mt-8">
      <h3 className="font-bold text-lg text-rose-700 mb-4">Exceptions / Missing Bank Details ({exceptions.length})</h3>
      <div className="bg-white rounded-xl border border-rose-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-rose-50 border-b border-rose-200 text-rose-800 font-bold">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Employee ID</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Exceptions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100">
            {exceptions.map((r, i) => (
              <tr key={i} className="hover:bg-rose-50/50">
                <td className="p-3 font-medium text-slate-800">{r.candidateName}</td>
                <td className="p-3 text-slate-600 font-mono text-xs">{r.employeeId}</td>
                <td className="p-3 font-bold text-slate-700">₹{r.amount.toLocaleString('en-IN')}</td>
                <td className="p-3 text-rose-600 font-medium text-xs">
                  {r.exceptions.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
