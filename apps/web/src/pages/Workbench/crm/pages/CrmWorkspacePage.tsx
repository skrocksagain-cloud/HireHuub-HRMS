import { useCrm } from '../hooks/useCrm';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import CrmHeader from '../components/CrmHeader';
import KpiCards from '../components/KpiCards';
import CrmFilters from '../components/CrmFilters';
import TodaysWorkQueue from '../components/TodaysWorkQueue';
import CandidateTable from '../components/CandidateTable';
import AddCandidateDrawer from '../components/AddCandidateDrawer';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import BulkImportModal from '../components/BulkImportModal';
import AssignmentCenterModal from '../components/AssignmentCenterModal';
import ClientProfileModal from '../components/ClientProfileModal';
import CandidateProfileDrawer from '../components/profile/CandidateProfileDrawer';
import CreatePlacementModal from '../components/profile/CreatePlacementModal';
import { UserCheck, ShieldAlert, CheckCircle } from 'lucide-react';

export default function CrmWorkspacePage({ embedLayout = true }: { embedLayout?: boolean }) {
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const {
    sessionUser,
    candidates,
    allCandidates,
    clients,
    openings,
    importHistory,
    loading,
    error,
    filters,
    setFilters,
    kpiSummary,
    todaysWorkQueue,
    selectedCandidate,
    setSelectedCandidate,
    isAddDrawerOpen,
    setIsAddDrawerOpen,
    isBulkImportOpen,
    setIsBulkImportOpen,
    isAssignmentCenterOpen,
    setIsAssignmentCenterOpen,
    assignmentMode,
    selectedCandidateIds,
    setSelectedCandidateIds,
    selectedClientPreview,
    setSelectedClientPreview,
    activeEmployees,
    assignableEmployees,
    toastMessage,
    handleAddCandidate,
    handleQuickUpdate,
    checkDuplicatePhone,
    handleBulkAssign,
    handleBulkTransfer,
  } = useCrm();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlCandidateId = searchParams.get('candidateId');

  useEffect(() => {
    if (urlCandidateId && allCandidates.length > 0 && !selectedCandidate) {
      const found = allCandidates.find((c) => c.id === urlCandidateId);
      if (found) {
        setSelectedCandidate(found);
      }
    }
  }, [urlCandidateId, allCandidates, selectedCandidate, setSelectedCandidate]);

  const handleCloseProfile = () => {
    setSelectedCandidate(null);
    if (urlCandidateId) {
      searchParams.delete('candidateId');
      setSearchParams(searchParams);
    }
  };

  // Handle Select All Candidates
  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedCandidateIds(candidates.map((c) => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  // Handle Toggle Single Candidate
  const handleToggleCandidateSelect = (id: string) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((item) => item !== id));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  if (loading) {
    const loadingView = (
      <div className="p-12 text-center text-slate-500 font-medium animate-pulse flex items-center justify-center gap-2">
        <UserCheck size={20} className="text-emerald-600 animate-spin" /> Loading Staffing Hub CRM Workspace...
      </div>
    );
    return embedLayout ? <DashboardLayout>{loadingView}</DashboardLayout> : loadingView;
  }

  if (error) {
    const errorView = (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between">
        <span className="font-semibold">Error loading CRM workspace: {error}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
    return embedLayout ? <DashboardLayout>{errorView}</DashboardLayout> : errorView;
  }

  const mainView = (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Permission Blocked View for HR/Finance/Marketing */}
      {['HR', 'Finance', 'Marketing'].includes(sessionUser.role) ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <ShieldAlert size={40} className="mx-auto text-amber-600 mb-2" />
          <h3 className="font-bold text-slate-800 text-base">Access Restricted</h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Your role (<strong>{sessionUser.role}</strong>) does not have permission to access Staffing Hub CRM. Please contact Staffing Admin or Super Admin if access is required.
          </p>
        </div>
      ) : (
        <>
          {/* Header Bar */}
          <CrmHeader
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => setFilters({ ...filters, searchQuery: q })}
            onOpenAddCandidate={() => setIsAddDrawerOpen(true)}
            onOpenImport={() => setIsBulkImportOpen(true)}
          />

          {/* KPI Metrics */}
          <KpiCards
            summary={kpiSummary}
            activeQuickFilter={filters.quickFilter}
            onFilterSelect={(qf) => setFilters({ ...filters, quickFilter: qf })}
          />

          {/* Quick & Advanced Filters */}
          <CrmFilters
            filters={filters}
            onFilterChange={setFilters}
            clients={clients}
            userRole={sessionUser.role}
            userAssignedRole={sessionUser.assignedRole}
            activeEmployees={activeEmployees}
          />

          {/* Today's Work Queue */}
          <TodaysWorkQueue
            queue={todaysWorkQueue}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
          />

          {/* Bulk Selection Bar if candidates selected */}
          {selectedCandidateIds.length > 0 && (
            <div className="p-3 bg-emerald-900 text-white rounded-xl flex items-center justify-between text-xs font-semibold shadow-md">
              <span>{selectedCandidateIds.length} Candidates Selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignmentCenterOpen(true)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  Bulk Assign / Reassign
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds([])}
                  className="px-2.5 py-1 text-slate-300 hover:text-white"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Candidate List (Simplified 1-click CTA) */}
          <CandidateTable
            candidates={candidates}
            onSelectCandidate={(c) => setSelectedCandidate(c)}
            selectedCandidateIds={selectedCandidateIds}
            onToggleCandidateSelect={handleToggleCandidateSelect}
            onSelectAll={handleSelectAll}
          />
        </>
      )}

      {/* Drawers and Modals */}
      <AddCandidateDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSubmit={async (input) => {
          await handleAddCandidate(input);
        }}
        checkDuplicatePhone={checkDuplicatePhone}
        userSession={{
          id: sessionUser.id,
          name: sessionUser.name,
          role: sessionUser.role,
          teamId: sessionUser.teamId,
        }}
        onOpenDuplicateProfile={(dupId) => {
          const found = allCandidates.find((c) => c.id === dupId);
          if (found) setSelectedCandidate(found);
        }}
        assignableEmployees={assignableEmployees}
      />



      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImportSuccess={() => {
          setIsBulkImportOpen(false);
        }}
        userRole={sessionUser.role}
        userAssignedRole={sessionUser.assignedRole}
        importHistory={importHistory}
        userSession={sessionUser}
        assignableEmployees={assignableEmployees}
      />

      <AssignmentCenterModal
        isOpen={isAssignmentCenterOpen}
        onClose={() => setIsAssignmentCenterOpen(false)}
        mode={assignmentMode}
        selectedCandidateIds={selectedCandidateIds}
        candidates={candidates}
        onBulkAssign={handleBulkAssign}
        onBulkTransfer={handleBulkTransfer}
        userRole={sessionUser.role}
        userAssignedRole={sessionUser.assignedRole}
        assignableEmployees={assignableEmployees}
        allActiveEmployees={activeEmployees}
      />

      <ClientProfileModal
        client={selectedClientPreview}
        onClose={() => setSelectedClientPreview(null)}
      />

      <CandidateProfileDrawer
        isOpen={!!selectedCandidate}
        onClose={handleCloseProfile}
        candidate={selectedCandidate}
        clients={clients}
        openings={openings}
        onSubmitUpdate={handleQuickUpdate}
      />

      {selectedCandidate && (
        <CreatePlacementModal
          isOpen={isPlacementModalOpen}
          onClose={() => setIsPlacementModalOpen(false)}
          candidate={selectedCandidate}
          clients={clients}
        />
      )}
    </div>
  );

  return embedLayout ? <DashboardLayout>{mainView}</DashboardLayout> : mainView;
}
