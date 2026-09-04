/* eslint-disable */
import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Send,
  Building2,
  Image as ImageIcon,
  ShieldCheck,
  Layers,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  FileText,
  Lock,
} from 'lucide-react';


import type {
  DocumentTemplateConfig,
  OfferLetterBlock,
  BrandProfile,
  CompanySignatoryV2,
  LegalCompanyV2,
} from '../../../../types/Admin';

import OfferTemplateCanvas from './OfferTemplateCanvas';
import OfferSectionInspector from './OfferSectionInspector';
import { offerTemplateService } from '../../../../services/admin/offerTemplateService';
import { useAdminCompany } from '../../../../hooks/admin/useAdmin';

interface OfferTemplateDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrandId?: string;
}

export default function OfferTemplateDesignerModal({
  isOpen,
  onClose,
  initialBrandId,
}: OfferTemplateDesignerModalProps) {
  const { company } = useAdminCompany();

  const brandList: BrandProfile[] =
    (company?.brandProfilesList || []).filter((b) => b.isActive !== false);

  const legalCompany: LegalCompanyV2 = company?.legalCompanyV2 || {
    legalCompanyName: company?.companyName || '',
    cin: company?.cin || '',
    gstin: company?.gstin || '',
    pan: company?.pan || '',
    registeredOfficeAddress: company?.address || '',
    state: 'West Bengal',
    city: 'Kolkata',
    pinCode: '700091',
    corporatePhone: company?.phone || '',
    corporateWebsite: company?.website || '',
  };

  const signatories: CompanySignatoryV2[] = company?.signatoriesV2 || [];

  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    initialBrandId && brandList.some((b) => b.id === initialBrandId)
      ? initialBrandId
      : brandList[0]?.id || ''
  );

  const [template, setTemplate] = useState<DocumentTemplateConfig | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentBrand = brandList.find((b) => b.id === selectedBrandId) || brandList[0] || null;

  // Load template whenever selectedBrandId changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadTemplate = async () => {
      const brandObj = brandList.find((b) => b.id === selectedBrandId) || brandList[0];
      if (!brandObj) return;

      const bName = brandObj.brandName;
      const loaded = await offerTemplateService.getOfferTemplateByBrand(brandObj.id, bName);
      if (isMounted) {
        setTemplate(loaded);
        setSelectedBlockId(loaded.offerSchema?.blocks[0]?.id || null);
      }
    };

    loadTemplate();
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedBrandId, company]);

  if (!isOpen) return null;

  if (brandList.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl relative text-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-amber-950 border border-amber-800 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">No Brand Profiles Configured</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please configure at least one active Brand Profile in <span className="text-sky-400 font-semibold">Company Settings → Brands</span> to manage Offer Letter templates.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Close Designer
          </button>
        </div>
      </div>
    );
  }

  if (!template) return null;

  const isPublished = template.lifecycleState === 'Published';
  const blocks = template.offerSchema?.blocks || [];

  const updateBlocks = (newBlocks: OfferLetterBlock[]) => {
    if (!currentBrand) return;
    setTemplate({
      ...template,
      offerSchema: {
        ...template.offerSchema!,
        brandId: currentBrand.id,
        brandName: currentBrand.brandName,
        pageSize: 'A4',
        margins: template.offerSchema?.margins || { top: 20, bottom: 20, left: 20, right: 20 },
        blocks: newBlocks,
      },
    });
  };

  const handleUpdateBlock = (id: string, updates: Partial<OfferLetterBlock>) => {
    if (isPublished) {
      setStatusMsg({
        type: 'error',
        text: 'Published template is immutable. Click "Create New Version" to edit.',
      });
      return;
    }

    const updated = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    updateBlocks(updated);
  };

  const handleInsertField = (fieldToken: string) => {
    if (isPublished) {
      setStatusMsg({
        type: 'error',
        text: 'Published template is immutable. Click "Create New Version" to edit.',
      });
      return;
    }

    if (!selectedBlockId) {
      setStatusMsg({ type: 'error', text: 'Select a section on the canvas to insert dynamic field.' });
      return;
    }

    const targetBlock = blocks.find((b) => b.id === selectedBlockId);
    if (!targetBlock || (targetBlock.type !== 'text' && targetBlock.type !== 'paragraph' && targetBlock.type !== 'heading')) {
      setStatusMsg({ type: 'error', text: 'Please select a text or heading section to insert dynamic fields.' });
      return;
    }

    const currentContent = targetBlock.content || '';
    const updatedContent = currentContent ? `${currentContent} ${fieldToken}` : fieldToken;
    handleUpdateBlock(selectedBlockId, { content: updatedContent });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const saved = await offerTemplateService.saveDraftTemplate(template);
      setTemplate(saved);
      setStatusMsg({ type: 'success', text: 'Draft template saved successfully to Firestore!' });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to save draft template.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const published = await offerTemplateService.publishTemplate(template, 'Super Admin');
      setTemplate(published);
      setStatusMsg({ type: 'success', text: `Template published successfully as immutable Version ${published.activeVersion}!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish template.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewVersion = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const newDraft = await offerTemplateService.createNewVersion(template);
      setTemplate(newDraft);
      setStatusMsg({ type: 'success', text: `Created new editable Draft ${newDraft.activeVersion}!` });
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to create new version draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* TOP HEADER TOOLBAR */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Brand-Aware Offer Letter Studio</h2>
          </div>

          {/* Brand Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold">
            <span className="text-slate-400">Brand Profile:</span>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="bg-transparent text-sky-400 font-bold focus:outline-none cursor-pointer"
            >
              {brandList.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                  {b.brandName} {b.isDefault ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status & Version Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                isPublished
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {template.lifecycleState}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {template.activeVersion || `v${template.versionNumber || 1}.0`}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isPublished ? (
            <button
              type="button"
              onClick={handleCreateNewVersion}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              <GitBranch className="w-4 h-4" />
              <span>Create New Version</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-sky-400" />
                <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSaving ? 'Publishing...' : 'Publish Template'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isPublished && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-6 py-2 flex items-center justify-between text-amber-200 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Published Version <strong className="text-white font-mono">{template.activeVersion || `v${template.versionNumber || 1}.0`}</strong> is read-only. Create New Version to edit this template.
            </span>
          </div>
          <button
            type="button"
            onClick={handleCreateNewVersion}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Create New Version</span>
          </button>
        </div>
      )}

      {statusMsg && (
        <div
          className={`px-6 py-2 text-xs font-semibold flex items-center justify-between border-b ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/90 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
          <button type="button" onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}


      {/* WORKSPACE PANELS */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: BRAND, LEGAL & SECTION NAVIGATOR */}
        <aside className="w-80 bg-slate-900 border-r border-slate-800 p-4 space-y-5 overflow-y-auto shrink-0 custom-scrollbar text-xs">
          {/* Registered Legal Company Entity Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-slate-800/80 pb-1.5">
              <Building2 className="w-4 h-4" />
              <span>Legal Entity (Company Settings)</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <p className="font-bold text-slate-100 truncate">{legalCompany.legalCompanyName}</p>
              <p className="font-mono text-slate-400">CIN: {legalCompany.cin || 'N/A'}</p>
              <p className="text-slate-400 truncate">{legalCompany.registeredOfficeAddress}</p>
            </div>
          </div>

          {/* Brand Assets Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" /> Brand Media Assets
              </span>
              <span className="text-[10px] text-sky-400 font-mono">Firebase Storage</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2 rounded-lg text-center space-y-1">
                <span className="text-slate-400 block font-semibold">Logo Asset</span>
                {currentBrand?.logoUrl ? (
                  <img src={currentBrand.logoUrl} alt="Logo" className="h-7 object-contain mx-auto" />
                ) : (
                  <span className="text-amber-400 block text-[10px]">No Brand Logo</span>
                )}
              </div>

              <div className="bg-slate-900 p-2 rounded-lg text-center space-y-1">
                <span className="text-slate-400 block font-semibold">Stamp Asset</span>
                {currentBrand?.stampUrl ? (
                  <img src={currentBrand.stampUrl} alt="Stamp" className="h-7 object-contain mx-auto" />
                ) : (
                  <span className="text-purple-400 block text-[10px]">No Brand Stamp</span>
                )}
              </div>
            </div>
          </div>

          {/* Authorized Signatory Picker */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="font-bold text-rose-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Company Signatories ({signatories.length})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Select the <span className="text-sky-300 font-bold">Signature Section</span> on the A4 canvas to choose a specific authorized signatory.
            </p>
            <button
              type="button"
              onClick={() => {
                const sigBlock = blocks.find((b) => b.type === 'signature');
                if (sigBlock) setSelectedBlockId(sigBlock.id);
              }}
              className="w-full mt-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-700 text-sky-300 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Configure Signature Block</span>
            </button>
          </div>


          {/* 13 Real Offer Letter Sections Navigator */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-slate-300 font-bold text-xs uppercase tracking-wider">
              <span>Document Sections ({blocks.length})</span>
              <FileText className="w-3.5 h-3.5 text-sky-400" />
            </div>

            {/* Section Add Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isPublished}
                onClick={() => {
                  const newId = `sec-custom-${Date.now()}`;
                  const newBlock: OfferLetterBlock = {
                    id: newId,
                    type: 'paragraph',
                    title: 'Custom Terms Section',
                    isCustom: true,
                    content: 'Enter custom offer terms or policy text here...',
                    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 12 },
                  };
                  updateBlocks([...blocks, newBlock]);
                  setSelectedBlockId(newId);
                }}
                className="py-1.5 px-2 bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition disabled:opacity-50"
              >
                + Custom Section
              </button>

              <button
                type="button"
                disabled={isPublished}
                onClick={() => {
                  const newId = `sec-pb-${Date.now()}`;
                  const newBlock: OfferLetterBlock = {
                    id: newId,
                    type: 'page_break',
                    title: '--- Page Break ---',
                    isProtected: false,
                  };
                  updateBlocks([...blocks, newBlock]);
                  setSelectedBlockId(newId);
                }}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition disabled:opacity-50"
              >
                + Page Break
              </button>
            </div>

            {/* Reorderable / Editable Section List */}
            <div className="space-y-1.5 custom-scrollbar max-h-[420px] overflow-y-auto pr-1">
              {blocks.map((b, idx) => {
                const isSelected = b.id === selectedBlockId;
                const isFirst = idx === 0;
                const isLast = idx === blocks.length - 1;
                const displayTitle = b.title || (b.type === 'page_break' ? '--- Page Break ---' : `${idx + 1}. ${b.type.toUpperCase()}`);

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBlockId(b.id)}
                    className={`group flex items-center justify-between p-2 rounded-xl text-xs transition border cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950 border-sky-600 text-white font-bold shadow-sm ring-1 ring-sky-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <span className="text-[10px] font-mono text-slate-500 w-4">{idx + 1}.</span>
                      <span className="truncate">{displayTitle}</span>
                    </div>

                    {/* Section Action Controls (Move Up, Move Down, Duplicate, Delete) */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                      <button
                        type="button"
                        disabled={isPublished || isFirst}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newBlocks = [...blocks];
                          const temp = newBlocks[idx - 1];
                          newBlocks[idx - 1] = newBlocks[idx];
                          newBlocks[idx] = temp;
                          updateBlocks(newBlocks);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-300 disabled:opacity-30"
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={isPublished || isLast}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newBlocks = [...blocks];
                          const temp = newBlocks[idx + 1];
                          newBlocks[idx + 1] = newBlocks[idx];
                          newBlocks[idx] = temp;
                          updateBlocks(newBlocks);
                        }}
                        className="p-1 text-slate-400 hover:text-sky-300 disabled:opacity-30"
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={isPublished}
                        onClick={(e) => {
                          e.stopPropagation();
                          const dupBlock: OfferLetterBlock = {
                            ...b,
                            id: `${b.id}-copy-${Date.now()}`,
                            title: `${b.title || b.type} (Copy)`,
                            isProtected: false,
                          };
                          const newBlocks = [...blocks];
                          newBlocks.splice(idx + 1, 0, dupBlock);
                          updateBlocks(newBlocks);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-300 disabled:opacity-30"
                        title="Duplicate Section"
                      >
                        ❐
                      </button>
                      <button
                        type="button"
                        disabled={isPublished}
                        onClick={(e) => {
                          e.stopPropagation();
                          const newBlocks = blocks.filter((item) => item.id !== b.id);
                          updateBlocks(newBlocks);
                          if (selectedBlockId === b.id) {
                            setSelectedBlockId(newBlocks[0]?.id || null);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30"
                        title="Delete Section"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>

        {/* CENTER PANEL: AUTHENTIC A4 DOCUMENT CANVAS */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <OfferTemplateCanvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              selectedBrand={currentBrand}
              legalCompany={legalCompany}
              signatories={signatories}
              onSelectBlock={(id) => setSelectedBlockId(id)}
            />

          </div>
        </main>

        {/* RIGHT PANEL: SECTION INSPECTOR & CONTROLLED FIELD PICKER */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto shrink-0 custom-scrollbar">
          <OfferSectionInspector
            selectedBlock={selectedBlock}
            selectedBrand={currentBrand}
            signatories={signatories}
            isPublished={isPublished}
            onUpdateBlock={handleUpdateBlock}
            onInsertField={handleInsertField}
          />
        </aside>
      </div>
    </div>
  );
}
