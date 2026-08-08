import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import SectionHeader from '../../../../ui/SectionHeader';
import WorkforceKpiCards from '../components/WorkforceKpiCards';
import WorkforceFilters from '../components/WorkforceFilters';
import ActiveWorkforceTable from '../components/ActiveWorkforceTable';
import ClientPayoutImportModal from '../components/ClientPayoutImportModal';
import ClientTransferModal from '../components/ClientTransferModal';
import PayoutHistoryModal from '../components/PayoutHistoryModal';
import ExtensionPointsPlaceholder from '../components/ExtensionPointsPlaceholder';
import { useWorkforce } from '../hooks/useWorkforce';
import type { WorkforceItem } from '../types/workforce';

export default function WorkforceWorkspacePage() {
  const navigate = useNavigate();
  const {
    workforce,
    allWorkforce,
    payoutImports,
    loading,
    error,
    filters,
    setFilters,
    kpiSummary,
    currentRole,
    userSession,
    executeClientTransfer,
    importClientPayout,
    rollbackPayoutImport,
    toggleLockImport,
  } = useWorkforce();

  const [selectedItem, setSelectedItem] = useState<WorkforceItem | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showPayoutHistoryModal, setShowPayoutHistoryModal] = useState<boolean>(false);

  const isFinanceOrAdmin = currentRole === 'Finance' || currentRole === 'Super Admin';
  const isRestrictedRole = currentRole === 'Marketing' || currentRole === 'HR';

  const handleOpenProfile = (item: WorkforceItem) => {
    navigate(`/workbench/workforce/${item.id}`);
  };

  const handleOpenCrmProfile = (candidateId: string) => {
    navigate(`/workbench/staffing-hub/crm?candidateId=${candidateId}`);
  };

  const handleOpenPayoutHistory = (item: WorkforceItem) => {
    setSelectedItem(item);
    setShowPayoutHistoryModal(true);
  };

  if (isRestrictedRole) {
    return (
      <DashboardLayout>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <ShieldAlert size={48} className="mx-auto text-rose-600" />
          <h3 className="text-base font-bold text-rose-900">Access Restricted — Workforce Module</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            Your current role ('{currentRole}') does not have permission to view or manage Active
            Workforce records.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="Workforce Management Workspace"
            subtitle="Single Source of Truth for Active Employment, Working Status, Payout Imports, Tenure, Eligibility, and Billing Lifecycle."
          />
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            disabled
            title="Workforce Export extension ready"
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-500 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 shrink-0 cursor-not-allowed"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {isFinanceOrAdmin ? (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
            >
              <FileSpreadsheet size={16} />
              <span>Client Payout Import</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={`Role '${currentRole}' cannot perform payout imports`}
              className="inline-flex items-center gap-2 bg-slate-200 text-slate-400 cursor-not-allowed font-semibold text-xs px-4 py-2.5 rounded-xl shrink-0"
            >
              <Lock size={14} />
              <span>Client Payout Import</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <WorkforceKpiCards summary={kpiSummary} userRole={currentRole} />

      {/* Search & Filters */}
      <WorkforceFilters
        filters={filters}
        onFilterChange={setFilters}
        allWorkforce={allWorkforce}
      />

      {/* Main Active Workforce Data Table */}
      <ActiveWorkforceTable
        workforce={workforce}
        loading={loading}
        onSelectCandidate={handleOpenProfile}
        onOpenCrmProfile={handleOpenCrmProfile}
        onOpenUpdateWorkforce={handleOpenProfile}
        onOpenPayoutHistory={handleOpenPayoutHistory}
      />

      {/* Client Payout Import Modal */}
      <ClientPayoutImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={importClientPayout}
        workforce={allWorkforce}
        userRole={currentRole}
        userSession={userSession}
        payoutImports={payoutImports}
        onRollbackImport={rollbackPayoutImport}
        onToggleLockImport={toggleLockImport}
      />

      {/* Client Transfer Modal */}
      <ClientTransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        item={selectedItem}
        onExecuteTransfer={executeClientTransfer}
      />

      {/* Payout History Modal */}
      <PayoutHistoryModal
        isOpen={showPayoutHistoryModal}
        onClose={() => setShowPayoutHistoryModal(false)}
        item={selectedItem}
        payoutImports={payoutImports}
      />

      {/* Extension Points Prepared Components */}
      <ExtensionPointsPlaceholder />
    </DashboardLayout>
  );
}
