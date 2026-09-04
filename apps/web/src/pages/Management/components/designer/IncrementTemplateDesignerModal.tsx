import { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileCheck2,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAdminCompany } from '../../../../hooks/admin/useAdmin';
import { offerTemplateService } from '../../../../services/admin/offerTemplateService';
import { INITIAL_INCREMENT_LETTER_BLOCKS } from '../../../../constants/initialIncrementTemplate';
import type { OfferLetterBlock, BrandProfile, DocumentTemplateConfig } from '../../../../types/Admin';
import IncrementTemplateCanvas from './IncrementTemplateCanvas';
import IncrementSectionInspector from './IncrementSectionInspector';

interface IncrementTemplateDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBrandId?: string | null;
  onSuccess?: () => void;
}

export default function IncrementTemplateDesignerModal({
  isOpen,
  onClose,
  initialBrandId,
  onSuccess,
}: IncrementTemplateDesignerModalProps) {
  const { company } = useAdminCompany();

  const brandList: BrandProfile[] = useMemo(() => {
    return (company?.brandProfilesList || []).filter((b) => b.isActive !== false);
  }, [company]);

  const [selectedBrandId, setSelectedBrandId] = useState<string>(initialBrandId || brandList[0]?.id || '');
  const [blocks, setBlocks] = useState<OfferLetterBlock[]>(INITIAL_INCREMENT_LETTER_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>('inc-block-1');

  const [lifecycleState, setLifecycleState] = useState<'Draft' | 'Published'>('Draft');
  const [versionNumber, setVersionNumber] = useState<number>(1);

  const [, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedBrand = useMemo(() => {
    return brandList.find((b) => b.id === selectedBrandId) || null;
  }, [brandList, selectedBrandId]);

  useEffect(() => {
    if (initialBrandId) {
      setSelectedBrandId(initialBrandId);
    } else if (brandList.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brandList[0].id);
    }
  }, [initialBrandId, brandList, selectedBrandId]);

  // Load existing template from Firestore for brand
  useEffect(() => {
    if (isOpen && selectedBrandId) {
      setIsLoading(true);
      setErrorMessage(null);

      offerTemplateService
        .getOfferTemplateByBrand(selectedBrandId, selectedBrand?.brandName || 'Brand', 'INCREMENT_LETTER')
        .then((docData: DocumentTemplateConfig) => {
          if (docData && docData.offerSchema && docData.offerSchema.blocks && docData.offerSchema.blocks.length > 0) {
            setBlocks(docData.offerSchema.blocks);
            setLifecycleState((docData.lifecycleState as 'Draft' | 'Published') || 'Draft');
            setVersionNumber(docData.versionNumber || docData.version || 1);
            if (docData.offerSchema.blocks[0]) setSelectedBlockId(docData.offerSchema.blocks[0].id);
          } else {
            setBlocks(INITIAL_INCREMENT_LETTER_BLOCKS);
            setLifecycleState('Draft');
            setVersionNumber(1);
            setSelectedBlockId(INITIAL_INCREMENT_LETTER_BLOCKS[0].id);
          }
        })
        .catch(() => {
          setBlocks(INITIAL_INCREMENT_LETTER_BLOCKS);
          setLifecycleState('Draft');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, selectedBrandId, selectedBrand]);

  if (!isOpen) return null;

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleUpdateBlock = (updated: OfferLetterBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(blocks.find((b) => b.id !== id)?.id || null);
    }
  };

  const handleDuplicateBlock = (id: string) => {
    const target = blocks.find((b) => b.id === id);
    if (!target) return;
    const duplicated: OfferLetterBlock = {
      ...target,
      id: `inc-block-${Date.now()}`,
      title: `${target.title} (Copy)`,
    };
    const idx = blocks.findIndex((b) => b.id === id);
    const updated = [...blocks];
    updated.splice(idx + 1, 0, duplicated);
    setBlocks(updated);
    setSelectedBlockId(duplicated.id);
  };

  const handleMoveBlock = (id: string, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === blocks.length - 1) return;

    const updated = [...blocks];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setBlocks(updated);
  };

  const handleAddBlock = () => {
    const newBlock: OfferLetterBlock = {
      id: `inc-block-${Date.now()}`,
      type: 'paragraph',
      title: 'Custom Section',
      isProtected: false,
      content: 'Enter section details here...',
      formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 },
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleSaveTemplate = async (targetState: 'Draft' | 'Published') => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedBrandId) {
      setErrorMessage('Please select a Target Brand Profile.');
      return;
    }

    setIsSaving(true);

    try {
      const templateId = `increment_letter_${selectedBrandId}`;
      const nextVersion = targetState === 'Published' ? versionNumber + (lifecycleState === 'Published' ? 1 : 0) : versionNumber;

      const templateConfig: DocumentTemplateConfig = {
        id: templateId,
        templateId,
        brandId: selectedBrandId,
        brandName: selectedBrand?.brandName || 'Brand',
        templateName: `Increment Letter (${selectedBrand?.brandName || 'Default'})`,
        category: 'HR',
        type: 'INCREMENT_LETTER',
        format: 'PDF',
        version: nextVersion,
        versionNumber: nextVersion,
        activeVersion: `v${nextVersion}.0 (${targetState})`,
        lifecycleState: targetState,
        isActive: true,
        previousVersions: [],
        offerSchema: {
          brandId: selectedBrandId,
          brandName: selectedBrand?.brandName || 'Brand',
          pageSize: 'A4',
          margins: { top: 20, bottom: 20, left: 20, right: 20 },
          blocks,
        },
        updatedAt: new Date().toISOString(),
      };

      if (targetState === 'Published') {
        await offerTemplateService.publishTemplate(templateConfig, 'Super Admin');
      } else {
        await offerTemplateService.saveDraftTemplate(templateConfig);
      }

      setLifecycleState(targetState);
      setVersionNumber(nextVersion);
      setSuccessMessage(
        targetState === 'Published'
          ? `Increment Letter Master Template v${nextVersion}.0 Published Successfully!`
          : 'Increment Letter Template Draft Saved.'
      );

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save template.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Increment Letter Master Template Designer</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  lifecycleState === 'Published'
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}
              >
                {lifecycleState} v{versionNumber}.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Configure A4 document layout, headers, placeholders, and signature lines for salary increments.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold"
            >
              {brandList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brandName}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveTemplate('Draft')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-400" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveTemplate('Published')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Publish Template</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="bg-rose-950 border-b border-rose-800 px-6 py-2 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-950 border-b border-emerald-800 px-6 py-2 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Designer Grid (2 Columns: Canvas + Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: A4 Document Canvas */}
        <IncrementTemplateCanvas
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          selectedBrand={selectedBrand}
          companySettings={company}
          onSelectBlock={(id) => setSelectedBlockId(id)}
          onAddBlock={handleAddBlock}
        />

        {/* Right: Section Inspector & Placeholder Picker */}
        <div className="w-96 border-l border-slate-800 bg-slate-950 p-4 overflow-y-auto">
          <IncrementSectionInspector
            selectedBlock={selectedBlock}
            signatures={company?.signatoriesV2 || []}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveBlock={handleMoveBlock}
          />
        </div>
      </div>
    </div>
  );
}
