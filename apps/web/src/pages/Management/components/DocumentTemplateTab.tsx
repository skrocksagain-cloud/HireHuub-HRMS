import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Edit3,
  Layers,
  CheckCircle2,
  History,
  GitBranch,
  AlertCircle,
} from 'lucide-react';
import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import OfferTemplateDesignerModal from './designer/OfferTemplateDesignerModal';
import RelievingTemplateDesignerModal from './designer/RelievingTemplateDesignerModal';
import IncrementTemplateDesignerModal from './designer/IncrementTemplateDesignerModal';
import { offerTemplateService, type TemplateVersionRecord } from '../../../services/admin/offerTemplateService';
import type { DocumentTemplateConfig, BrandProfile } from '../../../types/Admin';

export default function DocumentTemplateTab() {
  const { company } = useAdminCompany();

  const brandList: BrandProfile[] =
    (company?.brandProfilesList || []).filter((b) => b.isActive !== false);

  const [selectedDocType, setSelectedDocType] = useState<'OFFER_LETTER' | 'RELIEVING_LETTER' | 'INCREMENT_LETTER'>('OFFER_LETTER');
  const [selectedBrandForDesigner, setSelectedBrandForDesigner] = useState<string | null>(null);
  const [isDesignerOpen, setIsDesignerOpen] = useState<boolean>(false);
  const [brandTemplates, setBrandTemplates] = useState<Record<string, DocumentTemplateConfig>>({});
  const [versionHistories, setVersionHistories] = useState<Record<string, TemplateVersionRecord[]>>({});
  const [viewHistoryBrandId, setViewHistoryBrandId] = useState<string | null>(null);

  const fetchBrandTemplates = async () => {
    const templatesMap: Record<string, DocumentTemplateConfig> = {};
    const historyMap: Record<string, TemplateVersionRecord[]> = {};

    for (const brand of brandList) {
      const tmpl = await offerTemplateService.getOfferTemplateByBrand(brand.id, brand.brandName, selectedDocType);
      templatesMap[brand.id] = tmpl;

      const history = await offerTemplateService.getTemplateVersions(brand.id, selectedDocType);
      historyMap[brand.id] = history;
    }

    setBrandTemplates(templatesMap);
    setVersionHistories(historyMap);
  };

  useEffect(() => {
    fetchBrandTemplates();
  }, [company, selectedDocType]);

  const handleOpenDesigner = (brandId: string) => {
    setSelectedBrandForDesigner(brandId);
    setIsDesignerOpen(true);
  };

  const handleCloseDesigner = () => {
    setIsDesignerOpen(false);
    setSelectedBrandForDesigner(null);
    fetchBrandTemplates();
  };

  return (
    <div className="w-full space-y-6 text-slate-100 font-sans">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-950 border border-sky-800 rounded-xl text-sky-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Native ERP Document Template Designer</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Brand-Specific Document Templates • Structured Block Engine • Native PDF Generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>Native Engine Active</span>
            </span>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedDocType('OFFER_LETTER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedDocType === 'OFFER_LETTER'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Offer Letter Templates
          </button>
          <button
            type="button"
            onClick={() => setSelectedDocType('RELIEVING_LETTER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedDocType === 'RELIEVING_LETTER'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Relieving Letter Templates
          </button>
          <button
            type="button"
            onClick={() => setSelectedDocType('INCREMENT_LETTER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedDocType === 'INCREMENT_LETTER'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Increment Letter Templates
          </button>
        </div>
      </div>

      {/* Brand Document Templates Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>
                Brand {selectedDocType === 'RELIEVING_LETTER' ? 'Relieving Letter' : selectedDocType === 'INCREMENT_LETTER' ? 'Increment Letter' : 'Offer Letter'} Configurations
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each brand maintains its own published immutable template. Super Admin can edit drafts & publish new versions.
            </p>
          </div>
        </div>

        {brandList.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950 space-y-3">
            <div className="w-12 h-12 bg-amber-950 border border-amber-800 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-300">No Brand Profiles Configured</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Please configure at least one active Brand Profile in <span className="text-sky-400 font-semibold">Company Settings → Brands</span> to manage {selectedDocType === 'RELIEVING_LETTER' ? 'Relieving Letter' : selectedDocType === 'INCREMENT_LETTER' ? 'Increment Letter' : 'Offer Letter'} templates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {brandList.map((brand) => {
            const tmpl = brandTemplates[brand.id];
            const history = versionHistories[brand.id] || [];

            return (
              <div
                key={brand.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.brandName} className="h-8 max-w-[100px] object-contain" />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center font-bold text-xs">
                        {brand.brandName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{brand.brandName}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {selectedDocType === 'RELIEVING_LETTER' ? 'Relieving Letter Template' : selectedDocType === 'INCREMENT_LETTER' ? 'Increment Letter Template' : 'Offer Letter Template'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                        tmpl?.lifecycleState === 'Published'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {tmpl?.lifecycleState || 'Draft'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                      {tmpl?.activeVersion || 'v1.0'}
                    </span>
                  </div>
                </div>

                {/* Template Details Summary */}
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Canvas Blocks:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {tmpl?.offerSchema?.blocks?.length || 0} blocks
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Updated:</span>
                    <span className="font-mono text-slate-400">
                      {tmpl?.updatedAt ? new Date(tmpl.updatedAt).toLocaleDateString() : 'Initial'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleOpenDesigner(brand.id)}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-sky-600/20"
                  >
                    <Edit3 size={14} />
                    <span>Open Template Designer</span>
                  </button>

                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewHistoryBrandId(viewHistoryBrandId === brand.id ? null : brand.id)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                      title="View Published Versions History"
                    >
                      <History size={14} />
                      <span className="font-mono font-bold">{history.length}</span>
                    </button>
                  )}
                </div>

                {/* Published Version History Subpanel */}
                {viewHistoryBrandId === brand.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-[11px] bg-slate-900/60 p-3 rounded-xl">
                    <div className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                      <GitBranch size={13} className="text-sky-400" />
                      <span>Published Version History</span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {history.map((ver) => (
                        <div
                          key={ver.versionNumber}
                          className="flex items-center justify-between p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-400">v{ver.versionNumber}.0</span>
                            <span className="text-[10px] text-slate-500">
                              {ver.publishedAt ? new Date(ver.publishedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">By {ver.publishedBy || 'Admin'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Document Designer Modals */}
      {isDesignerOpen && selectedBrandForDesigner && selectedDocType === 'RELIEVING_LETTER' && (
        <RelievingTemplateDesignerModal
          isOpen={isDesignerOpen}
          onClose={handleCloseDesigner}
          initialBrandId={selectedBrandForDesigner}
        />
      )}

      {isDesignerOpen && selectedBrandForDesigner && selectedDocType === 'OFFER_LETTER' && (
        <OfferTemplateDesignerModal
          isOpen={isDesignerOpen}
          onClose={handleCloseDesigner}
          initialBrandId={selectedBrandForDesigner}
        />
      )}

      {isDesignerOpen && selectedBrandForDesigner && selectedDocType === 'INCREMENT_LETTER' && (
        <IncrementTemplateDesignerModal
          isOpen={isDesignerOpen}
          onClose={handleCloseDesigner}
          initialBrandId={selectedBrandForDesigner}
        />
      )}
    </div>
  );
}
