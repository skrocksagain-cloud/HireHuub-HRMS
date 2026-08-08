import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Users,
  Award,
  Edit2,
  CheckCircle2,
  FileCheck,
  Banknote,
  UserCheck,
  History,
  Paperclip,
} from 'lucide-react';

import DashboardLayout from '../../../../layouts/DashboardLayout';
import StatusBadge from '../../../../ui/StatusBadge';
import KpiCard from '../../../../ui/KpiCard';
import { useOpeningProfile } from '../hooks/useOpenings';
import { useAuth } from '../../../../context/AuthContext';
import type { UserRole } from '../../../../types/Client';
import type { OpeningAuditEntry, OpeningAttachment, Opening } from '../../../../types/Opening';
import NewOpeningDrawer from '../components/NewOpeningDrawer';

export default function OpeningDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { opening, loading, error, updateProfile } = useOpeningProfile(id);
  const { user } = useAuth();

  const currentRole: UserRole = (user?.role as UserRole) || 'Super Admin';
  const isSuperAdmin = currentRole === 'Super Admin';
  const isStaffingAdmin = currentRole === 'Super Admin' || currentRole === 'Marketing' || currentRole === 'Staffing';
  const canEdit = isSuperAdmin || isStaffingAdmin;

  const [activeTab, setActiveTab] = useState<'overview' | 'criteria' | 'benefits' | 'documents' | 'history' | 'attachments'>('overview');
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState<OpeningAuditEntry[]>([]);
  const [attachmentsList, setAttachmentsList] = useState<OpeningAttachment[]>([]);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    async function loadExtensionData() {
      if (id && opening) {
        try {
          const { openingAuditService } = await import('../services/openingAuditService');
          const history = await openingAuditService.getTimeline(id);
          setTimelineEntries(history);
          setAttachmentsList(opening.attachments || []);
        } catch {
          setTimelineEntries([]);
          setAttachmentsList([]);
        }
      }
    }
    void loadExtensionData();
  }, [id, opening]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500 text-xs">Loading Opening Details…</div>
      </DashboardLayout>
    );
  }

  if (error || !opening) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4 text-xs">
          <button
            type="button"
            onClick={() => navigate('/workbench/staffing-hub/openings')}
            className="inline-flex items-center gap-2 text-slate-500 font-semibold hover:text-emerald-600"
          >
            <ArrowLeft size={16} /> Back to Openings Directory
          </button>
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl">
            {error || 'Opening record not found.'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveEdit = async (updates: Partial<Opening>) => {
    await updateProfile(updates);
    setActionSuccess('Opening details updated successfully.');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/workbench/staffing-hub/openings')}
            className="inline-flex items-center gap-2 text-xs text-slate-500 font-semibold hover:text-emerald-600 transition"
          >
            <ArrowLeft size={16} /> Back to Openings Directory
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowEditDrawer(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition"
            >
              <Edit2 size={16} />
              <span>Edit Opening</span>
            </button>
          )}
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button type="button" onClick={() => setActionSuccess('')}><Edit2 size={12} /></button>
          </div>
        )}

        {/* Title Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shrink-0">
              <Briefcase size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {opening.id}
                </span>
                <h1 className="text-xl font-bold text-slate-900">{opening.title}</h1>
                <StatusBadge status={opening.status} />
                {opening.isOutsourced && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                    Outsourced ({opening.outsourcedVendor || 'Vendor'})
                  </span>
                )}
              </div>

              {/* Mandatory Correction 8: Clickable Client Link to Client Master Profile */}
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 flex-wrap">
                <span>Client Master:</span>
                <button
                  type="button"
                  onClick={() => navigate(`/workbench/network/clients/${opening.clientId}`)}
                  className="font-bold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <Building2 size={14} />
                  <span>{opening.clientName}</span>
                </button>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <MapPin size={13} className="text-slate-400" />
                  {opening.location || `${opening.city}, ${opening.state}`}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-slate-400 font-medium block">Total Openings</span>
              <span className="text-lg font-bold text-slate-900">{opening.openPositions} Positions</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Interview Date</span>
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-1">
                <Calendar size={13} className="text-emerald-600" />
                {opening.interviewDate || 'Not Scheduled'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            metric={{
              id: 'kpi-positions',
              title: 'Open Positions',
              value: `${opening.openPositions} Open`,
              change: opening.priority,
              trend: 'up',
              subtext: `Priority: ${opening.priority}`,
              category: 'invoices',
            }}
            icon={<Users size={20} className="text-emerald-600" />}
            badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
          <KpiCard
            metric={{
              id: 'kpi-salary',
              title: 'Salary Range',
              value: opening.minSalary && opening.maxSalary ? `₹${(opening.minSalary / 1000).toFixed(0)}k - ₹${(opening.maxSalary / 1000).toFixed(0)}k` : 'Negotiable',
              change: opening.salaryType || 'Monthly',
              trend: 'neutral',
              subtext: `${opening.salaryType || 'Monthly'} Pay Period`,
              category: 'invoices',
            }}
            icon={<Banknote size={20} className="text-amber-600" />}
            badgeBg="bg-amber-50 text-amber-700 border-amber-200"
          />
          <KpiCard
            metric={{
              id: 'kpi-exp',
              title: 'Experience Required',
              value: `${opening.minExperience ?? 0} - ${opening.maxExperience ?? 3} Yrs`,
              change: opening.qualification || 'Any',
              trend: 'neutral',
              subtext: opening.qualification || 'Minimum Qualification',
              category: 'invoices',
            }}
            icon={<Award size={20} className="text-blue-600" />}
            badgeBg="bg-blue-50 text-blue-700 border-blue-200"
          />
          <KpiCard
            metric={{
              id: 'kpi-outsourced',
              title: 'Delivery Model',
              value: opening.isOutsourced ? 'Outsourced' : 'In-House Staffing',
              change: opening.isOutsourced ? (opening.outsourcedVendor || 'Vendor') : 'Internal',
              trend: 'neutral',
              subtext: opening.isOutsourced ? 'Sub-Vendor Managed' : 'Direct Staffing',
              category: 'invoices',
            }}
            icon={<Building2 size={20} className="text-indigo-600" />}
            badgeBg="bg-indigo-50 text-indigo-700 border-indigo-200"
          />
        </div>

        {/* 6 Mandatory Approved Tabs */}
        <div className="border-b border-slate-200 bg-white px-4 rounded-2xl shadow-xs overflow-x-auto">
          <nav className="flex space-x-6 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'overview' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase size={16} /> Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('criteria')}
              className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'criteria' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCheck size={16} /> Candidate Criteria
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('benefits')}
              className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'benefits' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Banknote size={16} /> Salary & Benefits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'documents' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileCheck size={16} /> Required Documents
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'history' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History size={16} /> History ({timelineEntries.length})
            </button>
            {/* Mandatory Correction 4: Tab renamed to "Attachments" */}
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`py-3.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'attachments' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Paperclip size={16} /> Attachments ({attachmentsList.length})
            </button>
          </nav>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Job Description & Scope</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{opening.description || 'No detailed description specified.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              <div>
                <span className="text-slate-400 font-medium block">Location & Address</span>
                <span className="font-semibold text-slate-800">{opening.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">City & State</span>
                <span className="font-semibold text-slate-800">{opening.city}, {opening.state}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Opening Priority</span>
                <span className="font-bold text-emerald-700">{opening.priority}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Candidate Criteria */}
        {activeTab === 'criteria' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-slate-400 font-medium block">Required Experience</span>
                <span className="font-bold text-slate-900 text-sm">{opening.minExperience ?? 0} to {opening.maxExperience ?? 3} Years</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Minimum Qualification</span>
                <span className="font-semibold text-slate-800">{opening.qualification || 'Not Specified'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Gender Preference</span>
                <span className="font-semibold text-slate-800">{opening.genderPreference || 'Any'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Maximum Age Limit</span>
                <span className="font-semibold text-slate-800">{opening.ageLimit ? `${opening.ageLimit} Years` : 'No Limit'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-slate-400 font-medium block mb-2">Required Skills</span>
              {opening.skills && opening.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {opening.skills.map((sk) => (
                    <span key={sk} className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-medium border border-slate-200">
                      {sk}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 italic">No specific skills listed.</span>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Salary & Benefits */}
        {activeTab === 'benefits' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-slate-400 font-medium block">Minimum Salary</span>
                <span className="font-bold text-slate-900 text-base">₹{opening.minSalary ? opening.minSalary.toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Maximum Salary</span>
                <span className="font-bold text-slate-900 text-base">₹{opening.maxSalary ? opening.maxSalary.toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Payment Period</span>
                <span className="font-semibold text-slate-800">{opening.salaryType || 'Monthly'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-slate-400 font-medium block mb-2">Client Benefits & Candidate Perks</span>
              {opening.benefits && opening.benefits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {opening.benefits.map((ben) => (
                    <span key={ben} className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold">
                      {ben}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 italic">No benefits specified.</span>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Documents Required */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900">Required Onboarding Documents</h3>
            {opening.requiredDocuments && opening.requiredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {opening.requiredDocuments.map((doc) => (
                  <div key={doc} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No specific documents specified for this opening.</p>
            )}
          </div>
        )}

        {/* Tab 5: History */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900">Opening Timeline & Activity Log</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
              <p>Activity timeline tracking is ready to display logs for {opening.id}.</p>
            </div>
          </div>
        )}

        {/* Tab 6: Attachments (Mandatory Correction 4) */}
        {activeTab === 'attachments' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900">Opening Document Attachments</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
              <p>File attachments extension point ready for {opening.id}.</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {showEditDrawer && (
        <NewOpeningDrawer
          isOpen={showEditDrawer}
          onClose={() => setShowEditDrawer(false)}
          onSubmit={handleSaveEdit}
          initialData={opening}
          mode="edit"
        />
      )}
    </DashboardLayout>
  );
}
