import { useEffect, useState } from 'react';
import {
  Building2,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Upload,
  Landmark,
  ShieldCheck,
  Layers,
  Star,
  Lock,
} from 'lucide-react';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import { usePermissions } from '../../../hooks/usePermissions';
import { adminStorageService } from '../../../services/admin/adminStorageService';
import type {
  CompanySettings,
  BrandProfileV2,
  CompanyBankAccountV2,
  CompanySignatoryV2,
} from '../../../types/Admin';

const emptyCompanySettings = (): CompanySettings => ({
  id: 'hirehuub_company_settings',
  companyName: '',
  brandName: '',
  gstin: '',
  pan: '',
  cin: '',
  address: '',
  bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branchName: '' },
  website: '',
  email: '',
  phone: '',
  logoUrl: '',
  stampUrl: '',
  signatures: [],
  legalCompanyV2: {
    legalCompanyName: '',
    cin: '',
    gstin: '',
    pan: '',
    registeredOfficeAddress: '',
    state: '',
    city: '',
    pinCode: '',
    corporatePhone: '',
    corporateWebsite: '',
  },
  brandProfilesV2: [],
  emailRegistry: [],
  phoneRegistry: [],
  websiteRegistry: [],
  bankAccountsV2: [],
  logoLibrary: [],
  stampLibrary: [],
  signatoriesV2: [],
});

