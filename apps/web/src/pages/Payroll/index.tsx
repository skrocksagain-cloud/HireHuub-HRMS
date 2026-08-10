import { useState } from 'react';
import { DollarSign, Download, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { usePermissions } from '../../hooks/usePermissions';

export default function PayrollPage() {
  const { canAccessModule } = usePermissions();
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [statusMsg, setStatusMsg] = useState('');

  const samplePayrollList = [
    { id: 'pay_1', employeeId: 'HH0001', name: 'Somnath', department: 'Engineering', grossSalary: 185000, tds: 18500, netSalary: 166500, status: 'Processed' },
    { id: 'pay_2', employeeId: 'HH0002', name: 'Amit Kumar', department: 'Staffing', grossSalary: 95000, tds: 9500, netSalary: 85500, status: 'Processed' },
    { id: 'pay_3', employeeId: 'HH0003', name: 'Priya Sharma', department: 'Finance', grossSalary: 110000, tds: 11000, netSalary: 99000, status: 'Processed' },
  ];

  const handleProcessPayroll = () => {
    setStatusMsg(`Payroll for ${selectedMonth} calculated and locked successfully.`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  if (!canAccessModule('finance')) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-500 font-bold text-sm">
          Access Denied. You do not have permission to view Payroll Management.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 p-6">
        
        {/* Workspace Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <DollarSign size={14} />
              <span>Finance & Payroll Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Enterprise Payroll Processing Engine</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Automated salary computation, TDS compliance deductions, net pay calculation, and payslip generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-800 border border-slate-700 text-white font-bold rounded-xl text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleProcessPayroll}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck size={16} /> Process Payroll
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> {statusMsg}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Employees</span>
            <strong className="text-xl font-black text-slate-900 dark:text-white">3</strong>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Salary Pool</span>
            <strong className="text-xl font-black text-emerald-600">₹3,90,000</strong>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">TDS Deductions</span>
            <strong className="text-xl font-black text-amber-600">₹39,000</strong>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Net Salary Disbursed</span>
            <strong className="text-xl font-black text-blue-600">₹3,51,000</strong>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Users size={16} className="text-emerald-600" /> Employee Payroll Disbursal Register ({selectedMonth})
            </h3>
            <button
              type="button"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-200 transition"
            >
              <Download size={14} /> Export Register (CSV)
            </button>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Gross Salary</th>
                <th className="py-2.5 px-3">TDS Deduction</th>
                <th className="py-2.5 px-3">Net Disbursed</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {samplePayrollList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition font-medium">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {row.name} ({row.employeeId})
                  </td>
                  <td className="py-3 px-3 text-slate-500">{row.department}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">₹{row.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 font-mono text-amber-600 font-bold">₹{row.tds.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600">₹{row.netSalary.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px]">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded-lg text-[11px] hover:bg-slate-800 transition"
                    >
                      Payslip PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}