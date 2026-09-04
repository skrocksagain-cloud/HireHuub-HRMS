import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  CheckSquare,
} from 'lucide-react';
import type { OfferLetterBlock, OfferLetterHeaderConfig, CompanySignatoryV2 } from '../../../../types/Admin';
import IncrementPlaceholderPicker from './IncrementPlaceholderPicker';

interface IncrementSectionInspectorProps {
  selectedBlock: OfferLetterBlock | null;
  signatures: CompanySignatoryV2[];
  onUpdateBlock: (updated: OfferLetterBlock) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
}

export default function IncrementSectionInspector({
  selectedBlock,
  signatures,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
}: IncrementSectionInspectorProps) {
  if (!selectedBlock) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-3">
        <Layers className="w-8 h-8 text-slate-600 mx-auto" />
        <h4 className="text-xs font-bold text-slate-300">No Section Selected</h4>
        <p className="text-[11px] text-slate-500">
          Click any section on the A4 canvas to inspect and edit its typography, content, or layout options.
        </p>
      </div>
    );
  }

  const handleContentChange = (val: string) => {
    onUpdateBlock({
      ...selectedBlock,
      content: val,
    });
  };

  const handleInsertToken = (token: string) => {
    const current = selectedBlock.content || '';
    onUpdateBlock({
      ...selectedBlock,
      content: current ? `${current} ${token}` : token,
    });
  };

  const handleFormattingChange = (key: string, val: any) => {
    onUpdateBlock({
      ...selectedBlock,
      formatting: {
        ...selectedBlock.formatting,
        [key]: val,
      },
    });
  };

  const handleHeaderConfigChange = (key: keyof OfferLetterHeaderConfig, val: any) => {
    onUpdateBlock({
      ...selectedBlock,
      headerConfig: {
        ...selectedBlock.headerConfig,
        [key]: val,
      },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 text-slate-100 text-xs font-sans">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
            {selectedBlock.type} SECTION
          </span>
          <h3 className="font-bold text-slate-200 text-sm">{selectedBlock.title || 'Untitled Section'}</h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveBlock(selectedBlock.id, 'up')}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
            title="Move Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveBlock(selectedBlock.id, 'down')}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
            title="Move Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicateBlock(selectedBlock.id)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
            title="Duplicate Section"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteBlock(selectedBlock.id)}
            className="p-1.5 hover:bg-rose-950/80 text-rose-400 rounded"
            title="Delete Section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Header Block Settings */}
      {selectedBlock.type === 'header' && (
        <div className="space-y-4">
          <h4 className="font-bold text-slate-300 text-xs flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Header Field Visibility Guards</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
            {[
              { key: 'showLogo', label: 'Brand Logo' },
              { key: 'showBrandName', label: 'Brand Name' },
              { key: 'showLegalName', label: 'Legal Name' },
              { key: 'showAddress', label: 'Address' },
              { key: 'showPhone', label: 'Phone' },
              { key: 'showEmail', label: 'Email' },
              { key: 'showWebsite', label: 'Website' },
              { key: 'showCin', label: 'CIN' },
              { key: 'showPan', label: 'PAN' },
              { key: 'showGstin', label: 'GSTIN' },
            ].map((field) => (
              <label key={field.key} className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={(selectedBlock.headerConfig as any)?.[field.key] !== false}
                  onChange={(e) => handleHeaderConfigChange(field.key as any, e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-slate-900"
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 2. Text / Paragraph Content */}
      {(selectedBlock.type === 'paragraph' || selectedBlock.type === 'heading' || selectedBlock.type === 'text') && (
        <div className="space-y-3">
          <label className="block font-bold text-slate-300 text-[11px]">Section Text Content</label>
          <textarea
            rows={5}
            value={selectedBlock.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            placeholder="Enter template text with placeholders..."
          />

          <IncrementPlaceholderPicker onInsert={handleInsertToken} />
        </div>
      )}

      {/* 3. Typography & Formatting */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <label className="block font-bold text-slate-300 text-[11px] flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-400" />
          <span>Formatting & Spacing</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Font Size (px)</span>
            <input
              type="number"
              value={selectedBlock.formatting?.fontSize || 12}
              onChange={(e) => handleFormattingChange('fontSize', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Margin Bottom (px)</span>
            <input
              type="number"
              value={selectedBlock.formatting?.marginBottom ?? 16}
              onChange={(e) => handleFormattingChange('marginBottom', Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 block mb-1">Text Alignment</span>
          <div className="flex items-center gap-2">
            {[
              { val: 'left', icon: AlignLeft },
              { val: 'center', icon: AlignCenter },
              { val: 'right', icon: AlignRight },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = (selectedBlock.formatting?.alignment || 'left') === item.val;
              return (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => handleFormattingChange('alignment', item.val)}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center transition ${
                    isActive
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Signature Block Options */}
      {selectedBlock.type === 'signature' && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="block font-bold text-slate-300 text-[11px]">Signatory Source</label>
          <select
            value={selectedBlock.signatureSource || 'brandDefault'}
            onChange={(e) =>
              onUpdateBlock({
                ...selectedBlock,
                signatureSource: e.target.value as any,
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="brandDefault">Brand Default Signatory</option>
            {signatures.map((sig) => (
              <option key={sig.id} value={sig.id}>
                {sig.fullName} ({sig.designation})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
