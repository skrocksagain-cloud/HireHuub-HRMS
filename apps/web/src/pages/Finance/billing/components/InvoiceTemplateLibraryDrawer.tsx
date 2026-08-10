import { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
} from 'lucide-react';
import Drawer from '../../../../ui/Drawer';
import { invoiceTemplateService } from '../services/invoiceTemplateService';
import type { InvoiceTemplate } from '../../../../types/InvoiceTemplate';

interface InvoiceTemplateLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actorName: string;
}

export default function InvoiceTemplateLibraryDrawer({
  isOpen,
  onClose,
  actorName,
}: InvoiceTemplateLibraryDrawerProps) {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // New Template Upload Form
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [templateNameInput, setTemplateNameInput] = useState<string>('');
  const [companyNameInput, setCompanyNameInput] = useState<string>('');
  const [remarksInput, setRemarksInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Version Upload modal state
  const [versionTarget, setVersionTarget] = useState<InvoiceTemplate | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionRemarks, setVersionRemarks] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await invoiceTemplateService.getTemplates();
      setTemplates(list);
    } catch {
      setError('Unable to load invoice templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a template file (.xlsx / .pdf).');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await invoiceTemplateService.uploadTemplateFile(selectedFile, {
        templateName: templateNameInput,
        companyName: companyNameInput,
        uploadedBy: actorName,
        remarks: remarksInput,
      });
      setSuccess(`Template '${templateNameInput}' uploaded successfully.`);
      setShowUploadForm(false);
      setTemplateNameInput('');
      setCompanyNameInput('');
      setRemarksInput('');
      setSelectedFile(null);
      await loadTemplates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload template file.');
    } finally {
      setUploading(false);
    }
  };

  const handleVersionUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTarget || !versionFile) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await invoiceTemplateService.uploadNewTemplateVersion(
        versionTarget.id,
        versionFile,
        actorName,
        versionRemarks
      );
      setSuccess(`New version uploaded for '${versionTarget.templateName}'.`);
      setVersionTarget(null);
      setVersionFile(null);
      setVersionRemarks('');
      await loadTemplates();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload new template version.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await invoiceTemplateService.toggleTemplateStatus(id, actorName);
      await loadTemplates();
    } catch {
      setError('Failed to update template status.');
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template '${name}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await invoiceTemplateService.deleteTemplate(id, actorName);
      setSuccess(`Template '${name}' deleted.`);
      await loadTemplates();
    } catch {
      setError('Failed to delete template.');
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Invoice Template Library">
      <div className="space-y-5 text-xs text-slate-700 p-1">
        {/* Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Multi-Client Invoice Template Library</h3>
              <p className="text-slate-600 text-xs">
                Manage independent billing formats for clients (Blinkit, ElasticRun, BigBasket, Zepto, Amazon, Standard).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition shrink-0"
          >
            <Plus size={14} />
            <span>Upload Template</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Upload Form Modal/Container */}
        {showUploadForm && (
          <form onSubmit={handleCreateTemplateSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-700">
                Upload New Invoice Template Document
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  placeholder="e.g. Zepto Invoice"
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Client / Company Name *</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="e.g. Kiranakart Technologies (Zepto)"
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Template File (.xlsx, .pdf, .docx) *</label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.pdf,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remarks / Format Notes</label>
              <input
                type="text"
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Specific column structure or client requirements"
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-3.5 py-2 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Save Template Record'}
              </button>
            </div>
          </form>
        )}

        {/* Upload Version Modal */}
        {versionTarget && (
          <form onSubmit={handleVersionUploadSubmit} className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <h4 className="font-bold text-amber-950 text-xs">
                Upload New Version for '{versionTarget.templateName}' (Target v{versionTarget.version + 1})
              </h4>
              <button
                type="button"
                onClick={() => setVersionTarget(null)}
                className="text-amber-700 hover:text-amber-900 text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Template File *</label>
              <input
                type="file"
                accept=".xlsx,.xls,.pdf,.docx"
                onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Version Release Notes</label>
              <input
                type="text"
                value={versionRemarks}
                onChange={(e) => setVersionRemarks(e.target.value)}
                placeholder="e.g. Updated tax column layout for FY 2026-27"
                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setVersionTarget(null)}
                className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-xs transition disabled:opacity-50"
              >
                {uploading ? 'Uploading Version...' : `Upload v${versionTarget.version + 1}`}
              </button>
            </div>
          </form>
        )}

        {/* Template Cards List */}
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading template records…</div>
        ) : (
          <div className="space-y-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{tmpl.templateName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tmpl.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {tmpl.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                      v{tmpl.version}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs font-medium">{tmpl.companyName}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>File: <strong className="text-slate-700">{tmpl.fileName}</strong></span>
                    <span>•</span>
                    <span>Uploaded By: {tmpl.uploadedBy}</span>
                    {tmpl.remarks && (
                      <>
                        <span>•</span>
                        <span>{tmpl.remarks}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVersionTarget(tmpl)}
                    title="Upload New Version"
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition text-xs font-semibold flex items-center gap-1 border border-amber-200"
                  >
                    <RefreshCw size={14} />
                    <span>New Version</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(tmpl.id)}
                    title={tmpl.status === 'Active' ? 'Deactivate Template' : 'Activate Template'}
                    className={`p-2 rounded-xl transition text-xs font-semibold flex items-center gap-1 border ${
                      tmpl.status === 'Active'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {tmpl.status === 'Active' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    <span>{tmpl.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  {tmpl.fileUrl && (
                    <a
                      href={tmpl.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={tmpl.fileName}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-semibold flex items-center gap-1"
                    >
                      <Download size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(tmpl.id, tmpl.templateName)}
                    title="Delete Template"
                    className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-xl transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
