import { useState, useEffect } from 'react';
import { X, Building2, Briefcase, UserCheck, Banknote, FileCheck, ShieldAlert, Plus, Check, Paperclip, Trash2 } from 'lucide-react';
import Drawer from '../../../../ui/Drawer';
import { clientService } from '../../Network/clients/services/clientService';
import { attachmentStorageService } from '../services/attachmentStorageService';
import { getIndianStates, getCitiesForState, isValidCityForState } from '../../../../core/location/indiaLocationMaster';
import type { Client } from '../../../../types/Client';
import type { Opening, OpeningStatus, OpeningPriority, SalaryType, GenderPreference, OpeningAttachment } from '../../../../types/Opening';

interface NewOpeningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (openingData: Partial<Opening>) => Promise<void>;
  initialData?: Partial<Opening> | null;
  mode?: 'create' | 'edit';
}

const PREDEFINED_BENEFITS: string[] = [
  'Weekly Payment',
  'Free Accommodation',
  'Free Food',
  'Transport Facility',
  'Pickup & Drop',
  'Attendance Bonus',
  'Incentive',
  'Overtime',
  'Medical Insurance',
  'Uniform',
  'Joining Bonus',
  'Festival Bonus',
  'Growth Opportunity',
  'Fixed Shift',
  'Rotational Shift',
];

const STANDARD_DOCUMENTS: string[] = [
  'Aadhaar Card',
  'PAN Card',
  'Bank Passbook / Cancelled Cheque',
  '10th / 12th Marksheet',
  'Degree Certificate',
  'Relieving / Experience Letter',
  'Driving License',
  'Passport Size Photos',
];

