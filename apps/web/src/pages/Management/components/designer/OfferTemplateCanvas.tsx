import { Scissors } from 'lucide-react';
import type { OfferLetterBlock, BrandProfile, CompanySignatoryV2, LegalCompanyV2 } from '../../../../types/Admin';
import { DEFAULT_HEADER_CONFIG, DEFAULT_FOOTER_CONFIG } from './OfferSectionInspector';

interface OfferTemplateCanvasProps {
  blocks: OfferLetterBlock[];
  selectedBlockId: string | null;
  selectedBrand: BrandProfile | null;
  legalCompany?: LegalCompanyV2;
  signatories: CompanySignatoryV2[];
  onSelectBlock: (id: string) => void;
}

export default function OfferTemplateCanvas({
  blocks,
  selectedBlockId,
  selectedBrand,
  legalCompany,
  signatories,
  onSelectBlock,
}: OfferTemplateCanvasProps) {

  // Helper to format string placeholders as visual chips on canvas
  const renderVisualContent = (text: string = '') => {
    if (!text) return <span className="text-slate-400 italic">[Empty Content]</span>;

    const parts = text.split(/(\{\{[A-Z0-9_.]+\}\})/g);

    return (
      <span>
        {parts.map((part, idx) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            const token = part.replace(/^\{\{|\}\}$/g, '');
            return (
              <span
                key={idx}
                className="inline-block bg-sky-100 text-sky-800 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border border-sky-300 mx-0.5"
                title={`ERP Placeholder Token: ${part}`}
              >
                [{token.replace(/_/g, ' ')}]
              </span>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  };

  const renderSection = (block: OfferLetterBlock) => {
    const isSelected = selectedBlockId === block.id;

    const fmt = block.formatting || {};
    const baseStyle = {
      fontSize: `${fmt.fontSize || 12}px`,
      fontWeight: fmt.fontWeight || 'normal',
      fontStyle: fmt.fontStyle || 'normal',
      textDecoration: fmt.textDecoration || 'none',
      textAlign: fmt.alignment || 'left',
      marginTop: `${fmt.marginTop || 0}px`,
      marginBottom: `${fmt.marginBottom || 12}px`,
      color: fmt.color || '#1e293b',
      lineHeight: fmt.lineHeight || 1.5,
    };

    return (
      <div
        key={block.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectBlock(block.id);
        }}
        className={`relative group rounded-xl p-3 my-1.5 transition-all border cursor-pointer ${
          isSelected
            ? 'bg-sky-500/10 border-sky-500 shadow-md ring-2 ring-sky-500/30'
            : 'border-transparent hover:border-slate-300 hover:bg-slate-50/60'
        }`}
      >
        {block.type === 'page_break' && (
          <div className="py-4 my-6 border-t-2 border-dashed border-rose-400/60 flex items-center justify-center gap-2 text-rose-500 font-mono text-xs font-bold uppercase tracking-wider bg-rose-50/40 rounded-lg">
            <Scissors className="w-4 h-4" />
            <span>--- Page Break (A4 Split Point) ---</span>
          </div>
        )}

        {block.type === 'logo' && (
          <div style={{ textAlign: fmt.alignment || 'left', marginBottom: `${fmt.marginBottom || 12}px` }}>
            {selectedBrand?.logoUrl ? (
              <img
                src={selectedBrand.logoUrl}
                alt={selectedBrand.brandName}
                className="max-h-14 object-contain inline-block"
              />
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-bold text-sm">
                <span>[BRAND LOGO: {selectedBrand?.brandName || 'Hire Huub'}]</span>
              </div>
            )}
          </div>
        )}

        {block.type === 'heading' && (
          <div style={baseStyle}>
            {block.headingLevel === 'h1' && (
              <h1 className="text-base font-bold uppercase tracking-wide">{renderVisualContent(block.content)}</h1>
            )}
            {block.headingLevel === 'h2' && (
              <h2 className="text-sm font-bold">{renderVisualContent(block.content)}</h2>
            )}
            {(!block.headingLevel || block.headingLevel === 'h3') && (
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 border-b border-slate-300 pb-1">
                {renderVisualContent(block.content)}
              </h3>
            )}
          </div>
        )}

        {(block.type === 'paragraph' || block.type === 'text') && (
          <div style={baseStyle} className="whitespace-pre-wrap">
            {renderVisualContent(block.content)}
          </div>
        )}

        {block.type === 'divider' && (
          <hr
            style={{
              marginTop: `${fmt.marginTop || 12}px`,
              marginBottom: `${fmt.marginBottom || 12}px`,
              borderColor: fmt.color || '#e2e8f0',
            }}
            className="border-t-2"
          />
        )}

        {block.type === 'table' && (
          <div className="my-3">
            <div className="text-xs font-bold text-slate-700 mb-2">Itemized Compensation Breakdown (Annexure A)</div>
            <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sky-600 text-white font-bold">
                    <th className="p-2 border-r border-sky-700 w-[40%]">Salary Component</th>
                    <th className="p-2 border-r border-sky-700 text-right w-[30%]">Monthly (₹)</th>
                    <th className="p-2 text-right w-[30%]">Annual (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="p-2 font-medium">Basic Pay</td><td className="p-2 text-right font-mono">[BASIC MONTHLY]</td><td className="p-2 text-right font-mono">[BASIC ANNUAL]</td></tr>
                  <tr className="bg-slate-50"><td className="p-2 font-medium">House Rent Allowance (HRA)</td><td className="p-2 text-right font-mono">[HRA MONTHLY]</td><td className="p-2 text-right font-mono">[HRA ANNUAL]</td></tr>
                  <tr><td className="p-2 font-medium">Special Allowance</td><td className="p-2 text-right font-mono">[SPECIAL MONTHLY]</td><td className="p-2 text-right font-mono">[SPECIAL ANNUAL]</td></tr>
                  <tr className="bg-slate-100 font-bold"><td className="p-2">Gross Salary</td><td className="p-2 text-right font-mono">[GROSS CTC]</td><td className="p-2 text-right font-mono">[ANNUAL CTC]</td></tr>
                  <tr><td className="p-2 font-medium">Employee PF</td><td className="p-2 text-right font-mono">[PF EMPLOYEE]</td><td className="p-2 text-right font-mono">-</td></tr>
                  <tr className="bg-slate-50"><td className="p-2 font-medium">Professional Tax (PT)</td><td className="p-2 text-right font-mono">[PROFESSIONAL TAX]</td><td className="p-2 text-right font-mono">-</td></tr>
                  <tr className="bg-sky-50 font-bold text-sky-900"><td className="p-2">Estimated Net Take-Home</td><td className="p-2 text-right font-mono">[NET TAKE HOME]</td><td className="p-2 text-right font-mono">-</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {block.type === 'signature' && (
          <div className="space-y-1.5" style={{ textAlign: fmt.alignment || 'left' }}>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              AUTHORIZED SIGNATURE
            </div>
            {(() => {
              const matchedSig =
                block.signatureSource === 'specific' && block.signatoryId
                  ? signatories.find((s) => (s.id || (s as any).signatoryId) === block.signatoryId)
                  : signatories.find((s) => s.isDefault) || signatories[0];

              if (matchedSig?.signatureUrl) {
                return (
                  <div className="inline-block text-center">
                    <img src={matchedSig.signatureUrl} alt="Signature" className="h-12 object-contain inline-block bg-white p-1 rounded border border-slate-200" />
                    <div className="text-[11px] font-bold text-slate-900 mt-1">{matchedSig.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{matchedSig.designation}</div>
                  </div>
                );
              }
              return (
                <div className="inline-block p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs font-mono">
                  [SIGNATURE: {matchedSig?.fullName || '[Signatory Name]'}]
                </div>
              );
            })()}
          </div>
        )}

        {block.type === 'stamp' && (
          <div style={{ textAlign: fmt.alignment || 'left' }}>
            {selectedBrand?.stampUrl ? (
              <img
                src={selectedBrand.stampUrl}
                alt="Brand Stamp"
                className="h-16 object-contain inline-block"
              />
            ) : (
              <div className="inline-block p-2 bg-purple-50 border border-purple-300 rounded-lg text-purple-800 text-xs font-mono">
                [OFFICIAL STAMP: {selectedBrand?.brandName || 'Hire Huub'}]
              </div>
            )}
          </div>
        )}

        {block.type === 'footer' && (
          <div
            style={{
              fontSize: `${block.footerConfig?.fontSize || 10}px`,
              marginTop: `${block.footerConfig?.marginTop || 16}px`,
            }}
            className="pt-4 border-t border-slate-300 text-slate-600 font-mono flex items-center justify-between"
          >
            <div>
              {block.footerConfig?.showConfidentialityNotice !== false ? (
                renderVisualContent(block.footerConfig?.confidentialityText || '{{BRAND_NAME}} • Confidential Offer Letter')
              ) : (
                <span>{selectedBrand?.brandName || 'Hire Huub'} • Official Offer Letter</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {block.footerConfig?.showWebsite !== false && (
                <span>{selectedBrand?.website || legalCompany?.corporateWebsite || 'www.hirehuub.in'}</span>
              )}
              {block.footerConfig?.showPageNumber !== false && (
                <span>Page 1{block.footerConfig?.showTotalPages !== false ? ' of 3' : ''}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };


  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;
  const activeHeaderBlock = blocks.find((b) => b.type === 'header' || b.type === 'logo') || blocks[0];
  const activeFooterBlock = blocks.find((b) => b.type === 'footer') || blocks.find((b) => b.id === 'block-20');

  const headerBlock = (selectedBlock?.type === 'header' || selectedBlock?.type === 'logo' ? selectedBlock : activeHeaderBlock) || activeHeaderBlock;
  const footerBlock = (selectedBlock?.type === 'footer' ? selectedBlock : activeFooterBlock) || activeFooterBlock;

  const headerCfg = {
    ...DEFAULT_HEADER_CONFIG,
    ...headerBlock?.headerConfig,
  };

  const footerCfg = {
    ...DEFAULT_FOOTER_CONFIG,
    ...footerBlock?.footerConfig,
  };


  return (
    <div className="bg-slate-300/70 p-8 rounded-2xl min-h-[900px] flex justify-center custom-scrollbar overflow-y-auto font-sans">
      {/* Authentic A4 Paper Canvas */}
      <div
        onClick={() => onSelectBlock('')}
        className="w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-[20mm] text-slate-900 border border-slate-200 flex flex-col justify-between"
      >
        <div>
          {/* TWO-SIDED DOCUMENT HEADER (LEFT: Brand Logo, RIGHT: Right-aligned Legal Company Details) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (headerBlock) onSelectBlock(headerBlock.id);
            }}
            className={`border-b-2 border-sky-600 pb-4 mb-6 flex items-start justify-between cursor-pointer rounded-lg p-2 transition-all ${
              selectedBlockId && (blocks.find((b) => b.id === selectedBlockId)?.type === 'header' || blocks.find((b) => b.id === selectedBlockId)?.type === 'logo')
                ? 'bg-sky-500/10 ring-2 ring-sky-500/30'
                : 'hover:bg-slate-50'
            }`}
          >
            {/* LEFT COLUMN: Brand Logo & Optional Brand Name */}
            <div className="flex flex-col items-start gap-1">
              {headerCfg.showLogo !== false && (
                selectedBrand?.logoUrl ? (
                  <img
                    src={selectedBrand.logoUrl}
                    alt={selectedBrand.brandName}
                    style={{ maxHeight: `${headerCfg.logoHeight || 50}px` }}
                    className="object-contain"
                  />
                ) : (
                  <div className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-slate-600 font-bold text-xs">
                    [BRAND LOGO]
                  </div>
                )
              )}

              {/* Optional Brand Name (OFF by default) */}
              {headerCfg.showBrandName && (
                <span className="text-xs font-bold text-sky-700 mt-1">{selectedBrand?.brandName || 'Hire Huub'}</span>
              )}
            </div>

            {/* RIGHT COLUMN: Right-aligned Legal Company Details */}
            <div
              style={{ fontSize: `${headerCfg.legalFontSize || 10}px` }}
              className={`space-y-0.5 max-w-[60%] ${
                headerCfg.legalAlignment === 'left'
                  ? 'text-left'
                  : headerCfg.legalAlignment === 'center'
                  ? 'text-center'
                  : 'text-right'
              }`}
            >
              {headerCfg.showLegalName !== false && (
                <h1 className="font-bold text-slate-900 leading-tight" style={{ fontSize: `${(headerCfg.legalFontSize || 10) + 3}px` }}>
                  {legalCompany?.legalCompanyName || ''}
                </h1>
              )}
              {headerCfg.showAddress !== false && (
                <p className="text-slate-600 leading-tight">
                  {legalCompany?.registeredOfficeAddress || ''}
                </p>
              )}
              {headerCfg.showPhone && (
                <p className="text-slate-500 font-mono">
                  Phone: {selectedBrand?.phone || legalCompany?.corporatePhone || ''}
                </p>
              )}
              {headerCfg.showEmail !== false && (
                <p className="text-slate-500 font-mono">
                  Email: {selectedBrand?.email || ''}
                </p>
              )}
              {headerCfg.showWebsite && (
                <p className="text-slate-500 font-mono">
                  Website: {selectedBrand?.website || legalCompany?.corporateWebsite || ''}
                </p>
              )}
              {headerCfg.showCin !== false && (
                <p className="text-slate-500 font-mono">
                  CIN: {legalCompany?.cin || ''}
                </p>
              )}
              {headerCfg.showPan && (
                <p className="text-slate-500 font-mono">
                  PAN: {legalCompany?.pan || ''}
                </p>
              )}
              {headerCfg.showGstin && (
                <p className="text-slate-500 font-mono">
                  GSTIN: {legalCompany?.gstin || ''}
                </p>
              )}
            </div>

          </div>

          {/* Sections List */}

          {blocks.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 space-y-2">
              <p className="font-bold text-sm">No Document Sections Defined</p>
              <p className="text-xs">Select brand and customize offer terms in the designer sidebar.</p>
            </div>
          ) : (
            blocks.map((block) => renderSection(block))
          )}
        </div>

        {/* Dynamic Paper Footer */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (footerBlock) onSelectBlock(footerBlock.id);
          }}
          style={{
            fontSize: `${footerCfg.fontSize || 10}px`,
            marginTop: `${footerCfg.marginTop || 16}px`,
          }}
          className={`pt-6 border-t border-slate-200 text-slate-600 font-mono flex items-center justify-between cursor-pointer rounded-lg p-2 transition-all ${
            selectedBlockId && blocks.find((b) => b.id === selectedBlockId)?.type === 'footer'
              ? 'bg-purple-500/10 ring-2 ring-purple-500/30'
              : 'hover:bg-slate-50'
          }`}
        >
          <div>
            {footerCfg.showConfidentialityNotice !== false ? (
              renderVisualContent(footerCfg.confidentialityText || '{{BRAND_NAME}} • Confidential Offer Letter')
            ) : (
              <span>{selectedBrand?.brandName || ''} • Official Offer Letter</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {footerCfg.showWebsite !== false && (
              <span>{selectedBrand?.website || legalCompany?.corporateWebsite || ''}</span>
            )}
            {footerCfg.showPageNumber !== false && (
              <span>Page 1{footerCfg.showTotalPages !== false ? ' of 3' : ''}</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

