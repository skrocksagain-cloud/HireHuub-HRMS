import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  Type,
  ShieldCheck,
  Building2,
  Stamp as StampIcon,
  Trash2,
} from 'lucide-react';
import type { OfferLetterBlock, BrandProfile, CompanySignatoryV2 } from '../../../../types/Admin';
import RelievingPlaceholderPicker from './RelievingPlaceholderPicker';

interface RelievingSectionInspectorProps {
  block: OfferLetterBlock | null;
  onUpdateBlock: (updatedBlock: OfferLetterBlock) => void;
  onDeleteBlock: () => void;
  selectedBrand?: BrandProfile | null;
  signatories?: CompanySignatoryV2[];
}

export default function RelievingSectionInspector({
  block,
  onUpdateBlock,
  onDeleteBlock,
  selectedBrand,
  signatories = [],
}: RelievingSectionInspectorProps) {
  if (!block) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-900 border-l border-slate-800 font-sans">
        <Sliders className="w-8 h-8 text-slate-600 mb-2" />
        <h4 className="text-xs font-bold text-slate-300">No Section Selected</h4>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
          Select any section on the canvas or left panel to customize its content, styles, and dynamic placeholders.
        </p>
      </div>
    );
  }

  const fmt = block.formatting || {};

  const handleFormatChange = (key: string, value: unknown) => {
    onUpdateBlock({
      ...block,
      formatting: {
        ...fmt,
        [key]: value,
      },
    });
  };

  const handleHeaderConfigChange = (key: string, value: unknown) => {
    onUpdateBlock({
      ...block,
      headerConfig: {
        ...(block.headerConfig || {}),
        [key]: value,
      },
    });
  };

  const handleFooterConfigChange = (key: string, value: unknown) => {
    onUpdateBlock({
      ...block,
      footerConfig: {
        ...(block.footerConfig || {}),
        [key]: value,
      },
    });
  };

  const handleInsertPlaceholder = (token: string) => {
    const currentContent = block.content || '';
    onUpdateBlock({
      ...block,
      content: currentContent ? `${currentContent} ${token}` : token,
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 font-sans overflow-y-auto">
      {/* Inspector Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-mono font-bold uppercase">
              {block.type}
            </span>
            <h3 className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
              {block.title || 'Section Inspector'}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {block.id}</p>
        </div>

        <button
          type="button"
          onClick={onDeleteBlock}
          title="Delete Section"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Form Body */}
      <div className="p-4 space-y-6 flex-1">
        {/* Section Title Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">Section Label / Title</label>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => onUpdateBlock({ ...block, title: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* 1. Header Block Settings */}
        {block.type === 'header' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Brand & Legal Header Settings</span>
            </h4>

            <div className="space-y-2 text-xs">
              {/* Logo */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showLogo !== false}
                  onChange={(e) => handleHeaderConfigChange('showLogo', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Brand Logo</span>
              </label>

              {block.headerConfig?.showLogo !== false && (
                <div className="space-y-1 pl-6">
                  <label className="block text-[11px] text-slate-400">Logo Height (px): {block.headerConfig?.logoHeight || 50}px</label>
                  <input
                    type="range"
                    min="25"
                    max="100"
                    value={block.headerConfig?.logoHeight || 50}
                    onChange={(e) => handleHeaderConfigChange('logoHeight', Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              )}

              {/* Brand Name */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showBrandName === true}
                  onChange={(e) => handleHeaderConfigChange('showBrandName', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Brand Name Text</span>
              </label>

              {/* Registered Legal Name */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showLegalName !== false}
                  onChange={(e) => handleHeaderConfigChange('showLegalName', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Registered Legal Name</span>
              </label>

              {/* Registered Address */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showAddress !== false}
                  onChange={(e) => handleHeaderConfigChange('showAddress', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Registered Address</span>
              </label>

              {/* Contact Phone */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showPhone !== false}
                  onChange={(e) => handleHeaderConfigChange('showPhone', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Contact Phone</span>
              </label>

              {/* Contact Email */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showEmail !== false}
                  onChange={(e) => handleHeaderConfigChange('showEmail', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Contact Email</span>
              </label>

              {/* Official Website */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showWebsite !== false}
                  onChange={(e) => handleHeaderConfigChange('showWebsite', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Official Website</span>
              </label>

              {/* CIN */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showCin !== false}
                  onChange={(e) => handleHeaderConfigChange('showCin', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Corporate Identity Number (CIN)</span>
              </label>

              {/* PAN */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showPan !== false}
                  onChange={(e) => handleHeaderConfigChange('showPan', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Permanent Account Number (PAN)</span>
              </label>

              {/* GSTIN */}
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.headerConfig?.showGstin !== false}
                  onChange={(e) => handleHeaderConfigChange('showGstin', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show GSTIN Registration</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. Text / Heading / Paragraph Settings */}
        {(block.type === 'paragraph' || block.type === 'text' || block.type === 'heading') && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>Text & Content Editor</span>
            </h4>

            {/* Content Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">Section Content Text</label>
              <textarea
                rows={5}
                value={block.content || ''}
                onChange={(e) => onUpdateBlock({ ...block, content: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
              />
            </div>

            {/* Dynamic Placeholder Insertion Component */}
            <RelievingPlaceholderPicker onSelectPlaceholder={handleInsertPlaceholder} />
          </div>
        )}

        {/* 3. Signature Block Settings */}
        {block.type === 'signature' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AUTHORIZED SIGNATURE CONFIGURATION</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-300">Signatory Source</label>
                <select
                  value={block.signatureSource || 'brandDefault'}
                  onChange={(e) => onUpdateBlock({ ...block, signatureSource: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="brandDefault">Brand Default Authorized Signatory</option>
                  <option value="specific">Specific Authorized Signatory</option>
                </select>
              </div>

              {block.signatureSource === 'specific' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">Select Specific Signatory</label>
                  <select
                    value={block.signatoryId || ''}
                    onChange={(e) => onUpdateBlock({ ...block, signatoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    <option value="">-- Choose Signatory --</option>
                    {signatories.map((sig) => (
                      <option key={sig.id} value={sig.id}>
                        {sig.fullName} ({sig.designation})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Stamp Block Settings */}
        {block.type === 'stamp' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <StampIcon className="w-3.5 h-3.5" />
              <span>Official Brand Stamp</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              The stamp image automatically displays the official stamp uploaded for brand{' '}
              <strong className="text-sky-300">{selectedBrand?.brandName || 'Selected Brand'}</strong> in Company Settings.
            </p>
          </div>
        )}

        {/* 5. Footer Block Settings */}
        {block.type === 'footer' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Page Footer Controls</span>
            </h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.footerConfig?.showConfidentialityNotice !== false}
                  onChange={(e) => handleFooterConfigChange('showConfidentialityNotice', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Confidentiality Notice</span>
              </label>

              {block.footerConfig?.showConfidentialityNotice !== false && (
                <div className="space-y-1 pl-6">
                  <label className="block text-[11px] text-slate-400">Confidentiality Text</label>
                  <input
                    type="text"
                    value={block.footerConfig?.confidentialityText || ''}
                    onChange={(e) => handleFooterConfigChange('confidentialityText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.footerConfig?.showWebsite !== false}
                  onChange={(e) => handleFooterConfigChange('showWebsite', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Brand Website</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.footerConfig?.showPageNumber !== false}
                  onChange={(e) => handleFooterConfigChange('showPageNumber', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Show Page Numbers (Page X of Y)</span>
              </label>
            </div>
          </div>
        )}

        {/* Generic Styling Controls */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300">Section Typography & Layout</h4>

          {/* Alignment Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] text-slate-400 font-medium">Text Alignment</label>
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleFormatChange('alignment', 'left')}
                className={`flex-1 py-1.5 flex justify-center rounded-lg transition ${
                  fmt.alignment === 'left' || !fmt.alignment ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('alignment', 'center')}
                className={`flex-1 py-1.5 flex justify-center rounded-lg transition ${
                  fmt.alignment === 'center' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('alignment', 'right')}
                className={`flex-1 py-1.5 flex justify-center rounded-lg transition ${
                  fmt.alignment === 'right' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('alignment', 'justify')}
                className={`flex-1 py-1.5 flex justify-center rounded-lg transition ${
                  fmt.alignment === 'justify' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">Font Size (px)</label>
              <input
                type="number"
                min="8"
                max="36"
                value={fmt.fontSize || 12}
                onChange={(e) => handleFormatChange('fontSize', Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">Font Weight</label>
              <select
                value={fmt.fontWeight || 'normal'}
                onChange={(e) => handleFormatChange('fontWeight', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
