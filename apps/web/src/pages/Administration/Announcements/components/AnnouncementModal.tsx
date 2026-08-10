import React, { useState } from 'react';
import { FileUp, Megaphone, ShieldCheck, X } from 'lucide-react';
import type {
  AnnouncementCategory,
  AnnouncementItem,
  AnnouncementPriority,
  AnnouncementVisibilityScope,
  CircularFileMetadata,
} from '../../../../types/Announcement';
import ActiveEmployeePicker from './ActiveEmployeePicker';
import { usePermissions } from '../../../../hooks/usePermissions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (annData: Partial<AnnouncementItem> & { title: string; summary: string }) => Promise<unknown>;
  onUploadCircular: (file: File) => Promise<CircularFileMetadata>;
  initialData?: AnnouncementItem | null;
  isUploading?: boolean;
}

const CATEGORIES: AnnouncementCategory[] = [
  'HR Policy',
  'Finance',
  'Payroll',
  'Recruitment',
  'Staffing',
  'Marketing',
  'IT',
  'Operations',
  'Training',
  'Compliance',
  'Emergency',
  'General',
];

const PRIORITIES: AnnouncementPriority[] = ['Low', 'Medium', 'High', 'Critical'];

const SCOPES: AnnouncementVisibilityScope[] = [
  'Organization',
  'Company',
  'Department',
  'Team',
  'Selected Employees',
];

const DEMO_COMPANIES = [
  { id: 'cmp_1', name: 'Hire Huub One ERP Corp' },
  { id: 'cmp_2', name: 'Huub HR Technologies Ltd' },
];

const DEMO_DEPTS = [
  { id: 'dept_hr', name: 'Human Resources' },
  { id: 'dept_fin', name: 'Finance & Accounting' },
  { id: 'dept_eng', name: 'Engineering & IT' },
  { id: 'dept_mkt', name: 'Marketing & Sales' },
  { id: 'dept_ops', name: 'Operations & Staffing' },
];

