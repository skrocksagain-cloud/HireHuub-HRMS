import {
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Building2,
  Stamp as StampIcon,
} from 'lucide-react';
import type { OfferLetterBlock, BrandProfile, LegalCompanyV2, CompanySignatoryV2 } from '../../../../types/Admin';

interface RelievingTemplateCanvasProps {
  blocks: OfferLetterBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onMoveBlock: (index: number, direction: 'up' | 'down') => void;
  onDuplicateBlock: (index: number) => void;
  onDeleteBlock: (index: number) => void;
  selectedBrand?: BrandProfile | null;
  legalCompany?: LegalCompanyV2 | null;
  signatories?: CompanySignatoryV2[];
}

export default function RelievingTemplateCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  selectedBrand,
  legalCompany,
  signatories = [],
}: RelievingTemplateCanvasProps) {
  // Resolve default signatory
  const defaultSignatory = signatories.find((s) => s.isDefault) || signatories[0];

  return (
    <div className="w-full flex justify-center py-6 font-sans">
      {/* A4 Paper Container */}
      <div className="w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-[20mm] relative flex flex-col justify-between box-sizing-border">
        <div className="space-y-4">
          {blocks.map((block, index) => {
            const isSelected = selectedBlockId === block.id;

            return (
              <div
                key={block.id || `block-${index}`}
                onClick={() => onSelectBlock(block.id)}
                className={`relative group rounded-xl transition cursor-pointer border ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20'
                    : 'border-transparent hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Floating Block Actions Bar on Hover/Selection */}
                <div
                  className={`absolute -top-3.5 right-3 z-20 flex items-center gap-1 bg-slate-900 text-slate-200 px-2 py-0.5 rounded-lg text-[10px] shadow-lg transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-mono text-slate-400 mr-1.5 font-bold">
                    #{index + 1} {block.type}
                  </span>
                  <button
                    type="button"
                    title="Move Up"
                    disabled={index === 0}
                    onClick={() => onMoveBlock(index, 'up')}
                    className="p-1 hover:text-sky-400 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    disabled={index === blocks.length - 1}
                    onClick={() => onMoveBlock(index, 'down')}
                    className="p-1 hover:text-sky-400 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Duplicate Section"
                    onClick={() => onDuplicateBlock(index)}
                    className="p-1 hover:text-emerald-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Delete Section"
                    onClick={() => onDeleteBlock(index)}
                    className="p-1 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Render Block Content */}
                <div className="p-3">
                  {renderBlockContent(block, selectedBrand, legalCompany, signatories, defaultSignatory)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderBlockContent(
  block: OfferLetterBlock,
  brand?: BrandProfile | null,
  legal?: LegalCompanyV2 | null,
  signatories: CompanySignatoryV2[] = [],
  defaultSignatory?: CompanySignatoryV2
) {
  const fmt = block.formatting || {};
  const alignment = fmt.alignment || 'left';
  const fontSize = fmt.fontSize || 12;
  const fontWeight = fmt.fontWeight || 'normal';
  const fontStyle = fmt.fontStyle || 'normal';
  const color = fmt.color || '#1e293b';

  const styleObj: React.CSSProperties = {
    textAlign: alignment,
    fontSize: `${fontSize}px`,
    fontWeight,
    fontStyle,
    color,
    marginTop: `${fmt.marginTop || 0}px`,
    marginBottom: `${fmt.marginBottom || 8}px`,
    lineHeight: fmt.lineHeight || 1.5,
  };

  switch (block.type) {
    case 'header': {
      const hCfg = block.headerConfig || {};
      const showLogo = hCfg.showLogo !== false;
      const logoH = hCfg.logoHeight || 50;
      const showBrandName = hCfg.showBrandName === true;
      const showLegalName = hCfg.showLegalName !== false;
      const showAddress = hCfg.showAddress !== false;
      const showPhone = hCfg.showPhone !== false;
      const showEmail = hCfg.showEmail !== false;
      const showWebsite = hCfg.showWebsite !== false;
      const showCin = hCfg.showCin !== false;
      const showPan = hCfg.showPan !== false;
      const showGstin = hCfg.showGstin !== false;

      const hasLeftCol = (showLogo && brand?.logoUrl) || (showBrandName && brand?.brandName);
      const hasRightCol =
        (showLegalName && legal?.legalCompanyName) ||
        (showAddress && legal?.registeredOfficeAddress) ||
        (showPhone && brand?.phone) ||
        (showEmail && brand?.email) ||
        (showWebsite && brand?.website) ||
        (showCin && legal?.cin) ||
        (showPan && legal?.pan) ||
        (showGstin && legal?.gstin);

      if (!hasLeftCol && !hasRightCol) {
        return (
          <div className="py-2 text-center text-[10px] text-slate-400 font-mono border-b border-dashed border-slate-200">
            [ Header Content Hidden ]
          </div>
        );
      }

      return (
        <div className="flex items-center justify-between border-b-2 border-sky-600 pb-3">
          <div>
            {showLogo && brand?.logoUrl && (
              <img src={brand.logoUrl} alt={brand.brandName} style={{ maxHeight: `${logoH}px` }} className="object-contain" />
            )}
            {showBrandName && brand?.brandName && (
              <div className="flex items-center gap-2 text-sky-600 font-bold text-base">
                <Building2 className="w-5 h-5" />
                <span>{brand.brandName}</span>
              </div>
            )}
          </div>
          <div className="text-right text-[11px] text-slate-600 leading-tight">
            {showLegalName && legal?.legalCompanyName && (
              <div className="font-bold text-slate-900 text-xs">
                {legal.legalCompanyName}
              </div>
            )}
            {showAddress && legal?.registeredOfficeAddress && (
              <div>{legal.registeredOfficeAddress}</div>
            )}
            {showPhone && brand?.phone && <div>Phone: {brand.phone}</div>}
            {showEmail && brand?.email && <div>Email: {brand.email}</div>}
            {showWebsite && brand?.website && <div>Website: {brand.website}</div>}
            {showCin && legal?.cin && <div>CIN: {legal.cin}</div>}
            {showPan && legal?.pan && <div>PAN: {legal.pan}</div>}
            {showGstin && legal?.gstin && <div>GSTIN: {legal.gstin}</div>}
          </div>
        </div>
      );
    }

    case 'heading': {
      const level = block.headingLevel || 'h2';
      if (level === 'h1') return <h1 style={styleObj}>{block.content || 'Untitled Section'}</h1>;
      if (level === 'h3') return <h3 style={styleObj}>{block.content || 'Untitled Section'}</h3>;
      return <h2 style={styleObj}>{block.content || 'Untitled Section'}</h2>;
    }

    case 'paragraph':
    case 'text': {
      return (
        <div style={styleObj} className="whitespace-pre-wrap">
          {block.content || 'Click to edit section text...'}
        </div>
      );
    }

    case 'divider': {
      return <hr className="my-3 border-t border-slate-300" />;
    }

    case 'signature': {
      let activeSig = defaultSignatory;

      if (block.signatureSource === 'specific' && block.signatoryId) {
        activeSig = signatories.find((s) => s.id === block.signatoryId) || defaultSignatory;
      }

      return (
        <div style={{ textAlign: alignment }} className="space-y-1 my-4">
          <div className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
            AUTHORIZED SIGNATURE
          </div>

          {activeSig?.signatureUrl ? (
            <img src={activeSig.signatureUrl} alt={activeSig.fullName} className="h-12 object-contain inline-block my-1" />
          ) : (
            <div className="p-3 border border-dashed border-slate-300 rounded-lg inline-block text-[11px] text-slate-400 font-mono bg-slate-50">
              Signature not configured
            </div>
          )}

          <div className="text-xs font-bold text-slate-900">{activeSig?.fullName || 'Authorized Signatory'}</div>
          <div className="text-[11px] text-slate-500">{activeSig?.designation || 'Management'}</div>
        </div>
      );
    }

    case 'stamp': {
      return (
        <div style={{ textAlign: alignment }} className="my-4">
          {brand?.stampUrl ? (
            <img src={brand.stampUrl} alt="Brand Stamp" className="h-16 object-contain inline-block" />
          ) : (
            <div className="p-3 border border-dashed border-slate-300 rounded-lg inline-block text-[11px] text-slate-400 font-mono bg-slate-50">
              <StampIcon className="w-4 h-4 inline-block mr-1 text-slate-400" />
              Stamp not configured
            </div>
          )}
        </div>
      );
    }

    case 'footer': {
      const fCfg = block.footerConfig || {};
      const notice = fCfg.confidentialityText || '{{BRAND_NAME}} • Confidential Relieving Letter';

      return (
        <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
          <div>{notice}</div>
          <div className="font-mono">Page 1 of 1</div>
        </div>
      );
    }

    case 'page_break': {
      return (
        <div className="my-6 border-b-2 border-dashed border-amber-400/60 relative text-center">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full relative -top-3">
            --- PAGE BREAK ---
          </span>
        </div>
      );
    }

    default:
      return <div style={styleObj}>{block.content}</div>;
  }
}
