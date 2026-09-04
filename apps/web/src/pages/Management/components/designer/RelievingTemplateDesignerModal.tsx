/* eslint-disable */
import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Send,
  Plus,
  Layers,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  FilePlus,
  Type,
  Minus,
} from 'lucide-react';
import { useAdminCompany } from '../../../../hooks/admin/useAdmin';
import { offerTemplateService } from '../../../../services/admin/offerTemplateService';
import type { OfferLetterBlock, DocumentTemplateConfig, BrandProfile } from '../../../../types/Admin';
import RelievingTemplateCanvas from './RelievingTemplateCanvas';
import RelievingSectionInspector from './RelievingSectionInspector';
import { INITIAL_RELIEVING_LETTER_BLOCKS } from '../../../../constants/initialRelievingTemplate';

interface RelievingTemplateDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrandId?: string;
}

export default function RelievingTemplateDesignerModal({
  isOpen,
  onClose,
  initialBrandId,
}: RelievingTemplateDesignerModalProps) {
  const { company } = useAdminCompany();

  // Filter active brands strictly from Company Settings
  const brandList: BrandProfile[] = (company?.brandProfilesList || []).filter(
    (b) => b.isActive !== false
  );

  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [templateConfig, setTemplateConfig] = useState<DocumentTemplateConfig | null>(null);
  const [blocks, setBlocks] = useState<OfferLetterBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Resolve selected brand
  useEffect(() => {
    if (brandList.length > 0) {
      if (initialBrandId && brandList.some((b) => b.id === initialBrandId)) {
        setSelectedBrandId(initialBrandId);
      } else if (!selectedBrandId || !brandList.some((b) => b.id === selectedBrandId)) {
        setSelectedBrandId(brandList[0].id);
      }
    } else {
      setSelectedBrandId('');
    }
  }, [brandList, initialBrandId]);

  // 2. Fetch or initialize Relieving Letter template for selected brand
  const loadTemplate = async () => {
    if (!selectedBrandId) return;

    setIsLoading(true);
    setStatusMessage(null);

    const activeBrandObj = brandList.find((b) => b.id === selectedBrandId);
    const brandName = activeBrandObj?.brandName || 'Hire Huub';

    try {
      const config = await offerTemplateService.getOfferTemplateByBrand(
        selectedBrandId,
        brandName,
        'RELIEVING_LETTER'
      );
      setTemplateConfig(config);

      const blockList = config.offerSchema?.blocks || INITIAL_RELIEVING_LETTER_BLOCKS;
      setBlocks(blockList);

      if (blockList.length > 0) {
        setSelectedBlockId(blockList[0].id);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to load Relieving Letter template configuration.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedBrandId) {
      loadTemplate();
    }
  }, [isOpen, selectedBrandId]);

  if (!isOpen) return null;

  const currentBrand = brandList.find((b) => b.id === selectedBrandId);
  const isPublished = templateConfig?.lifecycleState === 'Published';

  // Section Manipulation Handlers
  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const updated = [...blocks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setBlocks(updated);
  };

  const handleDuplicateBlock = (index: number) => {
    const sourceBlock = blocks[index];
    const newBlock: OfferLetterBlock = {
      ...sourceBlock,
      id: `block-${Date.now()}`,
      title: `${sourceBlock.title || 'Section'} (Copy)`,
    };

    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);

    setBlocks(updated);
    setSelectedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (index: number) => {
    const targetBlock = blocks[index];
    const updated = blocks.filter((_, i) => i !== index);

    setBlocks(updated);

    if (selectedBlockId === targetBlock.id) {
      setSelectedBlockId(updated[0]?.id || null);
    }
  };

  const handleUpdateSelectedBlock = (updatedBlock: OfferLetterBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const handleAddCustomSection = (type: OfferLetterBlock['type'] = 'paragraph') => {
    const newBlock: OfferLetterBlock = {
      id: `block-${Date.now()}`,
      type,
      title: `Custom ${type.toUpperCase()} Section`,
      content: type === 'paragraph' ? 'Enter section text here...' : undefined,
      formatting: { alignment: 'left', fontSize: 12, marginBottom: 12 },
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    setSelectedBlockId(newBlock.id);
  };

  // Actions: Save Draft, Publish, Create Version
  const handleSaveDraft = async () => {
    if (!templateConfig || !selectedBrandId) return;

    setIsSaving(true);
    setStatusMessage(null);

    const activeBrandName = currentBrand?.brandName || (brandList.length > 0 ? brandList[0].brandName : '');

    try {
      const updatedConfig: DocumentTemplateConfig = {
        ...templateConfig,
        type: 'RELIEVING_LETTER',
        brandId: selectedBrandId,
        brandName: activeBrandName,
        lifecycleState: 'Draft',
        updatedAt: new Date().toISOString(),
        offerSchema: {
          brandId: selectedBrandId,
          brandName: activeBrandName,
          pageSize: 'A4',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          ...(templateConfig.offerSchema || {}),
          blocks,
        },
      };

      const saved = await offerTemplateService.saveDraftTemplate(updatedConfig);
      setTemplateConfig(saved);
      setStatusMessage({ type: 'success', text: 'Draft template saved successfully.' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to save draft template.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!templateConfig || !selectedBrandId) return;

    setIsSaving(true);
    setStatusMessage(null);

    const activeBrandName = currentBrand?.brandName || (brandList.length > 0 ? brandList[0].brandName : '');

    try {
      const draftConfig: DocumentTemplateConfig = {
        ...templateConfig,
        type: 'RELIEVING_LETTER',
        brandId: selectedBrandId,
        brandName: activeBrandName,
        lifecycleState: 'Draft',
        updatedAt: new Date().toISOString(),
        offerSchema: {
          brandId: selectedBrandId,
          brandName: activeBrandName,
          pageSize: 'A4',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          ...(templateConfig.offerSchema || {}),
          blocks,
        },
      };

      const published = await offerTemplateService.publishTemplate(draftConfig, 'Super Admin');
      setTemplateConfig(published);
      setStatusMessage({ type: 'success', text: `Published version v${published.versionNumber || 1}.0 created successfully!` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to publish template version.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewVersion = async () => {
    if (!templateConfig || !selectedBrandId) return;

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const newVersion = await offerTemplateService.createNewVersion(templateConfig);
      setTemplateConfig(newVersion);
      setBlocks(newVersion.offerSchema?.blocks || blocks);
      setStatusMessage({ type: 'success', text: `Created new editable Draft v${newVersion.versionNumber || 2}.0 snapshot.` });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to create new draft version.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* 1. TOP HEADER */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-950 border border-sky-800 text-sky-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Relieving Letter Template Designer</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isPublished
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                WYSIWYG A4 Block Editor • Immutable Versioning • Native ERP Engine
              </p>
            </div>
          </div>

          {/* Brand Selector */}
          {brandList.length > 0 && (
            <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-semibold"
              >
                {brandList.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.brandName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Version Badge */}
          {templateConfig && (
            <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-sky-400">
              v{templateConfig.versionNumber || templateConfig.version || 1}.0
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {statusMessage && (
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5 ${
                statusMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{statusMessage.text}</span>
            </span>
          )}

          {isPublished ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCreateNewVersion}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-sky-600/20"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create New Version</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isSaving || brandList.length === 0}
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition border border-slate-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={isSaving || brandList.length === 0}
                onClick={handlePublish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Publish Version</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* NO BRANDS CONFIGURED EMPTY STATE */}
      {brandList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
          <div className="max-w-md w-full p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900 space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-950 border border-amber-800 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-200">No Brand Profiles Configured</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please configure at least one active Brand Profile in <span className="text-sky-400 font-semibold">Company Settings → Brands</span> to manage Relieving Letter templates.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
            >
              Close Designer
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-xs font-mono">Loading Relieving Letter Template Schema...</span>
        </div>
      ) : (
        /* THREE COLUMN EDITOR LAYOUT */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL — SECTIONS LIST */}
          <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <span>Sections ({blocks.length})</span>
              </h3>
              {!isPublished && (
                <button
                  type="button"
                  onClick={() => handleAddCustomSection('paragraph')}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              )}
            </div>

            {/* Blocks List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {blocks.map((block, index) => {
                const isSelected = selectedBlockId === block.id;

                return (
                  <div
                    key={block.id || `left-block-${index}`}
                    onClick={() => handleSelectBlock(block.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-600 text-slate-100 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-[10px] font-mono font-bold text-slate-500">#{index + 1}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{block.title || `Section ${index + 1}`}</div>
                        <div className="text-[10px] text-slate-500 font-mono capitalize">{block.type}</div>
                      </div>
                    </div>

                    {!isPublished && (
                      <div className="flex items-center gap-0.5 opacity-80 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveBlock(index, 'up')}
                          className="p-1 hover:text-sky-400 text-slate-400 disabled:opacity-20"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === blocks.length - 1}
                          onClick={() => handleMoveBlock(index, 'down')}
                          className="p-1 hover:text-sky-400 text-slate-400 disabled:opacity-20"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateBlock(index)}
                          className="p-1 hover:text-emerald-400 text-slate-400"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(index)}
                          className="p-1 hover:text-rose-400 text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER — A4 DOCUMENT CANVAS */}
          <div className="flex-1 bg-slate-950 overflow-y-auto flex justify-center relative">
            <RelievingTemplateCanvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              selectedBrand={currentBrand}
              legalCompany={company?.legalCompanyV2}
              signatories={company?.signatoriesV2}
            />
          </div>

          {/* RIGHT PANEL — BLOCK SETTINGS */}
          <div className="w-80 shrink-0">
            <RelievingSectionInspector
              block={selectedBlock}
              onUpdateBlock={handleUpdateSelectedBlock}
              onDeleteBlock={() => {
                const idx = blocks.findIndex((b) => b.id === selectedBlockId);
                if (idx !== -1) handleDeleteBlock(idx);
              }}
              selectedBrand={currentBrand}
              signatories={company?.signatoriesV2}
            />
          </div>
        </div>
      )}

      {/* BOTTOM TOOLBAR FOR QUICK ADDITION */}
      {!isPublished && brandList.length > 0 && (
        <div className="h-12 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Insert:</span>
            <button
              type="button"
              onClick={() => handleAddCustomSection('heading')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-sky-600 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 transition"
            >
              <Type className="w-3.5 h-3.5 text-sky-400" />
              <span>Heading</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddCustomSection('paragraph')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-sky-600 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 transition"
            >
              <Type className="w-3.5 h-3.5 text-emerald-400" />
              <span>Text Paragraph</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddCustomSection('divider')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-sky-600 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 transition"
            >
              <Minus className="w-3.5 h-3.5 text-amber-400" />
              <span>Divider</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddCustomSection('page_break')}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-sky-600 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1 transition"
            >
              <Minus className="w-3.5 h-3.5 text-purple-400" />
              <span>Page Break</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {blocks.length} Sections Array
          </div>
        </div>
      )}
    </div>
  );
}
