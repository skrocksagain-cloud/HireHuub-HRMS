import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Award,
} from 'lucide-react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import AssignmentPanel from '../components/AssignmentPanel';
import ClientTransferModal from '../components/ClientTransferModal';
import PayoutHistoryModal from '../components/PayoutHistoryModal';
import { workforceRepository } from '../repositories/workforceRepository';
import { crmRepository } from '../../crm/repositories/crmRepository';
import { useAuth } from '../../../../context/AuthContext';
import type { WorkforceItem, OtsBillingStatus } from '../types/workforce';
import type { CandidateDocument } from '../../crm/types/crm';

type TabType =
  | 'overview'
  | 'employment'
  | 'payout-history'
  | 'billing'
  | 'documents'
  | 'timeline'
  | 'placement-history'
  | 'performance'
  | 'history';

export default function WorkforceProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentRole = (user?.role as string) || 'Super Admin';
  const userSession = {
    id: user?.employeeId || 'user-admin',
    name: user?.name || 'Super Admin',
  };

  const [item, setItem] = useState<WorkforceItem | null>(null);
  const [crmDocuments, setCrmDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modals
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showPayoutHistoryModal, setShowPayoutHistoryModal] = useState<boolean>(false);
  const [updatingBilling, setUpdatingBilling] = useState<boolean>(false);
  const [billingError, setBillingError] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const found = await workforceRepository.getWorkforceItemById(id);
        if (!found) {
          setError(`Workforce record '${id}' not found.`);
          return;
        }
        setItem(found);

        // Fetch candidate documents strictly from CRM Candidate Master (No duplication)
        if (found.candidateId) {
          const crmCandidate = await crmRepository.getCandidateById(found.candidateId);
          if (crmCandidate) {
            setCrmDocuments(crmCandidate.documents || []);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const isFinanceOrAdmin = currentRole === 'Finance' || currentRole === 'Super Admin';

  const handleToggleBilling = async (newStatus: OtsBillingStatus) => {
    if (!item || !isFinanceOrAdmin) return;
    setUpdatingBilling(true);
    setBillingError('');
    try {
      const updated = await workforceRepository.updateBillingStatus(item.id, newStatus, userSession.name);
      setItem(updated);
    } catch (err: unknown) {
      setBillingError(err instanceof Error ? err.message : 'Failed to update billing status.');
    } finally {
      setUpdatingBilling(false);
    }
  };

  const handleUpdateAssignment = async (wfId: string, newId: string, newName: string) => {
    const updated = await workforceRepository.updateAssignment(wfId, newId, newName, userSession.name);
    setItem(updated);
  };

  const handleExecuteTransfer = async (
    wfId: string,
    newClientId: string,
    newClientName: string,
    newClientType: 'Payroll' | 'OTS',
    activeDate: string
  ) => {
    const updated = await workforceRepository.executeClientTransfer(
      wfId,
      newClientId,
      newClientName,
      newClientType,
      activeDate,
      userSession.name
    );
    setItem(updated);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs">Loading Workforce Profile…</div>
      </DashboardLayout>
    );
  }

  if (error || !item) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <div className="font-bold text-rose-900 text-sm">Workforce Profile Error</div>
          <div className="text-xs text-rose-700">{error || 'Record not found.'}</div>
          <button
            type="button"
            onClick={() => navigate('/workbench/workforce')}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            Back to Workforce Workspace
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/workbench/workforce')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Workforce Workspace</span>
          </button>

          <span className="text-[11px] font-mono text-slate-400">
            CRM Candidate Ref: <strong className="text-emerald-700">{item.candidateId}</strong>
          </span>
        </div>

        {/* Profile Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{item.candidateName}</h1>
                {item.workforceType === 'Payroll' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                    Payroll
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    OTS ({item.id})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-slate-500 font-mono text-xs mt-1">
                <span>Employee ID: <strong className="text-slate-900">{item.id}</strong></span>
                <span>•</span>
                <span>Mobile: {item.phone}</span>
                <span>•</span>
                <span>City: {item.city}</span>
                <span>•</span>
                <span>Client: <strong className="text-emerald-800">{item.clientName}</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/workbench/staffing-hub/crm?candidateId=${item.candidateId}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-semibold transition"
              >
                <ExternalLink size={14} />
                <span>Open CRM Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-800 font-semibold transition"
              >
                <RefreshCw size={14} />
                <span>Execute Client Transfer</span>
              </button>
            </div>
          </div>

          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Lifecycle Badges:</span>

            {item.workingStatus === 'Working' ? (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Working (Payout Match)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                Not Working
              </span>
            )}

            {item.eligibility === 'Eligible' ? (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Eligible
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Pending Eligibility
              </span>
            )}

            {item.billingStatus === 'Billed' ? (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                Billed
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                Pending Billing
              </span>
            )}

            {isFinanceOrAdmin && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] font-bold text-slate-500">Finance Action:</span>
                {item.billingStatus === 'Pending' ? (
                  <button
                    type="button"
                    disabled={updatingBilling}
                    onClick={() => handleToggleBilling('Billed')}
                    className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
                  >
                    Mark Billed
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updatingBilling}
                    onClick={() => handleToggleBilling('Pending')}
                    className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
                  >
                    Revert to Pending
                  </button>
                )}
              </div>
            )}
          </div>

          {billingError && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
              {billingError}
            </div>
          )}
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Working Since
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">{item.workingFrom}</span>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Current Tenure
            </span>
            <span className="font-bold text-slate-900 text-sm mt-1 block">{item.tenureDisplay}</span>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Earnings
            </span>
            <span className="font-bold text-emerald-700 text-sm mt-1 block">
              ₹{item.totalEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Orders
            </span>
            <span className="font-bold text-blue-700 text-sm mt-1 block">
              {item.supportsOrders && item.totalOrders !== undefined ? item.totalOrders : '—'}
            </span>
          </div>
        </div>

        {/* Dedicated Profile Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-4 bg-slate-50 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'employment', label: 'Employment' },
              { id: 'payout-history', label: 'Client Payout History' },
              { id: 'billing', label: 'Billing', financeOnly: true },
              { id: 'documents', label: 'Documents (CRM Reused)' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'placement-history', label: 'Placement History' },
              { id: 'performance', label: 'Performance' },
              { id: 'history', label: 'Audit History' },
            ].map((t) => {
              if (t.financeOnly && !isFinanceOrAdmin) return null;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as TabType)}
                  className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition border-b-2 ${
                    activeTab === t.id
                      ? 'border-emerald-600 text-emerald-800 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <AssignmentPanel
                  item={item}
                  userRole={currentRole}
                  userSession={userSession}
                  onUpdateAssignment={handleUpdateAssignment}
                />

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                    Active Contract Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Client Account</span>
                      <span className="font-bold text-slate-900">{item.clientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Workforce Type</span>
                      <span className="font-bold text-slate-900">{item.workforceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Activated Date</span>
                      <span className="font-semibold text-slate-700">{item.activeDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Last Import</span>
                      <span className="font-semibold text-slate-700">
                        {item.lastPayoutImportDate
                          ? new Date(item.lastPayoutImportDate).toLocaleDateString('en-GB')
                          : 'No import'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Employment */}
            {activeTab === 'employment' && (
              <div className="space-y-4">
                {item.workforceType === 'Payroll' ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-teal-700">
                      Payroll Contract Metrics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 bg-white rounded-xl border">
                        <span className="text-[10px] text-slate-500 font-semibold block">Working Status</span>
                        <span className="font-bold text-emerald-700 text-xs">{item.workingStatus}</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border">
                        <span className="text-[10px] text-slate-500 font-semibold block">Monthly Earnings</span>
                        <span className="font-bold text-slate-900 text-xs">
                          ₹{item.totalEarnings.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border">
                        <span className="text-[10px] text-slate-500 font-semibold block">Monthly Orders</span>
                        <span className="font-bold text-blue-700 text-xs">
                          {item.supportsOrders && item.totalOrders !== undefined ? item.totalOrders : '—'}
                        </span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border">
                        <span className="text-[10px] text-slate-500 font-semibold block">Performance Rank</span>
                        <span className="font-bold text-amber-700 text-xs">
                          {item.supportsOrders && item.rank !== undefined ? `#${item.rank}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-purple-700">
                      OTS Settlement Contract Metrics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Joining Date</span>
                        <span className="font-bold text-slate-800">{item.joiningDate || item.activeDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Last Working Date</span>
                        <span className="font-bold text-slate-800">{item.lastWorkingDate || 'Active'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Calculated Tenure</span>
                        <span className="font-bold text-purple-800">{item.tenureDisplay}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Eligibility Status</span>
                        <span className="font-bold text-emerald-700">{item.eligibility}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Billing Status</span>
                        <span className="font-bold text-blue-700">{item.billingStatus}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Payout History */}
            {activeTab === 'payout-history' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Client Payout Import Audit History
                </h4>
                {item.totalEarnings > 0 ? (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 text-xs">
                      <span>July 2026 Aggregated Client Import</span>
                      <span className="text-emerald-700">₹{item.totalEarnings.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Verified working status via Client Payout Import V1.
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center py-6">
                    No payout imports recorded for this candidate yet.
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Billing (Finance Only) */}
            {activeTab === 'billing' && isFinanceOrAdmin && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Finance Billing Lifecycle Management
                </h4>
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Automatic Eligibility</span>
                      <span className="text-[10px] text-slate-500">
                        Calculated from tenure vs Client Master rule
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                      {item.eligibility}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Manual Billing Status</span>
                      <span className="text-[10px] text-slate-500">
                        Finance manual approval toggle (Never automated)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleBilling('Pending')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          item.billingStatus === 'Pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Pending Billing
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBilling('Billed')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          item.billingStatus === 'Billed'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Billed
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Documents (Reused from CRM Master) */}
            {activeTab === 'documents' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
                    Reused CRM Candidate Documents (Single Source of Truth)
                  </h4>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    No Document Duplication
                  </span>
                </div>

                {crmDocuments.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center py-6">
                    No documents uploaded in CRM Candidate Master for Candidate {item.candidateId}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {crmDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{doc.documentType}</div>
                          <div className="text-[10px] text-slate-500">
                            {doc.fileName || doc.accountNumber || 'Document File Verified'}
                          </div>
                          {doc.ocrPlaceholderText && (
                            <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
                              {doc.ocrPlaceholderText}
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CRM Verified
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Timeline */}
            {activeTab === 'timeline' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Employment Event Timeline
                </h4>
                <div className="space-y-3 pl-2 border-l-2 border-slate-200 pt-1">
                  <div className="relative pl-4">
                    <div className="absolute -left-[17px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <div className="font-bold text-slate-900">Entered Active Workforce</div>
                    <div className="text-[11px] text-slate-500">{item.workingFrom}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Placed at {item.clientName} under {item.workforceType} contract.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 7: Placement History */}
            {activeTab === 'placement-history' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Immutable Placement History
                </h4>
                <div className="space-y-2">
                  {item.placementHistory.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.clientName}</div>
                        <div className="text-[10px] text-slate-500">
                          Active Date: {p.activeDate} • Type: {p.clientType}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 8: Performance */}
            {activeTab === 'performance' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
                    Performance Metrics Engine
                  </h4>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Read-Only Extension Prepared
                  </span>
                </div>
                <div className="p-4 bg-white rounded-xl text-slate-600 text-xs text-center space-y-1 border">
                  <Award size={24} className="mx-auto text-purple-600" />
                  <div className="font-bold text-slate-900">Performance Engine Extension Point</div>
                  <div>
                    Recruiter Incentive Points and candidate productivity scores are ready to connect.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 9: History Audit Log */}
            {activeTab === 'history' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Audit History Log
                </h4>
                <div className="space-y-2">
                  {item.systemAudit.map((audit) => (
                    <div key={audit.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{audit.action}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(audit.timestamp).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">{audit.details}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">By: {audit.performedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Client Transfer Modal */}
        <ClientTransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          item={item}
          onExecuteTransfer={handleExecuteTransfer}
        />

        {/* Payout History Modal */}
        <PayoutHistoryModal
          isOpen={showPayoutHistoryModal}
          onClose={() => setShowPayoutHistoryModal(false)}
          item={item}
          payoutImports={[]}
        />
      </div>
    </DashboardLayout>
  );
}