export default function NewOpeningDrawer({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'create',
}: NewOpeningDrawerProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [city, setCity] = useState('Pune');
  const [openPositions, setOpenPositions] = useState<number>(5);
  const [priority, setPriority] = useState<OpeningPriority>('Medium');
  const [interviewDate, setInterviewDate] = useState('');

  // Candidate Criteria
  const [minExperience, setMinExperience] = useState<number>(0);
  const [maxExperience, setMaxExperience] = useState<number>(3);
  const [qualification, setQualification] = useState('');
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('Any');
  const [ageLimit, setAgeLimit] = useState<number>(35);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // Salary & Benefits
  const [minSalary, setMinSalary] = useState<number>(15000);
  const [maxSalary, setMaxSalary] = useState<number>(25000);
  const [salaryType, setSalaryType] = useState<SalaryType>('Monthly');
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);

  // Documents & Attachments Required
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<OpeningAttachment[]>([]);

  // Status & Outsourcing
  const [status, setStatus] = useState<OpeningStatus>('Active');
  const [isOutsourced, setIsOutsourced] = useState(false);

  const availableStates = getIndianStates();
  const availableCities = getCitiesForState(state);

  useEffect(() => {
    async function loadClients() {
      try {
        setLoadingClients(true);
        const data = await clientService.getClients();
        setClients(data);
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    }
    if (isOpen) {
      void loadClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setSelectedClientId(initialData.clientId || '');
      setClientName(initialData.clientName || '');
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setLocation(initialData.location || '');
      const st = initialData.state || 'Maharashtra';
      setState(st);
      setCity(initialData.city || (getCitiesForState(st)[0] || 'Pune'));
      setOpenPositions(initialData.openPositions || 1);
      setPriority(initialData.priority || 'Medium');
      setInterviewDate(initialData.interviewDate || '');
      setMinExperience(initialData.minExperience || 0);
      setMaxExperience(initialData.maxExperience || 3);
      setQualification(initialData.qualification || '');
      setGenderPreference(initialData.genderPreference || 'Any');
      setAgeLimit(initialData.ageLimit || 35);
      setSkills(initialData.skills || []);
      setMinSalary(initialData.minSalary || 15000);
      setMaxSalary(initialData.maxSalary || 25000);
      setSalaryType(initialData.salaryType || 'Monthly');
      setSelectedBenefits(initialData.benefits || []);
      setSelectedDocuments(initialData.requiredDocuments || []);
      setAttachments(initialData.attachments || []);
      setStatus(initialData.status || 'Active');
      setIsOutsourced(Boolean(initialData.isOutsourced));
    } else {
      setSelectedClientId('');
      setClientName('');
      setTitle('');
      setDescription('');
      setLocation('');
      setState('Maharashtra');
      setCity('Pune');
      setOpenPositions(5);
      setPriority('Medium');
      setInterviewDate('');
      setMinExperience(0);
      setMaxExperience(3);
      setQualification('');
      setGenderPreference('Any');
      setAgeLimit(35);
      setSkills([]);
      setMinSalary(15000);
      setMaxSalary(25000);
      setSalaryType('Monthly');
      setSelectedBenefits([]);
      setSelectedDocuments([]);
      setAttachments([]);
      setStatus('Active');
      setIsOutsourced(false);
    }
    setFormError('');
  }, [initialData, isOpen]);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const validCities = getCitiesForState(newState);
    if (!validCities.includes(city)) {
      setCity(validCities[0] || '');
    }
  };

  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    const selected = clients.find((c) => c.id === cId);
    if (selected) {
      setClientName(selected.name);
      if (selected.state) {
        handleStateChange(selected.state);
      }
      if (selected.billingAddress?.city) {
        setCity(selected.billingAddress.city);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploaded: OpeningAttachment[] = [];
      for (const f of Array.from(files)) {
        const att = await attachmentStorageService.uploadAttachment(f, initialData?.id || 'new');
        uploaded.push(att);
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      setFormError('Failed to upload file attachment.');
    }
  };

  const removeAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((prev) =>
      prev.includes(benefit) ? prev.filter((b) => b !== benefit) : [...prev, benefit]
    );
  };

  const toggleDocument = (doc: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const removeSkill = (sk: string) => {
    setSkills(skills.filter((s) => s !== sk));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setFormError('Please select a Client from Client Master.');
      return;
    }
    if (!title.trim()) {
      setFormError('Position Title is required.');
      return;
    }
    if (!state) {
      setFormError('Please select a valid Indian State.');
      return;
    }
    if (!city) {
      setFormError('Please select a valid City for the selected State.');
      return;
    }
    if (!isValidCityForState(state, city)) {
      setFormError(`City "${city}" is not valid for State "${state}". Please select a valid City.`);
      return;
    }
    if (openPositions <= 0) {
      setFormError('Number of Openings must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await onSubmit({
        clientId: selectedClientId,
        clientName: clientName || 'Client Master',
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || `${city}, ${state}`,
        city: city.trim(),
        state: state.trim(),
        openPositions: Number(openPositions),
        status,
        priority,
        interviewDate,
        isOutsourced,
        minExperience: Number(minExperience),
        maxExperience: Number(maxExperience),
        qualification: qualification.trim(),
        genderPreference,
        ageLimit: Number(ageLimit),
        skills,
        minSalary: Number(minSalary),
        maxSalary: Number(maxSalary),
        salaryType,
        benefits: selectedBenefits,
        requiredDocuments: selectedDocuments,
        attachments,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save opening.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={mode === 'edit' ? 'Edit Opening' : 'Create New Opening'}>
      <form onSubmit={handleSubmit} className="space-y-6 pb-12 text-xs">
        {/* Supporting Document / Image Attachment (Reference Only) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Paperclip size={14} className="text-emerald-600" /> Reference Image / Document Attachment
            </span>
            <span className="text-[10px] text-slate-500">Supports JPG, PNG, PDF, Excel</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-semibold text-xs transition">
              <Paperclip size={13} className="text-slate-600" />
              <span>Attach File</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,application/pdf,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-500">Attach requisition image/document for reference.</span>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 text-[11px] font-medium shadow-2xs">
                  <span className="truncate max-w-[140px]">{att.fileName}</span>
                  <button type="button" onClick={() => removeAttachment(att.id)} className="text-slate-400 hover:text-rose-600 p-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Section 1: Client Information */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building2 size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">1. Client Information</h4>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client (Client Master) *</label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={loadingClients}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Choose Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.billingName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Opening Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Briefcase size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">2. Opening Details</h4>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Position / Job Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Warehouse Logistics Executive"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Roles, responsibilities, work schedule..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State *</label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {availableStates.map((s) => (
                  <option key={s.stateCode} value={s.stateName}>
                    {s.stateName} {s.isUT ? '(UT)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {availableCities.length > 0 ? (
                  availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                ) : (
                  <option value="">No cities found for {state}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Exact Location Address</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Warje Logistics Park, Pune-Bangalore Highway"
              className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. of Openings *</label>
              <input
                type="number"
                min={1}
                value={openPositions}
                onChange={(e) => setOpenPositions(parseInt(e.target.value, 10) || 1)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as OpeningPriority)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interview Date</label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Candidate Criteria */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <UserCheck size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">3. Candidate Criteria</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Exp (Years)</label>
              <input
                type="number"
                min={0}
                value={minExperience}
                onChange={(e) => setMinExperience(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Exp (Years)</label>
              <input
                type="number"
                min={0}
                value={maxExperience}
                onChange={(e) => setMaxExperience(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Qualification Required</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. Graduate / 12th Pass"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender Pref</label>
              <select
                value={genderPreference}
                onChange={(e) => setGenderPreference(e.target.value as GenderPreference)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="Any">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Skills Required</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add required skill (e.g. Barcode Scanning)..."
                className="flex-1 p-2 bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
              >
                + Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="inline-flex items-center gap-1 bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded-md text-xs font-medium"
                >
                  {sk}
                  <button type="button" onClick={() => removeSkill(sk)} className="text-slate-400 hover:text-rose-600">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Salary & Benefits */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Banknote size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">4. Salary & Benefits</h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Min Salary (₹)</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Salary (₹)</label>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Period</label>
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
                <option value="Daily">Daily</option>
                <option value="Hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Client Highlights & Perks</label>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_BENEFITS.map((ben) => {
                const isSelected = selectedBenefits.includes(ben);
                return (
                  <button
                    key={ben}
                    type="button"
                    onClick={() => toggleBenefit(ben)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? <Check size={12} /> : <Plus size={12} className="text-slate-400" />}
                    {ben}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 5: Documents Required */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileCheck size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">5. Documents Required</h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {STANDARD_DOCUMENTS.map((doc) => {
              const isChecked = selectedDocuments.includes(doc);
              return (
                <label
                  key={doc}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                    isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDocument(doc)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{doc}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 6: Status & Outsourcing */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <ShieldAlert size={16} className="text-emerald-600" />
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">6. Status & Outsourcing</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Opening Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OpeningStatus)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
              >
                <option value="Active">Active (Open)</option>
                <option value="OnHold">On Hold</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOutsourced}
                  onChange={(e) => setIsOutsourced(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Is Outsourced Opening?</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Saving Opening…' : mode === 'edit' ? 'Save Changes' : '+ Create Opening'}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
