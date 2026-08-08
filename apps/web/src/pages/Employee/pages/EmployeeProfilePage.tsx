import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  History,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Award,
  FileCheck,
} from 'lucide-react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import StatusBadge from '../../../ui/StatusBadge';
import KpiCard from '../../../ui/KpiCard';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../types/Employee';
import { attendanceRepository } from '../../Attendance/repositories/attendanceRepository';
import type { DailyAttendance, AttendanceRequest } from '../../Attendance/types/attendance';
import { leaveRepository } from '../../Leave/repositories/leaveRepository';
import type { LeaveBalance, LeaveRequest } from '../../Leave/types/leave';
import { performanceService, type PerformanceSummary } from '../../People/services/performanceService';
import { documentService } from '../../../services/document/documentService';
import type { Document } from '../../../types/Document';

type TabType =
  | 'overview'
  | 'employment'
  | 'attendance'
  | 'leave'
  | 'performance'
  | 'documents'
  | 'timeline'
  | 'audit';

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Live Data States
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendance[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    if (!employeeId) return;

    let isMounted = true;
    setLoading(true);

    const loadProfile = async () => {
      try {
        const emp = await employeeService.getEmployeeById(employeeId);
        if (!isMounted) return;

        if (!emp) {
          setError('Employee record not found.');
          setLoading(false);
          return;
        }

        setEmployee(emp);

        // Fetch live sub-module data concurrently
        const targetId = emp.employeeId || emp.employeeCode || emp.id || '';
        const [attList, attReqs, lBalances, lReqs, perfData, docList] = await Promise.all([
          attendanceRepository.getDailyForEmployee(targetId, '2026-01-01', '2026-12-31').catch(() => []),
          attendanceRepository.getRequestsForEmployee(targetId).catch(() => []),
          leaveRepository.getBalances(targetId).catch(() => []),
          leaveRepository.getRequestsForEmployee(targetId).catch(() => []),
          performanceService.getPerformanceForEmployee(targetId).catch(() => null),
          documentService.getByReference(targetId).catch(() => []),
        ]);

        if (!isMounted) return;
        setAttendanceRecords(attList);
        setAttendanceRequests(attReqs);
        setLeaveBalances(lBalances);
        setLeaveRequests(lReqs);
        setPerformance(perfData);
        setDocuments(docList);
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Error loading profile.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs font-semibold">
          Loading Employee Master Profile…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="inline-flex items-center gap-2 text-xs text-emerald-600 font-semibold hover:underline"
          >
            <ArrowLeft size={14} /> Back to Employees
          </button>
          <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold">
            {error || 'Employee record not found.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <User size={14} /> },
    { id: 'employment', label: 'Employment', icon: <Building2 size={14} /> },
    { id: 'attendance', label: 'Attendance', icon: <Clock size={14} /> },
    { id: 'leave', label: 'Leave', icon: <Calendar size={14} /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <History size={14} /> },
    { id: 'audit', label: 'Audit History', icon: <ShieldCheck size={14} /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Navigation Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="inline-flex items-center gap-2 text-xs text-slate-600 font-semibold hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to Employee Master
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            System ID: {employee.id}
          </span>
        </div>

        {/* Enterprise Profile Header Card */}
        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shrink-0 border-2 border-emerald-400 shadow-md">
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={employee.fullName}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                employee.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">{employee.fullName}</h1>
                <StatusBadge status={employee.employmentStatus} />
              </div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                {employee.designation} • {employee.department}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 mt-2">
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded-md text-emerald-300 border border-slate-700">
                  ID: {employee.employeeCode || employee.employeeId}
                </span>
                <span>•</span>
                <span>{employee.email}</span>
                <span>•</span>
                <span>+91 {employee.mobileNumber}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              type="button"
              onClick={() => navigate(`/employees?edit=${employee.id}`)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs border border-slate-700 transition"
            >
              Edit Master Profile
            </button>
          </div>
        </div>

        {/* KPI Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            metric={{
              id: 'att-days',
              title: 'Attendance Days',
              value: `${attendanceRecords.filter((r) => r.status === 'Present').length} Days`,
              subtext: 'Current Month Present',
              change: 'Active',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Clock size={18} />}
            badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
          <KpiCard
            metric={{
              id: 'leave-bal',
              title: 'Leave Balance',
              value: `${leaveBalances.reduce((sum, b) => sum + b.available, 0)} Days`,
              subtext: 'Available Paid Leaves',
              change: '24 Days/Yr',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Calendar size={18} />}
            badgeBg="bg-blue-50 text-blue-700 border-blue-200"
          />
          <KpiCard
            metric={{
              id: 'rec-pts',
              title: 'Recruiter Points',
              value: String(performance?.totalPoints ?? 0),
              subtext: 'Earned from Client Master',
              change: 'Client Sync',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<Award size={18} />}
            badgeBg="bg-amber-50 text-amber-700 border-amber-200"
          />
          <KpiCard
            metric={{
              id: 'ver-docs',
              title: 'Verified Documents',
              value: `${documents.length} Files`,
              subtext: 'Document Center Linked',
              change: 'Verified',
              trend: 'neutral',
              category: 'people',
            }}
            icon={<FileCheck size={18} />}
            badgeBg="bg-purple-50 text-purple-700 border-purple-200"
          />
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap text-xs transition ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="pt-2">
          {activeTab === 'overview' && <OverviewTab employee={employee} />}
          {activeTab === 'employment' && <EmploymentTab employee={employee} />}
          {activeTab === 'attendance' && (
            <AttendanceTab records={attendanceRecords} requests={attendanceRequests} />
          )}
          {activeTab === 'leave' && (
            <LeaveTab balances={leaveBalances} requests={leaveRequests} employee={employee} />
          )}
          {activeTab === 'performance' && <PerformanceTab performance={performance} />}
          {activeTab === 'documents' && <DocumentsTab documents={documents} employee={employee} />}
          {activeTab === 'timeline' && <TimelineTab employee={employee} />}
          {activeTab === 'audit' && <AuditTab employee={employee} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
            Contact Information
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <Mail size={14} className="text-slate-400" /> Official Email
              </span>
              <span className="font-semibold text-slate-900">{employee.email}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <Phone size={14} className="text-slate-400" /> Contact Mobile
              </span>
              <span className="font-semibold text-slate-900">+91 {employee.mobileNumber}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> Work Location
              </span>
              <span className="font-semibold text-slate-900">{employee.workLocation || 'HQ'}</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
            Personal Profile
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Gender</span>
              <span className="font-semibold text-slate-900">{employee.gender || 'Not Specified'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Date of Birth</span>
              <span className="font-semibold text-slate-900">{employee.dateOfBirth || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 font-medium">Emergency Contact</span>
              <span className="font-semibold text-slate-900">{employee.emergencyContact || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmploymentTab({ employee }: { employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">
        Job & Organizational Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-500">Department</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{employee.department}</p>
        </div>
        <div>
          <span className="text-slate-500">Designation</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{employee.designation}</p>
        </div>
        <div>
          <span className="text-slate-500">Reporting Manager</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.reportingManager || 'Founder / Director'}</p>
        </div>
        <div>
          <span className="text-slate-500">Joining Date</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.joiningDate}</p>
        </div>
        <div>
          <span className="text-slate-500">Employment Type</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.employmentType}</p>
        </div>
        <div>
          <span className="text-slate-500">Probation Rule Status</span>
          <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Probation Rules Active (First 90 Days: 1 SL/Mo)
          </p>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ records, requests }: { records: DailyAttendance[]; requests: AttendanceRequest[] }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
        <div>
          <p className="text-[11px] text-slate-400 font-medium">Recorded Logged Sessions</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{records.length} Sessions Logged</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-slate-400">WFH / Regularization Requests</p>
          <p className="text-lg font-bold text-white mt-0.5">{requests.length} Requests</p>
        </div>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
        <h4 className="font-bold text-slate-900">Attendance Log History</h4>
        {records.length === 0 ? (
          <p className="text-slate-500 py-4 text-center">No attendance records logged yet for this employee.</p>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 10).map((r) => (
              <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{r.attendanceDate}</span>
                  <span className="text-[10px] text-slate-500 ml-2">Work: {r.totalWorkMinutes} mins</span>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LeaveTab({ balances, requests }: { balances: LeaveBalance[]; requests: LeaveRequest[]; employee: Employee }) {
  return (
    <div className="space-y-4 text-xs">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {balances.map((b) => (
          <div key={b.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">{b.leaveType}</span>
            <p className="font-bold text-slate-900 text-xl">{b.available} Days Available</p>
            <p className="text-[10px] text-slate-400">Credited: {b.credited} • Used: {b.used}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
        <h4 className="font-bold text-slate-900">Leave Requests History</h4>
        {requests.length === 0 ? (
          <p className="text-slate-500 py-4 text-center">No leave requests submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{r.leaveType} ({r.days} Days)</span>
                  <p className="text-[10px] text-slate-500">{r.startDate} to {r.endDate} • {r.reason}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PerformanceTab({ performance }: { performance: PerformanceSummary | null }) {
  if (!performance) {
    return <div className="p-6 text-center text-slate-500 text-xs">No performance data generated yet.</div>;
  }

  return (
    <div className="space-y-5 text-xs">
      <div className="p-5 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Client-Point Based Performance
          </span>
          <h3 className="text-2xl font-black text-white mt-1">{performance.totalPoints} Recruiter Points</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Earned from Client Master Recruiter Points via Active Candidate Activations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block">Company Rank</span>
            <span className="font-bold text-emerald-400 text-base">#{performance.companyRank}</span>
          </div>
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block">Dept Rank</span>
            <span className="font-bold text-emerald-400 text-base">#{performance.departmentRank}</span>
          </div>
        </div>
      </div>

      {/* Client-wise Breakdown Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
        <h4 className="font-bold text-slate-900">Client-wise Recruiter Points Breakdown</h4>
        {performance.clientPointsBreakdown.length === 0 ? (
          <p className="text-slate-500 py-3">No active candidate points accumulated yet from Client Master.</p>
        ) : (
          <div className="space-y-2">
            {performance.clientPointsBreakdown.map((cb: { clientId: string; clientName: string; activeCount: number; pointsPerCandidate: number; totalEarned: number }) => (
              <div key={cb.clientId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{cb.clientName}</span>
                  <span className="text-[10px] text-slate-500 ml-2">({cb.activeCount} Active Candidates × {cb.pointsPerCandidate} pts)</span>
                </div>
                <span className="font-bold text-emerald-600 text-sm">+{cb.totalEarned} Points</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations & Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
          <span className="text-[10px] text-emerald-700 font-bold uppercase">Reward Eligibility</span>
          <p className="font-bold text-slate-900">{performance.rewardEligibility}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
          <span className="text-[10px] text-blue-700 font-bold uppercase">Promotion Recommendation</span>
          <p className="font-bold text-slate-900">{performance.promotionRecommendation}</p>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ documents, employee }: { documents: Document[]; employee: Employee }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
        <div>
          <h4 className="font-bold text-slate-900">Employee Document Center Records</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Linked strictly via referenceId ({employee.employeeCode || employee.employeeId}) with Document Center. No duplicate storage.
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
          No document records found in Document Center for reference: <span className="font-mono font-bold text-slate-700">{employee.employeeCode || employee.employeeId}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((docItem) => (
            <div key={docItem.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck size={18} className="text-emerald-600" />
                <div>
                  <span className="font-bold text-slate-900 block">{docItem.title || docItem.documentType}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{docItem.documentId} • {docItem.fileName}</span>
                </div>
              </div>
              <StatusBadge status={docItem.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ employee }: { employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 text-xs">
      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Employee Lifecycle Timeline</h4>
      <div className="space-y-4 pl-2">
        <div className="relative pl-6 border-l-2 border-emerald-500">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white" />
          <p className="font-bold text-slate-900">Employee Onboarded & Master Record Created</p>
          <p className="text-[10px] text-slate-500">{employee.joiningDate} • Initial Status: {employee.employmentStatus}</p>
        </div>
        <div className="relative pl-6 border-l-2 border-blue-500">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white" />
          <p className="font-bold text-slate-900">Assigned Department & Manager</p>
          <p className="text-[10px] text-slate-500">{employee.department} • Manager: {employee.reportingManager || 'Leadership'}</p>
        </div>
      </div>
    </div>
  );
}

function AuditTab({ employee }: { employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 text-xs">
      <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Audit Log Trail</h4>
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
        <p className="font-bold text-slate-800">Master Record Modification Audit</p>
        <p className="text-[10px] text-slate-500">Target Employee ID: {employee.employeeCode || employee.employeeId}</p>
      </div>
    </div>
  );
}
