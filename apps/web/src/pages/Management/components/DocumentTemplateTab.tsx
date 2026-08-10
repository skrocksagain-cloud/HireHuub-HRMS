import { useState } from 'react';
import {
  FileText,
  Save,
  CheckCircle2,
  Upload,
  Plus,
  Layers,
  FileSpreadsheet,
  Download,
  Trash2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useAdminCompany, useAdminDocumentTemplates } from '../../../hooks/admin/useAdmin';
import type { DocumentTemplateConfig, TemplateHistoryEntry } from '../../../types/Admin';
import documentEngine, { type DocumentResult } from '../../../core/engine/documentEngine';
import DocumentPreviewModal from '../../../components/DocumentPreviewModal';

const STANDARD_DOCUMENT_TYPES = [
  { type: 'Offer Letter', category: 'HR', format: 'DOCX' },
  { type: 'Appointment Letter', category: 'HR', format: 'DOCX' },
  { type: 'Confirmation Letter', category: 'HR', format: 'DOCX' },
  { type: 'Increment Letter', category: 'HR', format: 'DOCX' },
  { type: 'Experience Letter', category: 'HR', format: 'DOCX' },
  { type: 'Relieving Letter', category: 'HR', format: 'DOCX' },
  { type: 'Warning Letter', category: 'HR', format: 'DOCX' },
  { type: 'Termination Letter', category: 'HR', format: 'DOCX' },
  { type: 'NDA', category: 'HR', format: 'DOCX' },
  { type: 'Employment Contract', category: 'HR', format: 'DOCX' },
  { type: 'Invoice', category: 'Finance', format: 'XLSX' },
  { type: 'Credit Note', category: 'Finance', format: 'XLSX' },
  { type: 'Debit Note', category: 'Finance', format: 'XLSX' },
  { type: 'Payslip', category: 'Payroll', format: 'XLSX' },
  { type: 'Salary Register', category: 'Payroll', format: 'XLSX' },
  { type: 'Payroll Reports', category: 'Payroll', format: 'XLSX' },
] as const;

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function DocumentTemplateTab() {
  const { company } = useAdminCompany();
  const { templates, isLoading, saveTemplate, uploadTemplateFile, deleteTemplate } = useAdminDocumentTemplates();

  const [selectedType, setSelectedType] = useState<string>('Offer Letter');

  const [statusMsg, setStatusMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Invoice Multi-Template Upload Form State
  const [showUploadInvoiceModal, setShowUploadInvoiceModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newTemplateRemarks, setNewTemplateRemarks] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  // Version Upload State
  const [versionTarget, setVersionTarget] = useState<DocumentTemplateConfig | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionRemarks, setVersionRemarks] = useState('');

  // Find existing config or prepare default for single doc types
  const existingConfig = templates.find(
    (t) => t.type.toLowerCase() === selectedType.toLowerCase() || t.id === slugify(selectedType)
  );

  const matchedMeta = STANDARD_DOCUMENT_TYPES.find((d) => d.type === selectedType);
  const category = existingConfig?.category || matchedMeta?.category || 'HR';
  const format = existingConfig?.format || matchedMeta?.format || 'DOCX';

  const defaultSigId = existingConfig?.assignedSignatureId || existingConfig?.defaultSignatureId || company?.signatures[0]?.id || '';

  const [form, setForm] = useState<DocumentTemplateConfig>(
    existingConfig || {
      id: slugify(selectedType),
      templateName: `${selectedType} Configuration`,
      type: selectedType,
      category,
      format,
      templateFileUrl: '',
      templateStoragePath: '',
      activeVersion: 'v1.0',
      previousVersions: [],
      assignedSignatureId: defaultSigId,
      defaultSignatureId: defaultSigId,
      useCompanyLetterhead: category === 'HR',
      includeLetterhead: category === 'HR',
      useCompanyFooter: category === 'HR',
      includeFooter: category === 'HR',
      useOfficialStamp: true,
      includeStamp: true,
      brandingProfileId: 'profile-default',
      placeholders: ['employee_name', 'designation', 'date', 'company_name', 'amount'],
      isActive: true,
    }
  );

  const [previewResult, setPreviewResult] = useState<DocumentResult | null>(null);

  const invoiceTemplatesList = templates.filter(
    (t) => t.type.toLowerCase() === 'invoice' || (t as { documentType?: string }).documentType?.toLowerCase() === 'invoice'
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: DocumentTemplateConfig = {
        ...form,
        defaultSignatureId: form.assignedSignatureId || form.defaultSignatureId || '',
        includeStamp: form.useOfficialStamp ?? form.includeStamp ?? true,
        includeLetterhead: form.useCompanyLetterhead ?? form.includeLetterhead ?? (form.category === 'HR'),
        includeFooter: form.useCompanyFooter ?? form.includeFooter ?? (form.category === 'HR'),
      };
      await saveTemplate(payload);
      setStatusMsg(`Template configuration for '${form.type}' saved successfully.`);
      setTimeout(() => setStatusMsg(''), 4000);
    } catch {
      setStatusMsg('Error saving template configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg('');
    try {
      const versionNumber = (form.previousVersions?.length || 0) + 1;
      const nextVerStr = `v${versionNumber + 1}.0`;
      const res = await uploadTemplateFile(form.type, file, nextVerStr);

      const historyItem: TemplateHistoryEntry = {
        version: form.activeVersion || 'v1.0',
        fileUrl: form.templateFileUrl,
        fileName: `${form.type}_${form.activeVersion || 'v1.0'}`,
        uploadedBy: 'Super Admin',
        uploadedAt: new Date().toISOString(),
        storagePath: form.templateStoragePath || '',
      };

      const updatedHistory = form.templateFileUrl
        ? [historyItem, ...(form.previousVersions || [])]
        : form.previousVersions || [];

      const updated: DocumentTemplateConfig = {
        ...form,
        templateFileUrl: res.url,
        templateStoragePath: res.path,
        activeVersion: nextVerStr,
        previousVersions: updatedHistory,
      };

      setForm(updated);
      await saveTemplate(updated);
      setStatusMsg(`New template version ${nextVerStr} uploaded successfully.`);
    } catch {
      setStatusMsg('Failed to upload template file.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadNewInvoiceTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile || !newTemplateName.trim() || !newClientName.trim()) {
      setStatusMsg('Please select a file and enter template and client names.');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadTemplateFile('Invoice', newFile, 'v1.0');
      const templateId = slugify(`tmpl-${newTemplateName}`);

      const newTemplate: DocumentTemplateConfig = {
        id: templateId,
        templateId,
        templateName: newTemplateName.trim(),
        type: 'Invoice',
        clientName: newClientName.trim(),
        companyName: newClientName.trim(),
        category: 'Finance',
        format: newFile.name.endsWith('.pdf') ? 'PDF' : 'XLSX',
        activeVersion: 'v1.0',
        version: 1,
        status: 'Active',
        isActive: true,
        templateFileUrl: res.url,
        templateStoragePath: res.path,
        fileName: newFile.name,
        fileSize: newFile.size,
        mimeType: newFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedBy: 'Super Admin',
        uploadedAt: new Date().toISOString(),
        remarks: newTemplateRemarks,
        defaultSignatureId: 'sig-1',
        includeStamp: true,
        previousVersions: [],
        placeholders: ['invoice_number', 'invoice_date', 'client_name', 'taxable_amount', 'gst_amount', 'grand_total'],
      };

      await saveTemplate(newTemplate);
      setShowUploadInvoiceModal(false);
      setNewTemplateName('');
      setNewClientName('');
      setNewTemplateRemarks('');
      setNewFile(null);
      setStatusMsg(`Invoice template '${newTemplateName}' created successfully.`);
    } catch {
      setStatusMsg('Failed to upload invoice template.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTarget || !versionFile) return;
    setUploading(true);
    try {
      const newVerNum = (versionTarget.version || 1) + 1;
      const verStr = `v${newVerNum}.0`;
      const res = await uploadTemplateFile(versionTarget.type || 'Invoice', versionFile, verStr);

      const historyItem: TemplateHistoryEntry = {
        version: versionTarget.activeVersion || `v${versionTarget.version || 1}.0`,
        fileUrl: versionTarget.templateFileUrl,
        fileName: versionTarget.fileName || `${versionTarget.templateName}_v${versionTarget.version || 1}`,
        uploadedBy: versionTarget.uploadedBy || 'Super Admin',
        uploadedAt: versionTarget.uploadedAt || new Date().toISOString(),
        storagePath: versionTarget.templateStoragePath || '',
      };

      const updatedConfig: DocumentTemplateConfig = {
        ...versionTarget,
        activeVersion: verStr,
        version: newVerNum,
        templateFileUrl: res.url,
        templateStoragePath: res.path,
        fileName: versionFile.name,
        fileSize: versionFile.size,
        mimeType: versionFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        previousVersions: [historyItem, ...(versionTarget.previousVersions || [])],
        updatedAt: new Date().toISOString(),
        remarks: versionRemarks || `Version ${newVerNum} update`,
      };

      await saveTemplate(updatedConfig);
      setVersionTarget(null);
      setVersionFile(null);
      setVersionRemarks('');
      setStatusMsg(`New version v${newVerNum} uploaded for '${versionTarget.templateName}'.`);
    } catch {
      setStatusMsg('Failed to upload template version.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleStatus = async (tmpl: DocumentTemplateConfig) => {
    const newStatus = (tmpl.status || (tmpl.isActive ? 'Active' : 'Inactive')) === 'Active' ? 'Inactive' : 'Active';
    await saveTemplate({
      ...tmpl,
      status: newStatus,
      isActive: newStatus === 'Active',
    });
    setStatusMsg(`Template '${tmpl.templateName}' set to ${newStatus}.`);
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete '${name}'?`)) return;
    await deleteTemplate(id);
    setStatusMsg(`Template '${name}' deleted.`);
  };

  const handleOpenPreview = async () => {
    const res = await documentEngine.generate({
      module: (form.category === 'Custom' ? 'HR' : form.category) as 'HR' | 'Finance' | 'Payroll',
      type: form.type,
      identifier: 'PREVIEW_SAMPLE',
      generatedBy: 'admin',
      generatedByName: 'Super Admin',
      context: {
        employee: {
          fullName: 'Rohan Sharma (Sample)',
          designation: 'Senior HR Manager',
          department: 'Human Resources',
          joiningDate: new Date().toLocaleDateString(),
          ctc: '₹12,00,000 LPA',
        },
      },
    });
    setPreviewResult(res);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Template Engine…</div>;
  }

  const allDocTypes = [
    ...STANDARD_DOCUMENT_TYPES.map((d) => d.type),
    ...templates.map((t) => t.type).filter((t) => !STANDARD_DOCUMENT_TYPES.some((s) => s.type === t)),
  ];

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Top Header & Document Type Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            Document Template Configuration Engine (Single Source of Truth)
          </h3>
          <p className="text-slate-500 text-xs">
            Manage all ERP templates in Firestore <code className="font-mono text-emerald-800">document_templates</code> collection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700">Document Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
            >
              {allDocTypes.map((t) => {
                const count = templates.filter((item) => item.type.toLowerCase() === t.toLowerCase()).length;
                return (
                  <option key={t} value={t}>
                    {t} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedType === 'Invoice' ? (
            <button
              type="button"
              onClick={() => setShowUploadInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              <Plus size={16} /> New Client Template
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowUploadInvoiceModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
            >
              <Plus size={16} /> New Document Type
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* SPECIAL MULTI-TEMPLATE LIST FOR INVOICE TYPE */}
      {selectedType === 'Invoice' ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Multi-Client Invoice Templates (document_templates)</h3>
                <p className="text-slate-600 text-xs">
                  Central Firestore repository for client invoice formats (Blinkit, ElasticRun, BigBasket, Zepto, Amazon, Standard).
                </p>
              </div>
            </div>
          </div>

          {showUploadInvoiceModal && (
            <form onSubmit={handleUploadNewInvoiceTemplate} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 font-bold text-slate-900 text-xs">
                <span>Upload New Client Invoice Template (.xlsx / .pdf)</span>
                <button type="button" onClick={() => setShowUploadInvoiceModal(false)} className="text-slate-400">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Zepto Invoice"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client / Legal Name *</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="e.g. KIRANAKART TECHNOLOGIES"
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template File *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf,.docx"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadInvoiceModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  {uploading ? 'Uploading...' : 'Save Template Record'}
                </button>
              </div>
            </form>
          )}

          {versionTarget && (
            <form onSubmit={handleUploadVersionSubmit} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2 font-bold text-amber-950 text-xs">
                <span>Upload Version {(versionTarget.version || 1) + 1} for '{versionTarget.templateName}'</span>
                <button type="button" onClick={() => setVersionTarget(null)} className="text-amber-700">✕</button>
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
                <label className="block font-semibold text-slate-700 mb-1">Version Notes</label>
                <input
                  type="text"
                  value={versionRemarks}
                  onChange={(e) => setVersionRemarks(e.target.value)}
                  placeholder="e.g. Layout update"
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setVersionTarget(null)} className="px-3 py-1.5 bg-white border rounded-xl">Cancel</button>
                <button type="submit" disabled={uploading} className="px-3.5 py-1.5 bg-amber-600 text-white font-bold rounded-xl shadow-xs">
                  {uploading ? 'Uploading...' : 'Save New Version'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {invoiceTemplatesList.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{tmpl.templateName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      (tmpl.status || (tmpl.isActive ? 'Active' : 'Inactive')) === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {tmpl.status || (tmpl.isActive ? 'Active' : 'Inactive')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                      v{tmpl.version || 1}
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs font-medium">{tmpl.clientName || tmpl.companyName || 'Hire Huub'}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>File: <strong className="text-slate-700">{tmpl.fileName || 'template.xlsx'}</strong></span>
                    <span>•</span>
                    <span>Uploaded By: {tmpl.uploadedBy || tmpl.modifiedBy || 'Admin'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVersionTarget(tmpl)}
                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1 border border-amber-200"
                  >
                    <RefreshCw size={14} /> <span>New Version</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(tmpl)}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 border ${
                      (tmpl.status || (tmpl.isActive ? 'Active' : 'Inactive')) === 'Active'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {(tmpl.status || (tmpl.isActive ? 'Active' : 'Inactive')) === 'Active' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    <span>{(tmpl.status || (tmpl.isActive ? 'Active' : 'Inactive')) === 'Active' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  {tmpl.templateFileUrl && (
                    <a
                      href={tmpl.templateFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={tmpl.fileName || 'template.xlsx'}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <Download size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(tmpl.id, tmpl.templateName)}
                    className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-xl"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* STANDARD SINGLE-TYPE FORM FOR HR & PAYROLL DOCUMENTS */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-slate-900 text-sm">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-600" />
                <span>Configuring Template: <span className="text-emerald-700">{form.type}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono font-bold text-slate-700 text-[10px]">
                  {form.category} Module
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 font-mono font-bold text-emerald-700 text-[10px]">
                  Required Format: {form.format}
                </span>
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                >
                  <FileText size={14} /> Preview Document
                </button>
              </div>
            </div>

            {/* Template Master Document File */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Uploaded Master Template File</span>
                  <span className="text-[11px] text-slate-500">
                    {form.templateFileUrl
                      ? `Active Version: ${form.activeVersion || 'v1.0'} | Path: ${form.templateStoragePath}`
                      : 'No custom template uploaded. System will use standard built-in layout.'}
                  </span>
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition">
                  <Upload size={14} />
                  <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                  <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              {form.templateFileUrl && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <a href={form.templateFileUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">
                    Download Current Master ({form.activeVersion})
                  </a>
                  <span className="text-slate-400">History: {form.previousVersions?.length || 0} previous versions</span>
                </div>
              )}
            </div>

            {/* Save Action Bar */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving Config…' : `Save ${form.type} Config`}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Preview Modal */}
      {previewResult && (
        <DocumentPreviewModal result={previewResult} onClose={() => setPreviewResult(null)} />
      )}
    </div>
  );
}
