import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  MapPin,
  FileSpreadsheet,
  Award,
  Edit2,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  CreditCard,
  Lock,
  Receipt,
  UserCheck2,
} from 'lucide-react';

import DashboardLayout from '../../../../../layouts/DashboardLayout';
import StatusBadge from '../../../../../ui/StatusBadge';
import KpiCard from '../../../../../ui/KpiCard';
import Drawer from '../../../../../ui/Drawer';
import { useAssociatePartnerProfile } from '../hooks/useAssociatePartners';
import { useAuth } from '../../../../../context/AuthContext';
import type { CandidateSubmissionStatus, CandidateBillingStatus } from '../../../../../types/AssociatePartner';
import type { UserRole } from '../../../../../types/Client';

export default function AssociatePartnerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    partner,
    loading,
    error,
    toggleStatus,
    updateCandidateStatus,
    updateCandidateBillingStatus,
    updateReportingTo,
  } = useAssociatePartnerProfile(id);

  // Role derived from authentication context
  const currentRole: UserRole = (user?.role as UserRole) || 'Super Admin';
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'sync'>('submissions');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Candidate Status Edit Drawer State
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [selectedCandidateName, setSelectedCandidateName] = useState('');
  const [newStatus, setNewStatus] = useState<CandidateSubmissionStatus>('Selected');
  const [rejectionReason, setRejectionReason] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  // Billing Status Edit State
  const [showBillingDrawer, setShowBillingDrawer] = useState(false);
  const [selectedBillingSubId, setSelectedBillingSubId] = useState('');
  const [newBillingStatus, setNewBillingStatus] = useState<CandidateBillingStatus>('Pending Billing');

  // Change Reporting To State (Super Admin Only)
  const [isEditingReportingTo, setIsEditingReportingTo] = useState(false);
  const [newEmpId, setNewEmpId] = useState('emp-001');
  const [newEmpName, setNewEmpName] = useState('Somnath (Account Exec)');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs">Loading Associate Partner Profile…</div>
      </DashboardLayout>
    );
  }

  if (error || !partner) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button
            type="button"
            onClick={() => navigate('/workbench/network/associate-partners')}
            className="inline-flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-4 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Associate Partners List
          </button>
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
            {error || 'Associate Partner record not found.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleStatus = async () => {
    await toggleStatus();
    setActionSuccess(`Partner status toggled successfully to ${partner.status === 'Active' ? 'Inactive' : 'Active'}.`);
  };

  const handleSaveReportingTo = async () => {
    try {
      setActionError('');
      await updateReportingTo(newEmpId, newEmpName, currentRole === 'Super Admin');
      setIsEditingReportingTo(false);
      setActionSuccess(`Assigned Reporting To employee updated to '${newEmpName}' by Super Admin.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update Reporting To employee.');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      await updateCandidateStatus(selectedSubmissionId, newStatus, rejectionReason, joiningDate);
      setShowStatusDrawer(false);
      setActionSuccess(`Candidate '${selectedCandidateName}' status updated to ${newStatus}.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update candidate status.');
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      await updateCandidateBillingStatus(selectedBillingSubId, newBillingStatus, currentRole);
      setShowBillingDrawer(false);
      setActionSuccess(`Candidate billing status updated to ${newBillingStatus} by ${currentRole}.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update billing status.');
    }
  };

  return (
    <DashboardLayout>
      {/* Top Header & Role Switcher */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/workbench/network/associate-partners')}
            className="inline-flex items-center gap-2 text-xs text-slate-500 font-semibold hover:text-emerald-600 transition"
          >
            <ArrowLeft size={16} /> Back to Associate Partners List
          </button>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button type="button" onClick={() => setActionSuccess('')}><Edit2 size={12} /></button>
          </div>
        )}

        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError('')}><Edit2 size={12} /></button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <Users size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{partner.subVendorName}</h1>
                <span className="font-mono text-xs font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                  {partner.partnerCode}
                </span>
                <StatusBadge status={partner.status} />
              </div>

              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <UserCheck size={14} className="text-emerald-600" />
                  <span>Reporting To: </span>
                  {isEditingReportingTo ? (
                    <div className="inline-flex items-center gap-1.5">
                      <select
                        value={newEmpId}
                        onChange={(e) => {
                          setNewEmpId(e.target.value);
                          setNewEmpName(e.target.options[e.target.selectedIndex].text);
                        }}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
                      >
                        <option value="emp-001">Somnath (Account Exec)</option>
                        <option value="emp-002">Anil Kumar (Staffing Lead)</option>
                        <option value="emp-003">Meenal Joshi (Account Exec)</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveReportingTo}
                        className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingReportingTo(false)}
                        className="px-1.5 py-0.5 text-slate-400 text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-emerald-900">{partner.reportingTo.employeeName}</span>
                  )}

                  {currentRole === 'Super Admin' && !isEditingReportingTo && (
                    <button
                      type="button"
                      onClick={() => setIsEditingReportingTo(true)}
                      className="text-slate-400 hover:text-emerald-600 p-0.5"
                      title="Only Super Admin can change Reporting To employee"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>
                <span>•</span>
                <span className="flex items-center gap-1"><MapPin size={12} className="text-emerald-600" /> {partner.city}, {partner.state}</span>
              </div>

              <div className="flex items-center gap-3 mt-2 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                  Sub Vendor Type: {partner.type}
                </span>
                <span className="text-slate-400">
                  No Hire Huub One ERP login (External Sub Vendor)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {currentRole === 'Super Admin' ? (
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`inline-flex items-center gap-2 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition ${
                  partner.status === 'Active'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{partner.status === 'Active' ? 'Deactivate Sub Vendor' : 'Activate Sub Vendor'}</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Lock size={12} /> Status managed by Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Summary Cards (Dashboard Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          metric={{
            id: 'prof-submitted',
            title: 'Submitted',
            value: partner.metrics.totalSubmitted.toString(),
            change: 'Candidates',
            trend: 'up',
            subtext: 'Total candidate entries',
            category: 'candidates',
          }}
          icon={<Users size={18} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <KpiCard
          metric={{
            id: 'prof-selected',
            title: 'Selected',
            value: partner.metrics.selected.toString(),
            change: 'Interviewed',
            trend: 'neutral',
            subtext: 'Selected candidates',
            category: 'candidates',
          }}
          icon={<UserCheck size={18} className="text-teal-600" />}
          badgeBg="bg-teal-50 text-teal-700 border-teal-200"
        />
        <KpiCard
          metric={{
            id: 'prof-joined',
            title: 'Joined',
            value: partner.metrics.joined.toString(),
            change: 'Joined',
            trend: 'up',
            subtext: 'Joining date confirmed',
            category: 'candidates',
          }}
          icon={<CheckCircle2 size={18} className="text-blue-600" />}
          badgeBg="bg-blue-50 text-blue-700 border-blue-200"
        />
        <KpiCard
          metric={{
            id: 'prof-active',
            title: 'Active',
            value: partner.metrics.active.toString(),
            change: 'Workforce',
            trend: 'up',
            subtext: 'Auto workforce entry',
            category: 'candidates',
          }}
          icon={<UserCheck2 size={18} className="text-indigo-600" />}
          badgeBg="bg-indigo-50 text-indigo-700 border-indigo-200"
        />
        <KpiCard
          metric={{
            id: 'prof-eligible',
            title: 'Eligible',
            value: partner.metrics.eligible.toString(),
            change: 'Tenure Passed',
            trend: 'up',
            subtext: 'Completed tenure condition',
            category: 'candidates',
          }}
          icon={<Award size={18} className="text-amber-600" />}
          badgeBg="bg-amber-50 text-amber-700 border-amber-200"
        />
        <KpiCard
          metric={{
            id: 'prof-pending-billing',
            title: 'Pending Billing',
            value: partner.metrics.pendingBilling.toString(),
            change: 'Finance',
            trend: 'neutral',
            subtext: 'Awaiting billing status update',
            category: 'invoices',
          }}
          icon={<Receipt size={18} className="text-rose-600" />}
          badgeBg="bg-rose-50 text-rose-700 border-rose-200"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-2xl shadow-xs">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'submissions'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck size={16} /> Candidate Submissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> Master Info & Bank Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet size={16} /> Integration & Synchronization
          </button>
        </nav>
      </div>

      {/* Tab 1: Candidate Submissions */}
      {activeTab === 'submissions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" /> Candidate Submissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Managed by assigned Hire Huub Employee: <strong className="text-slate-800 font-bold">{partner.reportingTo.employeeName}</strong>. Setting status to <strong className="text-emerald-800">Joined</strong> automatically makes candidate active in Workforce. Rejection requires mandatory reason.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Candidate & Mobile</th>
                  <th className="py-3 px-3">Client & State</th>
                  <th className="py-3 px-3">Submission Date</th>
                  <th className="py-3 px-3">Hire Huub Status</th>
                  <th className="py-3 px-3">Joining Date</th>
                  <th className="py-3 px-3">Tenure & Eligibility</th>
                  <th className="py-3 px-3">Billing Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {partner.submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No candidate submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  partner.submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{sub.candidateName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{sub.mobileNumber}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-emerald-800">{sub.clientName}</div>
                        <div className="text-[10px] text-slate-400">{sub.state}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        {sub.submissionDate}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            sub.status === 'Joined'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : sub.status === 'Selected'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : sub.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                        {sub.status === 'Rejected' && sub.rejectionReason && (
                          <div className="text-[10px] text-rose-600 font-normal mt-0.5 italic max-w-xs">
                            Reason: {sub.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {sub.joiningDate || '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        {sub.eligibilityStatus ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              sub.eligibilityStatus === 'Eligible'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Award size={10} /> {sub.eligibilityStatus} ({sub.tenure || '30 Days'})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {sub.eligibilityStatus === 'Eligible' ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.billingStatus === 'Billed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.billingStatus === 'Paid'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {sub.billingStatus || 'Pending'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]" title="Billing Status available ONLY when Eligible">
                            Locked (Not Eligible)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmissionId(sub.id);
                            setSelectedCandidateName(sub.candidateName);
                            setNewStatus(sub.status);
                            setRejectionReason(sub.rejectionReason || '');
                            setJoiningDate(sub.joiningDate || '');
                            setShowStatusDrawer(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold rounded-lg text-[11px]"
                        >
                          Update Status
                        </button>

                        {sub.eligibilityStatus === 'Eligible' && (currentRole === 'Super Admin' || currentRole === 'Finance') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBillingSubId(sub.id);
                              setNewBillingStatus(sub.billingStatus || 'Pending Billing');
                              setShowBillingDrawer(true);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg text-[11px]"
                            title="Super Admin / Finance: Update Billing Status"
                          >
                            Billing
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Master Info & Bank Details */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users size={18} className="text-emerald-600" /> Sub Vendor Master Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Sub Vendor Code</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{partner.partnerCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Sub Vendor Firm Name</span>
                <span className="font-bold text-slate-800">{partner.subVendorName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Sub Vendor Type</span>
                <span className="font-semibold text-slate-800">{partner.type}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Assigned Reporting To Employee</span>
                <span className="font-bold text-emerald-900 flex items-center gap-1.5 mt-0.5">
                  <UserCheck size={14} className="text-emerald-600" /> {partner.reportingTo.employeeName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Primary Contact Person</span>
                <span className="font-bold text-slate-800">{partner.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email Address</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail size={12} className="text-emerald-600" /> {partner.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Phone Number</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone size={12} className="text-emerald-600" /> {partner.phone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Location</span>
                <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-emerald-600" /> {partner.city}, {partner.state}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard size={18} className="text-emerald-600" /> Bank & Tax Identifiers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Bank Name</span>
                <span className="font-bold text-slate-900">{partner.bankDetails.bankName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Account Number</span>
                <span className="font-mono font-bold text-slate-900">{partner.bankDetails.accountNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">IFSC Code</span>
                <span className="font-mono font-bold text-slate-900">{partner.bankDetails.ifscCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">PAN Number</span>
                <span className="font-mono font-bold text-slate-900">{partner.pan}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400 font-medium block">Aadhaar / Trade Licence</span>
                <span className="font-semibold text-slate-800">{partner.aadhaarOrTradeLicence}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Integration & Synchronization */}
      {activeTab === 'sync' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileSpreadsheet size={18} className="text-emerald-600" /> Integration & Synchronization
          </h3>
          <p className="text-xs text-slate-500">
            Every Associate Partner (Sub Vendor) has one dedicated integration dataset containing <strong className="text-slate-800">Submissions</strong> and <strong className="text-slate-800">Requirements</strong> data. Synchronization updates status, joining date, candidate tenure, and eligibility lifecycle.
          </p>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-semibold block">Configured Integration Sheet ID</span>
                <span className="font-mono text-slate-900 font-bold">{partner.syncMetadata.sheetId || 'Not Configured'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Sync Status</span>
                <span className="font-bold text-emerald-800">{partner.syncMetadata.syncStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="font-semibold text-slate-800">Database Sheet Tab Architecture: Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span className="font-semibold text-slate-800">Requirements Sheet Tab Architecture: Ready</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-slate-600 flex items-center gap-2 text-[11px]">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Prepared for future Apps Script / Drive API synchronization without modifying existing Sub Vendor business workflow.</span>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Update Candidate Status */}
      <Drawer
        isOpen={showStatusDrawer}
        onClose={() => setShowStatusDrawer(false)}
        title={`Update Status for Candidate: ${selectedCandidateName}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500 text-[11px]">
            Assigned employee <strong className="text-slate-800 font-bold">{partner.reportingTo.employeeName}</strong> updates candidate progress.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Candidate Status *</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CandidateSubmissionStatus)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option value="Selected">Selected</option>
              <option value="Joined">Joined (Auto-makes Active in Workforce)</option>
              <option value="Rejected">Rejected (Requires Mandatory Reason)</option>
            </select>
          </div>

          {newStatus === 'Rejected' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <label className="block font-bold text-rose-900 text-xs">Rejection Reason (MANDATORY) *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify exact reason for rejection..."
                rows={3}
                className="w-full p-2 bg-white border border-rose-300 rounded-lg text-rose-950 font-medium"
                required
              />
            </div>
          )}

          {newStatus === 'Joined' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div>
                <label className="block font-bold text-emerald-900 text-xs">Joining Date *</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-900"
                  required
                />
              </div>
              <p className="text-[10px] text-emerald-800">
                Candidate will automatically become <strong className="font-bold">Active</strong> and appear inside Workbench → Workforce. Eligibility will auto-calculate based on Client Tenure.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowStatusDrawer(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              Save Candidate Status
            </button>
          </div>
        </form>
      </Drawer>

      {/* Drawer: Update Candidate Billing Status */}
      <Drawer
        isOpen={showBillingDrawer}
        onClose={() => setShowBillingDrawer(false)}
        title="Update Candidate Billing Status (Finance / Super Admin)"
      >
        <form onSubmit={handleBillingSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500 text-[11px]">
            Billing Status is available ONLY when candidate eligibility is <strong className="text-amber-900 font-bold">Eligible</strong>. Restricted to Super Admin or Finance.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Billing Status *</label>
            <select
              value={newBillingStatus}
              onChange={(e) => setNewBillingStatus(e.target.value as CandidateBillingStatus)}
              className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-amber-950"
            >
              <option value="Pending Billing">Pending Billing</option>
              <option value="Billed">Billed</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowBillingDrawer(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
            >
              Save Billing Status
            </button>
          </div>
        </form>
      </Drawer>
    </DashboardLayout>
  );
}
