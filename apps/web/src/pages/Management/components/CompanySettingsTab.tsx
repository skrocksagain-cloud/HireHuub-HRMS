import { useState } from 'react';
import { Building2, Save, Plus, Trash2, CheckCircle2, FileSignature, Upload, Image as ImageIcon, Eye } from 'lucide-react';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import type { CompanySignature, SignatureType } from '../../../types/Admin';

export default function CompanySettingsTab() {
  const {
    company,
    isLoading,
    updateCompany,
    uploadLogo,
    uploadStamp,
    deleteStamp,
    uploadLetterhead,
    deleteLetterhead,
    uploadLetterFooter,
    deleteLetterFooter,
    uploadSignature,
    deleteSignature,
  } = useAdminCompany();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const [uploadingSigId, setUploadingSigId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(true);

  const [form, setForm] = useState(
    company || {
      id: 'hirehuub_company_settings',
      companyName: 'Hire Huub Pvt Ltd',
      brandName: 'Hire Huub One',
      gstin: '27AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      cin: 'U72900PN2026PTC000000',
      address: 'Suite 401, Apex Tech Hub, Baner, Pune, Maharashtra 411045',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0000123',
        branchName: 'Baner Branch',
      },
      website: 'https://hirehuub.com',
      email: 'contact@hirehuub.com',
      phone: '+91 98765 43210',
      logoUrl: '/logo/h-logo.png',
      stampUrl: '',
      letterheadUrl: '',
      letterFooterUrl: '',
      brandingProfiles: [
        {
          id: 'profile-default',
          name: 'Corporate Letterhead (Default)',
          isDefault: true,
          letterheadUrl: '',
          letterFooterUrl: '',
        },
        {
          id: 'profile-staffing',
          name: 'Staffing Division Letterhead',
          isDefault: false,
          letterheadUrl: '',
          letterFooterUrl: '',
        },
        {
          id: 'profile-payroll',
          name: 'Payroll Division Letterhead',
          isDefault: false,
          letterheadUrl: '',
          letterFooterUrl: '',
        },
        {
          id: 'profile-training',
          name: 'Training Division Letterhead',
          isDefault: false,
          letterheadUrl: '',
          letterFooterUrl: '',
        },
      ],
      signatures: [],
    }
  );

  if (company && form.id !== company.id) {
    setForm(company);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg('');
    try {
      await updateCompany(form);
      setStatusMsg('Company settings & Central Branding Assets saved successfully!');
    } catch {
      setStatusMsg('Failed to save company settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadLogo(file);
      setForm((prev) => ({ ...prev, logoUrl: url }));
      setStatusMsg('Company Logo uploaded successfully to Firebase Storage (/company/logo/)!');
    } catch {
      setStatusMsg('Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStamp(true);
    try {
      const url = await uploadStamp(file);
      setForm((prev) => ({ ...prev, stampUrl: url }));
      setStatusMsg('Official Stamp uploaded successfully to Firebase Storage (/company/stamp/)!');
    } catch {
      setStatusMsg('Failed to upload stamp.');
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleStampDelete = async () => {
    try {
      await deleteStamp();
      setForm((prev) => ({ ...prev, stampUrl: '' }));
      setStatusMsg('Official Stamp removed.');
    } catch {
      setStatusMsg('Failed to remove stamp.');
    }
  };

  const handleLetterheadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLetterhead(true);
    try {
      const url = await uploadLetterhead(file);
      setForm((prev) => ({
        ...prev,
        letterheadUrl: url,
        brandingProfiles: (prev.brandingProfiles || []).map((p) =>
          p.isDefault ? { ...p, letterheadUrl: url } : p
        ),
      }));
      setStatusMsg('Top Letterhead Image uploaded successfully to Firebase Storage (/company/letterhead/)!');
    } catch {
      setStatusMsg('Failed to upload letterhead.');
    } finally {
      setUploadingLetterhead(false);
    }
  };

  const handleLetterheadDelete = async () => {
    try {
      await deleteLetterhead();
      setForm((prev) => ({
        ...prev,
        letterheadUrl: '',
        brandingProfiles: (prev.brandingProfiles || []).map((p) =>
          p.isDefault ? { ...p, letterheadUrl: '' } : p
        ),
      }));
      setStatusMsg('Letterhead Image removed.');
    } catch {
      setStatusMsg('Failed to remove letterhead.');
    }
  };

  const handleLetterFooterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFooter(true);
    try {
      const url = await uploadLetterFooter(file);
      setForm((prev) => ({
        ...prev,
        letterFooterUrl: url,
        brandingProfiles: (prev.brandingProfiles || []).map((p) =>
          p.isDefault ? { ...p, letterFooterUrl: url } : p
        ),
      }));
      setStatusMsg('Bottom Letter Footer Image uploaded successfully to Firebase Storage (/company/letterfooter/)!');
    } catch {
      setStatusMsg('Failed to upload footer image.');
    } finally {
      setUploadingFooter(false);
    }
  };

  const handleLetterFooterDelete = async () => {
    try {
      await deleteLetterFooter();
      setForm((prev) => ({
        ...prev,
        letterFooterUrl: '',
        brandingProfiles: (prev.brandingProfiles || []).map((p) =>
          p.isDefault ? { ...p, letterFooterUrl: '' } : p
        ),
      }));
      setStatusMsg('Letter Footer Image removed.');
    } catch {
      setStatusMsg('Failed to remove letter footer image.');
    }
  };

  const addSignatureRow = () => {
    const newSig: CompanySignature = {
      id: `sig-${Date.now()}`,
      name: '',
      designation: '',
      signatureUrl: '',
      signatureType: 'Image',
      isActive: true,
    };
    setForm((prev) => ({ ...prev, signatures: [...prev.signatures, newSig] }));
  };

  const handleSignatureUpload = async (sigId: string, file: File, name: string, designation: string) => {
    setUploadingSigId(sigId);
    try {
      const sig = await uploadSignature(sigId, file, name, designation);
      setForm((prev) => ({
        ...prev,
        signatures: prev.signatures.map((s) => (s.id === sigId ? sig : s)),
      }));
      setStatusMsg(`Signature image for ${name || 'signatory'} uploaded to Firebase Storage (/company/signatures/)!`);
    } catch {
      setStatusMsg('Failed to upload signature.');
    } finally {
      setUploadingSigId(null);
    }
  };

  const handleSignatureDelete = async (sigId: string) => {
    try {
      await deleteSignature(sigId);
      setForm((prev) => ({
        ...prev,
        signatures: prev.signatures.filter((s) => s.id !== sigId),
      }));
      setStatusMsg('Signature deleted.');
    } catch {
      setStatusMsg('Failed to delete signature.');
    }
  };

  const updateSigField = (id: string, field: keyof CompanySignature, value: string | boolean | SignatureType) => {
    setForm((prev) => ({
      ...prev,
      signatures: prev.signatures.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Company Settings…</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs text-slate-700">
      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* Legal & Contact Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 font-bold text-slate-900 text-sm">
          <Building2 size={18} className="text-emerald-600" />
          <span>Legal Entity & Contact Info</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Company Legal Name *</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Brand Name *</label>
            <input
              type="text"
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">GSTIN Number</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">PAN Number</label>
            <input
              type="text"
              value={form.pan}
              onChange={(e) => setForm({ ...form, pan: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">CIN Number</label>
            <input
              type="text"
              value={form.cin}
              onChange={(e) => setForm({ ...form, cin: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Official Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Phone Number</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Website URL</label>
            <input
              type="text"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Registered Address</label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block font-semibold mb-1">Registered State (for GST) *</label>
            <input
              type="text"
              value={form.registeredState ?? 'Maharashtra'}
              onChange={(e) => setForm({ ...form, registeredState: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Maharashtra"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Registered City</label>
            <input
              type="text"
              value={form.registeredCity ?? 'Pune'}
              onChange={(e) => setForm({ ...form, registeredCity: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. Pune"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Postal Code</label>
            <input
              type="text"
              value={form.postalCode ?? '411045'}
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. 411045"
            />
          </div>
        </div>
      </div>

      {/* Enterprise Numbering & Financial Rules (Single Source of Truth) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 font-bold text-slate-900 text-sm">
          <Building2 size={18} className="text-emerald-600" />
          <span>Enterprise Numbering Rules & Tax Defaults</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold mb-1">Invoice Prefix *</label>
            <input
              type="text"
              value={form.invoicePrefix ?? 'HH'}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Credit Note Prefix *</label>
            <input
              type="text"
              value={form.creditNotePrefix ?? 'HHCN'}
              onChange={(e) => setForm({ ...form, creditNotePrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Employee Prefix *</label>
            <input
              type="text"
              value={form.employeeCodePrefix ?? 'HHEMP'}
              onChange={(e) => setForm({ ...form, employeeCodePrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Offer Letter Prefix *</label>
            <input
              type="text"
              value={form.offerPrefix ?? 'HHOFF'}
              onChange={(e) => setForm({ ...form, offerPrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold mb-1">Document Prefix</label>
            <input
              type="text"
              value={form.documentPrefix ?? 'HHDOC'}
              onChange={(e) => setForm({ ...form, documentPrefix: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Financial Year Start Month (1-12)</label>
            <input
              type="number"
              min={1}
              max={12}
              value={form.financialYearStartMonth ?? 4}
              onChange={(e) => setForm({ ...form, financialYearStartMonth: parseInt(e.target.value, 10) || 4 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Default GST Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.defaultGstRate ?? 18}
              onChange={(e) => setForm({ ...form, defaultGstRate: parseFloat(e.target.value) || 18 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Default TDS Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.defaultTdsRate ?? 2}
              onChange={(e) => setForm({ ...form, defaultTdsRate: parseFloat(e.target.value) || 2 })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
          Bank Details (Invoices & Payroll)
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Bank Name</label>
            <input
              type="text"
              value={form.bankDetails.bankName}
              onChange={(e) =>
                setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Account Number</label>
            <input
              type="text"
              value={form.bankDetails.accountNumber}
              onChange={(e) =>
                setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">IFSC Code</label>
            <input
              type="text"
              value={form.bankDetails.ifscCode}
              onChange={(e) =>
                setForm({ ...form, bankDetails: { ...form.bankDetails, ifscCode: e.target.value } })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Branch Name</label>
            <input
              type="text"
              value={form.bankDetails.branchName}
              onChange={(e) =>
                setForm({ ...form, bankDetails: { ...form.bankDetails, branchName: e.target.value } })
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Global Company Brand Assets (Firebase Storage /company/) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            Company Global Brand Assets (Single Source of Truth)
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold">
            Shared Across All HR & Document Engines
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Logo Upload Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={16} className="text-emerald-600" /> Company Logo (/company/logo/)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PNG, JPG, JPEG</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No Logo</span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition">
                  <Upload size={14} />
                  {uploadingLogo ? 'Uploading to Storage…' : form.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                  <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleLogoUpload} className="hidden" />
                </label>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {form.logoUrl ? form.logoUrl : 'No file uploaded'}
                </div>
              </div>
            </div>
          </div>

          {/* Official Stamp Upload Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={16} className="text-emerald-600" /> Official Company Stamp (/company/stamp/)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PNG, JPG</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {form.stampUrl ? (
                  <img src={form.stampUrl} alt="Official Stamp" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No Stamp</span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition">
                    <Upload size={14} />
                    {uploadingStamp ? 'Uploading…' : form.stampUrl ? 'Replace' : 'Upload Stamp'}
                    <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleStampUpload} className="hidden" />
                  </label>
                  {form.stampUrl && (
                    <button
                      type="button"
                      onClick={handleStampDelete}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {form.stampUrl ? form.stampUrl : 'No stamp file uploaded'}
                </div>
              </div>
            </div>
          </div>

          {/* Letterhead Top Image Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={16} className="text-emerald-600" /> Letterhead (Top Image) (/company/letterhead/)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PNG, JPG, JPEG</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {form.letterheadUrl ? (
                  <img src={form.letterheadUrl} alt="Letterhead Top" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No Top Letterhead</span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition">
                    <Upload size={14} />
                    {uploadingLetterhead ? 'Uploading…' : form.letterheadUrl ? 'Replace' : 'Upload Top Image'}
                    <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleLetterheadUpload} className="hidden" />
                  </label>
                  {form.letterheadUrl && (
                    <button
                      type="button"
                      onClick={handleLetterheadDelete}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {form.letterheadUrl ? form.letterheadUrl : 'No letterhead image uploaded'}
                </div>
              </div>
            </div>
          </div>

          {/* Letter Footer Bottom Image Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={16} className="text-emerald-600" /> Letter Footer (Bottom Image) (/company/letterfooter/)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PNG, JPG, JPEG</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {form.letterFooterUrl ? (
                  <img src={form.letterFooterUrl} alt="Letter Footer Bottom" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">No Footer Image</span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-xs transition">
                    <Upload size={14} />
                    {uploadingFooter ? 'Uploading…' : form.letterFooterUrl ? 'Replace' : 'Upload Footer Image'}
                    <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleLetterFooterUpload} className="hidden" />
                  </label>
                  {form.letterFooterUrl && (
                    <button
                      type="button"
                      onClick={handleLetterFooterDelete}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {form.letterFooterUrl ? form.letterFooterUrl : 'No footer image uploaded'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Signatures */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <FileSignature size={18} className="text-emerald-600" />
              <span>Authorized Signatures Registry (Firebase Storage /company/signatures/)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Document templates select a Signatory ID. Support for Image, Digital Certificate, Aadhaar eSign & DSC Token.
            </p>
          </div>
          <button
            type="button"
            onClick={addSignatureRow}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition"
          >
            <Plus size={14} /> Add Signatory
          </button>
        </div>

        <div className="space-y-4 pt-1">
          {form.signatures.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium bg-slate-50 rounded-xl border border-slate-200">
              No signatures added yet. Click Add Signatory to create one.
            </div>
          ) : (
            form.signatures.map((sig, idx) => (
              <div key={sig.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <span className="col-span-1 font-bold text-slate-400 text-center">#{idx + 1}</span>

                  <div className="col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Signatory Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={sig.name}
                      onChange={(e) => updateSigField(sig.id, 'name', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director / Founder"
                      value={sig.designation}
                      onChange={(e) => updateSigField(sig.id, 'designation', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Signature Type</label>
                    <select
                      value={sig.signatureType || 'Image'}
                      onChange={(e) => updateSigField(sig.id, 'signatureType', e.target.value as SignatureType)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 text-[11px]"
                    >
                      <option value="Image">Image</option>
                      <option value="Digital Certificate">Digital Certificate</option>
                      <option value="Aadhaar eSign">Aadhaar eSign</option>
                      <option value="DSC Token">DSC Token</option>
                    </select>
                  </div>

                  {/* Signature Image Preview & Upload */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="w-14 h-9 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0">
                      {sig.signatureUrl ? (
                        <img src={sig.signatureUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[8px] text-slate-400">No Image</span>
                      )}
                    </div>

                    <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition text-[10px]">
                      <Upload size={11} />
                      {uploadingSigId === sig.id ? '…' : sig.signatureUrl ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSignatureUpload(sig.id, file, sig.name, sig.designation);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSignatureDelete(sig.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Delete Signature"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Branding Preview Section (Requirement 5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Eye size={18} className="text-emerald-600" />
            <span>Live Company Branding Preview (Stationery Preview)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            {showLivePreview ? 'Collapse Preview' : 'Show Live Preview'}
          </button>
        </div>

        {showLivePreview && (
          <div className="p-6 bg-slate-100 rounded-2xl flex justify-center">
            <div className="bg-white text-slate-900 w-full max-w-xl min-h-[350px] p-6 shadow-md border border-slate-300 rounded-xl flex flex-col justify-between space-y-4 text-[11px]">
              {/* Top Letterhead Image */}
              <div className="border-b pb-2">
                {form.letterheadUrl ? (
                  <img src={form.letterheadUrl} alt="Top Letterhead Preview" className="max-h-20 w-full object-contain" />
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 font-mono text-[10px]">
                    Top Letterhead Image Preview (/company/letterhead/top_letterhead.png)
                  </div>
                )}
              </div>

              {/* Sample Content */}
              <div className="space-y-2 py-2 text-slate-700 leading-relaxed">
                <div className="font-bold text-slate-900 text-xs">OFFER OF EMPLOYMENT — SAMPLE PREVIEW</div>
                <p>Dear Candidate Name,</p>
                <p>
                  We are pleased to offer you the position at <strong>{form.brandName || form.companyName}</strong>. This document uses central company stationery, logo, stamp, and authorized signature.
                </p>
              </div>

              {/* Stamp & Signature Section */}
              <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                <div>
                  {form.stampUrl ? (
                    <img src={form.stampUrl} alt="Official Stamp" className="h-14 object-contain" />
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">No stamp uploaded</div>
                  )}
                </div>

                <div className="text-right space-y-1">
                  {form.signatures[0]?.signatureUrl ? (
                    <img src={form.signatures[0].signatureUrl} alt="Signature" className="h-10 object-contain ml-auto" />
                  ) : (
                    <div className="h-8 border-b border-slate-300 w-32 ml-auto"></div>
                  )}
                  <div className="font-bold text-slate-900 text-[10px]">
                    {form.signatures[0]?.name || 'Authorized Signatory'}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {form.signatures[0]?.designation || 'Signatory Designation'}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Image */}
              <div className="border-t pt-2">
                {form.letterFooterUrl ? (
                  <img src={form.letterFooterUrl} alt="Bottom Footer Preview" className="max-h-16 w-full object-contain" />
                ) : (
                  <div className="p-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 font-mono text-[9px]">
                    Bottom Footer Image Preview (/company/letterfooter/bottom_footer.png)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm transition"
        >
          <Save size={16} />
          {isSaving ? 'Saving Settings…' : 'Save Company Settings'}
        </button>
      </div>
    </form>
  );
}
