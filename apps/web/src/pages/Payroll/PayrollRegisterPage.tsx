import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { canReadFinanceGlobally } from '../../core/authorization/financeAuthorization';
import { payrollRegisterService } from './services/payrollRegisterService';
import type { PayrollRegisterRun, AttendanceOverride } from './types';
import { Loader2, RefreshCw, CheckCircle2, FileText, CreditCard} from 'lucide-react';
import { adminService } from '../../services/admin/adminService';
import type { CompanyBankAccountV2 } from '../../types/Admin';

export default function PayrollRegisterPage() {
  const { user } = useAuth();
  const canReadPayroll = canReadFinanceGlobally({
    role: user?.authorization?.role || user?.assignedRole,
  });

  const [month, setMonth] = useState('2026-09');
  const [run, setRun] = useState<PayrollRegisterRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bankAccounts, setBankAccounts] = useState<CompanyBankAccountV2[]>([]);
  const [selectedDebitAccount, setSelectedDebitAccount] = useState<string>('');

  useEffect(() => {
    adminService.getCompanySettings().then(res => {
      if (res?.bankAccountsV2) {
        setBankAccounts(res.bankAccountsV2.filter(b => b.isActive));
      }
    });
  }, []);
  const [overrides, setOverrides] = useState<Record<string, AttendanceOverride>>({});

  useEffect(() => {
    if (canReadPayroll && month) {
      loadRun();
    }
  }, [month, canReadPayroll]);

  const loadRun = async () => {
    setLoading(true);
    setError('');
    try {
      const existing = await payrollRegisterService.getPayrollRun(month);
      setRun(existing);
      setOverrides({});
    } catch (err: any) {
      setError(err.message || 'Failed to load run');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError('');
    try {
      const calculated = await payrollRegisterService.calculatePayroll(month, overrides);
      setRun(calculated);
      await payrollRegisterService.saveRun(calculated);
    } catch (err: any) {
      setError(err.message || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!run) return;
    setLoading(true);
    setError('');
    try {
      await payrollRegisterService.finalizeRun(run.id);
      await loadRun();
    } catch (err: any) {
      setError(err.message || 'Finalize failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayslips = async () => {
    if (!run) return;
    setLoading(true);
    setError('');
    try {
      await payrollRegisterService.generatePayslips(run);
      alert('Payslips generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Payslip generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBankProcess = async () => {
    if (!run) return;
    if (!selectedDebitAccount) {
       setError('Please select a valid Debit Account Number before generating the Bank Excel.');
       return;
    }
    setLoading(true);
    setError('');
    try {
      await payrollRegisterService.generateBankProcess(run, selectedDebitAccount);
    } catch (err: any) {
      setError(err.message || 'Bank process failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideChange = (empId: string, field: keyof AttendanceOverride, value: number) => {
    setOverrides(prev => {
      const current = prev[empId] || {
        employeeId: empId,
        present: run?.records.find(r => r.employeeId === empId)?.attendance.present || 0,
        leave: run?.records.find(r => r.employeeId === empId)?.attendance.leave || 0,
        weekOff: run?.records.find(r => r.employeeId === empId)?.attendance.weekOff || 0,
        holiday: run?.records.find(r => r.employeeId === empId)?.attendance.holiday || 0,
        absent: run?.records.find(r => r.employeeId === empId)?.attendance.absent || 0,
      };
      
      return {
        ...prev,
        [empId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  if (!canReadPayroll) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-rose-600 font-bold">
          Your canonical authorization role cannot access organization payroll data.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans text-slate-100 p-2">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-0.5">
                <span>Finance</span>
                <span className="text-slate-600">&rarr;</span>
                <span className="text-sky-400 font-bold">Internal Payroll</span>
              </div>
              <h1 className="text-xl font-extrabold text-white">Payroll Register</h1>
            </div>
          </div>
          <div className="flex gap-4">
            <input 
              type="month" 
              value={month} 
              onChange={e => setMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
            />
            <button 
              onClick={handleCalculate}
              disabled={loading || run?.status === 'Finalized'}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-bold disabled:opacity-50 flex gap-2 items-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {run ? 'Recalculate' : 'Load / Calculate Payroll'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        {run && (
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap bg-slate-900 border border-slate-800 p-4 rounded-xl items-center">
              <span className="text-xs font-bold px-3 py-1 rounded bg-slate-800 border border-slate-700">
                Status: {run.status.toUpperCase()}
              </span>
              
              {run.status === 'Draft' || run.status === 'Calculated' ? (
                <button onClick={handleFinalize} disabled={loading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4" /> Finalize Payroll
                </button>
              ) : null}
              
              {run.status === 'Finalized' && (
                <>
                  <button onClick={handlePayslips} disabled={loading} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold flex gap-2 items-center">
                    <FileText className="w-4 h-4" /> Generate Payslips
                  </button>
                  <div className="flex items-center gap-2">
                      <div className="flex flex-col text-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold px-1 uppercase">Debit Account</span>
                        <select 
                           className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
                           value={selectedDebitAccount}
                           onChange={e => setSelectedDebitAccount(e.target.value)}
                        >
                          <option value="">Select Active Company Bank Account ▼</option>
                          {bankAccounts.map(b => (
                            <option key={b.id} value={b.accountNumber}>{b.bankName} - {b.accountNumber}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={handleBankProcess} disabled={loading || !selectedDebitAccount} className="px-4 py-2 mt-4 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold flex gap-2 items-center disabled:opacity-50">
                        <CreditCard className="w-4 h-4" /> Download Bank Excel
                      </button>
                    </div>
                </>
              )}
            </div>

            <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3 text-center">P</th>
                    <th className="p-3 text-center">L</th>
                    <th className="p-3 text-center">WO</th>
                    <th className="p-3 text-center">H</th>
                    <th className="p-3 text-center">A</th>
                    <th className="p-3 text-center">Work Days</th>
                    <th className="p-3 text-center">C/F Days</th>
                    <th className="p-3 text-right">Gross</th>
                    <th className="p-3 text-right">PF</th>
                    <th className="p-3 text-right">ESI</th>
                    <th className="p-3 text-right">PT</th>
                    <th className="p-3 text-right">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {run.records.map(record => {
                    const o = overrides[record.employeeId];
                    const isDraft = run.status !== 'Finalized';
                    return (
                      <tr key={record.employeeId} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{record.employeeName}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{record.employeeCode}</div>
                        </td>
                        <td className="p-3 text-center">
                          {isDraft ? (
                            <input type="number" className="w-12 bg-white border border-slate-300 rounded text-slate-800 px-1 py-0.5 text-center" value={o?.present ?? record.attendance.present} onChange={e => handleOverrideChange(record.employeeId, 'present', Number(e.target.value))} />
                          ) : record.attendance.present}
                        </td>
                        <td className="p-3 text-center">
                          {isDraft ? (
                            <input type="number" className="w-12 bg-white border border-slate-300 rounded text-slate-800 px-1 py-0.5 text-center" value={o?.leave ?? record.attendance.leave} onChange={e => handleOverrideChange(record.employeeId, 'leave', Number(e.target.value))} />
                          ) : record.attendance.leave}
                        </td>
                        <td className="p-3 text-center">
                          {isDraft ? (
                            <input type="number" className="w-12 bg-white border border-slate-300 rounded text-slate-800 px-1 py-0.5 text-center" value={o?.weekOff ?? record.attendance.weekOff} onChange={e => handleOverrideChange(record.employeeId, 'weekOff', Number(e.target.value))} />
                          ) : record.attendance.weekOff}
                        </td>
                        <td className="p-3 text-center">
                          {isDraft ? (
                            <input type="number" className="w-12 bg-white border border-slate-300 rounded text-slate-800 px-1 py-0.5 text-center" value={o?.holiday ?? record.attendance.holiday} onChange={e => handleOverrideChange(record.employeeId, 'holiday', Number(e.target.value))} />
                          ) : record.attendance.holiday}
                        </td>
                        <td className="p-3 text-center">
                          {isDraft ? (
                            <input type="number" className="w-12 bg-white border border-slate-300 rounded text-slate-800 px-1 py-0.5 text-center" value={o?.absent ?? record.attendance.absent} onChange={e => handleOverrideChange(record.employeeId, 'absent', Number(e.target.value))} />
                          ) : record.attendance.absent}
                        </td>
                        <td className="p-3 text-center font-bold text-sky-400">{record.currentMonthPayableDays}</td>
                        <td className="p-3 text-center font-bold text-amber-400">{record.carryForwardPayableDays}</td>
                        <td className="p-3 text-right font-mono text-emerald-400">₹{record.grossSalary.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-rose-400">{record.calculatedPf || '-'}</td>
                        <td className="p-3 text-right font-mono text-rose-400">{record.calculatedEsic || '-'}</td>
                        <td className="p-3 text-right font-mono text-rose-400">{record.calculatedPt || '-'}</td>
                        <td className="p-3 text-right font-mono text-white font-bold">₹{record.netSalary.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
