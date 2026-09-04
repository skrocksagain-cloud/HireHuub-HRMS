import { Plus } from 'lucide-react';
import type { OfferLetterBlock, BrandProfile, CompanySettings } from '../../../../types/Admin';

interface IncrementTemplateCanvasProps {
  blocks: OfferLetterBlock[];
  selectedBlockId: string | null;
  selectedBrand: BrandProfile | null;
  companySettings: CompanySettings | null;
  onSelectBlock: (id: string) => void;
  onAddBlock: () => void;
}

export default function IncrementTemplateCanvas({
  blocks,
  selectedBlockId,
  selectedBrand,
  companySettings,
  onSelectBlock,
  onAddBlock,
}: IncrementTemplateCanvasProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-950/60 font-sans">
      {/* A4 Paper Dimensions (210mm x 297mm -> approx 794px width) */}
      <div className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl p-12 relative flex flex-col justify-between rounded-sm border border-slate-200">
        <div className="space-y-4">
          {blocks.map((block) => {
            const isSelected = block.id === selectedBlockId;
            return (
              <div
                key={block.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block.id);
                }}
                className={`p-3 rounded-lg cursor-pointer transition relative group border ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                    : 'border-transparent hover:border-slate-300 hover:bg-slate-50/50'
                }`}
                style={{
                  marginBottom: `${block.formatting?.marginBottom ?? 16}px`,
                  textAlign: block.formatting?.alignment || 'left',
                }}
              >
                {/* 1. Header Section */}
                {block.type === 'header' && (
                  <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                    <div className="space-y-1">
                      {block.headerConfig?.showLogo !== false && (selectedBrand?.logoUrl || companySettings?.logoUrl) ? (
                        <img
                          src={selectedBrand?.logoUrl || companySettings?.logoUrl}
                          alt={selectedBrand?.brandName || 'Brand Logo'}
                          className="h-12 object-contain"
                        />
                      ) : (
                        <div className="text-sm font-bold text-slate-400 font-mono">[BRAND LOGO]</div>
                      )}
                      {block.headerConfig?.showBrandName !== false && selectedBrand?.brandName && (
                        <div className="font-bold text-emerald-800 text-xs tracking-tight">
                          {selectedBrand.brandName}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                      {block.headerConfig?.showLegalName !== false && (companySettings?.companyName || (companySettings as any)?.legalName) && (
                        <div className="font-bold text-slate-900 text-xs">
                          {companySettings?.companyName || (companySettings as any)?.legalName}
                        </div>
                      )}
                      {block.headerConfig?.showAddress !== false && companySettings?.address && (
                        <div>{companySettings.address}</div>
                      )}
                      {block.headerConfig?.showEmail !== false && companySettings?.email && (
                        <div>Email: {companySettings.email}</div>
                      )}
                      {block.headerConfig?.showPhone !== false && companySettings?.phone && (
                        <div>Phone: {companySettings.phone}</div>
                      )}
                      {block.headerConfig?.showWebsite !== false && companySettings?.website && (
                        <div>{companySettings.website}</div>
                      )}
                      {(companySettings?.cin || companySettings?.pan || companySettings?.gstin) && (
                        <div className="text-[10px] text-slate-500 pt-0.5">
                          {block.headerConfig?.showCin !== false && companySettings?.cin && `CIN: ${companySettings.cin} `}
                          {block.headerConfig?.showPan !== false && companySettings?.pan && `PAN: ${companySettings.pan} `}
                          {block.headerConfig?.showGstin !== false && companySettings?.gstin && `GSTIN: ${companySettings.gstin}`}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Text / Paragraph Section */}
                {(block.type === 'paragraph' || block.type === 'heading' || block.type === 'text') && (
                  <div
                    className="whitespace-pre-wrap text-slate-800"
                    style={{
                      fontSize: `${block.formatting?.fontSize || 12}px`,
                      fontWeight: block.formatting?.fontWeight || 'normal',
                      lineHeight: block.formatting?.lineHeight || 1.5,
                    }}
                  >
                    {block.content || <span className="text-slate-400 italic">Empty section content...</span>}
                  </div>
                )}

                {/* 3. Signature Section */}
                {block.type === 'signature' && (() => {
                  const sigSrc = block.signatureSource;
                  const allSigs = companySettings?.signatoriesV2 || [];
                  const activeSigs = allSigs.filter((s) => s.isActive !== false);
                  const matchedSig = sigSrc && sigSrc !== 'brandDefault'
                    ? activeSigs.find((s) => s.id === sigSrc || (s as any).signatoryId === sigSrc)
                    : activeSigs.find((s: any) => s.isPrimary) || activeSigs[0];

                  if (matchedSig) {
                    return (
                      <div className="pt-2" style={{ textAlign: block.formatting?.alignment || 'left' }}>
                        {matchedSig.signatureUrl ? (
                          <img src={matchedSig.signatureUrl} alt={matchedSig.fullName} className="h-12 object-contain mb-1" />
                        ) : (
                          <div className="w-36 h-10 border border-dashed border-slate-300 rounded mb-1 flex items-center justify-center bg-slate-50 text-[10px] text-slate-400 font-mono">
                            [NO SIGNATURE IMAGE]
                          </div>
                        )}
                        <div className="text-xs font-bold text-slate-900 font-sans">{matchedSig.fullName}</div>
                        <div className="text-[11px] text-slate-600">{matchedSig.designation}</div>
                      </div>
                    );
                  }

                  return (
                    <div className="pt-2 text-slate-400 italic text-[11px]" style={{ textAlign: block.formatting?.alignment || 'left' }}>
                      [No active signatory configured in Company Settings]
                    </div>
                  );
                })()}

                {/* 4. Stamp Section */}
                {block.type === 'stamp' && (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                    [STAMP]
                  </div>
                )}

                {/* 5. Footer Section */}
                {block.type === 'footer' && (
                  <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
                    <div>{block.footerConfig?.confidentialityText || 'Confidential Increment Letter'}</div>
                    <div>Page 1 of 1</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Section Button */}
        <div className="pt-6 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={onAddBlock}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Custom Section</span>
          </button>
        </div>
      </div>
    </div>
  );
}
