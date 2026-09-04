import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  ShieldCheck,
  Award,
  FileCheck,
  LogOut,
  Download,
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
import { useAuth } from '../../../context/AuthContext';

import ExitTab from '../components/ExitTab';
import { payslipService, type PayslipDisplayItem } from '../../../services/payroll/payslipService';

type TabType =
  | 'overview'
  | 'employment'
  | 'attendance'
  | 'leave'
  | 'performance'
  | 'payslips'
  | 'documents'
  | 'timeline'
  | 'audit'
  | 'exit';

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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

  // Permission & Context Evaluation
  const fromSearch = searchParams.get('fromSearch') === 'true';
  const userRole = user?.role || '';
  const currentUserId = user?.employeeId || user?.id || '';
  const targetId = employee?.employeeId || employee?.employeeCode || employee?.id || '';

  const isSelf = Boolean(currentUserId && (currentUserId === targetId || user?.email === employee?.email));
  const isHrOrAdmin =
    ['Super Admin', 'Super_Admin'].includes(userRole?.assignedRole || userRole?.role || userRole?.name || '') ||
    userRole.toLowerCase().includes('admin') ||
    userRole.toLowerCase().includes('hr');

  // Authorized for sensitive personal/identity/bank fields and full HR tabs ONLY when HR/Admin or self viewing, AND NOT in Global Search restricted view
  const canViewSensitive = (isHrOrAdmin || isSelf) && !fromSearch;

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

        // Fetch sensitive sub-module data ONLY for authorized HR/Admin or self
        if (canViewSensitive) {
          const idToFetch = emp.employeeId || emp.employeeCode || emp.id || '';
          const [attList, attReqs, lBalances, lReqs, perfData, docList] = await Promise.all([
            attendanceRepository.getDailyForEmployee(idToFetch, '2026-01-01', '2026-12-31').catch(() => []),
            attendanceRepository.getRequestsForEmployee(idToFetch).catch(() => []),
            leaveRepository.getBalances(idToFetch).catch(() => []),
            leaveRepository.getRequestsForEmployee(idToFetch).catch(() => []),
            performanceService.getPerformanceForEmployee(idToFetch).catch(() => null),
            documentService.getByReference(idToFetch).catch(() => []),
          ]);

          if (!isMounted) return;
          setAttendanceRecords(attList);
          setAttendanceRequests(attReqs);
          setLeaveBalances(lBalances);
          setLeaveRequests(lReqs);
          setPerformance(perfData);
          setDocuments(docList);
        }
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
  }, [employeeId, canViewSensitive]);

  // Data-Layer Security Sanitization: Strip sensitive fields for non-authorized profile access
  const displayEmployee = useMemo(() => {
    if (!employee) return null;
    if (canViewSensitive) return employee;

    return {
      ...employee,
      fatherName: undefined,
      motherName: undefined,
      dateOfBirth: '',
      aadhaarNumber: undefined,
      panNumber: undefined,
      bankName: undefined,
      branchName: undefined,
      accountNumber: undefined,
      ifscCode: undefined,
      salary: undefined,
      monthlyGross: undefined,
      address: '',
    };
  }, [employee, canViewSensitive]);

  // Restrict Tab Navigation List
  const allTabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <User size={14} /> },
    { id: 'employment', label: 'Employment', icon: <Building2 size={14} /> },
    { id: 'attendance', label: 'Attendance', icon: <Clock size={14} /> },
    { id: 'leave', label: 'Leave', icon: <Calendar size={14} /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> },
    { id: 'payslips', label: 'Payslips', icon: <FileText size={14} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
    { id: 'timeline', label: 'Timeline', icon: <History size={14} /> },
    { id: 'audit', label: 'Audit History', icon: <ShieldCheck size={14} /> },
    { id: 'exit', label: 'Exit', icon: <LogOut size={14} /> },
  ];

  const tabs = useMemo(() => {
    if (canViewSensitive) return allTabs;
    // Global Search / Restricted non-HR view shows ONLY Overview, Employment, and Timeline
    return allTabs.filter((t) => ['overview', 'employment', 'timeline'].includes(t.id));
  }, [canViewSensitive]);

  // Enforce tab access safety
  useEffect(() => {
    if (!canViewSensitive && !['overview', 'employment', 'timeline'].includes(activeTab)) {
      setActiveTab('overview');
    }
  }, [canViewSensitive, activeTab]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs font-semibold">
          Loading Employee Master Profile…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee || !displayEmployee) {
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
            System ID: {displayEmployee.id}
          </span>
        </div>

        {/* Enterprise Profile Header Card */}
        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shrink-0 border-2 border-emerald-400 shadow-md">
              {displayEmployee.photoUrl ? (
                <img
                  src={displayEmployee.photoUrl}
                  alt={displayEmployee.fullName}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                displayEmployee.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">{displayEmployee.fullName}</h1>
                <StatusBadge status={displayEmployee.employmentStatus} />
              </div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                {displayEmployee.designation} • {displayEmployee.department}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 mt-2">
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded-md text-emerald-300 border border-slate-700">
                  ID: {displayEmployee.employeeCode || displayEmployee.employeeId}
                </span>
                <span>•</span>
                <span>{displayEmployee.email}</span>
                <span>•</span>
                <span>+91 {displayEmployee.mobileNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards Bar (Only rendered for authorized HR view) */}
        {canViewSensitive && (
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
        )}

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
          {activeTab === 'overview' && <OverviewTab employee={displayEmployee} canViewSensitive={canViewSensitive} />}
          {activeTab === 'employment' && <EmploymentTab employee={displayEmployee} />}
          {canViewSensitive && activeTab === 'attendance' && (
            <AttendanceTab records={attendanceRecords} requests={attendanceRequests} />
          )}
          {canViewSensitive && activeTab === 'leave' && (
            <LeaveTab balances={leaveBalances} requests={leaveRequests} employee={displayEmployee} />
          )}
          {canViewSensitive && activeTab === 'performance' && <PerformanceTab performance={performance} />}
          {canViewSensitive && activeTab === 'payslips' && <PayslipsTab employee={displayEmployee} />}
          {canViewSensitive && activeTab === 'documents' && <DocumentsTab documents={documents} employee={displayEmployee} />}
          {activeTab === 'timeline' && <TimelineTab employee={displayEmployee} />}
          {canViewSensitive && activeTab === 'audit' && <AuditTab employee={displayEmployee} />}
          {canViewSensitive && activeTab === 'exit' && (
            <ExitTab
              employee={displayEmployee}
              onRefresh={() => {
                if (employeeId) {
                  employeeService.getEmployeeById(employeeId).then((emp) => emp && setEmployee(emp));
                }
              }}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({ employee, canViewSensitive }: { employee: Employee; canViewSensitive: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information (Always Allowed in Global Search Overview) */}
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

        {/* Personal Profile (Hidden for Global Search / Restricted View) */}
        {canViewSensitive && (
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
                <span className="text-slate-500 font-medium">Father's Name</span>
                <span className="font-semibold text-slate-900">{employee.fatherName || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Mother's Name</span>
                <span className="font-semibold text-slate-900">{employee.motherName || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Address</span>
                <span className="font-semibold text-slate-900">{employee.address || 'Not Provided'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Identity & Bank Information (Hidden for Global Search / Restricted View) */}
      {canViewSensitive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Identity Information
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Aadhaar Number</span>
                <span className="font-semibold font-mono text-slate-900">
                  {employee.aadhaarNumber
                    ? `XXXX XXXX ${employee.aadhaarNumber.replace(/\s+/g, '').slice(-4)}`
                    : 'Not Provided'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">PAN Number</span>
                <span className="font-semibold font-mono text-slate-900">
                  {employee.panNumber ? `XXXXX${employee.panNumber.trim().slice(-4).toUpperCase()}` : 'Not Provided'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Bank Account Details
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Bank Name</span>
                <span className="font-semibold text-slate-900">{employee.bankName || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Branch Name</span>
                <span className="font-semibold text-slate-900">{employee.branchName || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">Account Number</span>
                <span className="font-semibold font-mono text-slate-900">
                  {employee.accountNumber ? `******${employee.accountNumber.trim().slice(-4)}` : 'Not Provided'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 font-medium">IFSC Code</span>
                <span className="font-semibold font-mono text-slate-900">{employee.ifscCode || 'Not Provided'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmploymentTab({ employee }: { employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">
        Job & Organizational Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-500 font-medium">Department</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{employee.department}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Designation</span>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{employee.designation}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Reporting Manager</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.reportingManager || 'Founder / Director'}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Joining Date</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.joiningDate}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Employment Type</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.employmentType}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Employment Status</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.employmentStatus}</p>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Work Location</span>
          <p className="font-bold text-slate-900 mt-0.5">{employee.workLocation || 'HQ'}</p>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ records }: { records: DailyAttendance[]; requests: AttendanceRequest[] }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">Attendance History</h3>
      <p className="text-xs text-slate-600">Total Records: {records.length}</p>
    </div>
  );
}

function LeaveTab({ balances }: { balances: LeaveBalance[]; requests: LeaveRequest[]; employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">Leave Balances</h3>
      <p className="text-xs text-slate-600">Total Available: {balances.reduce((s, b) => s + b.available, 0)} Days</p>
    </div>
  );
}

function PerformanceTab({ performance }: { performance: PerformanceSummary | null }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">Performance Points</h3>
      <p className="text-xs text-slate-600">Total Earned Points: {performance?.totalPoints ?? 0} Pts</p>
    </div>
  );
}

function DocumentsTab({ documents }: { documents: Document[]; employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">Linked Documents</h3>
      <p className="text-xs text-slate-600">Total Documents: {documents.length} Files</p>
    </div>
  );
}

function TimelineTab({ employee }: { employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">Activity Timeline</h3>
      <div className="space-y-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
          <span className="font-semibold text-slate-800">Joined Organization</span>
          <span className="text-slate-500 font-mono">{employee.joiningDate}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
          <span className="font-semibold text-slate-800">Assigned Department</span>
          <span className="text-slate-500 font-mono">{employee.department}</span>
        </div>
      </div>
    </div>
  );
}

function PayslipsTab({ employee }: { employee: Employee }) {
  const [payslips, setPayslips] = useState<PayslipDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const empId = (employee.employeeId || employee.employeeCode || employee.id || '').trim();

    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const list = await payslipService.getPayslipsForEmployee(empId);
        if (isMounted) setPayslips(list);
      } catch {
        if (isMounted) setErrorMsg('Failed to load payslips.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchPayslips();
    return () => {
      isMounted = false;
    };
  }, [employee]);

  const handleDownload = async (p: PayslipDisplayItem) => {
    try {
      setDownloadingId(p.id);
      setErrorMsg(null);
      await payslipService.downloadPayslipPDF(p.storagePath, `Payslip_${p.employeeId}_${p.month}.pdf`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Payslip PDF is unavailable. Please contact HR.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
          <FileText size={16} className="text-emerald-600" /> Salary Statements & Payslips Register
        </h3>
        <span className="text-xs font-mono font-bold text-slate-500">
          Total: {payslips.length} Statements
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading payslip history…</div>
      ) : payslips.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl font-medium">
          No payslips available.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Deductions</th>
                <th className="p-3 text-right">Net Pay</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Generated Date</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-800">{p.fullMonthName}</td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    ₹{p.gross.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-600">
                    ₹{p.deductions.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    ₹{p.netPay.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono text-slate-500">
                    {p.generatedAt || 'N/A'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      disabled={downloadingId === p.id}
                      onClick={() => void handleDownload(p)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 mx-auto disabled:opacity-50"
                    >
                      <Download size={12} />
                      {downloadingId === p.id ? 'Downloading…' : 'Download PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuditTab({ employee }: { employee: Employee }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-xs">
      <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-3">Audit Logs</h3>
      <p className="text-xs text-slate-600">Audit tracking active for employee {employee.employeeCode || employee.employeeId}.</p>
    </div>
  );
}
