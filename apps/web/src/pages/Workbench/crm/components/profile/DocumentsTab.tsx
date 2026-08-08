import { FileText, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import type { Candidate } from '../../types/crm';
import { prepareOcrExtraction } from '../../services/extensionContracts';

interface DocumentsTabProps {
  candidate: Candidate;
}

export default function DocumentsTab({ candidate }: DocumentsTabProps) {
  const isPayrollActive = candidate.status === 'Active' && candidate.currentPlacement?.clientType === 'Payroll';
  const docs = candidate.documents || [];

  const requiredDocTypes: Array<'Resume' | 'Aadhaar Card' | 'PAN Card' | 'Driving Licence' | 'Bank Details'> = [
    'Resume',
    'Aadhaar Card',
    'PAN Card',
    'Driving Licence',
    'Bank Details',
  ];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={16} className="text-emerald-600" /> Lifetime Profile Documents ({docs.length})
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Belongs to Candidate Profile — Reusable across placements</span>
      </div>

      {!isPayrollActive && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            Resume uploading and payroll document requirements are enabled after candidate becomes <strong>Active</strong> on a <strong>Payroll</strong> client.
          </span>
        </div>
      )}

      {/* Grid of Document Cards & OCR Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requiredDocTypes.map((docType) => {
          const existing = docs.find((d) => d.documentType === docType);
          const isUploaded = !!existing;

          return (
            <div
              key={docType}
              className={`p-4 rounded-2xl border transition space-y-2 ${
                isUploaded ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <FileText size={14} className={isUploaded ? 'text-emerald-600' : 'text-slate-400'} /> {docType}
                </span>

                {isUploaded ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck size={10} /> Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[10px]">
                    Pending Upload
                  </span>
                )}
              </div>

              {existing ? (
                <div className="space-y-1 text-[11px]">
                  {existing.fileName && <p className="font-medium text-slate-700 truncate">{existing.fileName}</p>}
                  {existing.accountNumber && (
                    <p className="font-mono text-slate-800">
                      Account: {existing.accountNumber} | IFSC: {existing.ifscCode}
                    </p>
                  )}
                  {existing.ocrPlaceholderText && (
                    <div className="p-1.5 bg-white border border-emerald-200 rounded text-[10px] text-emerald-800 flex items-center gap-1">
                      <Sparkles size={12} className="text-emerald-600" /> {existing.ocrPlaceholderText}
                    </div>
                  )}
                  {existing.uploadedAt && (
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Uploaded {new Date(existing.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400">OCR Integration Point Ready</span>
                  <button
                    type="button"
                    onClick={() => prepareOcrExtraction(`doc-prep-${docType}`)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
