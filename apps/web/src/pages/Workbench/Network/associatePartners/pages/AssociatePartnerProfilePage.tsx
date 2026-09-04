import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  MapPin,
  Award,
  Edit2,
  Phone,
  Mail,
  CheckCircle2,
  UserCheck,
  CreditCard,
  Lock,
  UserCheck2,
  Plus,
  Download,
  Upload,
  Link2,
} from 'lucide-react';

import DashboardLayout from '../../../../../layouts/DashboardLayout';
import StatusBadge from '../../../../../ui/StatusBadge';
import KpiCard from '../../../../../ui/KpiCard';
import Drawer from '../../../../../ui/Drawer';
import { useAssociatePartnerProfile } from '../hooks/useAssociatePartners';
import { useAuth } from '../../../../../context/AuthContext';
import { employeeService } from '../../../../Employee/services/employeeService';
import { clientService } from '../../clients/services/clientService';
import { associatePartnerService, type AddActiveCandidateInput } from '../services/associatePartnerService';
import { guestAuthService } from '../../../../../services/guest/guestAuthService';
import { getIndianStates, getCitiesForState } from '../../../../../core/location/indiaLocationMaster';
import type { CandidateSubmissionStatus } from '../../../../../types/AssociatePartner';
import type { Client, UserRole } from '../../../../../types/Client';

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
    addActiveCandidate,
    updateReportingTo,
  } = useAssociatePartnerProfile(id);

  // Role derived from authentication context
  const currentRole: UserRole = (user?.role as UserRole) || 'Super Admin';
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('submissions');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Candidate Status Edit Drawer State
  const [showStatusDrawer, setShowStatusDrawer] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [selectedCandidateName, setSelectedCandidateName] = useState('');
  const [newStatus, setNewStatus] = useState<CandidateSubmissionStatus>('Selected');
  const [rejectionReason, setRejectionReason] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  // Add Active Candidate Drawer State
  const [showAddCandidateDrawer, setShowAddCandidateDrawer] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');
  const [candName, setCandName] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candState, setCandState] = useState('Maharashtra');
  const [candCity, setCandCity] = useState('Mumbai');
  const [candClientId, setCandClientId] = useState('');
  const [candClientName, setCandClientName] = useState('');
  const [candActiveDate, setCandActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [candRole, setCandRole] = useState('');
  const [submittingCand, setSubmittingCand] = useState(false);

  // Bulk Upload State
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkValidationErrors, setBulkValidationErrors] = useState<Array<{ rowNumber: number; error: string }>>([]);
  const [validBulkRows, setValidBulkRows] = useState<AddActiveCandidateInput[]>([]);

  const [employees, setEmployees] = useState<Array<{ id: string; employeeId: string; fullName: string; designation?: string; department?: string }>>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isEditingReportingTo, setIsEditingReportingTo] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');

  const availableStates = getIndianStates();
  const availableCities = getCitiesForState(candState);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [emps, clientList] = await Promise.all([
          employeeService.getEmployees(),
          clientService.getClients(),
        ]);
        if (isMounted) {
          const mappedEmps = emps.map((e) => {
            const empId = e.employeeId || e.id || '';
            return {
              id: e.id || e.employeeId || empId,
              employeeId: empId,
              fullName: `${e.firstName} ${e.lastName}`,
              designation: e.designation,
              department: e.department,
            };
          });
          setEmployees(mappedEmps);
          setClients(clientList);

          if (clientList.length > 0 && !candClientId) {
            setCandClientId(clientList[0].id);
            setCandClientName(clientList[0].name);
          }

          if (mappedEmps.length > 0 && !newEmpId) {
            const firstEmpId = mappedEmps[0].employeeId;
            setNewEmpId(firstEmpId);
            setNewEmpName(`${mappedEmps[0].fullName} (${mappedEmps[0].designation || mappedEmps[0].department || 'Staffing'})`);
          }
        }
      } catch {
        if (isMounted) {
          setEmployees([]);
          setClients([]);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [candClientId, newEmpId]);

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

  const handleGenerateGuestLink = async () => {
    try {
      setActionError('');
      if (!partner?.phone) {
        throw new Error('Partner must have a valid phone number to generate a secure guest link.');
      }
      const token = await guestAuthService.generateInvitation(partner.id, partner.phone);
      const url = `${window.location.origin}/guest/login/${token}`;
      await navigator.clipboard.writeText(url);
      setActionSuccess('Guest Link generated and copied to clipboard successfully!');
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate guest link.');
    }
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

  const handleSingleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setSubmittingCand(true);
    setActionError('');
    try {
      const input: AddActiveCandidateInput = {
        candidateName: candName.trim(),
        phone: candPhone.trim(),
        city: candCity.trim(),
        state: candState.trim(),
        associatePartnerId: partner.id,
        clientId: candClientId,
        clientName: candClientName,
        activeDate: candActiveDate,
        role: candRole.trim(),
      };
      await addActiveCandidate(input);
      setShowAddCandidateDrawer(false);
      resetAddForm();
      setActionSuccess(`Active candidate '${input.candidateName}' added and created in Workforce.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to add active candidate.');
    } finally {
      setSubmittingCand(false);
    }
  };

  const resetAddForm = () => {
    setCandName('');
    setCandPhone('');
    setCandState('Maharashtra');
    setCandCity('Mumbai');
    setCandRole('');
    setCandActiveDate(new Date().toISOString().split('T')[0]);
    setBulkCsvText('');
    setBulkValidationErrors([]);
    setValidBulkRows([]);
  };

  const handleValidateBulk = async () => {
    if (!partner) return;
    setActionError('');
    try {
      const lines = bulkCsvText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new Error('Please enter or paste bulk CSV rows.');
      }

      // Format: Candidate Name, Phone Number, City, State, Role, Active Date, Client ID, Client Name
      const parsedRows = lines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          'Candidate Name': parts[0] || '',
          'Phone Number': parts[1] || '',
          'City': parts[2] || '',
          'State': parts[3] || '',
          'Role': parts[4] || '',
          'Candidate Active Date': parts[5] || candActiveDate,
          'Client ID': parts[6] || candClientId,
          'Client Name': parts[7] || candClientName,
          'Associate Partner ID': partner.id,
        };
      });

      const res = await associatePartnerService.validateBulkCandidateRows(parsedRows, partner.id);
      setValidBulkRows(res.validInputs);
      setBulkValidationErrors(res.invalidRows.map((r) => ({ rowNumber: r.rowNumber, error: r.error })));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to validate bulk CSV inputs.');
    }
  };

  const handleBulkSubmit = async () => {
    if (validBulkRows.length === 0) return;
    setSubmittingCand(true);
    setActionError('');
    try {
      await associatePartnerService.bulkAddActiveCandidates(validBulkRows);
      setShowAddCandidateDrawer(false);
      resetAddForm();
      setActionSuccess(`Successfully added ${validBulkRows.length} active candidate(s) to Workforce.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to submit bulk candidate upload.');
    } finally {
      setSubmittingCand(false);
    }
  };

  const handleExportEligibleCandidates = () => {
    if (!partner) return;
    const eligibleList = partner.submissions.filter((s) => s.eligibilityStatus === 'Eligible');
    if (eligibleList.length === 0) {
      setActionError('No eligible candidates available for export.');
      return;
    }

    const headers = ['Candidate Name', 'Phone Number', 'City', 'State', 'Client Name', 'Active Date', 'Role', 'Tenure', 'Eligibility Status'];
    const rows = eligibleList.map((s) => [
      `"${s.candidateName}"`,
      `"${s.mobileNumber}"`,
      `"${s.city || ''}"`,
      `"${s.state}"`,
      `"${s.clientName}"`,
      `"${s.joiningDate || s.submissionDate}"`,
      `"${s.role || ''}"`,
      `"${s.tenure || '90 Days'}"`,
      `"Yes"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Eligible_Candidates_${partner.partnerCode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActionSuccess(`Exported ${eligibleList.length} eligible candidate(s) to CSV.`);
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

          <button
            type="button"
            onClick={handleGenerateGuestLink}
            className="inline-flex items-center gap-2 text-xs text-emerald-600 font-semibold hover:text-emerald-700 transition"
          >
            <Link2 size={16} /> Generate Guest Link
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
                          const val = e.target.value;
                          setNewEmpId(val);
                          const selText = e.target.options[e.target.selectedIndex]?.text || '';
                          setNewEmpName(selText);
                        }}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
                      >
                        {employees.length === 0 ? (
                          <option value="" disabled>No records available.</option>
                        ) : (
                          employees.map((emp) => (
                            <option key={emp.id || emp.employeeId} value={emp.employeeId || emp.id}>
                              {emp.fullName} ({emp.designation || emp.department || 'Staffing'})
                            </option>
                          ))
                        )}
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

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <UserCheck size={16} /> Candidate Submissions & Active Entries
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
        </nav>
      </div>

      {/* Tab 1: Candidate Submissions */}
      {activeTab === 'submissions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" /> Candidate Submissions & Active Entry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Managed by assigned Hire Huub Employee: <strong className="text-slate-800 font-bold">{partner.reportingTo.employeeName}</strong>. Active candidates automatically sync with Workbench $\rightarrow$ Workforce.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportEligibleCandidates}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs shadow-xs transition"
                title="Export candidates with Eligibility Status = Yes (Eligible)"
              >
                <Download size={14} />
                <span>Export Eligible Candidates</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setShowAddCandidateDrawer(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
              >
                <Plus size={14} />
                <span>Add Active Candidate</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Candidate & Mobile</th>
                  <th className="py-3 px-3">Client & Role</th>
                  <th className="py-3 px-3">Location (City, State)</th>
                  <th className="py-3 px-3">Active / Submission Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Tenure & Eligibility</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {partner.submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
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
                        {sub.role && <div className="text-[10px] text-slate-500 font-medium">{sub.role}</div>}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-700">{sub.city || '—'}, {sub.state}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        {sub.joiningDate || sub.submissionDate}
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
                      <td className="py-3.5 px-3">
                        {sub.eligibilityStatus ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              sub.eligibilityStatus === 'Eligible'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Award size={10} /> {sub.eligibilityStatus === 'Eligible' ? 'Yes' : 'No'} ({sub.tenure || '30 Days'})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
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
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-semibold rounded-lg text-[11px]"
                        >
                          Update Status
                        </button>
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

      {/* Drawer: Add Active Candidate (Single & Bulk Entry) */}
      <Drawer
        isOpen={showAddCandidateDrawer}
        onClose={() => setShowAddCandidateDrawer(false)}
        title={`Add Active Candidate(s) for ${partner.subVendorName}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setAddMode('single')}
              className={`py-2 px-4 font-bold border-b-2 transition ${
                addMode === 'single' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
              }`}
            >
              Single Candidate Entry
            </button>
            <button
              type="button"
              onClick={() => setAddMode('bulk')}
              className={`py-2 px-4 font-bold border-b-2 transition ${
                addMode === 'bulk' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'
              }`}
            >
              Bulk Upload
            </button>
          </div>

          {addMode === 'single' ? (
            <form onSubmit={handleSingleCandidateSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Name *</label>
                <input
                  type="text"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={candPhone}
                  onChange={(e) => setCandPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State *</label>
                  <select
                    value={candState}
                    onChange={(e) => {
                      const st = e.target.value;
                      setCandState(st);
                      const cities = getCitiesForState(st);
                      if (cities.length > 0) setCandCity(cities[0]);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  >
                    {availableStates.map((st) => (
                      <option key={st.stateCode} value={st.stateName}>
                        {st.stateName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  {availableCities.length > 0 ? (
                    <select
                      value={candCity}
                      onChange={(e) => setCandCity(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    >
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={candCity}
                      onChange={(e) => setCandCity(e.target.value)}
                      placeholder="Enter City"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Master *</label>
                <select
                  value={candClientId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setCandClientId(selId);
                    const matched = clients.find((c) => c.id === selId);
                    if (matched) setCandClientName(matched.name);
                  }}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-900"
                >
                  {clients.length === 0 ? (
                    <option value="" disabled>No Client Master records found.</option>
                  ) : (
                    clients.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.name} ({cli.clientId || cli.id})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Candidate Active Date *</label>
                  <input
                    type="date"
                    value={candActiveDate}
                    onChange={(e) => setCandActiveDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                  <input
                    type="text"
                    value={candRole}
                    onChange={(e) => setCandRole(e.target.value)}
                    placeholder="e.g. Delivery Executive"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateDrawer(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCand}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  {submittingCand ? 'Saving Candidate…' : 'Create & Sync to Workforce'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                Paste CSV rows with comma-separated values: <br />
                <code className="font-mono bg-slate-100 p-1 rounded block mt-1 text-[10px]">
                  Candidate Name, Phone Number, City, State, Role, Active Date
                </code>
              </p>

              <textarea
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder={`Ramesh Kumar, 9876543210, Mumbai, Maharashtra, Delivery Executive, 2026-08-01\nSuresh Verma, 9811122233, Bengaluru, Karnataka, Warehouse Staff, 2026-08-02`}
                rows={6}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleValidateBulk}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Upload size={14} /> Validate CSV Rows
                </button>
                {validBulkRows.length > 0 && (
                  <span className="text-emerald-700 font-bold text-xs">
                    ✓ {validBulkRows.length} valid row(s) ready for creation.
                  </span>
                )}
              </div>

              {bulkValidationErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 max-h-40 overflow-y-auto">
                  <span className="font-bold text-rose-900 text-xs block">Invalid Row Errors ({bulkValidationErrors.length}):</span>
                  {bulkValidationErrors.map((err) => (
                    <div key={err.rowNumber} className="text-[11px] text-rose-700 font-mono">
                      Row {err.rowNumber}: {err.error}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateDrawer(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={submittingCand || validBulkRows.length === 0}
                  className={`px-5 py-2 rounded-xl text-white font-semibold shadow-xs ${
                    validBulkRows.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {submittingCand ? 'Importing…' : `Import ${validBulkRows.length} Candidates to Workforce`}
                </button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

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
                Candidate will automatically become <strong className="font-bold">Active</strong> and appear inside Workbench → Workforce.
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
    </DashboardLayout>
  );
}

