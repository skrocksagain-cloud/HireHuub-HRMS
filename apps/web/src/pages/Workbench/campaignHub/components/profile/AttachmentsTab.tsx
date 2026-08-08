import type { CampaignMaster } from '../../types/campaign';
import { FileText, FileSpreadsheet, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface AttachmentsTabProps {
  campaign: CampaignMaster;
}

export default function AttachmentsTab({ campaign }: AttachmentsTabProps) {
  const docIds = campaign.documentIds || [];

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Document Center Integrated Attachments</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Campaign Hub stores references only. Files are managed centrally in Document Center.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
            Document Center Consumer
          </span>
        </div>

        {docIds.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <FileText className="mx-auto text-slate-400" size={28} />
            <p className="text-slate-500 font-medium text-xs">No campaign document references attached yet.</p>
            <p className="text-slate-400 text-[11px]">
              Supported types: Images, Posters, Creative Files, Bills, Invoices, PDFs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docIds.map((docId, index) => (
              <div
                key={docId}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 hover:bg-white hover:shadow-xs transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {index % 2 === 0 ? (
                    <ImageIcon className="text-purple-600 shrink-0" size={20} />
                  ) : (
                    <FileSpreadsheet className="text-emerald-600 shrink-0" size={20} />
                  )}
                  <div>
                    <span className="font-bold font-mono text-slate-900 block">{docId}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {index % 2 === 0 ? 'Campaign Creative Asset (Image/Poster)' : 'Vendor Invoice / Bill (PDF)'}
                    </span>
                  </div>
                </div>

                <a
                  href={`/documents?docId=${docId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                  title="View in Document Center"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
