import { Paperclip, Upload } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface AttachmentsTabProps {
  candidate: Candidate;
}

export default function AttachmentsTab({ candidate }: AttachmentsTabProps) {
  const attachments = candidate.attachments || [];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip size={16} className="text-emerald-600" /> Manual File Attachments ({attachments.length})
        </h4>
        <button
          type="button"
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1 cursor-pointer"
        >
          <Upload size={12} /> Upload Attachment
        </button>
      </div>

      {attachments.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 italic">
          No manual file attachments uploaded for this candidate profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => (
            <div key={att.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip size={16} className="text-slate-400" />
                <div>
                  <p className="font-bold text-slate-800 text-xs">{att.fileName}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(att.fileSize / 1024).toFixed(1)} KB • Uploaded by {att.uploadedBy}
                  </span>
                </div>
              </div>
              <a
                href={att.fileUrl}
                download
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
