import { Download, FileText, X } from 'lucide-react';
import type { CircularFileMetadata } from '../../../../types/Announcement';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  circular: CircularFileMetadata | null;
  onDownload?: () => void;
}

export default function CircularPreviewModal({ isOpen, onClose, circular, onDownload }: Props) {
  if (!isOpen || !circular) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-md">
                {circular.originalFileName || circular.fileName}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {circular.fileType} • {(circular.fileSize / 1024).toFixed(1)} KB • Uploaded by {circular.uploadedByName || 'Admin'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={circular.downloadURL}
              download={circular.originalFileName || circular.fileName}
              target="_blank"
              rel="noreferrer"
              onClick={onDownload}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Download File
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Frame */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 overflow-hidden flex items-center justify-center">
          {circular.fileType === 'PDF' || circular.downloadURL.includes('.pdf') ? (
            <iframe
              src={`${circular.downloadURL}#toolbar=0`}
              title={circular.originalFileName}
              className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
            />
          ) : (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl">
                DOCX
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Word Document Circular
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct browser inline rendering is available for PDF circulars. For Word (.docx) circulars, please click Download File below to view.
              </p>
              <a
                href={circular.downloadURL}
                download={circular.originalFileName || circular.fileName}
                target="_blank"
                rel="noreferrer"
                onClick={onDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                <Download size={16} /> Download {circular.originalFileName}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
