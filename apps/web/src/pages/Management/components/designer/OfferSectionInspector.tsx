import { useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Sparkles,
  ShieldCheck,
  User,
  Briefcase,
  Building2,
  Banknote,
} from 'lucide-react';

import type { OfferLetterBlock, BrandProfile, CompanySignatoryV2, OfferLetterHeaderConfig, OfferLetterFooterConfig } from '../../../../types/Admin';


export const DEFAULT_HEADER_CONFIG: OfferLetterHeaderConfig = {
  preset: 'logo-left-details-right',
  showLogo: true,
  logoHeight: 50,
  showBrandName: false,
  showLegalName: true,
  showAddress: true,
  showPhone: true,
  showEmail: true,
  showWebsite: true,
  showCin: true,
  showPan: true,
  showGstin: true,
  legalFontSize: 10,
  legalAlignment: 'right',
};

export const DEFAULT_FOOTER_CONFIG: OfferLetterFooterConfig = {
  showConfidentialityNotice: true,
  confidentialityText: '{{BRAND_NAME}} • Confidential Offer Letter',
  showWebsite: true,
  showEmail: false,
  showPageNumber: true,
  showTotalPages: true,
  layoutPlacement: 'left-right',
  alignment: 'left',
  fontSize: 10,
  marginTop: 16,
};

interface OfferSectionInspectorProps {
  selectedBlock: OfferLetterBlock | null;
  selectedBrand: BrandProfile | null;
  signatories: CompanySignatoryV2[];
  isPublished: boolean;
  onUpdateBlock: (id: string, updates: Partial<OfferLetterBlock>) => void;
  onInsertField: (fieldToken: string) => void;
}

interface FieldCategory {
  label: string;
  icon: React.ReactNode;
  fields: Array<{ key: string; label: string }>;
}

const FIELD_CATEGORIES: FieldCategory[] = [
  {
    label: 'Employee / Candidate',
    icon: <User className="w-3.5 h-3.5 text-sky-400" />,
    fields: [
      { key: 'PERSON_NAME', label: 'Candidate Name' },
      { key: 'PERSON_ADDRESS', label: 'Address' },
      { key: 'PERSON_EMAIL', label: 'Email' },
      { key: 'PERSON_PHONE', label: 'Phone' },
    ],
  },
  {
    label: 'Offer & Employment',
    icon: <Briefcase className="w-3.5 h-3.5 text-emerald-400" />,
    fields: [
      { key: 'OFFER_REFERENCE', label: 'Offer Ref' },
      { key: 'OFFER_DATE', label: 'Offer Date' },
      { key: 'JOINING_DATE', label: 'Joining Date' },
      { key: 'DESIGNATION', label: 'Designation' },
      { key: 'DEPARTMENT', label: 'Department' },
      { key: 'WORK_LOCATION', label: 'Work Location' },
      { key: 'REPORTING_MANAGER', label: 'Manager' },
    ],
  },
  {
    label: 'Brand & Legal',
    icon: <Building2 className="w-3.5 h-3.5 text-amber-400" />,
    fields: [
      { key: 'BRAND_NAME', label: 'Brand Name' },
      { key: 'LEGAL_NAME', label: 'Legal Name' },
      { key: 'BRAND_ADDRESS', label: 'Brand Address' },
      { key: 'BRAND_EMAIL', label: 'Brand Email' },
      { key: 'BRAND_PHONE', label: 'Brand Phone' },
      { key: 'BRAND_WEBSITE', label: 'Website' },
    ],
  },
  {
    label: 'Compensation',
    icon: <Banknote className="w-3.5 h-3.5 text-purple-400" />,
    fields: [
      { key: 'BASIC_MONTHLY', label: 'Basic Monthly' },
      { key: 'BASIC_ANNUAL', label: 'Basic Annual' },
      { key: 'HRA_MONTHLY', label: 'HRA Monthly' },
      { key: 'HRA_ANNUAL', label: 'HRA Annual' },
      { key: 'SPECIAL_ALLOWANCE_MONTHLY', label: 'Special Allowance' },
      { key: 'GROSS_CTC', label: 'Monthly Gross' },
      { key: 'ANNUAL_CTC', label: 'Annual CTC' },
      { key: 'NET_TAKE_HOME', label: 'Net Take-Home' },
    ],
  },
];

