import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, CheckCircle2, ShieldCheck, UserCheck, Layers, FileText } from 'lucide-react';
import type { CompanySettings, PayrollCalculationResult, EmployeeSalaryProfile } from '../../../types/Admin';
import { payrollEngineService } from '../../../services/payroll/payrollEngineService';
import { adminService } from '../../../services/admin/adminService';

interface PayslipGeneratorDrawerProps {
  companySettings?: CompanySettings | null;
  onClose: () => void;
}

export const PayslipGeneratorDrawer: React.FC<PayslipGeneratorDrawerProps> = ({
  companySettings,
  onClose,
}) => {
  const brandList = companySettings?.brandProfilesList || [];
  const [selectedBrandId, setSelectedBrandId] = useState<string>(brandList[0]?.id || '');
  const [profiles, setProfiles] = useState<EmployeeSalaryProfile[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07');

  const [calcResult, setCalcResult] = useState<PayrollCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      const list = await payrollEngineService.getEmployeeSalaryProfiles(selectedBrandId);
      setProfiles(list);
      if (list.length > 0) setSelectedEmpId(list[0].employeeId);
    };
    loadProfiles();
  }, [selectedBrandId]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const runRecord = await payrollEngineService.executePayrollRun(selectedMonth, 2026, selectedBrandId);
      const matched = runRecord.employeeResults.find((r) => r.employeeId === selectedEmpId) || runRecord.employeeResults[0];
      setCalcResult(matched || null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGeneratePayslipSnapshot = async () => {
    if (!calcResult) return;
    setIsGenerated(true);
    await adminService.logAuditEntry({
      whoId: 'admin',
      whoName: 'Super Admin',
      whatAction: 'GENERATE_INDIVIDUAL_PAYSLIP',
      entityName: 'GeneratedPayslipRecord',
      entityId: `pslip-${selectedMonth}-${calcResult.employeeId}`,
      oldValue: '',
      newValue: `Net Pay ₹${calcResult.netSalary.toLocaleString('en-IN')} for ${calcResult.employeeName}`,
    });

    setTimeout(() => {
      setIsGenerated(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full h-[620px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Generate Individual Payslip Snapshot</h3>
              <p className="text-xs text-slate-400">
                Formula-driven calculation consuming Attendance, Performance & Brand Statutory Rules.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Controls */}
          <div className="w-1/2 border-r border-slate-800 p-5 space-y-4 overflow-y-auto bg-slate-900/60 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" /> Target Brand Profile
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-sky-300 font-bold focus:outline-none"
              >
                {brandList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-400" /> Select Employee
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-semibold focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.employeeId} value={p.employeeId}>
                    {p.employeeName} (₹{p.monthlyCtc.toLocaleString('en-IN')}/mo)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" /> Payroll Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 transition"
            >
              {isCalculating ? 'Calculating Formulas...' : 'Run Dynamic Payroll Formula Calculation'}
            </button>

            {isGenerated ? (
              <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Payslip Snapshot generated and saved to history!
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePayslipSnapshot}
                disabled={!calcResult}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xl shadow-sky-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Generate Immutable Payslip Snapshot
              </button>
            )}
          </div>

          {/* Breakdown Preview */}
          <div className="w-1/2 bg-slate-950 p-5 overflow-y-auto space-y-4 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-sky-400" /> Calculation Breakdown Preview
            </h4>

            {calcResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px]">Monthly CTC</span>
                    <div className="font-bold text-white text-sm">₹{calcResult.monthlyCtc.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Net Payable Salary</span>
                    <div className="font-extrabold text-emerald-400 text-base">₹{calcResult.netSalary.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Earnings */}
                <div>
                  <h5 className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider mb-2">Earnings Breakdown</h5>
                  <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    {calcResult.earningsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-emerald-300 font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between font-bold text-xs pt-2 border-t border-slate-700 text-white">
                      <span>Total Gross Earnings</span>
                      <span className="text-emerald-400">₹{calcResult.grossEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h5 className="font-bold text-rose-400 text-[11px] uppercase tracking-wider mb-2">Deductions Breakdown</h5>
                  <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    {calcResult.deductionsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-rose-300 font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between font-bold text-xs pt-2 border-t border-slate-700 text-white">
                      <span>Total Deductions</span>
                      <span className="text-rose-400">₹{calcResult.totalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Click "Run Dynamic Payroll Formula Calculation" to preview breakdown.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
