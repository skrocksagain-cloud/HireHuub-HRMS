import { useState } from 'react';
import { getAuthorizationScope } from '../../../../core/authorization/authorizationResolver';

import {
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import SectionHeader from '../../../../ui/SectionHeader';
import WorkforceKpiCards from '../components/WorkforceKpiCards';
import WorkforceFilters from '../components/WorkforceFilters';
import ActiveWorkforceTable from '../components/ActiveWorkforceTable';
import ClientPayoutImportModal from '../components/ClientPayoutImportModal';
import PayoutHistoryModal from '../components/PayoutHistoryModal';
import { useWorkforce } from '../hooks/useWorkforce';
import type { WorkforceItem } from '../types/workforce';

import WorkforceProfileDrawer from '../components/WorkforceProfileDrawer';

export default function WorkforceWorkspacePage() {
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
    importClientPayout,
    rollbackPayoutImport,
    toggleLockImport,
    updateLastWorkingDate,
    staffingRecruiters,
  } = useWorkforce();

  const [selectedItem, setSelectedItem] = useState<WorkforceItem | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showPayoutHistoryModal, setShowPayoutHistoryModal] = useState<boolean>(false);
  
  // Drawer state
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  const scope = getAuthorizationScope((userSession as any).assignedRole);
  const isFinanceOrAdmin = scope === 'GLOBAL' || scope === 'DEPARTMENT';

  const handleOpenCrmProfile = (placementId: string) => {
    setSelectedPlacementId(placementId);
  };

  const handleOpenPayoutHistory = (item: WorkforceItem) => {
    setSelectedItem(item);
    setShowPayoutHistoryModal(true);
  };



  return (
    <DashboardLayout>
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title="Workforce Management Workspace"
            subtitle="Active Workforce, Payroll, OTS, Working Status and Tenure"
          />
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
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

      <WorkforceKpiCards summary={kpiSummary} />

      <WorkforceFilters
        filters={filters}
        onFilterChange={setFilters}
        allWorkforce={allWorkforce}
        staffingRecruiters={staffingRecruiters}
      />
      
      <ActiveWorkforceTable
        workforce={workforce}
        loading={loading}
        onOpenCrmProfile={handleOpenCrmProfile}
        onOpenPayoutHistory={handleOpenPayoutHistory}
        onUpdateLwd={updateLastWorkingDate}
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

      {/* Payout History Modal */}
      <PayoutHistoryModal
        isOpen={showPayoutHistoryModal}
        onClose={() => setShowPayoutHistoryModal(false)}
        item={selectedItem}
        payoutImports={payoutImports}
      />

      {/* Profile Drawer */}
      {selectedPlacementId && (
        <WorkforceProfileDrawer
          placementId={selectedPlacementId}
          onClose={() => setSelectedPlacementId(null)}
        />
      )}
    </DashboardLayout>
  );
}
