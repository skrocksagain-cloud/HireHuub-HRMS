import { useState, useEffect } from "react";
import { Upload, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, FileText, ChevronRight } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import DashboardStats from "./components/cards/DashboardStats";
import RecentDocuments from "./components/cards/RecentDocuments";
import DocumentDistribution from "./components/cards/DocumentDistribution";
import DocumentActivity from "./components/cards/DocumentActivity";
import UploadDocumentDrawer from "./components/UploadDocumentDrawer";
import DocumentPreviewModal, { type DocumentResult } from "../../components/DocumentPreviewModal";
import { DocumentContentHubPage } from "./components/DocumentContentHub/DocumentContentHubPage";

import type { Document } from "../../types/Document";
import type { CompanySettings } from "../../types/Admin";
import { documentCenterService } from "../../services/document/documentCenterService";
import { adminService } from "../../services/admin/adminService";

import useDocumentDashboard from "./useDocumentDashboard";


export default function DocumentDashboard() {
  const [activeTab, setActiveTab] = useState<'content_hub' | 'history'>('history');
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const [isUploadOpen, setIsUploadOpen] = useState(false);

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

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await adminService.getCompanySettings();
        if (settings) {
          setCompanySettings(settings);
          if (settings.brandProfilesList && settings.brandProfilesList.length > 0) {
            setSelectedBrandId(settings.brandProfilesList[0].id);
          }
        }
      } catch {
        // Fallback
      }
    };
    loadSettings();
  }, []);

  const brandList = companySettings?.brandProfilesList || [];
  const activeBrand = brandList.find((b) => b.id === selectedBrandId) || brandList[0];

  const canUpload = true;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadDocument = async (docItem: Document) => {
    const targetUrl = docItem.downloadUrl || docItem.fileUrl;
    if (!targetUrl) {
      showToast(`Document '${docItem.title}' has no downloadable file URL.`, 'error');
      return;
    }
    try {
      if (docItem.id) {
        await documentCenterService.recordDownload(docItem.id);
      }
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = docItem.title || 'document';
      a.target = '_blank';
      a.click();
      showToast(`Downloaded '${docItem.title || 'Document'}'`);
    } catch {
      showToast(`Failed to download '${docItem.title || 'Document'}'`, 'error');
    }
  };

  const handlePreviewDocument = async (docItem: Document) => {
    const docId = docItem.id || '';
    const registered = docId ? await documentCenterService.getDocumentById(docId).catch(() => null) : null;
    const targetUrl = registered?.storageUrl || docItem.downloadUrl || docItem.fileUrl;
    if (!targetUrl) {
      showToast(`Document '${docItem.title}' preview file is unavailable.`, 'error');
      return;
    }

    setPreviewResult({
      success: true,
      documentId: docId,
      fileName: docItem.title,
      downloadUrl: targetUrl,
      previewUrl: targetUrl,
      storagePath: registered?.storagePath || docItem.storagePath || '',
      templateVersion: `v${docItem.version || 1}`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Top-Level Brand Selector & Breadcrumb Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-950 border border-sky-800/60 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-0.5">
                <span>Legal Entity: {companySettings?.companyName || 'Hire Huub ERP'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-sky-400 font-bold">Document Library</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-200">{activeBrand?.brandName || 'Hire Huub'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Brand Scope:</span>
                <div className="relative">
                  <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="bg-slate-950 border border-sky-600/80 rounded-xl px-3.5 py-1.5 text-xs text-sky-300 font-extrabold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-md cursor-pointer"
                  >
                    {brandList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.brandName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canUpload && (
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
              >
                <Upload size={16} />
                <span>Upload Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Document Library Subtabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'history'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Document Storage & History
          </button>
          <button
            onClick={() => setActiveTab('content_hub')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'content_hub'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Document Content Hub
          </button>
        </div>

        {toastMessage && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            toastType === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
              : 'bg-rose-950 border-rose-800 text-rose-300'
          }`}>
            {toastType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Document Storage & History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <DashboardStats
              loading={loading}
              totalDocuments={totalDocuments}
              generatedToday={generatedToday}
              storageUsed={storageUsed}
              totalTemplates={totalTemplates}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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

              <div className="space-y-6">
                <DocumentActivity
                  loading={loading}
                  activities={activities}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Document Content Hub */}
        {activeTab === 'content_hub' && (
          <DocumentContentHubPage />
        )}

        {/* Upload Document Drawer */}
        <UploadDocumentDrawer
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            setIsUploadOpen(false);
            showToast('Document uploaded successfully!');
            refresh();
          }}
        />

        {/* Document Preview Modal */}
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
