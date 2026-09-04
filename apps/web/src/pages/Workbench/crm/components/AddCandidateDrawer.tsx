import { useState, useTransition } from 'react';
import { X, Check, AlertCircle, Sparkles, UserPlus, ShieldAlert } from 'lucide-react';
import type { CreateCandidateInput, MainSourceCategory, JobPortalOption, SocialMediaOption, DuplicateCheckResult } from '../types/crm';
import { crmService } from '../services/crmService';

import type { Employee } from '../../../Employee/types/Employee';

import { getAllIndianCities } from '../../../../core/location/indiaLocationMaster';

interface AddCandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCandidateInput) => Promise<void>;
  checkDuplicatePhone: (phone: string) => Promise<DuplicateCheckResult>;
  userSession: {
    id: string;
    name: string;
    role: string;
    assignedRole?: string;
    department?: string;
    teamId?: string;
  };
  onOpenDuplicateProfile?: (candidateId: string) => void;
  assignableEmployees?: Employee[];
}

export default function AddCandidateDrawer({
  isOpen,
  onClose,
  onSubmit,
  checkDuplicatePhone,
  userSession,
  onOpenDuplicateProfile,
  assignableEmployees = [],
}: AddCandidateDrawerProps) {
  const [, startTransition] = useTransition();

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [roleSuggestion, setRoleSuggestion] = useState<string | undefined>(undefined);

  // Source Fields
  const [sourceCategory, setSourceCategory] = useState<MainSourceCategory | ''>('');
  const [jobPortalOption, setJobPortalOption] = useState<JobPortalOption | ''>('');
  const [socialOption, setSocialOption] = useState<SocialMediaOption | ''>('');
  const [customDetailText, setCustomDetailText] = useState('');

  // Assignment Fields
  const [assignedRecruiterId, setAssignedRecruiterId] = useState<string>('');
  const [assignedRecruiterName, setAssignedRecruiterName] = useState<string>('');
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');

  // Duplicate Check & Error state
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle Role Input Change with Smart Text Normalization
  const handleRoleChange = (val: string) => {
    setRoleInput(val);
    const { suggestedRole } = crmService.normalizeRoleInput(val);
    setRoleSuggestion(suggestedRole);
  };

  const acceptRoleSuggestion = () => {
    if (roleSuggestion) {
      setRoleInput(roleSuggestion);
      setRoleSuggestion(undefined);
    }
  };

  // Check duplicate phone on blur
  const handlePhoneBlur = async () => {
    if (phone.trim().length >= 10) {
      const result = await checkDuplicatePhone(phone.trim());
      setDuplicateResult(result);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Required fields check
    if (!name.trim() || !phone.trim() || !area.trim() || !city.trim() || !roleInput.trim() || !sourceCategory) {
      setFormError('Please fill in all required fields (Name, Phone, Area, City, Role, Source Category).');
      return;
    }

    if (duplicateResult?.isDuplicate) {
      setFormError('Candidate already exists with this phone number.');
      return;
    }

    const { normalizedRole } = crmService.normalizeRoleInput(roleInput);

    let detailOption: string | undefined = undefined;
    let detailText: string | undefined = undefined;

    if (sourceCategory === 'Job Portal') detailOption = jobPortalOption || undefined;
    else if (sourceCategory === 'Social Media') detailOption = socialOption || undefined;
    else if (sourceCategory === 'Reference' || sourceCategory === 'Advertisement') detailText = customDetailText || undefined;

    const input: CreateCandidateInput = {
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim(),
      city: city.trim(),
      role: normalizedRole,
      source: {
        category: sourceCategory as MainSourceCategory,
        detailOption,
        detailText,
      },
      assignedRecruiterId: assignedRecruiterId || null,
      assignedRecruiterName: assignedRecruiterName || null,
      targetTeamId: targetTeamId || null,
      targetDepartmentId: targetDepartmentId || null,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(input);
      startTransition(() => {
        onClose();
        resetForm();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding candidate';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setArea('');
    setCity('');
    setRoleInput('');
    setRoleSuggestion(undefined);
    setSourceCategory('');
    setJobPortalOption('');
    setSocialOption('');
    setCustomDetailText('');
    setDuplicateResult(null);
    setFormError(null);
  };

  const activeRole = true;
  const viewScope = true.toLowerCase();
  const isTLOrAbove = viewScope !== 'own' && viewScope !== 'restricted' && viewScope !== 'none';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Add New Candidate</h3>
              <p className="text-[11px] text-slate-500">Single Drawer Candidate Registration</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="add-candidate-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" /> {formError}
            </div>
          )}

          {/* Section 1: Candidate Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
              1. Candidate Information
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Candidate Full Name"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="10-digit mobile number"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Duplicate Check Alert Box */}
            {duplicateResult?.isDuplicate && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <ShieldAlert size={16} className="text-amber-600" />
                  <span>Candidate Already Exists</span>
                </div>

                {duplicateResult.isRestrictedView ? (
                  <p className="text-amber-800 text-[11px]">
                    Candidate {duplicateResult.existingCandidate?.name || 'with this mobile'} is already assigned to a different team mate.
                  </p>
                ) : (
                  <div className="space-y-1 text-amber-900 text-[11px]">
                    <p><strong>Candidate {duplicateResult.existingCandidate?.name}</strong> is already assigned to {duplicateResult.existingCandidate?.assignedRecruiterName}.</p>
                    <p><strong>Status:</strong> {duplicateResult.existingCandidate?.currentCrmStatus ?? 'Not Contacted'}</p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (duplicateResult.existingCandidate && onOpenDuplicateProfile) {
                            onOpenDuplicateProfile(duplicateResult.existingCandidate.id);
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded-lg text-[10px] hover:bg-amber-700 transition"
                      >
                        View Existing Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  list="all-indian-cities"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Type city name..."
                  autoComplete="off"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <datalist id="all-indian-cities">
                  {getAllIndianCities().map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Locality"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Smart Free Text Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role (Smart Free Text) *</label>
              <input
                type="text"
                required
                value={roleInput}
                onChange={(e) => handleRoleChange(e.target.value)}
                placeholder="Enter role..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
              />

              {roleSuggestion && (
                <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} className="text-emerald-600" /> Did you mean <strong>{roleSuggestion}</strong>?
                  </span>
                  <button
                    type="button"
                    onClick={acceptRoleSuggestion}
                    className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-700 transition"
                  >
                    Accept
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Source */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
              2. Candidate Source
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Category *</label>
              <select
                required
                value={sourceCategory}
                onChange={(e) => setSourceCategory(e.target.value as MainSourceCategory)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              >
                <option value="" disabled>Select Source Category</option>
                <option value="Job Portal">Job Portal</option>
                <option value="Reference">Reference</option>
                <option value="Social Media">Social Media</option>
                <option value="Advertisement">Advertisement</option>
                <option value="Enquiry">Enquiry</option>
                <option value="Marketing Activity">Marketing Activity</option>
              </select>
            </div>

            {/* Dynamic Details based on Source */}
            {sourceCategory === 'Job Portal' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Portal Provider</label>
                <select
                  value={jobPortalOption}
                  onChange={(e) => setJobPortalOption(e.target.value as JobPortalOption)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="" disabled>Select Portal</option>
                  <option value="Apna">Apna</option>
                  <option value="WorkIndia">WorkIndia</option>
                  <option value="Indeed">Indeed</option>
                  <option value="Naukri">Naukri</option>
                  <option value="Foundit">Foundit</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            )}

            {sourceCategory === 'Social Media' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Social Media Channel</label>
                <select
                  value={socialOption}
                  onChange={(e) => setSocialOption(e.target.value as SocialMediaOption)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="" disabled>Select Channel</option>
                  <option value="Facebook">Facebook</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Telegram">Telegram</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            )}

            {(sourceCategory === 'Reference' || sourceCategory === 'Advertisement') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {sourceCategory === 'Reference' ? 'Reference Name' : 'Campaign Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={customDetailText}
                  onChange={(e) => setCustomDetailText(e.target.value)}
                  placeholder={sourceCategory === 'Reference' ? 'Reference Name' : 'Campaign Name'}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Section 3: Assignment */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-100 pb-1.5">
              3. Recruiter Assignment
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Recruiter <span className="text-slate-400 font-normal ml-1">(Optional &mdash; if left blank, assigned to you)</span>
              </label>
              {!isTLOrAbove ? (
                <input
                  type="text"
                  disabled
                  value={`${userSession.name} (Auto-assigned to self)`}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                />
              ) : assignableEmployees.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  No records available.
                </div>
              ) : (
                <select
                  value={assignedRecruiterId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setAssignedRecruiterId('');
                      setAssignedRecruiterName('');
                      setTargetTeamId('');
                      setTargetDepartmentId('');
                      return;
                    }
                    const emp = assignableEmployees.find(emp => (emp.employeeId || emp.id) === val);
                    if (emp) {
                      setAssignedRecruiterId(val);
                      setAssignedRecruiterName(emp.fullName || '');
                      setTargetTeamId((emp as any).teamId || '');
                      setTargetDepartmentId((emp.departmentId || emp.department) || '');
                    }
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-medium"
                >
                  <option value="">Leave blank (assign to me)</option>
                  {assignableEmployees.map((emp) => (
                    <option key={emp.id || emp.employeeId} value={emp.employeeId || emp.id}>
                      {emp.fullName} ({emp.designation || emp.department || 'Staffing'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-candidate-form"
            disabled={isSubmitting || duplicateResult?.isDuplicate}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Check size={16} /> {isSubmitting ? 'Saving...' : 'Save Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}

