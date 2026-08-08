import { useState } from 'react';
import { FileText, Save, CheckCircle2, Upload, Plus, History, Layers } from 'lucide-react';
import { useAdminCompany, useAdminDocumentTemplates } from '../../../hooks/admin/useAdmin';
import type { DocumentTemplateConfig, TemplateHistoryEntry } from '../../../types/Admin';

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
  const { templates, isLoading, saveTemplate, uploadTemplateFile } = useAdminDocumentTemplates();

  const [selectedType, setSelectedType] = useState<string>('Offer Letter');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [customCategory, setCustomCategory] = useState<'HR' | 'Finance' | 'Payroll' | 'Custom'>('HR');
  const [customFormat, setCustomFormat] = useState<'DOCX' | 'XLSX'>('DOCX');

  const [statusMsg, setStatusMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Find existing config or prepare default
  const existingConfig = templates.find(
    (t) => t.type.toLowerCase() === selectedType.toLowerCase() || t.id === slugify(selectedType)
  );

  const matchedMeta = STANDARD_DOCUMENT_TYPES.find((d) => d.type === selectedType);
  const category = existingConfig?.category || matchedMeta?.category || 'HR';
  const format = existingConfig?.format || matchedMeta?.format || 'DOCX';

  const [form, setForm] = useState<DocumentTemplateConfig>(
    existingConfig || {
      id: slugify(selectedType),
      templateName: `${selectedType} Configuration`,
      type: selectedType,
      category,
      format,
      content: 'Placeholders: {{employee_name}}, {{designation}}, {{date}}, {{company_name}}, {{amount}}',
      templateFileUrl: '',
      templateStoragePath: '',
      activeVersion: 'v1.0',
      previousVersions: [],
      defaultSignatureId: company?.signatures[0]?.id || '',
      includeStamp: true,
      includeLogo: true,
      headerText: 'HIRE HUUB ONE — OFFICIAL DOCUMENT',
      footerText: 'Hire Huub Pvt Ltd | Confidential & Proprietary',
      placeholders: ['employee_name', 'designation', 'date', 'company_name', 'amount'],
      isActive: true,
    }
  );

  // When switching document type, automatically reload its specific configuration
  if (existingConfig && form.id !== existingConfig.id) {
    setForm(existingConfig);
  } else if (!existingConfig && form.type !== selectedType) {
    setForm({
      id: slugify(selectedType),
      templateName: `${selectedType} Configuration`,
      type: selectedType,
      category,
      format,
      content: 'Placeholders: {{employee_name}}, {{designation}}, {{date}}, {{company_name}}, {{amount}}',
      templateFileUrl: '',
      templateStoragePath: '',
      activeVersion: 'v1.0',
      previousVersions: [],
      defaultSignatureId: company?.signatures[0]?.id || '',
      includeStamp: true,
      includeLogo: true,
      headerText: 'HIRE HUUB ONE — OFFICIAL DOCUMENT',
      footerText: 'Hire Huub Pvt Ltd | Confidential & Proprietary',
      placeholders: ['employee_name', 'designation', 'date', 'company_name', 'amount'],
      isActive: true,
    });
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveTemplate(form);
      setStatusMsg(`Template configuration for '${form.type}' saved successfully!`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      setStatusMsg('Failed to save template configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (form.format === 'DOCX' && fileExt !== 'docx') {
      setStatusMsg(`ERROR: Invalid file format! ${form.type} (${form.category}) requires a .docx file.`);
      return;
    }
    if (form.format === 'XLSX' && fileExt !== 'xlsx') {
      setStatusMsg(`ERROR: Invalid file format! ${form.type} (${form.category}) requires an .xlsx file.`);
      return;
    }

    setUploading(true);
    try {
      const { url, path } = await uploadTemplateFile(form.type, file, form.activeVersion);
      setForm((prev) => ({
        ...prev,
        templateFileUrl: url,
        templateStoragePath: path,
      }));
      setStatusMsg(`Uploaded template file (${file.name}) to Firebase Storage (/templates/${slugify(form.type)}/)!`);
    } catch {
      setStatusMsg('Failed to upload template file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCustomType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTypeName.trim()) return;

    const newType = customTypeName.trim();
    setSelectedType(newType);
    setForm({
      id: slugify(newType),
      templateName: `${newType} Configuration`,
      type: newType,
      category: customCategory,
      format: customFormat,
      content: 'Placeholders: {{employee_name}}, {{date}}, {{company_name}}',
      templateFileUrl: '',
      templateStoragePath: '',
      activeVersion: 'v1.0',
      previousVersions: [],
      defaultSignatureId: company?.signatures[0]?.id || '',
      includeStamp: true,
      includeLogo: true,
      headerText: 'HIRE HUUB ONE — OFFICIAL DOCUMENT',
      footerText: 'Hire Huub Pvt Ltd | Confidential & Proprietary',
      placeholders: ['employee_name', 'date', 'company_name'],
      isActive: true,
    });

    setShowCustomModal(false);
    setCustomTypeName('');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Template Engine…</div>;
  }

  // Combine standard and custom document types dynamically
  const allDocTypes = [
    ...STANDARD_DOCUMENT_TYPES.map((d) => d.type),
    ...templates.map((t) => t.type).filter((t) => !STANDARD_DOCUMENT_TYPES.some((s) => s.type === t)),
  ];

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Top Header & Document Type Switcher */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" />
            Document Template Configuration Engine
          </h3>
          <p className="text-slate-500">
            Independent DOCX & XLSX template configurations per document type. Admin acts as the Single Source of Truth for document generation.
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
                const tmpl = templates.find((item) => item.type.toLowerCase() === t.toLowerCase());
                return (
                  <option key={t} value={t}>
                    {t} {tmpl?.templateFileUrl ? '✓ File' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
          >
            <Plus size={16} /> New Document Type
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* Main Form for Selected Document Type */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-bold text-slate-900 text-sm">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" />
              <span>Configuring: <span className="text-emerald-700">{form.type}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono font-bold text-slate-700 text-[10px]">
                {form.category} Module
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 font-mono font-bold text-emerald-700 text-[10px]">
                Format: {form.format}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Template Configuration Name *</label>
              <input
                type="text"
                value={form.templateName}
                onChange={(e) => setForm({ ...form, templateName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Active Version *</label>
              <input
                type="text"
                value={form.activeVersion}
                onChange={(e) => setForm({ ...form, activeVersion: e.target.value })}
                placeholder="e.g. v1.0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Assigned Authorized Signature</label>
              <select
                value={form.defaultSignatureId}
                onChange={(e) => setForm({ ...form, defaultSignatureId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="">No Signature Assigned</option>
                {company?.signatures?.map((sig) => (
                  <option key={sig.id} value={sig.id}>
                    {sig.name} ({sig.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template File Upload (Firebase Storage) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Template File Upload (Firebase Storage /templates/{slugify(form.type)}/)</span>
              <span className="font-mono text-[10px] text-slate-400">Allowed: .{form.format.toLowerCase()}</span>
            </div>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition">
                <Upload size={16} />
                {uploading ? 'Uploading to Firebase Storage…' : form.templateFileUrl ? `Replace ${form.format} File` : `Upload ${form.format} Template`}
                <input
                  type="file"
                  accept={form.format === 'DOCX' ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex-1 font-mono text-[11px] text-slate-600 truncate">
                {form.templateFileUrl ? (
                  <a href={form.templateFileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                    ✓ Active Template File ({form.activeVersion})
                  </a>
                ) : (
                  <span className="text-slate-400">No template file uploaded to Storage yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Branding Toggles & Headers/Footers */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold mb-1">Header Text / Document Banner</label>
              <input
                type="text"
                value={form.headerText}
                onChange={(e) => setForm({ ...form, headerText: e.target.value })}
                placeholder="Header title for generated PDF"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Footer Text / Legal Disclaimer</label>
              <input
                type="text"
                value={form.footerText}
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                placeholder="Footer info for generated PDF"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 py-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={form.includeLogo}
                onChange={(e) => setForm({ ...form, includeLogo: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Include Company Logo
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={form.includeStamp}
                onChange={(e) => setForm({ ...form, includeStamp: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Include Official Company Stamp
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Active Configuration
            </label>
          </div>

          {/* Placeholders Configuration */}
          <div>
            <label className="block font-semibold mb-1">Configured Placeholders (Comma-separated)</label>
            <input
              type="text"
              value={form.placeholders.join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  placeholders: e.target.value.split(',').map((p) => p.trim()).filter(Boolean),
                })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Version History Preservation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b pb-2 flex items-center gap-2">
            <History size={16} /> Version Control & Template History (Preserved)
          </div>

          {form.previousVersions && form.previousVersions.length > 0 ? (
            <div className="space-y-2">
              {form.previousVersions.map((h: TemplateHistoryEntry, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{h.version}</span>
                    <span className="text-slate-400 ml-2">({h.fileName})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">Uploaded by {h.uploadedBy} on {new Date(h.uploadedAt).toLocaleDateString()}</span>
                    <a
                      href={h.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white border border-slate-200 text-emerald-700 font-bold rounded-lg hover:bg-slate-100"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400 font-medium text-xs">
              No previous template versions. Old uploaded files are preserved here automatically upon version updates.
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition"
          >
            <Save size={16} />
            {isSaving ? 'Saving Template…' : `Save ${form.type} Configuration`}
          </button>
        </div>
      </form>

      {/* Modal for Creating New Custom Document Type */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">Add New Custom Document Type</h3>

            <form onSubmit={handleCreateCustomType} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Document Type Name *</label>
                <input
                  type="text"
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder="e.g. Probation Confirmation"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Module Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as 'HR' | 'Finance' | 'Payroll' | 'Custom')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="HR">HR Documents</option>
                  <option value="Finance">Finance Documents</option>
                  <option value="Payroll">Payroll Documents</option>
                  <option value="Custom">Custom Module</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Template Format</label>
                <select
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value as 'DOCX' | 'XLSX')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="DOCX">DOCX (Word Document)</option>
                  <option value="XLSX">XLSX (Excel Sheet)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Create Document Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