export default function OfferSectionInspector({
  selectedBlock,
  signatories,
  isPublished,
  onUpdateBlock,
  onInsertField,
}: OfferSectionInspectorProps) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);

  if (!selectedBlock) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 space-y-2">
        <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
        <p className="font-bold text-slate-400">No Document Section Selected</p>
        <p className="text-[11px]">Click any section on the A4 offer letter canvas to edit its text, formatting, or signatory properties.</p>
      </div>
    );
  }

  const fmt = selectedBlock.formatting || {};
  const activeCategory = FIELD_CATEGORIES[activeCategoryIndex] || FIELD_CATEGORIES[0];
  const curHeader = { ...DEFAULT_HEADER_CONFIG, ...selectedBlock.headerConfig };
  const curFooter = { ...DEFAULT_FOOTER_CONFIG, ...selectedBlock.footerConfig };

  return (
    <div className="space-y-5 text-xs font-sans">
      <div className="border-b border-slate-800 pb-3 space-y-2">
        <span className="text-[10px] uppercase font-mono text-sky-400 font-bold tracking-wider">
          Section Property Inspector
        </span>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Section Title / Label</label>
          <input
            type="text"
            disabled={isPublished}
            value={selectedBlock.title || ''}
            onChange={(e) => onUpdateBlock(selectedBlock.id, { title: e.target.value })}
            placeholder="e.g. Terms & Conditions, Relocation Policy..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-sky-500 text-xs disabled:opacity-60"
          />
        </div>
      </div>


      {/* Content Editor */}
      {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph' || selectedBlock.type === 'text' || selectedBlock.type === 'footer') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-slate-300 font-bold">
              {selectedBlock.type === 'footer' ? 'Confidentiality Notice Text' : 'Section Text Content'}
            </label>
            {isPublished && <span className="text-[10px] text-amber-400 font-mono font-bold">Read Only (Published)</span>}
          </div>
          <textarea
            rows={selectedBlock.type === 'footer' ? 3 : 6}
            disabled={isPublished}
            value={selectedBlock.type === 'footer' ? (curFooter.confidentialityText || '') : (selectedBlock.content || '')}
            onChange={(e) => {
              const val = e.target.value;
              if (selectedBlock.type === 'footer') {
                onUpdateBlock(selectedBlock.id, {
                  content: val,
                  footerConfig: {
                    ...curFooter,
                    confidentialityText: val,
                  },
                });
              } else {
                onUpdateBlock(selectedBlock.id, { content: val });
              }
            }}
            placeholder="Enter section content text..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-sans focus:outline-none focus:border-sky-500 disabled:opacity-60 resize-y"
          />
        </div>
      )}

      {/* User-Friendly Dynamic Field Picker */}
      {(selectedBlock.type === 'heading' || selectedBlock.type === 'paragraph' || selectedBlock.type === 'text' || selectedBlock.type === 'footer') && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Dynamic ERP Fields
            </span>
            <span className="text-[10px] text-slate-500">Click to insert tag</span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {FIELD_CATEGORIES.map((cat, idx) => {
              const isActive = activeCategoryIndex === idx;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategoryIndex(idx)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                    isActive ? 'bg-sky-900 text-sky-200 font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Field Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {activeCategory.fields.map((f) => (
              <button
                key={f.key}
                type="button"
                disabled={isPublished}
                onClick={() => onInsertField(`{{${f.key}}}`)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-sky-950 border border-slate-800 hover:border-sky-700 text-slate-300 hover:text-sky-300 font-semibold text-[11px] transition cursor-pointer disabled:opacity-50"
                title={`Insert {{${f.key}}}`}
              >
                + {f.label}
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Formatting & Alignment Toolbar */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <label className="block text-slate-300 font-bold">Typography & Alignment</label>

        {/* Alignment Grid */}
        <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['left', 'center', 'right', 'justify'] as const).map((align) => {
            const isActive = (fmt.alignment || 'left') === align;
            return (
              <button
                key={align}
                type="button"
                disabled={isPublished}
                onClick={() =>
                  onUpdateBlock(selectedBlock.id, {
                    formatting: { ...fmt, alignment: align },
                  })
                }
                className={`p-1.5 rounded-lg flex items-center justify-center transition disabled:opacity-50 ${
                  isActive ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                {align === 'justify' && <AlignJustify className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>

        {/* Bold / Italic / Underline */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            disabled={isPublished}
            onClick={() =>
              onUpdateBlock(selectedBlock.id, {
                formatting: { ...fmt, fontWeight: fmt.fontWeight === 'bold' ? 'normal' : 'bold' },
              })
            }
            className={`p-2 rounded-lg flex-1 flex justify-center transition disabled:opacity-50 ${
              fmt.fontWeight === 'bold' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isPublished}
            onClick={() =>
              onUpdateBlock(selectedBlock.id, {
                formatting: { ...fmt, fontStyle: fmt.fontStyle === 'italic' ? 'normal' : 'italic' },
              })
            }
            className={`p-2 rounded-lg flex-1 flex justify-center transition disabled:opacity-50 ${
              fmt.fontStyle === 'italic' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isPublished}
            onClick={() =>
              onUpdateBlock(selectedBlock.id, {
                formatting: { ...fmt, textDecoration: fmt.textDecoration === 'underline' ? 'none' : 'underline' },
              })
            }
            className={`p-2 rounded-lg flex-1 flex justify-center transition disabled:opacity-50 ${
              fmt.textDecoration === 'underline' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Font Size Slider */}
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Font Size ({fmt.fontSize || 12}px)</label>
          <input
            type="range"
            min={10}
            max={26}
            step={1}
            disabled={isPublished}
            value={fmt.fontSize || 12}
            onChange={(e) =>
              onUpdateBlock(selectedBlock.id, {
                formatting: { ...fmt, fontSize: parseInt(e.target.value, 10) },
              })
            }
            className="w-full cursor-pointer accent-sky-500 disabled:opacity-50"
          />
        </div>

        {/* Bottom Margin Slider */}
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Bottom Spacing ({fmt.marginBottom || 12}px)</label>
          <input
            type="range"
            min={0}
            max={40}
            step={2}
            disabled={isPublished}
            value={fmt.marginBottom || 12}
            onChange={(e) =>
              onUpdateBlock(selectedBlock.id, {
                formatting: { ...fmt, marginBottom: parseInt(e.target.value, 10) },
              })
            }
            className="w-full cursor-pointer accent-sky-500 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Signature Specific Configuration */}
      {selectedBlock.type === 'signature' && (
        <div className="space-y-3 pt-3 border-t border-slate-800 bg-slate-950 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Signatory Asset Configuration</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Source Mode</label>
            <select
              disabled={isPublished}
              value={selectedBlock.signatureSource || 'brandDefault'}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  signatureSource: e.target.value as 'brandDefault' | 'specific',
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-50"
            >
              <option value="brandDefault">Brand Default Signatory</option>
              <option value="specific">Specific Authorized Signatory</option>
            </select>
          </div>

          {selectedBlock.signatureSource === 'specific' && (
            <div>
              <label className="block text-slate-400 mb-1">Choose Signatory</label>
              <select
                disabled={isPublished}
                value={selectedBlock.signatoryId || ''}
                onChange={(e) => onUpdateBlock(selectedBlock.id, { signatoryId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-50"
              >
                <option value="">-- Select Signatory --</option>
                {signatories.map((sig) => (
                  <option key={sig.id} value={sig.id}>
                    {sig.fullName} ({sig.designation})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Header & Legal Details Configuration (Dedicated Specialized Inspector) */}
      {(selectedBlock.type === 'header' || selectedBlock.type === 'logo') && (
        <div className="space-y-4 pt-3 border-t border-slate-800 bg-slate-950 p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-sky-400 text-xs flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Header & Legal Details Inspector
            </span>
          </div>

          {/* Header Layout Preset Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Header Layout Preset</label>
            <select
              disabled={isPublished}
              value={curHeader.preset || 'logo-left-details-right'}
              onChange={(e) =>
                onUpdateBlock(selectedBlock.id, {
                  headerConfig: {
                    ...curHeader,
                    preset: e.target.value as 'logo-left-details-right' | 'logo-center-details-below' | 'custom',
                  },
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-50"
            >
              <option value="logo-left-details-right">Logo Left + Legal Details Right (Default)</option>
              <option value="logo-center-details-below">Logo Center + Legal Details Below</option>
              <option value="custom">Custom Layout</option>
            </select>
          </div>

          {/* Left Column: Logo & Brand Name Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider">
              1. Left Column (Logo & Brand)
            </label>

            <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curHeader.showLogo !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    headerConfig: {
                      ...curHeader,
                      showLogo: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-900 text-sky-500 focus:ring-sky-500"
              />
              <span>Display Brand Logo (ON by default)</span>
            </label>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Logo Height / Scale ({curHeader.logoHeight || 50}px)
              </label>
              <input
                type="range"
                min={30}
                max={80}
                step={2}
                disabled={isPublished}
                value={curHeader.logoHeight || 50}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    headerConfig: {
                      ...curHeader,
                      logoHeight: parseInt(e.target.value, 10),
                    },
                  })
                }
                className="w-full cursor-pointer accent-sky-500 disabled:opacity-50"
              />
            </div>

            <label className="flex items-center gap-2 text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curHeader.showBrandName || false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    headerConfig: {
                      ...curHeader,
                      showBrandName: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-900 text-sky-500 focus:ring-sky-500"
              />
              <span>Display Brand Name beside logo (OFF by default)</span>
            </label>
          </div>

          {/* Right Column: Legal Details Controls */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="block text-slate-300 font-bold text-[11px] uppercase tracking-wider">
              2. Right Column (Legal Details Content Selection)
            </label>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Legal Text Size ({curHeader.legalFontSize || 10}px)
              </label>
              <input
                type="range"
                min={9}
                max={15}
                step={1}
                disabled={isPublished}
                value={curHeader.legalFontSize || 10}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    headerConfig: {
                      ...curHeader,
                      legalFontSize: parseInt(e.target.value, 10),
                    },
                  })
                }
                className="w-full cursor-pointer accent-sky-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold text-[11px]">Legal Details Alignment</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    disabled={isPublished}
                    onClick={() =>
                      onUpdateBlock(selectedBlock.id, {
                        headerConfig: {
                          ...curHeader,
                          legalAlignment: align,
                        },
                      })
                    }
                    className={`py-1 text-[11px] font-bold rounded flex items-center justify-center capitalize transition ${
                      (curHeader.legalAlignment || 'right') === align ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showLegalName !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showLegalName: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>Legal Company Name</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showAddress !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showAddress: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>Office Address</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showPhone !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showPhone: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>Phone</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showEmail !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showEmail: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>Email</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showWebsite !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showWebsite: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>Website</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showCin !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showCin: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>CIN</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showPan !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showPan: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>PAN</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isPublished}
                  checked={curHeader.showGstin !== false}
                  onChange={(e) =>
                    onUpdateBlock(selectedBlock.id, {
                      headerConfig: {
                        ...curHeader,
                        showGstin: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-800 bg-slate-900 text-sky-500"
                />
                <span>GSTIN</span>
              </label>
            </div>
          </div>

        </div>
      )}

      {/* Dedicated Footer & Confidentiality Inspector */}
      {selectedBlock.type === 'footer' && (
        <div className="space-y-4 pt-3 border-t border-slate-800 bg-slate-950 p-4 rounded-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Footer & Confidentiality Inspector
            </span>
          </div>

          {/* Confidentiality Notice */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-200 font-bold cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curFooter.showConfidentialityNotice !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      showConfidentialityNotice: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-950 text-purple-500 focus:ring-purple-500"
              />
              <span>Display Confidentiality Notice</span>
            </label>

            <textarea
              rows={2}
              disabled={isPublished}
              value={curFooter.confidentialityText || ''}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateBlock(selectedBlock.id, {
                  content: val,
                  footerConfig: {
                    ...curFooter,
                    confidentialityText: val,
                  },
                });
              }}
              placeholder="Footer confidentiality notice text..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>

          {/* Toggles Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curFooter.showPageNumber !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      showPageNumber: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-900 text-purple-500"
              />
              <span>Page Number</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curFooter.showTotalPages !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      showTotalPages: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-900 text-purple-500"
              />
              <span>Total Pages</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curFooter.showWebsite !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      showWebsite: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-900 text-purple-500"
              />
              <span>Website</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                disabled={isPublished}
                checked={curFooter.showEmail !== false}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      showEmail: e.target.checked,
                    },
                  })
                }
                className="rounded border-slate-800 bg-slate-900 text-purple-500"
              />
              <span>Email</span>
            </label>
          </div>

          {/* Font Size & Spacing */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Footer Font Size ({curFooter.fontSize || 10}px)
              </label>
              <input
                type="range"
                min={8}
                max={14}
                step={1}
                disabled={isPublished}
                value={curFooter.fontSize || 10}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      fontSize: parseInt(e.target.value, 10),
                    },
                  })
                }
                className="w-full cursor-pointer accent-purple-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Top Margin Spacing ({curFooter.marginTop || 16}px)
              </label>
              <input
                type="range"
                min={0}
                max={40}
                step={2}
                disabled={isPublished}
                value={curFooter.marginTop || 16}
                onChange={(e) =>
                  onUpdateBlock(selectedBlock.id, {
                    footerConfig: {
                      ...curFooter,
                      marginTop: parseInt(e.target.value, 10),
                    },
                  })
                }
                className="w-full cursor-pointer accent-purple-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



