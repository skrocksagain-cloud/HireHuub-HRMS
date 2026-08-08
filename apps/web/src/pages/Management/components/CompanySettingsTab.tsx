import { useState } from 'react';
import { Building2, Save, Plus, Trash2, CheckCircle2, FileSignature, Upload, Image as ImageIcon } from 'lucide-react';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import type { CompanySignature } from '../../../types/Admin';

export default function CompanySettingsTab() {
  const {
    company,
    isLoading,
    updateCompany,
    uploadLogo,
    uploadStamp,
    deleteStamp,
    uploadSignature,
    deleteSignature,
  } = useAdminCompany();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingSigId, setUploadingSigId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

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
      setStatusMsg('Company settings saved successfully!');
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
      setStatusMsg('Company Logo uploaded successfully to Firebase Storage!');
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
      setStatusMsg('Official Stamp uploaded successfully to Firebase Storage!');
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

  const addSignatureRow = () => {
    const newSig: CompanySignature = {
      id: `sig-${Date.now()}`,
      name: '',
      designation: '',
      signatureUrl: '',
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
      setStatusMsg(`Signature image for ${name || 'signatory'} uploaded to Firebase Storage!`);
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

  const updateSigField = (id: string, field: keyof CompanySignature, value: string | boolean) => {
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

      {/* Brand Assets Uploads (Logo & Stamp) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
          Company Brand Assets (Firebase Storage Uploads)
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Logo Upload Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <ImageIcon size={16} className="text-emerald-600" /> Company Logo
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
                <ImageIcon size={16} className="text-emerald-600" /> Official Company Stamp
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
        </div>
      </div>

      {/* Authorized Signatures */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <FileSignature size={18} className="text-emerald-600" />
              <span>Authorized Signatures (Firebase Storage /company/signatures/)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Support unlimited authorized signatures for Directors, HR Head, Finance Head, etc.
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

                  {/* Signature Image Preview & Upload */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-16 h-10 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center overflow-hidden shrink-0">
                      {sig.signatureUrl ? (
                        <img src={sig.signatureUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-slate-400">No Image</span>
                      )}
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition">
                      <Upload size={12} />
                      {uploadingSigId === sig.id ? 'Uploading…' : sig.signatureUrl ? 'Replace' : 'Upload'}
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

                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sig.isActive}
                        onChange={(e) => updateSigField(sig.id, 'isActive', e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">Active</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSignatureDelete(sig.id)}
                      className="text-slate-400 hover:text-rose-600 transition"
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
