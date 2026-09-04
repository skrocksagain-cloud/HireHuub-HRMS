/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { Award, CheckCircle2, Target, Percent, Plus, Layers, X, DollarSign } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../ui/PageHeader';
import KpiCard from '../../ui/KpiCard';
import {
  performanceService,
  type PerformanceSummary,
  type MonthlyRegisterItem,
} from './services/performanceService';
import { adminService } from '../../services/admin/adminService';
import { useAuth } from '../../context/AuthContext';

import type { BrandProfile } from '../../types/Admin';

export default function PerformancePage() {
  const { user } = useAuth();

  const availableMonths = useMemo(() => {
    const start = new Date(2026, 5); // June 2026
    const current = new Date();
    const months: string[] = [];
    
    let d = new Date(current.getFullYear(), current.getMonth(), 1);
    const minDate = new Date(start.getFullYear(), start.getMonth(), 1);

    while (d >= minDate) {
      const monthName = d.toLocaleString('en-US', { month: 'long' });
      months.push(`${monthName} ${d.getFullYear()}`);
      d.setMonth(d.getMonth() - 1);
    }
    
    return months.length > 0 ? months : ['August 2026', 'July 2026', 'June 2026'];
  }, []);

  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0]);
  const [summaries, setSummaries] = useState<PerformanceSummary[]>([]);
  const [monthlyRegister, setMonthlyRegister] = useState<MonthlyRegisterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTarget, setSavingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Target Modal Drawer State
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetEmpId, setTargetEmpId] = useState<string>('');
  const [targetBrandId, setTargetBrandId] = useState<string>('');
  const [targetPointsInput, setTargetPointsInput] = useState<number>(500);

  const activeRole: any = null;  // Placeholder for future authorization implementation
  const userEmpId = user?.employeeId || user?.id || '';
  const canManage = true; // Authorization is in bypass mode
  const viewScope = 'GLOBAL'; // Authorization is in bypass mode, always GLOBAL scope

  // Load Active Brands from Company Settings
  useEffect(() => {
    adminService
      .getCompanySettings()
      .then((settings) => {
        const activeBrands = (settings?.brandProfilesList || []).filter(
          (b) => b.isActive !== false
        );
        setBrands(activeBrands);
        if (activeBrands.length > 0) {
          setSelectedBrandId((prev) => prev || activeBrands[0].id);
        }
      })
      .catch(() => setBrands([]));
  }, []);

  // Selected Brand Profile Object
  const selectedBrandObj = useMemo(() => {
    return brands.find((b) => b.id === selectedBrandId) || brands[0];
  }, [brands, selectedBrandId]);

  // Load Brand-Scoped Performance & Target Data
  const loadPerformanceData = async () => {
    if (!selectedBrandId) return;
    try {
      setLoading(true);
      setError(null);
      const actorContext = {
        assignedRole: (user as any)?.authorization?.role || user?.assignedRole,
        departmentId: user?.departmentId,
        employeeId: user?.employeeId || user?.id,
      };
      const res = await performanceService.getPerformanceForBrand(selectedBrandId, selectedMonth, actorContext);
      setSummaries(res.summaries);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load performance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBrandId) {
      void loadPerformanceData();
    }
  }, [selectedBrandId, selectedMonth]);

  // Filter Active Employees Assigned to Selected Brand
  const filteredSummaries = useMemo(() => {
    if (!selectedBrandId) return [];
    const firstBrandId = brands[0]?.id;

    return summaries.filter((s) => {
      const isActive = s.employmentStatus === 'Active';
      const isStaffing = s.department === 'Staffing';
      if (!isActive || !isStaffing) return false;

      // Brand Filter Scoping: Must belong to selected active brand
      if (!s.brandId) return selectedBrandId === firstBrandId;
      return (
        s.brandId === selectedBrandId ||
        (selectedBrandObj &&
          s.brandName?.toLowerCase() === selectedBrandObj.brandName.toLowerCase())
      );
    });
  }, [summaries, selectedBrandId, selectedBrandObj, brands, activeRole, viewScope, userEmpId, user?.department, user?.name]);

  // Compute Brand Aggregate KPIs
  const totalMonthlyTarget = filteredSummaries.reduce((acc, s) => acc + (s.targetPoints || 0), 0);
  const totalAchievedPoints = filteredSummaries.reduce((acc, s) => acc + s.totalPoints, 0);
  const achievementPercent =
    totalMonthlyTarget > 0 ? Math.round((totalAchievedPoints / totalMonthlyTarget) * 100) : 0;
  const totalIncentive = filteredSummaries.reduce((acc, s) => acc + (s.incentiveAmount || 0), 0);
  const totalActiveCandidates = filteredSummaries.reduce(
    (acc, s) => acc + s.activeCandidateCount,
    0
  );

  // Load Monthly Register dynamically from Firestore
  useEffect(() => {
    if (!selectedBrandId) {
      setMonthlyRegister([]);
      return;
    }
    performanceService
      .getMonthlyRegisterForBrand(
        selectedBrandId,
        selectedMonth,
        totalMonthlyTarget,
        totalAchievedPoints,
        totalActiveCandidates
      )
      .then((items) => {
        // Enrich monthly register row with aggregate incentive for current month
        const updated = items.map((row) =>
          row.month === selectedMonth ? { ...row, incentiveAmount: totalIncentive } : row
        );
        setMonthlyRegister(updated);
      })
      .catch(() => setMonthlyRegister([]));
  }, [selectedBrandId, selectedMonth, totalMonthlyTarget, totalAchievedPoints, totalActiveCandidates, totalIncentive]);

  const handleOpenTargetModal = (empId?: string) => {
    if (empId) setTargetEmpId(empId);
    else if (filteredSummaries.length > 0) setTargetEmpId(filteredSummaries[0].employeeId);

    const initialBrand = selectedBrandId || brands[0]?.id || '';
    setTargetBrandId(initialBrand);
    setShowTargetModal(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmpId || !targetBrandId || !targetPointsInput) {
      setError('Employee, Brand, and Target Points are required.');
      return;
    }

    const empObj = filteredSummaries.find((s) => s.employeeId === targetEmpId);
    const brandObj = brands.find((b) => b.id === targetBrandId);

    try {
      setSavingTarget(true);
      setError(null);
      await performanceService.assignTarget({
        employeeId: targetEmpId,
        employeeName: empObj?.employeeName || 'Employee',
        employeeCode: empObj?.employeeCode || targetEmpId,
        brandId: targetBrandId,
        brandName: brandObj?.brandName || 'Brand',
        month: selectedMonth,
        targetPoints: Number(targetPointsInput),
      });

      setShowTargetModal(false);
      await loadPerformanceData();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save target.');
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Performance Workspace"
          description={`Brand-scoped performance targets, achieved points, and calculated incentives for ${
            selectedBrandObj?.brandName || 'Selected Brand'
          }.`}
        />

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </p>
        )}

        {/* 4 Brand Performance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KpiCard
            metric={{
              id: 'monthly-target',
              title: 'Target',
              value: totalMonthlyTarget > 0 ? `${totalMonthlyTarget} Pts` : 'Target not set',
              subtext: `${selectedBrandObj?.brandName || 'Brand'} (${selectedMonth})`,
              change: 'Target',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Target size={18} />}
            badgeBg="bg-blue-50 text-blue-700 border-blue-200"
          />
          <KpiCard
            metric={{
              id: 'achieved-points',
              title: 'Achieved',
              value: `${totalAchievedPoints} Pts`,
              subtext: 'Actual Performance Points',
              change: 'Active',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Award size={18} />}
            badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
          <KpiCard
            metric={{
              id: 'achievement-pct',
              title: 'Achievement (%)',
              value: `${achievementPercent}%`,
              subtext: '(Achieved ÷ Target) × 100',
              change: `${achievementPercent}%`,
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Percent size={18} />}
            badgeBg="bg-amber-50 text-amber-700 border-amber-200"
          />
          <KpiCard
            metric={{
              id: 'incentive-amount',
              title: 'Incentive Amount',
              value: `₹${totalIncentive.toLocaleString('en-IN')}`,
              subtext: 'Authoritative Slab Engine',
              change: 'Incentive',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<DollarSign size={18} />}
            badgeBg="bg-purple-50 text-purple-700 border-purple-200"
          />
        </div>

        {/* Active Brand Selector & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers size={14} className="text-slate-400" /> Select Active Brand:
            </span>
            {brands.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No active brands configured.</span>
            ) : (
              brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setSelectedBrandId(brand.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedBrandId === brand.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {brand.brandName}
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select Performance Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>

            {canManage && brands.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenTargetModal()}
                className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} /> Assign Target
              </button>
            )}
          </div>
        </div>

        {/* Employee Performance Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              Employee Performance — {selectedBrandObj?.brandName || 'Brand'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {filteredSummaries.length} Active Employees
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading brand performance data…</div>
          ) : brands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium text-slate-400">
              No active brands configured.
            </div>
          ) : filteredSummaries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium text-slate-400">
              No active employees assigned to this brand.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Employee</th>
                    <th className="py-3 px-3">Designation</th>
                    <th className="py-3 px-3">Target</th>
                    <th className="py-3 px-3">Achieved</th>
                    <th className="py-3 px-3">Achievement (%)</th>
                    <th className="py-3 px-3">Incentive Amount</th>
                    <th className="py-3 px-3">Active Candidates</th>
                    <th className="py-3 px-3">Status</th>
                    {canManage && <th className="py-3 px-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSummaries.map((emp) => {
                    const statusText =
                      emp.targetPoints > 0 && emp.achievementPercent >= 100 ? 'Achieved' : 'In Progress';
                    const incAmt = emp.incentiveAmount || 0;

                    return (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{emp.employeeName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{emp.employeeCode}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">{emp.designation}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {emp.targetPoints > 0 ? `${emp.targetPoints} Pts` : 'Not Set'}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-600">+{emp.totalPoints} Pts</td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {emp.targetPoints > 0 ? `${emp.achievementPercent}%` : '—'}
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-700">
                          ₹{incAmt.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-600">
                          {emp.activeCandidateCount} Candidates
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              statusText === 'Achieved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <CheckCircle2 size={12} /> {statusText}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenTargetModal(emp.employeeId)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                            >
                              Assign Target
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly Register Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm">
            Monthly Register — {selectedBrandObj?.brandName || 'Brand'}
          </h3>

          {monthlyRegister.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No performance history available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Month</th>
                    <th className="py-3 px-3">Target</th>
                    <th className="py-3 px-3">Achieved</th>
                    <th className="py-3 px-3">Achievement (%)</th>
                    <th className="py-3 px-3">Incentive Amount</th>
                    <th className="py-3 px-3">Total Active Candidates</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyRegister.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">{row.month}</td>
                      <td className="py-3 px-3 font-semibold">
                        {row.target > 0 ? `${row.target} Pts` : 'Not Set'}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">+{row.achieved} Pts</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{row.achievementPercent}%</td>
                      <td className="py-3 px-3 font-bold text-purple-700">
                        ₹{row.incentiveAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">
                        {row.totalActive} Candidates
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                            row.status === 'Achieved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <CheckCircle2 size={12} /> {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Target Assignment Modal Drawer */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Assign Performance Target</h3>
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Employee *
                </label>
                <select
                  aria-label="Select Employee"
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {filteredSummaries.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeName} ({emp.employeeCode}) — {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Brand *</label>
                <select
                  aria-label="Select Brand"
                  value={targetBrandId}
                  onChange={(e) => setTargetBrandId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective Month *
                </label>
                <input
                  type="text"
                  aria-label="Effective Month"
                  value={selectedMonth}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Points *</label>
                <input
                  type="number"
                  aria-label="Target Points"
                  min="1"
                  value={targetPointsInput}
                  onChange={(e) => setTargetPointsInput(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  disabled={savingTarget}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {savingTarget ? 'Saving…' : 'Save Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
