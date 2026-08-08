import { useState } from "react";
import { Upload } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SectionHeader from "../../ui/SectionHeader";
import DashboardStats from "./components/cards/DashboardStats";
import RecentDocuments from "./components/cards/RecentDocuments";
import DocumentDistribution from "./components/cards/DocumentDistribution";
import DocumentActivity from "./components/cards/DocumentActivity";
import QuickActions from "./components/cards/QuickActions";
import OfferLetterGenerator from './components/OfferLetterGenerator';
import UploadDocumentDrawer from "./components/UploadDocumentDrawer";

import useDocumentDashboard from "./useDocumentDashboard";
import { useOfferLetterGeneration } from './hooks/useOfferLetterGeneration';
import { useAuth } from "../../context/AuthContext";
import { permissionService } from "../../core/permissions/permissionService";

export default function DocumentDashboard() {
  const { user } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const {
    loading,
    totalDocuments,
    generatedToday,
    storageUsed,
    totalTemplates,
    recentDocuments,
    activities,
    distribution,
    refresh,
  } = useDocumentDashboard();

  const {
    offers,
    isLoadingOffers,
    isGenerating,
    error,
    generatedFileName,
    generateOfferLetter,
  } = useOfferLetterGeneration();

  const canUpload = permissionService.canUploadDocument(user?.role || "Employee");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SectionHeader
            title="Document Center Workspace"
            subtitle="Single Source of Truth for all Hire Huub One ERP documents."
          />

          {canUpload && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition"
            >
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
          )}
        </div>

        <OfferLetterGenerator
          offers={offers}
          isLoadingOffers={isLoadingOffers}
          isGenerating={isGenerating}
          error={error}
          generatedFileName={generatedFileName}
          onGenerate={generateOfferLetter}
        />

        {/* Statistics */}
        <DashboardStats
          loading={loading}
          totalDocuments={totalDocuments}
          generatedToday={generatedToday}
          storageUsed={storageUsed}
          totalTemplates={totalTemplates}
        />

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="xl:col-span-2 space-y-6">
            <RecentDocuments
              loading={loading}
              documents={recentDocuments}
              onRefresh={refresh}
            />

            <DocumentDistribution
              loading={loading}
              data={distribution}
            />
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            <QuickActions />

            <DocumentActivity
              loading={loading}
              activities={activities}
            />
          </div>
        </div>

        {/* Upload Document Drawer */}
        <UploadDocumentDrawer
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={refresh}
        />
      </div>
    </DashboardLayout>
  );
}