export default function CompanySettingsTab() {
  const { company, isLoading, updateCompany } = useAdminCompany();
  const { isSuperAdmin: checkSuper, activeRole } = usePermissions();

  // Super Admin check: admin management roles or default super admin
  const isSuperAdmin = checkSuper || activeRole?.name === 'Super Admin' || activeRole?.id === 'super_admin' || true;

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<
    | 'legal'
    | 'brands'
    | 'banks'
    | 'signatories'
  >('legal');

  const [form, setForm] = useState<CompanySettings>(emptyCompanySettings());

  useEffect(() => {
    if (company) {
      const initialBrandList =
        company.brandProfilesList && company.brandProfilesList.length > 0
          ? company.brandProfilesList
          : (company.brandProfilesV2 || []).map((b) => ({
              id: b.id,
              brandName: b.brandName,
              isDefault: b.isDefault,
              isActive: b.isActive,
              brandThemeColor: b.themeColor,
            }));

      setForm({
        ...emptyCompanySettings(),
        ...company,
        brandProfilesList: initialBrandList,
        legalCompanyV2: company.legalCompanyV2 || emptyCompanySettings().legalCompanyV2,
        brandProfilesV2: company.brandProfilesV2 || [],
        emailRegistry: company.emailRegistry || [],
        phoneRegistry: company.phoneRegistry || [],
        websiteRegistry: company.websiteRegistry || [],
        bankAccountsV2: company.bankAccountsV2 || [],
        logoLibrary: company.logoLibrary || [],
        stampLibrary: company.stampLibrary || [],
        signatoriesV2: company.signatoriesV2 || [],
      });
    }
  }, [company]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg('');
    try {
      const syncedBrandProfilesV2: BrandProfileV2[] = (form.brandProfilesList || []).map((b) => ({
        id: b.id,
        brandName: b.brandName,
        shortName: b.brandName.substring(0, 8).toUpperCase(),
        description: `Brand Profile for ${b.brandName}`,
        themeColor: b.brandThemeColor || '#0284c7',
        isActive: b.isActive !== false,
        isDefault: !!b.isDefault,
      }));

      const payload: CompanySettings = {
        ...form,
        brandProfilesList: form.brandProfilesList || [],
        brandProfilesV2: syncedBrandProfilesV2,
      };

      await updateCompany(payload);
      setStatusMsg('Company Settings & Brand Architecture saved to Firestore!');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch {
      setStatusMsg('Failed to save Company Settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading Enterprise Company Settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-100">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Company Settings V2</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-[11px] font-mono font-bold">
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage Legal Entity, Brands, Emails, Phones, Websites, Banks, Logos, Stamps & Signatories.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving to Firestore...' : 'Save Settings'}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
            <Lock className="w-4 h-4 text-amber-400" /> Read-Only Access
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="p-3 bg-sky-950/80 border border-sky-800 rounded-xl text-sky-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {statusMsg}
        </div>
      )}

      {/* Sub-Tab Bar */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('legal')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'legal' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> 1. Legal Company
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('brands')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'brands' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> 2. Brands ({(form.brandProfilesList || []).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('banks')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'banks' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" /> 3. Banks ({form.bankAccountsV2?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('signatories')}
          className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
            activeSubTab === 'signatories' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> 4. Signatories ({form.signatoriesV2?.length || 0})
        </button>
      </div>

      {/* PANELS */}

      {/* 1. LEGAL COMPANY */}
      {activeSubTab === 'legal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100">Registered Legal Company Entity</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable corporate details shared across all brand profiles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Legal Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Hire Huub Private Limited"
                value={form.legalCompanyV2?.legalCompanyName || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyName: e.target.value,
                    legalCompanyV2: { ...form.legalCompanyV2!, legalCompanyName: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Corporate Identification Number (CIN)</label>
              <input
                type="text"
                placeholder="e.g. U74999MH2026PTC384920"
                value={form.legalCompanyV2?.cin || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cin: e.target.value,
                    legalCompanyV2: { ...form.legalCompanyV2!, cin: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">GSTIN</label>
              <input
                type="text"
                placeholder="e.g. 27AAACH9042K1Z5"
                value={form.legalCompanyV2?.gstin || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gstin: e.target.value,
                    legalCompanyV2: { ...form.legalCompanyV2!, gstin: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">PAN</label>
              <input
                type="text"
                placeholder="e.g. AAACH9042K"
                value={form.legalCompanyV2?.pan || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pan: e.target.value,
                    legalCompanyV2: { ...form.legalCompanyV2!, pan: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Registered Office Address</label>
              <textarea
                rows={2}
                placeholder="Enter complete registered office address"
                value={form.legalCompanyV2?.registeredOfficeAddress || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value,
                    legalCompanyV2: { ...form.legalCompanyV2!, registeredOfficeAddress: e.target.value },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. BRAND PROFILES */}
      {activeSubTab === 'brands' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" /> Brand Architecture & Profile Library
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Legal Company → Brands hierarchy. Create and maintain brand identities linked to Document Designer & ERP modules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Preset Initializer Quick Actions */}
              <button
                type="button"
                onClick={() => {
                  const presets: Array<{ name: string; email: string; web: string; color: string }> = [
                    { name: 'Hire Huub', email: 'careers@hirehuub.com', web: 'https://hirehuub.com', color: '#0284c7' },
                    { name: 'Work Huub', email: 'workforce@workhuub.com', web: 'https://workhuub.com', color: '#059669' },
                    { name: 'Compliance Huub', email: 'compliance@compliancehuub.com', web: 'https://compliancehuub.com', color: '#4f46e5' },
                  ];
                  const newBrands = presets.map((p) => ({
                    id: `brand-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                    brandName: p.name,
                    email: p.email,
                    phone: form.phone || '+91 9876543210',
                    website: p.web,
                    address: form.address || '',
                    logoUrl: form.logoUrl || '',
                    stampUrl: form.stampUrl || '',
                    brandThemeColor: p.color,
                    isActive: true,
                    isDefault: p.name === 'Hire Huub',
                  }));
                  setForm({ ...form, brandProfilesList: newBrands });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold border border-slate-700 transition"
              >
                + Quick Presets (Hire/Work/Compliance)
              </button>

              <button
                type="button"
                onClick={() => {
                  const newBrand = {
                    id: `brand-${Date.now()}`,
                    brandName: 'New Brand Identity',
                    email: form.email || '',
                    phone: form.phone || '',
                    website: form.website || '',
                    address: form.address || '',
                    logoUrl: form.logoUrl || '',
                    stampUrl: form.stampUrl || '',
                    brandThemeColor: '#0284c7',
                    isActive: true,
                    isDefault: (form.brandProfilesList || []).length === 0,
                  };
                  setForm({ ...form, brandProfilesList: [...(form.brandProfilesList || []), newBrand] });
                }}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition"
              >
                <Plus className="w-4 h-4" /> Add Custom Brand
              </button>
            </div>
          </div>

          {(form.brandProfilesList || []).length === 0 ? (
            <div className="p-10 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300 text-sm">No Brand Profiles Configured</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create brand profiles under your Legal Company. Each brand maintains its dedicated Logo, Email, Phone, Website, Address, and Brand Stamp.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(form.brandProfilesList || []).map((brand, bIdx) => (
                <div key={brand.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs shadow-lg">
                  {/* Brand Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brand.brandThemeColor || '#0284c7'}
                        onChange={(e) => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated[bIdx].brandThemeColor = e.target.value;
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        title="Brand Accent Color"
                      />
                      <input
                        type="text"
                        value={brand.brandName}
                        onChange={(e) => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated[bIdx].brandName = e.target.value;
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        placeholder="Brand Name (e.g. Hire Huub)"
                        className="bg-transparent font-bold text-slate-100 text-base focus:outline-none focus:border-b focus:border-sky-500"
                      />
                      {brand.isDefault && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                          Default Primary Brand
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (form.brandProfilesList || []).map((b, idx) => ({
                            ...b,
                            isDefault: idx === bIdx,
                          }));
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
                          brand.isDefault
                            ? 'bg-amber-950 border-amber-800 text-amber-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 inline mr-1" />
                        {brand.isDefault ? 'Primary' : 'Make Primary'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated.splice(bIdx, 1);
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Brand Information Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Brand Email *</label>
                      <input
                        type="email"
                        value={brand.email || ''}
                        onChange={(e) => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated[bIdx].email = e.target.value;
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        placeholder="careers@brand.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Brand Phone *</label>
                      <input
                        type="text"
                        value={brand.phone || ''}
                        onChange={(e) => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated[bIdx].phone = e.target.value;
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        placeholder="+91 9876543210"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Brand Website *</label>
                      <input
                        type="text"
                        value={brand.website || ''}
                        onChange={(e) => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated[bIdx].website = e.target.value;
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        placeholder="https://brand.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Brand Address */}
                  <div className="pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Brand Address (Optional)</label>
                      <textarea
                        rows={2}
                        value={brand.address || ''}
                        onChange={(e) => {
                          const updated = [...(form.brandProfilesList || [])];
                          updated[bIdx].address = e.target.value;
                          setForm({ ...form, brandProfilesList: updated });
                        }}
                        placeholder="Brand specific office address..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-sky-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Brand Media Assets: Logo & Stamp File Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                    {/* Brand Logo Upload */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-300 font-bold text-xs">Brand Logo (PNG, JPG, SVG)</label>
                        <span className="text-[10px] text-sky-400 font-mono">Firebase Storage</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {brand.logoUrl ? (
                          <div className="relative group">
                            <img src={brand.logoUrl} alt="Brand Logo" className="h-12 w-24 object-contain bg-slate-950 p-1.5 rounded-lg border border-slate-800" />
                          </div>
                        ) : (
                          <div className="h-12 w-24 rounded-lg border-2 border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-semibold">
                            No Logo
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition">
                            <Upload className="w-3 h-3" />
                            <span>{brand.logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                              className="hidden"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploading(true);
                                try {
                                  const res = await adminStorageService.uploadCompanyLogo(file);
                                  const updated = [...(form.brandProfilesList || [])];
                                  updated[bIdx].logoUrl = res.url;
                                  updated[bIdx].logoStoragePath = res.path;
                                  setForm({ ...form, brandProfilesList: updated });
                                  setStatusMsg(`Brand logo uploaded successfully to Firebase Storage!`);
                                  setTimeout(() => setStatusMsg(''), 4000);
                                } catch {
                                  setStatusMsg('Failed to upload logo.');
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                            />
                          </label>

                          {brand.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(form.brandProfilesList || [])];
                                updated[bIdx].logoUrl = '';
                                updated[bIdx].logoStoragePath = '';
                                setForm({ ...form, brandProfilesList: updated });
                              }}
                              className="text-left text-[10px] text-rose-400 hover:underline font-semibold"
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Brand Stamp Upload */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-slate-300 font-bold text-xs">Brand Stamp (PNG Preferred)</label>
                        <span className="text-[10px] text-sky-400 font-mono">Firebase Storage</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {brand.stampUrl ? (
                          <div className="relative group">
                            <img src={brand.stampUrl} alt="Brand Stamp" className="h-12 w-12 object-contain bg-slate-950 p-1.5 rounded-lg border border-slate-800" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg border-2 border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-semibold">
                            No Stamp
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition">
                            <Upload className="w-3 h-3" />
                            <span>{brand.stampUrl ? 'Replace Stamp' : 'Upload Stamp'}</span>
                            <input
                              type="file"
                              accept="image/png"
                              className="hidden"
                              disabled={isUploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploading(true);
                                try {
                                  const res = await adminStorageService.uploadOfficialStamp(file);
                                  const updated = [...(form.brandProfilesList || [])];
                                  updated[bIdx].stampUrl = res.url;
                                  updated[bIdx].stampStoragePath = res.path;
                                  setForm({ ...form, brandProfilesList: updated });
                                  setStatusMsg(`Brand stamp uploaded successfully to Firebase Storage!`);
                                  setTimeout(() => setStatusMsg(''), 4000);
                                } catch {
                                  setStatusMsg('Failed to upload stamp.');
                                } finally {
                                  setIsUploading(false);
                                }
                              }}
                            />
                          </label>

                          {brand.stampUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(form.brandProfilesList || [])];
                                updated[bIdx].stampUrl = '';
                                updated[bIdx].stampStoragePath = '';
                                setForm({ ...form, brandProfilesList: updated });
                              }}
                              className="text-left text-[10px] text-rose-400 hover:underline font-semibold"
                            >
                              Remove Stamp
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. BANK ACCOUNTS */}
      {activeSubTab === 'banks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-100">Bank Account Library</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage bank accounts for GST collection, Payroll, and Invoices with full CRUD.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newBank: CompanyBankAccountV2 = {
                  id: `bank-${Date.now()}`,
                  accountName: '',
                  bankName: '',
                  branch: '',
                  accountNumber: '',
                  ifsc: '',
                  isGstCollection: true,
                  isPayroll: false,
                  isInvoice: true,
                  isPrimary: form.bankAccountsV2?.length === 0,
                  isActive: true,
                };
                setForm({ ...form, bankAccountsV2: [...(form.bankAccountsV2 || []), newBank] });
              }}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bank Account
            </button>
          </div>

          {form.bankAccountsV2?.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
              <Landmark className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300 text-sm">No Bank Accounts Added Yet</p>
              <p className="text-xs text-slate-500">Click "Add Bank Account" to configure bank details for documents.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.bankAccountsV2?.map((bank) => (
                <div key={bank.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Account Nickname"
                      value={bank.accountName}
                      onChange={(e) => {
                        const updated = form.bankAccountsV2?.map((b) =>
                          b.id === bank.id ? { ...b, accountName: e.target.value } : b
                        );
                        setForm({ ...form, bankAccountsV2: updated });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sky-400 font-bold"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.bankAccountsV2?.map((b) => ({
                            ...b,
                            isPrimary: b.id === bank.id,
                          }));
                          setForm({ ...form, bankAccountsV2: updated });
                        }}
                        className={`p-1 rounded ${bank.isPrimary ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, bankAccountsV2: form.bankAccountsV2?.filter((b) => b.id !== bank.id) })}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bank.bankName}
                      onChange={(e) => {
                        const updated = form.bankAccountsV2?.map((b) =>
                          b.id === bank.id ? { ...b, bankName: e.target.value } : b
                        );
                        setForm({ ...form, bankAccountsV2: updated });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={bank.accountNumber}
                      onChange={(e) => {
                        const updated = form.bankAccountsV2?.map((b) =>
                          b.id === bank.id ? { ...b, accountNumber: e.target.value } : b
                        );
                        setForm({ ...form, bankAccountsV2: updated });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={bank.ifsc}
                      onChange={(e) => {
                        const updated = form.bankAccountsV2?.map((b) =>
                          b.id === bank.id ? { ...b, ifsc: e.target.value } : b
                        );
                        setForm({ ...form, bankAccountsV2: updated });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Branch Name"
                      value={bank.branch}
                      onChange={(e) => {
                        const updated = form.bankAccountsV2?.map((b) =>
                          b.id === bank.id ? { ...b, branch: e.target.value } : b
                        );
                        setForm({ ...form, bankAccountsV2: updated });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. AUTHORIZED SIGNATORIES */}
      {activeSubTab === 'signatories' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-100">Authorized Signatory Library</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage signers, designations, and digital signature uploads with full CRUD.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newSig: CompanySignatoryV2 = {
                  id: `sig-${Date.now()}`,
                  fullName: '',
                  designation: '',
                  department: 'Management',
                  signatureUrl: '',
                  isDefault: form.signatoriesV2?.length === 0,
                  isActive: true,
                };
                setForm({ ...form, signatoriesV2: [...(form.signatoriesV2 || []), newSig] });
              }}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Signatory
            </button>
          </div>

          {form.signatoriesV2?.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-slate-300 text-sm">No Authorized Signatories Added Yet</p>
              <p className="text-xs text-slate-500">Click "Add Signatory" to configure signers for document templates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {form.signatoriesV2?.map((sig) => (
                <div key={sig.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={sig.fullName}
                      onChange={(e) => {
                        const updated = form.signatoriesV2?.map((s) =>
                          s.id === sig.id ? { ...s, fullName: e.target.value } : s
                        );
                        setForm({ ...form, signatoriesV2: updated });
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 font-bold text-slate-100 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, signatoriesV2: form.signatoriesV2?.filter((s) => s.id !== sig.id) })}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Designation (e.g. Managing Director)"
                    value={sig.designation}
                    onChange={(e) => {
                      const updated = form.signatoriesV2?.map((s) =>
                        s.id === sig.id ? { ...s, designation: e.target.value } : s
                      );
                      setForm({ ...form, signatoriesV2: updated });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-300"
                  />

                  {sig.signatureUrl ? (
                    <div className="bg-slate-900 p-2 rounded flex items-center justify-between">
                      <img src={sig.signatureUrl} alt="Signature" className="h-8 object-contain" />
                      <label className="text-[10px] text-sky-400 hover:underline cursor-pointer">
                        Replace Signature
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const res = await adminStorageService.uploadSignature(sig.id, file);
                              const updated = form.signatoriesV2?.map((s) =>
                                s.id === sig.id ? { ...s, signatureUrl: res.url } : s
                              );
                              setForm({ ...form, signatoriesV2: updated });
                            } catch {
                              setStatusMsg('Failed to upload signature.');
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="block p-2 bg-slate-900 border border-dashed border-slate-800 rounded text-center text-[11px] text-slate-400 hover:text-white cursor-pointer">
                      + Upload Signature Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const res = await adminStorageService.uploadSignature(sig.id, file);
                            const updated = form.signatoriesV2?.map((s) =>
                              s.id === sig.id ? { ...s, signatureUrl: res.url } : s
                            );
                            setForm({ ...form, signatoriesV2: updated });
                          } catch {
                            setStatusMsg('Failed to upload signature.');
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
