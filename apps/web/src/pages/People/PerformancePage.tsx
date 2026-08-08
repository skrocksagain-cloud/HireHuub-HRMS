import { useState, useEffect } from 'react';
import { Award, Users, CheckCircle2, ChevronRight, Target, Percent } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../ui/PageHeader';
import KpiCard from '../../ui/KpiCard';
import { performanceService, type PerformanceSummary } from './services/performanceService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { permissionService } from '../../core/permissions/permissionService';

interface MonthlyRegisterRow {
  month: string;
  target: number;
  points: number;
  achievementPercent: number;
  totalActive: number;
  status: string;
}

export default function PerformancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [summaries, setSummaries] = useState<PerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    performanceService
      .getAllPerformanceSummaries()
      .then((data) => {
        if (isMounted) {
          setSummaries(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const userRole = user?.role || 'Super Admin';
  const userEmpId = user?.employeeId || user?.id || '';

  // Filter summaries based on PO Permissions:
  // Employee: Own Performance
  // Team Lead: Own Team
  // Department Admin: Own Department
  // Super Admin: Entire Company
  let allowedSummaries = summaries;
  if (!permissionService.isSuperAdmin(userRole)) {
    if (userRole === 'Department Admin') {
      allowedSummaries = summaries.filter((s) => s.department === user?.department);
    } else if (userRole === 'Team Lead' || userRole === 'Team Leader' || userRole === 'Manager') {
      allowedSummaries = summaries.filter((s) => s.department === user?.department);
    } else {
      allowedSummaries = summaries.filter(
        (s) => s.employeeId === userEmpId || s.employeeName === user?.name
      );
    }
  }

  const filteredSummaries = allowedSummaries.filter(
    (s) => selectedDept === 'ALL' || s.department.toLowerCase() === selectedDept.toLowerCase()
  );

  const monthlyTarget = 500;
  const points = filteredSummaries.reduce((acc, s) => acc + s.totalPoints, 0);
  const achievementPercent = Math.round((points / (monthlyTarget || 1)) * 100);
  const totalActive = filteredSummaries.reduce((acc, s) => acc + s.activeCandidateCount, 0);

  const monthlyRegister: MonthlyRegisterRow[] = [
    {
      month: 'August 2026',
      target: monthlyTarget,
      points,
      achievementPercent,
      totalActive,
      status: achievementPercent >= 100 ? 'Achieved' : 'In Progress',
    },
    {
      month: 'July 2026',
      target: 450,
      points: 480,
      achievementPercent: 107,
      totalActive: 24,
      status: 'Achieved',
    },
    {
      month: 'June 2026',
      target: 400,
      points: 410,
      achievementPercent: 102,
      totalActive: 21,
      status: 'Achieved',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Performance Workspace"
          description="Track monthly recruiter performance based on points earned from active candidate placements."
        />

        {/* 4 Performance Dashboard Cards (PO Directive #1) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KpiCard
            metric={{
              id: 'monthly-target',
              title: 'Monthly Target',
              value: `${monthlyTarget} Pts`,
              subtext: 'Monthly Target',
              change: 'Target',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Target size={18} />}
            badgeBg="bg-blue-50 text-blue-700 border-blue-200"
          />
          <KpiCard
            metric={{
              id: 'points',
              title: 'Points',
              value: `${points} Pts`,
              subtext: 'Earned Points',
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
              title: 'Achievement %',
              value: `${achievementPercent}%`,
              subtext: 'Points ÷ Target × 100',
              change: `${achievementPercent}%`,
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Percent size={18} />}
            badgeBg="bg-amber-50 text-amber-700 border-amber-200"
          />
          <KpiCard
            metric={{
              id: 'total-active',
              title: 'Total Active Candidates',
              value: `${totalActive} Candidates`,
              subtext: 'Generated This Month',
              change: 'Active',
              trend: 'neutral',
              category: 'workforce',
            }}
            icon={<Users size={18} />}
            badgeBg="bg-purple-50 text-purple-700 border-purple-200"
          />
        </div>

        {/* Department Filter Tabs (Includes Sales) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
          {['ALL', 'Recruitment', 'Operations', 'Sales', 'Finance'].map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedDept === dept
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>

        {/* Monthly Register Table (PO Directive #1D) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Register</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">Month</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-3">Points</th>
                  <th className="py-3 px-3">Achievement %</th>
                  <th className="py-3 px-3">Total Active</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {monthlyRegister.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{row.month}</td>
                    <td className="py-3 px-3 font-semibold">{row.target} Pts</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">+{row.points} Pts</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{row.achievementPercent}%</td>
                    <td className="py-3 px-3 font-semibold">{row.totalActive} Candidates</td>
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
        </div>

        {/* Client-wise Points Breakdown Table (PO Directive #1E) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Client-wise Points</h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading client points…</div>
          ) : filteredSummaries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No recruiter points available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3">Recruiter Point</th>
                    <th className="py-3 px-3">Active Candidates</th>
                    <th className="py-3 px-3">Total Points</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSummaries.flatMap((emp) =>
                    emp.clientPointsBreakdown.map((cb) => (
                      <tr key={`${emp.employeeId}-${cb.clientId}`} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">{cb.clientName}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{cb.pointsPerCandidate} Pts / Candidate</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{cb.activeCount} Active</td>
                        <td className="py-3 px-3 font-extrabold text-emerald-600 text-sm">+{cb.totalEarned} Pts</td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/people/employees/${emp.employeeId}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[11px] transition"
                          >
                            <span>Profile</span>
                            <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
