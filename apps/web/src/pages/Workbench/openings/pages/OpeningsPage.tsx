import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Calendar,
  Lock,
  CheckCircle2,
} from 'lucide-react';

import DashboardLayout from '../../../../layouts/DashboardLayout';
import SectionHeader from '../../../../ui/SectionHeader';
import StatusBadge from '../../../../ui/StatusBadge';
import KpiCard from '../../../../ui/KpiCard';
import EmptyState from '../../../../ui/EmptyState';
import { useOpenings } from '../hooks/useOpenings';
import { useAuth } from '../../../../context/AuthContext';
import type { UserRole } from '../../../../types/Client';
import type { Opening } from '../../../../types/Opening';
import NewOpeningDrawer from '../components/NewOpeningDrawer';

export default function OpeningsPage() {
  const navigate = useNavigate();
  const { openings, createOpening, updateOpening, deleteOpening } = useOpenings();
  const { user } = useAuth();

  const currentRole: UserRole = (user?.role as UserRole) || 'Super Admin';
  const isSuperAdmin = currentRole === 'Super Admin';
  const isStaffingAdmin = currentRole === 'Super Admin' || currentRole === 'Marketing' || currentRole === 'Staffing';
  const isMarketing = currentRole === 'Marketing';

  // Role Permissions
  const canViewOutsourced = isSuperAdmin || isStaffingAdmin;
  const canCreate = isSuperAdmin || isStaffingAdmin;
  const canEdit = isSuperAdmin || isStaffingAdmin;
  const canDelete = isSuperAdmin || isStaffingAdmin;
  const isAccessRestricted = isMarketing;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('Active'); // Default Status: Open / Active
  const [interviewDateFilter] = useState('');
  const [outsourcedFilter, setOutsourcedFilter] = useState('ALL');

  // Modals & Drawers
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingOpening, setEditingOpening] = useState<Opening | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Role Filtering: Hide outsourced openings from Staffing Team & Finance
  const visibleOpenings = useMemo(() => {
    if (canViewOutsourced) {
      return openings;
    }
    return openings.filter((o) => !o.isOutsourced);
  }, [openings, canViewOutsourced]);

  // Mandatory Correction 1: KPI Dashboard Cards (EXACTLY 4 CARDS)
  const openCount = useMemo(() => visibleOpenings.filter((o) => o.status === 'Active').length, [visibleOpenings]);
  const outsourcedCount = useMemo(() => openings.filter((o) => o.isOutsourced).length, [openings]);
  const closedCount = useMemo(() => visibleOpenings.filter((o) => o.status === 'Closed').length, [visibleOpenings]);
  const onHoldCount = useMemo(() => visibleOpenings.filter((o) => o.status === 'OnHold').length, [visibleOpenings]);

  // Unique Filter Options
  const clientOptions = useMemo(() => Array.from(new Set(visibleOpenings.map((o) => o.clientName))).sort(), [visibleOpenings]);
  const stateOptions = useMemo(() => Array.from(new Set(visibleOpenings.map((o) => o.state).filter(Boolean))).sort(), [visibleOpenings]);
  const cityOptions = useMemo(() => Array.from(new Set(visibleOpenings.map((o) => o.city).filter(Boolean))).sort(), [visibleOpenings]);

  // Table Data Filtering & Default Sorting: Newest First
  const filteredOpenings = useMemo(() => {
    return visibleOpenings
      .filter((op) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          op.id.toLowerCase().includes(query) ||
          op.clientName.toLowerCase().includes(query) ||
          op.title.toLowerCase().includes(query) ||
          op.location.toLowerCase().includes(query) ||
          op.city.toLowerCase().includes(query);

        const matchesClient = clientFilter === 'ALL' || op.clientName === clientFilter;
        const matchesState = stateFilter === 'ALL' || op.state === stateFilter;
        const matchesCity = cityFilter === 'ALL' || op.city === cityFilter;
        const matchesStatus = statusFilter === 'ALL' || op.status === statusFilter;
        const matchesInterview = !interviewDateFilter || op.interviewDate === interviewDateFilter;
        const matchesOutsourced =
          outsourcedFilter === 'ALL' ||
          (outsourcedFilter === 'OUTSOURCED' && op.isOutsourced) ||
          (outsourcedFilter === 'INHOUSE' && !op.isOutsourced);

        return matchesSearch && matchesClient && matchesState && matchesCity && matchesStatus && matchesInterview && matchesOutsourced;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest First
  }, [visibleOpenings, searchQuery, clientFilter, stateFilter, cityFilter, statusFilter, interviewDateFilter, outsourcedFilter]);



  const handleCreateSubmit = async (data: Partial<Opening>) => {
    await createOpening(data as Omit<Opening, 'id' | 'createdAt' | 'updatedAt'>);
  };

  const handleEditSubmit = async (data: Partial<Opening>) => {
    if (!editingOpening) return;
    await updateOpening(editingOpening.id, data);
    setEditingOpening(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete Opening ${id}?`)) {
      setDeletingId(id);
      await deleteOpening(id);
      setDeletingId(null);
    }
  };

  if (isAccessRestricted) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center space-y-4">
          <div className="inline-flex p-4 bg-rose-50 text-rose-600 rounded-full border border-rose-200">
            <Lock size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The Marketing Team role does not have access permissions for the Openings module. Please contact Super Admin if access is required.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <SectionHeader
              title="Openings Workspace"
              subtitle="Single Source of Truth for Staffing Requisitions, Candidate Criteria, Salary Benefits, and Delivery Models."
            />
          </div>

          {/* Top Actions: + New Opening */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateDrawer(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
              >
                <Plus size={16} />
                <span>+ New Opening</span>
              </button>
            )}
          </div>
        </div>

        {/* Mandatory Correction 1: OPENINGS DASHBOARD (EXACTLY 4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            metric={{
              id: 'card-open',
              title: 'Open Openings',
              value: openCount.toString(),
              change: 'Active Requisitions',
              trend: 'up',
              subtext: 'Active candidate requisitions',
              category: 'invoices',
            }}
            icon={<Briefcase size={20} className="text-emerald-600" />}
            badgeBg="bg-emerald-50 text-emerald-700 border-emerald-200"
          />

          {canViewOutsourced ? (
            <KpiCard
              metric={{
                id: 'card-outsourced',
                title: 'Outsourced',
                value: outsourcedCount.toString(),
                change: 'Sub-Vendor',
                trend: 'neutral',
                subtext: 'Admin Only View',
                category: 'invoices',
              }}
              icon={<Building2 size={20} className="text-amber-600" />}
              badgeBg="bg-amber-50 text-amber-700 border-amber-200"
            />
          ) : (
            <KpiCard
              metric={{
                id: 'card-outsourced-hidden',
                title: 'Outsourced',
                value: 'Restricted',
                change: 'Admin Only',
                trend: 'neutral',
                subtext: 'Visible for Admin roles',
                category: 'invoices',
              }}
              icon={<Lock size={20} className="text-slate-400" />}
              badgeBg="bg-slate-100 text-slate-600 border-slate-200"
            />
          )}

          <KpiCard
            metric={{
              id: 'card-closed',
              title: 'Closed',
              value: closedCount.toString(),
              change: 'Fulfilled',
              trend: 'neutral',
              subtext: 'Fulfilled opening positions',
              category: 'invoices',
            }}
            icon={<CheckCircle2 size={20} className="text-blue-600" />}
            badgeBg="bg-blue-50 text-blue-700 border-blue-200"
          />

          <KpiCard
            metric={{
              id: 'card-onhold',
              title: 'On Hold',
              value: onHoldCount.toString(),
              change: 'Paused',
              trend: 'down',
              subtext: 'Temporarily paused openings',
              category: 'invoices',
            }}
            icon={<Briefcase size={20} className="text-rose-600" />}
            badgeBg="bg-rose-50 text-rose-700 border-rose-200"
          />
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Opening ID, Client, Position, Location, City..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none w-full lg:w-40"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Open / Active</option>
              <option value="OnHold">On Hold</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
            </select>

            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none w-full lg:w-44"
            >
              <option value="ALL">All Clients</option>
              {clientOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none w-full lg:w-36"
            >
              <option value="ALL">All States</option>
              {stateOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none w-full lg:w-36"
            >
              <option value="ALL">All Cities</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Outsourced Filter (Admin Only) */}
            {canViewOutsourced && (
              <select
                value={outsourcedFilter}
                onChange={(e) => setOutsourcedFilter(e.target.value)}
                className="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold outline-none w-full lg:w-40"
              >
                <option value="ALL">All Delivery</option>
                <option value="OUTSOURCED">Outsourced Only</option>
                <option value="INHOUSE">In-House Only</option>
              </select>
            )}
          </div>
        </div>

        {/* Openings Table or Professional Empty State */}
        {filteredOpenings.length === 0 ? (
          /* Mandatory Correction 7: Professional Empty State */
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <EmptyState
              icon={<Briefcase size={36} className="text-emerald-600" />}
              title="No Openings Yet"
              description="Create your first opening requisition or import batch openings from Excel/Image to get started."
            />
            {canCreate && (
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>+ Create Opening</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Openings Table */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Opening ID</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Position</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">City</th>
                    <th className="p-3.5">State</th>
                    <th className="p-3.5 text-center">No. of Openings</th>
                    <th className="p-3.5">Interview Date</th>
                    {canViewOutsourced && <th className="p-3.5">Outsourced</th>}
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Updated</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpenings.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50/80 transition">
                      {/* 1. Opening ID (Clickable) */}
                      <td className="p-3.5 font-mono font-bold text-emerald-700">
                        <button
                          type="button"
                          onClick={() => navigate(`/workbench/staffing-hub/openings/${op.id}`)}
                          className="hover:underline"
                        >
                          {op.id}
                        </button>
                      </td>

                      {/* 2. Client (Mandatory Correction 8: Clickable Link to Client Master) */}
                      <td className="p-3.5 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => navigate(`/workbench/network/clients/${op.clientId}`)}
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1.5"
                          title="View Client Master Profile"
                        >
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span>{op.clientName}</span>
                        </button>
                      </td>

                      {/* 3. Position */}
                      <td className="p-3.5 font-bold text-slate-900">{op.title}</td>

                      {/* 4. Location */}
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">{op.location || `${op.city}, ${op.state}`}</td>

                      {/* 5. City */}
                      <td className="p-3.5 text-slate-700 font-medium">{op.city}</td>

                      {/* 6. State */}
                      <td className="p-3.5 text-slate-700 font-medium">{op.state}</td>

                      {/* 7. No of Openings */}
                      <td className="p-3.5 text-center font-bold text-slate-900 bg-slate-50/50 rounded-lg">{op.openPositions}</td>

                      {/* 8. Interview Date */}
                      <td className="p-3.5 text-slate-600">
                        {op.interviewDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {op.interviewDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* 9. Outsourced (Admin Only) */}
                      {canViewOutsourced && (
                        <td className="p-3.5">
                          {op.isOutsourced ? (
                            <span className="bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Yes ({op.outsourcedVendor || 'Vendor'})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No (In-House)</span>
                          )}
                        </td>
                      )}

                      {/* 10. Status */}
                      <td className="p-3.5">
                        <StatusBadge status={op.status} />
                      </td>

                      {/* 11. Last Updated */}
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {typeof op.updatedAt === 'string' ? op.updatedAt.split('T')[0] : 'Recent'}
                      </td>

                      {/* 12. Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/workbench/staffing-hub/openings/${op.id}`)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => setEditingOpening(op)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg transition"
                              title="Edit Opening"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(op.id)}
                              disabled={deletingId === op.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-50"
                              title="Delete Opening"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Opening Drawer */}
      {showCreateDrawer && (
        <NewOpeningDrawer
          isOpen={showCreateDrawer}
          onClose={() => setShowCreateDrawer(false)}
          onSubmit={handleCreateSubmit}
          mode="create"
        />
      )}

      {/* Edit Opening Drawer */}
      {editingOpening && (
        <NewOpeningDrawer
          isOpen={Boolean(editingOpening)}
          onClose={() => setEditingOpening(null)}
          onSubmit={handleEditSubmit}
          initialData={editingOpening}
          mode="edit"
        />
      )}
    </DashboardLayout>
  );
}
