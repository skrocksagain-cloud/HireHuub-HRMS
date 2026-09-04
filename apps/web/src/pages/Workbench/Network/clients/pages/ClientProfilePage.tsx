import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  FileSpreadsheet,
  Users,
  CreditCard,
  Briefcase,
  Layers,
  Receipt,
  Award,
  Lock,
  Edit2,
  Plus,
  UserCheck,
  History as HistoryIcon,
  Sparkles,
  Check,
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import DashboardLayout from '../../../../../layouts/DashboardLayout';
import StatusBadge from '../../../../../ui/StatusBadge';
import KpiCard from '../../../../../ui/KpiCard';
import Drawer from '../../../../../ui/Drawer';
import { useClientProfile } from '../hooks/useClients';
import { formatTenureCondition } from '../../../../../types/ClientCommercial';
import type { StateGSTRecord } from '../../../../../types/ClientGST';
import type { ClientSPOC, SpocRole, SpocScope } from '../../../../../types/ClientSPOC';

import { getIndianStates, getStateCode } from '../../../../../core/location/indiaLocationMaster';

const PREDEFINED_HIGHLIGHTS: string[] = [
  'Weekly Payment',
  'Free Accommodation',
  'Free Food',
  'Transport Facility',
  'Pickup & Drop',
  'Attendance Bonus',
  'Incentive',
  'Overtime',
  'Medical Insurance',
  'Uniform',
  'Joining Bonus',
  'Festival Bonus',
  'Growth Opportunity',
  'Fixed Shift',
  'Rotational Shift',
];

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, loading, error, updateProfile } = useClientProfile(id);

  // Role derived from authentication context
  const activeRole: any = null;  // Placeholder for future authorization implementation
  const [activeTab, setActiveTab] = useState<'overview' | 'highlights' | 'commercial' | 'spocs' | 'finance' | 'gst' | 'templates' | 'recruitment' | 'history'>('overview');

  // Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [editedBillingName, setEditedBillingName] = useState('');
  const [editedGstin, setEditedGstin] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Custom Highlight Input State
  const [customHighlightInput, setCustomHighlightInput] = useState('');

  // Add State Drawer State (Finance Team)
  const [showAddStateDrawer, setShowAddStateDrawer] = useState(false);
  const [newStateName, setNewStateName] = useState('Karnataka');
  const [newStateGstin, setNewStateGstin] = useState('');
  const [newStateBillingName, setNewStateBillingName] = useState('');
  const [newStateStreet, setNewStateStreet] = useState('');
  const [newStateCity, setNewStateCity] = useState('');
  const [newStatePostal, setNewStatePostal] = useState('');

  // SPOC Add/Edit Drawer State
  const [showSpocDrawer, setShowSpocDrawer] = useState(false);
  const [editingSpoc, setEditingSpoc] = useState<ClientSPOC | null>(null);
  const [spocRole, setSpocRole] = useState<SpocRole>('HR');
  const [spocName, setSpocName] = useState('');
  const [spocDesignation, setSpocDesignation] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [spocPhone, setSpocPhone] = useState('');
  const [spocScope, setSpocScope] = useState<SpocScope>('All India');
  const [spocScopeDetail, setSpocScopeDetail] = useState('');
  const [spocIsPrimary, setSpocIsPrimary] = useState(false);
  const [spocNotes, setSpocNotes] = useState('');
  const [spocFormError, setSpocFormError] = useState('');

  const handleOpenAddSpoc = () => {
    setEditingSpoc(null);
    setSpocRole('HR');
    setSpocName('');
    setSpocDesignation('');
    setSpocEmail('');
    setSpocPhone('');
    setSpocScope('All India');
    setSpocScopeDetail('');
    setSpocIsPrimary(false);
    setSpocNotes('');
    setSpocFormError('');
    setShowSpocDrawer(true);
  };

  const handleOpenEditSpoc = (spoc: ClientSPOC) => {
    setEditingSpoc(spoc);
    setSpocRole(spoc.role);
    setSpocName(spoc.name);
    setSpocDesignation(spoc.designation || '');
    setSpocEmail(spoc.email || '');
    setSpocPhone(spoc.phone || '');
    setSpocScope(spoc.scope || 'All India');
    setSpocScopeDetail(spoc.scopeDetail || '');
    setSpocIsPrimary(Boolean(spoc.isPrimary));
    setSpocNotes(spoc.notes || '');
    setSpocFormError('');
    setShowSpocDrawer(true);
  };

  const handleSaveSpoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpocFormError('');

    if (!spocName.trim()) {
      setSpocFormError('SPOC Contact Name is required.');
      return;
    }
    if (!spocEmail.trim()) {
      setSpocFormError('Email address is required.');
      return;
    }
    if (!spocPhone.trim()) {
      setSpocFormError('Phone number is required.');
      return;
    }

    try {
      let updatedSpocs: ClientSPOC[] = [];
      const currentSpocs = client?.spocs || [];
      if (editingSpoc) {
        updatedSpocs = currentSpocs.map((s) =>
          s.id === editingSpoc.id
            ? {
                ...s,
                role: spocRole,
                name: spocName.trim(),
                designation: spocDesignation.trim(),
                email: spocEmail.trim(),
                phone: spocPhone.trim(),
                scope: spocScope,
                scopeDetail: spocScopeDetail.trim(),
                isPrimary: spocIsPrimary,
                notes: spocNotes.trim(),
              }
            : spocIsPrimary ? { ...s, isPrimary: false } : s
        );
      } else {
        const newId = `spoc-${Math.random().toString(36).substring(2, 9)}`;
        const newSpoc: ClientSPOC = {
          id: newId,
          role: spocRole,
          name: spocName.trim(),
          designation: spocDesignation.trim() || `${spocRole} Contact`,
          email: spocEmail.trim(),
          phone: spocPhone.trim(),
          scope: spocScope,
          scopeDetail: spocScopeDetail.trim(),
          isPrimary: spocIsPrimary || currentSpocs.length === 0,
          notes: spocNotes.trim(),
        };

        if (spocIsPrimary) {
          updatedSpocs = currentSpocs.map((s) => ({ ...s, isPrimary: false })).concat(newSpoc);
        } else {
          updatedSpocs = [...currentSpocs, newSpoc];
        }
      }

      await updateProfile({ spocs: updatedSpocs });
      setShowSpocDrawer(false);
      setActionSuccess(editingSpoc ? `Contact SPOC '${spocName}' updated successfully.` : `New Contact SPOC '${spocName}' added successfully.`);
    } catch (err: unknown) {
      setSpocFormError(err instanceof Error ? err.message : 'Failed to save SPOC contact.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs">Loading Client Master Profile…</div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button
            type="button"
            onClick={() => navigate('/workbench/network/clients')}
            className="inline-flex items-center gap-2 text-xs text-emerald-600 font-semibold mb-4 hover:underline"
          >
            <ArrowLeft size={16} /> Back to Client Master Directory
          </button>
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
            {error || 'Client record not found.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Access Control Checks
  const canEditClient = true;
  const canEditShortName = canEditClient;
  const canEditBilling = canEditClient;
  const canEditCommercial = canEditClient;
  const canAddState = canEditClient && client.status === 'Active';
  const canChangeStatus = ['Super Admin', 'Super_Admin'].includes(activeRole?.assignedRole || activeRole?.role || activeRole?.name || '');

  // Client Highlights Access Control
  const canEditHighlights = canEditClient;

  const handleToggleHighlight = async (highlightName: string) => {
    if (!canEditHighlights) return;
    const currentHighlights = client.highlights || [];
    const updated = currentHighlights.includes(highlightName)
      ? currentHighlights.filter((h) => h !== highlightName)
      : [...currentHighlights, highlightName];
    await updateProfile({ highlights: updated });
    setActionSuccess('Client highlights updated successfully.');
  };

  const handleAddCustomHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditHighlights || !customHighlightInput.trim()) return;
    const item = customHighlightInput.trim();
    const currentHighlights = client.highlights || [];
    if (!currentHighlights.includes(item)) {
      const updated = [...currentHighlights, item];
      await updateProfile({ highlights: updated });
      setActionSuccess(`Added custom highlight "${item}" successfully.`);
    }
    setCustomHighlightInput('');
  };

  const handleRemoveHighlight = async (highlightName: string) => {
    if (!canEditHighlights) return;
    const currentHighlights = client.highlights || [];
    const updated = currentHighlights.filter((h) => h !== highlightName);
    await updateProfile({ highlights: updated });
    setActionSuccess(`Removed highlight "${highlightName}".`);
  };

  const handleSaveShortName = async () => {
    if (!editedName.trim()) return;
    await updateProfile({ name: editedName.trim() });
    setIsEditingName(false);
    setActionSuccess('Client short name updated successfully by Marketing/Super Admin.');
  };

  const handleSaveBilling = async () => {
    if (!editedBillingName.trim() || !editedGstin.trim()) return;
    await updateProfile({ billingName: editedBillingName.trim(), gstin: editedGstin.trim() });
    setIsEditingBilling(false);
    setActionSuccess('Billing details updated successfully by Finance.');
  };

  const handleAddStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddState) return;

    const newRecord: StateGSTRecord = {
      id: `gst-rec-${Date.now()}`,
      stateCode: getStateCode(newStateName),
      stateName: newStateName,
      gstin: newStateGstin,
      billingName: newStateBillingName || client.billingName,
      billingAddress: {
        line1: newStateStreet,
        city: newStateCity,
        state: newStateName,
        postalCode: newStatePostal,
        country: 'India',
      },
      templateReference: client.invoiceConfig.templateReference,
      templateVersion: client.invoiceConfig.templateVersion,
      isGstOptional: false,
      isPrimary: false,
      isActive: true,
    };

    const updatedStateRecords = [...client.gstConfig.stateGstRecords, newRecord];
    await updateProfile({
      gstConfig: {
        ...client.gstConfig,
        scopeChoice: 'IndividualStates',
        gstMode: 'IndividualStates',
        stateGstRecords: updatedStateRecords,
      },
    });

    setShowAddStateDrawer(false);
    setActionSuccess(`Added new GST State '${newStateName}' successfully by Finance Team.`);
  };

  const handleToggleStatus = async () => {
    if (!canChangeStatus) return;
    const newStatus = client.status === 'Active' ? 'Inactive' : 'Active';
    await updateProfile({ status: newStatus });
    setActionSuccess(`Client status updated to ${newStatus} by Super Admin.`);
  };

  const isMultiGst = client.gstConfig.scopeChoice === 'IndividualStates' || client.gstConfig.gstMode === 'IndividualStates' || client.gstConfig.gstMode === 'MultiState';

  return (
    <DashboardLayout>
      {/* Top Navigation & Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/workbench/network/clients')}
            className="inline-flex items-center gap-2 text-xs text-slate-500 font-semibold hover:text-emerald-600 transition"
          >
            <ArrowLeft size={16} /> Back to Clients List
          </button>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button type="button" onClick={() => setActionSuccess('')}><Edit2 size={12} /></button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="p-1 bg-slate-50 border border-slate-300 rounded text-sm font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSaveShortName}
                      className="px-2.5 py-1 bg-emerald-600 text-white font-semibold text-xs rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
                    {canEditShortName && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditedName(client.name);
                          setIsEditingName(true);
                        }}
                        className="text-slate-400 hover:text-emerald-600 p-1"
                        title="Edit Short Name (Marketing / Super Admin)"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </>
                )}

                <StatusBadge status={client.status} />
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {client.clientId || client.id}
                </span>

                {canChangeStatus ? (
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className="text-[10px] text-slate-500 hover:text-emerald-600 font-semibold underline"
                    title="Super Admin Only: Toggle Status"
                  >
                    Toggle Status
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1" title="Only Super Admin can modify status">
                    <Lock size={10} /> Status Locked
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Legal Billing Name: <span className="font-semibold text-slate-700">{client.billingName}</span> • GSTIN:{' '}
                <span className="font-mono text-slate-800 font-semibold">{client.gstin}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                  <Award size={12} className="text-amber-600" />
                  <span>{client.points} Recruiter Performance Points</span>
                </div>
                <span className="text-slate-400">
                  Created: {typeof client.createdAt === 'string' ? client.createdAt.split('T')[0] : '2026-01-15'}
                </span>
                <span className="text-slate-400">
                  Updated: {typeof client.updatedAt === 'string' ? client.updatedAt.split('T')[0] : '2026-07-28'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canAddState && isMultiGst && (
              <button
                type="button"
                onClick={() => setShowAddStateDrawer(true)}
                className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition"
                title="Finance Team: Add new state GST registration"
              >
                <Plus size={16} />
                <span>+ Add State</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(`/finance/billing/new-invoice`)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <Receipt size={16} />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          metric={{
            id: 'points-kpi',
            title: 'Recruiter Points',
            value: `${client.points} Points`,
            change: 'Active Candidate',
            trend: 'up',
            subtext: 'Earned per candidate activation',
            category: 'invoices',
          }}
          icon={<Award size={20} className="text-amber-600" />}
          badgeBg="bg-amber-50 text-amber-700 border-amber-200"
        />
        <KpiCard
          metric={{
            id: 'outstanding-summary',
            title: 'Outstanding Balance',
            value: `₹${((client.financeSummary?.outstandingAmount || 0) / 1000).toFixed(1)}k`,
            change: 'Finance',
            trend: 'up',
            subtext: 'Unsettled invoice amount',
            category: 'invoices',
          }}
          icon={<CreditCard size={20} className="text-rose-600" />}
          badgeBg="bg-rose-50 text-rose-700 border-rose-200"
        />
        <KpiCard
          metric={{
            id: 'credit-notes-summary',
            title: 'Credit Notes',
            value: (client.financeSummary?.totalCreditNotes || 0).toString(),
            change: 'Read-only',
            trend: 'neutral',
            subtext: 'Issued credit note count',
            category: 'invoices',
          }}
          icon={<Receipt size={20} className="text-emerald-600" />}
          badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
        />
        <KpiCard
          metric={{
            id: 'template-ref-summary',
            title: 'Invoice Template',
            value: client.invoiceConfig.templateReference,
            change: `v${client.invoiceConfig.templateVersion}`,
            trend: 'neutral',
            subtext: 'Assigned template reference',
            category: 'invoices',
          }}
          icon={<FileSpreadsheet size={20} className="text-blue-600" />}
          badgeBg="bg-blue-50 text-blue-700 border-blue-200"
        />
      </div>

      {/* Tabs Navigation (360° Foundation) */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-2xl shadow-xs overflow-x-auto">
        <nav className="flex space-x-6 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 size={16} /> Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('highlights')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'highlights'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={16} /> Client Highlights {client.highlights?.length ? `(${client.highlights.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commercial')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'commercial'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase size={16} /> Commercial & Points
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spocs')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'spocs'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> Contacts (SPOCs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'finance'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard size={16} /> Finance Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gst')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'gst'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={16} /> Registered States & GST
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'templates'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet size={16} /> Invoice Config
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recruitment')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'recruitment'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserCheck size={16} /> Recruitment (Placeholder)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <HistoryIcon size={16} /> History (Placeholder)
          </button>
        </nav>
      </div>

      {/* Tab 1: Overview & Primary Billing Info */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-emerald-600" /> Primary Legal & Billing Information
              </h3>
              {canEditBilling && !isEditingBilling && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedBillingName(client.billingName);
                    setEditedGstin(client.gstin);
                    setIsEditingBilling(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
                >
                  <Edit2 size={12} /> Edit Billing (Finance / Super Admin)
                </button>
              )}
            </div>

            {isEditingBilling ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Name (Legal Name)</label>
                  <input
                    type="text"
                    value={editedBillingName}
                    onChange={(e) => setEditedBillingName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editedGstin}
                    onChange={(e) => setEditedGstin(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBilling(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBilling}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                  >
                    Save Billing Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Name (Short / Common Name)</span>
                  <span className="font-bold text-slate-800 text-sm">{client.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Billing Name (Legal Name)</span>
                  <span className="font-semibold text-slate-800">{client.billingName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Primary GSTIN</span>
                  <span className="font-mono font-bold text-slate-900">{client.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Primary State</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin size={14} className="text-emerald-600" /> {client.state}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-400 font-medium block">Billing Address</span>
                  <span className="font-medium text-slate-800">
                    {client.billingAddress.line1}
                    {client.billingAddress.line2 ? `, ${client.billingAddress.line2}` : ''},{' '}
                    {client.billingAddress.city ? `${client.billingAddress.city}, ` : ''}{client.billingAddress.state} - {client.billingAddress.postalCode},{' '}
                    {client.billingAddress.country}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Client Highlights Overview Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-500" /> Client Highlights & Candidate Benefits
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Key client perks and features to help recruiters convince candidates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('highlights')}
                className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
              >
                {canEditHighlights ? 'Manage Highlights →' : 'View All Highlights →'}
              </button>
            </div>

            {client.highlights && client.highlights.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {client.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold shadow-2xs"
                  >
                    <Sparkles size={13} className="text-amber-600 shrink-0" />
                    {highlight}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-xs text-slate-500">No client highlights added yet.</p>
                {canEditHighlights && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('highlights')}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
                  >
                    + Add Client Highlights
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Client Highlights */}
      {activeTab === 'highlights' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" /> Client Highlights & Candidate Benefits
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Help recruiters convince candidates by highlighting key benefits provided by {client.name}. (Business Information)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEditHighlights ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full">
                    <Check size={14} /> Marketing / Staffing / Admin Edit Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-full">
                    <Lock size={12} /> View Only ({activeRole.name} Team)
                  </span>
                )}
              </div>
            </div>

            {/* Currently Active Highlights */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Active Client Highlights ({client.highlights?.length || 0})
              </h4>
              {client.highlights && client.highlights.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {client.highlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 text-slate-800 border border-amber-200 text-xs font-semibold shadow-2xs group"
                    >
                      <Sparkles size={14} className="text-amber-500 shrink-0" />
                      <span>{highlight}</span>
                      {canEditHighlights && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(highlight)}
                          className="text-slate-400 hover:text-rose-600 transition p-0.5 rounded-full hover:bg-white"
                          title={`Remove ${highlight}`}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No highlights currently assigned to this client. Select from predefined list below or add a custom highlight.
                </div>
              )}
            </div>

            {/* Predefined & Custom Highlights */}
            {canEditHighlights ? (
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Predefined Highlights
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Click to quickly select or deselect standard client perks and candidate incentives.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_HIGHLIGHTS.map((item) => {
                      const isSelected = client.highlights?.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleToggleHighlight(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isSelected ? <Check size={14} /> : <Plus size={14} className="text-slate-400" />}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    + Add Custom Highlight
                  </h4>
                  <form onSubmit={handleAddCustomHighlight} className="flex items-center gap-3 max-w-lg">
                    <input
                      type="text"
                      value={customHighlightInput}
                      onChange={(e) => setCustomHighlightInput(e.target.value)}
                      placeholder="Enter custom benefit (e.g. Free Shuttle, Gym Access)..."
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!customHighlightInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition shrink-0 inline-flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add Highlight
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <Lock size={14} className="text-slate-400 shrink-0" />
                <span>Client Highlights editing is reserved for Marketing, Staffing, and Super Admin teams. Finance Team view is Read Only.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Commercial & Recruiter Points */}
      {activeTab === 'commercial' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={18} className="text-emerald-600" /> Commercial Terms & Recruiter Performance Points
            </h3>
            {!canEditCommercial && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Lock size={12} /> Editable by Finance & Super Admin only
              </span>
            )}
          </div>

          {/* Recruiter Performance Points Highlight Banner */}
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                <Award size={28} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 text-sm">Recruiter Performance Points</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Recruiters earn <strong className="text-amber-950 font-bold">{client.points} Points</strong> for every active candidate placed & activated at {client.name}. Integrates with Performance Leaderboards & Incentives (ORBIT).
                </p>
              </div>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-amber-300 text-center font-bold text-amber-900 text-lg shadow-xs shrink-0">
              {client.points} Points / Active Candidate
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-medium block">Commercial Type</span>
              <span className="font-bold text-slate-900 text-sm">{client.commercial.type}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-medium block">Payout Structure</span>
              <span className="font-bold text-slate-800 text-sm">
                {client.commercial.payoutType === 'Percentage'
                  ? `${client.commercial.percentageRate}% of ${client.commercial.percentageBasis}`
                  : `₹${(client.commercial.payoutAmount || 0).toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-medium block">Tenure Condition</span>
              <span className="font-bold text-slate-800 text-sm">
                {client.commercial.type === 'OTS' ? (
                  <span className="text-amber-900">{formatTenureCondition(client.commercial.tenureCondition)}</span>
                ) : (
                  <span className="text-slate-400 font-normal">— (Payroll)</span>
                )}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-medium block">PO Required</span>
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                {client.commercial.poRequired ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-600" /> Yes (Mandatory)
                  </>
                ) : (
                  <>No PO Required</>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Contacts (SPOCs) */}
      {activeTab === 'spocs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" /> Key Contacts (HR, Operations, Accounts, Hiring Manager)
            </h3>
            <button
              type="button"
              onClick={handleOpenAddSpoc}
              className="inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
            >
              <Plus size={14} /> + Add SPOC
            </button>
          </div>

          {(!client.spocs || client.spocs.length === 0) ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200/60">
              No SPOC contact points recorded yet. Click "+ Add SPOC" to add key client contacts.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {client.spocs.map((spoc) => (
                <div key={spoc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Role: {spoc.role}
                      </span>
                      {spoc.isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Scope: {spoc.scope}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditSpoc(spoc)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 text-[10px] font-semibold transition"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{spoc.name}</div>
                  <div className="text-slate-500 font-medium">{spoc.designation}</div>
                  <div className="pt-2 border-t border-slate-200/60 text-slate-600 space-y-1">
                    <div>Email: <span className="font-medium text-slate-800">{spoc.email}</span></div>
                    <div>Phone: <span className="font-medium text-slate-800">{spoc.phone}</span></div>
                    {spoc.notes && <div className="text-[10px] text-slate-500 italic mt-1">{spoc.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Finance Summary (Read-Only) */}
      {activeTab === 'finance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard size={18} className="text-emerald-600" /> Client Finance Summary (Read-Only)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-medium block">Total Billed Invoices</span>
              <span className="font-bold text-slate-900 text-2xl">{client.financeSummary?.totalInvoices || 0}</span>
              <p className="text-[11px] text-slate-500 mt-1">Read-only count from Finance billing repository</p>
            </div>
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-1">
              <span className="text-rose-700 font-medium block">Current Outstanding Balance</span>
              <span className="font-bold text-rose-900 text-2xl">₹{(client.financeSummary?.outstandingAmount || 0).toLocaleString('en-IN')}</span>
              <p className="text-[11px] text-rose-600 mt-1">Read-only outstanding amount</p>
            </div>
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-1">
              <span className="text-amber-800 font-medium block">Credit Notes Issued</span>
              <span className="font-bold text-amber-900 text-2xl">{client.financeSummary?.totalCreditNotes || 0}</span>
              <p className="text-[11px] text-amber-700 mt-1">Read-only credit note count</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Registered States & GST */}
      {activeTab === 'gst' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" /> Registered States & GST Configurations
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
                Coverage Scope: {client.gstConfig.scopeChoice || client.gstConfig.gstMode}
              </span>

              {canAddState && isMultiGst && (
                <button
                  type="button"
                  onClick={() => setShowAddStateDrawer(true)}
                  className="inline-flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-xs transition"
                >
                  <Plus size={14} /> + Add State (Finance)
                </button>
              )}
            </div>
          </div>

          {isMultiGst ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                This client has multiple GST registrations under <strong className="text-slate-800">Individual States</strong>. Finance can continue adding unlimited states below. Each state stores its own State, Billing Name, Billing Address, GST Number, and Template Reference.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.gstConfig.stateGstRecords.map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin size={14} className="text-emerald-600" /> {rec.stateName} (Code: {rec.stateCode})
                      </span>
                      {rec.isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Primary State
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400">GSTIN: </span>
                      <span className="font-mono font-bold text-slate-800">{rec.gstin}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Billing Name: </span>
                      <span className="font-medium text-slate-800">{rec.billingName || client.billingName}</span>
                    </div>
                    {rec.billingAddress && (
                      <div>
                        <span className="text-slate-400">Billing Address: </span>
                        <span className="font-medium text-slate-700">
                          {rec.billingAddress.line1}, {rec.billingAddress.city ? `${rec.billingAddress.city}, ` : ''}{rec.billingAddress.state}
                        </span>
                      </div>
                    )}
                    {client.invoiceConfig.templateReference && (
                      <div>
                        <span className="text-slate-400">Template Reference: </span>
                        <span className="font-mono text-emerald-700 font-semibold">{client.invoiceConfig.templateReference} (v{client.invoiceConfig.templateVersion || 1})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-900">India (One GST for All India)</p>
              <p className="text-slate-600">
                No State selector required during Finance invoice creation. Automatically loads primary billing details and template reference.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Invoice Configuration */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileSpreadsheet size={18} className="text-emerald-600" /> Hire Huub Billing Configuration
          </h3>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold block">Assigned Hire Huub Invoice Template</span>
                <span className="font-mono text-sm font-bold text-emerald-800">{client.invoiceConfig.templateReference || 'All'}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 text-slate-600 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Client-level template assignment is automatically resolved during invoice creation.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Recruitment Placeholder */}
      {activeTab === 'recruitment' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl w-fit mx-auto">
            <UserCheck size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Recruitment Hub Foundation Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Recruitment candidate pipelines and active candidate activation history for {client.name} will be built in the upcoming Staffing Hub sprint.
          </p>
        </div>
      )}

      {/* Tab 8: History Placeholder */}
      {activeTab === 'history' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl w-fit mx-auto">
            <HistoryIcon size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Audit History & Client Timeline Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Client Master contract amendments, state additions, and commercial updates audit log will be tracked here.
          </p>
        </div>
      )}

      {/* Drawer: Add State for Finance Team */}
      <Drawer
        isOpen={showAddStateDrawer}
        onClose={() => setShowAddStateDrawer(false)}
        title={`+ Add New State Registration for ${client.name}`}
      >
        <form onSubmit={handleAddStateSubmit} className="space-y-4 text-xs">
          <p className="text-slate-500 text-[11px]">
            Finance Team can add unlimited State GST registrations for Active clients under Individual States coverage.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">State Name *</label>
            <select
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            >
              {getIndianStates().map((state) => (
                <option key={state.stateName} value={state.stateName}>
                  {state.stateName} (Code {state.stateCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">State GSTIN Number *</label>
            <input
              type="text"
              value={newStateGstin}
              onChange={(e) => setNewStateGstin(e.target.value)}
              placeholder="e.g. 29AABCN1234F2Z8"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">State Billing Name (Legal Entity Branch Name)</label>
            <input
              type="text"
              value={newStateBillingName}
              onChange={(e) => setNewStateBillingName(e.target.value)}
              placeholder={client.billingName}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">State Street Address</label>
            <input
              type="text"
              value={newStateStreet}
              onChange={(e) => setNewStateStreet(e.target.value)}
              placeholder="State office / warehouse address"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={newStateCity}
                onChange={(e) => setNewStateCity(e.target.value)}
                placeholder="City name"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={newStatePostal}
                onChange={(e) => setNewStatePostal(e.target.value)}
                placeholder="560058"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>


          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddStateDrawer(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
            >
              Save New State GST Registration
            </button>
          </div>
        </form>
      </Drawer>

      {/* SPOC Add/Edit Drawer */}
      <Drawer
        isOpen={showSpocDrawer}
        onClose={() => setShowSpocDrawer(false)}
        title={editingSpoc ? `Edit Contact SPOC: ${editingSpoc.name}` : 'Add New Contact SPOC'}
      >
        <form onSubmit={handleSaveSpoc} className="space-y-4 text-xs">
          {spocFormError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
              {spocFormError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={spocRole}
              onChange={(e) => setSpocRole(e.target.value as SpocRole)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
              <option value="Accounts">Accounts</option>
              <option value="Hiring Manager">Hiring Manager</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Name *</label>
            <input
              type="text"
              value={spocName}
              onChange={(e) => setSpocName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Designation</label>
            <input
              type="text"
              value={spocDesignation}
              onChange={(e) => setSpocDesignation(e.target.value)}
              placeholder="e.g. Talent Acquisition Lead"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={spocEmail}
                onChange={(e) => setSpocEmail(e.target.value)}
                placeholder="rajesh@client.com"
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={spocPhone}
                onChange={(e) => setSpocPhone(e.target.value)}
                placeholder="+91 9876543210"
                required
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Coverage Scope</label>
            <select
              value={spocScope}
              onChange={(e) => setSpocScope(e.target.value as SpocScope)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              <option value="All India">All India</option>
              <option value="State">State</option>
              <option value="Zone">Zone</option>
              <option value="Department">Department</option>
            </select>
          </div>

          {spocScope !== 'All India' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scope Details</label>
              <input
                type="text"
                value={spocScopeDetail}
                onChange={(e) => setSpocScopeDetail(e.target.value)}
                placeholder="e.g. Karnataka State / North Zone / Engineering"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              value={spocNotes}
              onChange={(e) => setSpocNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Primary contact for escalations"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-slate-700">
              <input
                type="checkbox"
                checked={spocIsPrimary}
                onChange={(e) => setSpocIsPrimary(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Set as Primary Contact for this Client</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowSpocDrawer(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              {editingSpoc ? 'Update SPOC' : 'Save New SPOC'}
            </button>
          </div>
        </form>
      </Drawer>
    </DashboardLayout>
  );
}