const DEMO_TEAMS = [
  { id: 'team_core', name: 'Core Platform Engineering' },
  { id: 'team_payroll', name: 'Payroll Operations' },
  { id: 'team_talent', name: 'Talent Acquisition' },
];

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSave,
  onUploadCircular,
  initialData,
  isUploading = false,
}: Props) {
  const { activeRole } = usePermissions();
  const isSuperAdmin = activeRole.name === 'Super Admin' || activeRole.name === 'admin';

  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [category, setCategory] = useState<AnnouncementCategory>(initialData?.category || 'General');
  const [priority, setPriority] = useState<AnnouncementPriority>(initialData?.priority || 'Medium');
  const [visibility, setVisibility] = useState<AnnouncementVisibilityScope>(initialData?.visibility || 'Organization');

  const [companyIds, setCompanyIds] = useState<string[]>(initialData?.companyIds || []);
  const [departmentIds, setDepartmentIds] = useState<string[]>(initialData?.departmentIds || []);
  const [teamIds, setTeamIds] = useState<string[]>(initialData?.teamIds || []);
  const [employeeIds, setEmployeeIds] = useState<string[]>(initialData?.employeeIds || []);

  const [circularMetadata, setCircularMetadata] = useState<CircularFileMetadata | null>(initialData?.circularMetadata || null);
  const [requireAcknowledgement, setRequireAcknowledgement] = useState<boolean>(Boolean(initialData?.requireAcknowledgement));
  const [isPinned, setIsPinned] = useState<boolean>(Boolean(initialData?.isPinned));
  const [publishDate, setPublishDate] = useState(initialData?.publishDate || new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg('');
      const meta = await onUploadCircular(file);
      setCircularMetadata(meta);
    } catch {
      setErrorMsg('Failed to upload file to Firebase Storage. Please try again.');
    }
  };

  const handleSubmit = async (submitStatus: AnnouncementItem['status']) => {
    setErrorMsg('');
    if (!title.trim() || !summary.trim()) {
      setErrorMsg('Title and Executive Summary are required fields.');
      return;
    }

    if (!isSuperAdmin && visibility === 'Organization') {
      setErrorMsg('Department Admins cannot publish Organization-wide announcements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialData?.id,
        title: title.trim(),
        summary: summary.trim(),
        category,
        priority,
        status: submitStatus,
        visibility,
        companyIds,
        departmentIds,
        teamIds,
        employeeIds,
        circularMetadata,
        requireAcknowledgement,
        isPinned: priority === 'Critical' ? true : isPinned,
        publishDate,
        expiryDate: expiryDate || undefined,
        version: initialData?.version || '1.0',
      });
      setIsSubmitting(false);
      onClose();
    } catch (caught) {
      setIsSubmitting(false);
      const msg = caught instanceof Error ? caught.message : 'Error saving announcement.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
              <Megaphone size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {initialData ? `Edit Announcement (v${initialData.version})` : 'Create Enterprise Announcement'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Enterprise Announcement Center • Dynamic Scoping & File Upload
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Announcement Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Organization Policy & Compliance Circular"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Executive Summary Input Only (No Long Description) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Executive Summary *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide a concise 2-3 sentence executive summary for Dashboard & Notification card previews…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-3.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 leading-relaxed font-medium"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as AnnouncementPriority;
                  setPriority(val);
                  if (val === 'Critical') setIsPinned(true);
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} {p === 'Critical' ? '(Pinned & Mandatory)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Circular File Upload (Replaces URL inputs) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <FileUp size={16} /> Upload Circular Document (PDF / DOCX)
              </span>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>

            {circularMetadata ? (
              <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold rounded text-[10px]">
                    {circularMetadata.fileType}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {circularMetadata.originalFileName || circularMetadata.fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCircularMetadata(null)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Supported formats: PDF, DOCX (Max 25 MB). Direct Firebase Storage upload under /announcements/.
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Audience Engine */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Dynamic Audience Scope
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as AnnouncementVisibilityScope)}
              className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {SCOPES.map((sc) => (
                <option key={sc} value={sc}>
                  {sc} {!isSuperAdmin && sc === 'Organization' ? '(Super Admin Only)' : ''}
                </option>
              ))}
            </select>

            {/* Dynamic Pickers based on Scope */}
            {visibility === 'Organization' && (
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Visible to everyone across the entire organization.
              </div>
            )}

            {visibility === 'Company' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold block text-slate-700 dark:text-slate-300">Select Companies</span>
                <div className="space-y-1">
                  {DEMO_COMPANIES.map((cmp) => (
                    <label key={cmp.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={companyIds.includes(cmp.id)}
                        onChange={(e) => {
                          if (e.target.checked) setCompanyIds([...companyIds, cmp.id]);
                          else setCompanyIds(companyIds.filter((id) => id !== cmp.id));
                        }}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      {cmp.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {visibility === 'Department' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold block text-slate-700 dark:text-slate-300">Select Target Departments</span>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_DEPTS.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={departmentIds.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) setDepartmentIds([...departmentIds, d.id]);
                          else setDepartmentIds(departmentIds.filter((id) => id !== d.id));
                        }}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {visibility === 'Team' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold block text-slate-700 dark:text-slate-300">Select Target Teams</span>
                <div className="space-y-1">
                  {DEMO_TEAMS.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={teamIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setTeamIds([...teamIds, t.id]);
                          else setTeamIds(teamIds.filter((id) => id !== t.id));
                        }}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {visibility === 'Selected Employees' && (
              <ActiveEmployeePicker
                selectedEmployeeIds={employeeIds}
                onChange={(ids) => setEmployeeIds(ids)}
              />
            )}
          </div>

          {/* Acknowledgement & Pin Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAcknowledgement}
                onChange={(e) => setRequireAcknowledgement(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Require Mandatory Employee Acknowledgement
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Pin Announcement at Top of Workspace
            </label>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Publish Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSubmit('Draft')}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 transition cursor-pointer"
          >
            Save as Draft
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>

            {isSuperAdmin ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('Published')}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={16} />
                {isSubmitting ? 'Publishing…' : 'Publish Announcement Immediately'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit('Submitted for Approval')}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={16} />
                {isSubmitting ? 'Submitting…' : 'Submit for Super Admin Approval'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
