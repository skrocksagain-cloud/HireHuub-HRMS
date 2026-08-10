import { useState } from "react";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import SectionHeader from "../../ui/SectionHeader";
import DashboardStats from "./components/cards/DashboardStats";
import RecentDocuments from "./components/cards/RecentDocuments";
import DocumentDistribution from "./components/cards/DocumentDistribution";
import DocumentActivity from "./components/cards/DocumentActivity";
import QuickActions from "./components/cards/QuickActions";
import OfferLetterGenerator from './components/OfferLetterGenerator';
import UploadDocumentDrawer from "./components/UploadDocumentDrawer";
import DocumentPreviewModal from "../../components/DocumentPreviewModal";
import {
  PayslipDrawer,
  IncrementLetterDrawer,
  RelievingLetterDrawer,
  ExperienceLetterDrawer,
} from "./components/DocumentGenerationDrawers";

import type { Document } from "../../types/Document";
import type { DocumentResult } from "../../core/engine/documentEngine";
import { documentCenterService } from "../../services/document/documentCenterService";

import useDocumentDashboard from "./useDocumentDashboard";
import { useOfferLetterGeneration } from './hooks/useOfferLetterGeneration';
import { useAuth } from "../../context/AuthContext";
import { permissionService } from "../../core/permissions/permissionService";

export default function DocumentDashboard() {
  const { user } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [isIncrementOpen, setIsIncrementOpen] = useState(false);
  const [isRelievingOpen, setIsRelievingOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [previewResult, setPreviewResult] = useState<DocumentResult | null>(null);

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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDocumentGeneratedSuccess = (res: DocumentResult) => {
    showToast(`Document '${res.fileName}' generated and downloaded successfully!`);
    refresh();
  };

  const handleDownloadDocument = async (docItem: Document) => {
    try {
      const docId = docItem.id || docItem.documentId;
      const registered = docId ? await documentCenterService.getDocumentById(docId) : null;
      const targetUrl = registered?.storageUrl || docItem.downloadUrl || docItem.fileUrl;
      if (!targetUrl) {
        showToast(`Document '${docItem.title}' file was not found in storage.`, 'error');
        return;
      }

      if (docId) {
        await documentCenterService.recordDownload(docId);
      }

      const link = window.document.createElement('a');
      link.href = targetUrl;
      link.target = '_blank';
      link.download = docItem.title.endsWith('.pdf') ? docItem.title : `${docItem.title}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      showToast(`Document '${docItem.title}' downloaded successfully.`);
      await refresh();
    } catch {
      showToast(`Failed to download document '${docItem.title}'.`, 'error');
    }
  };

  const handlePreviewDocument = async (docItem: Document) => {
    const docId = docItem.id || docItem.documentId;
    const registered = docId ? await documentCenterService.getDocumentById(docId) : null;
    const targetUrl = registered?.storageUrl || docItem.downloadUrl || docItem.fileUrl;
    if (!targetUrl) {
      showToast(`Document '${docItem.title}' preview file is unavailable.`, 'error');
      return;
    }

    setPreviewResult({
      success: true,
      documentId: docId,
      fileName: docItem.title,
      status: 'Generated',
      downloadUrl: targetUrl,
      previewUrl: targetUrl,
      storagePath: registered?.storagePath || docItem.storagePath || '',
      templateVersion: `v${docItem.version || 1}`,
      resolvedPlaceholders: {},
    });
  };

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

        {toastMessage && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            toastType === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage}</span>
          </div>
        )}

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
              onDownload={handleDownloadDocument}
              onPreview={handlePreviewDocument}
            />

            <DocumentDistribution
              loading={loading}
              data={distribution}
            />
          </div>

          {/* Right Section */}
          <div className="space-y-6">
            <QuickActions
              onGenerateOfferLetter={() => {
                const el = window.document.getElementById('offer-letter-generator');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else showToast('Select an offer from the list above to generate PDF.');
              }}
              onGeneratePayslip={() => setIsPayslipOpen(true)}
              onGenerateIncrementLetter={() => setIsIncrementOpen(true)}
              onGenerateRelievingLetter={() => setIsRelievingOpen(true)}
              onUploadDocument={() => setIsUploadOpen(true)}
            />

            <DocumentActivity
              loading={loading}
              activities={activities}
            />
          </div>
        </div>

        {/* Drawers for Document Generation */}
        <PayslipDrawer
          isOpen={isPayslipOpen}
          onClose={() => setIsPayslipOpen(false)}
          onSuccess={handleDocumentGeneratedSuccess}
        />

        <IncrementLetterDrawer
          isOpen={isIncrementOpen}
          onClose={() => setIsIncrementOpen(false)}
          onSuccess={handleDocumentGeneratedSuccess}
        />

        <RelievingLetterDrawer
          isOpen={isRelievingOpen}
          onClose={() => setIsRelievingOpen(false)}
          onSuccess={handleDocumentGeneratedSuccess}
        />

        <ExperienceLetterDrawer
          isOpen={isExperienceOpen}
          onClose={() => setIsExperienceOpen(false)}
          onSuccess={handleDocumentGeneratedSuccess}
        />

        {/* Upload Document Drawer */}
        <UploadDocumentDrawer
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            refresh();
            setIsUploadOpen(false);
          }}
        />

        {/* Preview Modal */}
        {previewResult && (
          <DocumentPreviewModal
            result={previewResult}
            onClose={() => setPreviewResult(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
