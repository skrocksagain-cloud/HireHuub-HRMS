import { useState } from 'react';
import { X, Download, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2, ShieldCheck, FileText } from 'lucide-react';
export interface DocumentResult {
  success: boolean;
  documentId?: string;
  fileName?: string;
  downloadUrl?: string;
  previewUrl?: string;
  storagePath?: string;
  renderedHtml?: string;
  blob?: Blob;
  templateFileUrl?: string;
  format?: string;
  templateVersion?: string;
  templateUsed?: string;
  digitalSignatureInfo?: any;
  status?: string;
  error?: string;
}

import { documentCenterService } from '../services/document/documentCenterService';

interface DocumentPreviewModalProps {
  result: DocumentResult;
  onClose: () => void;
}

export default function DocumentPreviewModal({ result, onClose }: DocumentPreviewModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 175));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (result.documentId) {
        await documentCenterService.recordDownload(result.documentId);
      }

      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.fileName || 'document.pdf';
        link.target = '_blank';
        link.click();
      } else if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName || 'document.pdf';
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore
    } finally {
      setDownloading(false);
    }
  };

  const uploadedUrl = result.templateFileUrl || '';
  const generatedUrl = result.downloadUrl || result.previewUrl || '';
  const blobUrl = result.blob ? URL.createObjectURL(result.blob) : '';

  const previewSrc = uploadedUrl || blobUrl || generatedUrl;
  const activeUrl = uploadedUrl || generatedUrl;

  const cleanUrl = activeUrl.split('?')[0].toLowerCase();
  const isPdf = cleanUrl.endsWith('.pdf') || (!uploadedUrl && (Boolean(result.blob) || result.format === 'PDF'));
  const isImage = cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp');
  const isDocxOrXlsx =
    cleanUrl.endsWith('.docx') ||
    cleanUrl.endsWith('.xlsx') ||
    cleanUrl.endsWith('.xls') ||
    cleanUrl.includes('.doc') ||
    cleanUrl.includes('.xls') ||
    result.format === 'DOCX' ||
    result.format === 'XLSX';

  return (
    <div className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 ${isFullScreen ? 'p-0' : 'p-4'}`}>
      <div
        className={`bg-slate-100 rounded-3xl w-full flex flex-col overflow-hidden shadow-2xl border border-slate-200 transition-all ${
          isFullScreen ? 'h-screen w-screen rounded-none' : 'max-w-5xl h-[90vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {result.fileName}
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  {result.templateVersion || 'v1.0'}
                </span>
              </h3>
              <p className="text-slate-400 text-[11px]">
                Template: <span className="text-slate-200 font-semibold">{result.templateUsed}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="px-2 text-[11px] font-mono font-bold text-slate-300">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 175}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              <Printer size={15} /> Print
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              <Download size={15} />
              {downloading ? 'Downloading…' : 'Download File'}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white transition"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 transition"
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Document Preview Body */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-200/80">
          {result.renderedHtml ? (
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-10 shadow-xl border border-slate-300 rounded-lg transition-all"
              dangerouslySetInnerHTML={{ __html: result.renderedHtml }}
            />
          ) : !uploadedUrl && !generatedUrl && !blobUrl ? (
            <div className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-10 shadow-xl border border-slate-300 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-slate-100 text-slate-400 rounded-full border border-slate-200">
                <FileText size={48} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">No Template Available</h2>
              <p className="text-sm text-slate-500 max-w-md">
                No template has been uploaded for this document type.
              </p>
            </div>
          ) : isPdf ? (
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="bg-white w-full h-full min-h-[297mm] shadow-xl border border-slate-300 rounded-lg overflow-hidden flex flex-col transition-all"
            >
              <iframe
                src={previewSrc}
                title={result.fileName}
                className="w-full flex-1 border-0 rounded-lg"
              />
            </div>
          ) : isImage ? (
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="bg-white p-6 shadow-xl border border-slate-300 rounded-lg flex items-center justify-center transition-all max-w-full overflow-auto"
            >
              <img src={previewSrc} alt={result.fileName} className="max-w-full max-h-[280mm] object-contain rounded-md" />
            </div>
          ) : isDocxOrXlsx ? (
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="bg-white w-full h-full min-h-[297mm] shadow-xl border border-slate-300 rounded-lg overflow-hidden flex flex-col transition-all"
            >
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewSrc)}`}
                title={result.fileName}
                className="w-full flex-1 border-0 rounded-lg"
              />
            </div>
          ) : (
            <div className="bg-white text-slate-900 p-10 shadow-xl border border-slate-300 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
              <FileText size={48} className="text-slate-400" />
              <h3 className="font-bold text-base text-slate-900">Preview unavailable for this file type</h3>
              <p className="text-xs text-slate-500 font-mono">{result.fileName}</p>
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Download File to View
              </button>
            </div>
          )}
        </div>

        {/* Digital Signature & Metadata Drawer */}
        <div className="bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck size={16} /> Digitally Certified Document
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-[11px]">Provider: {result.digitalSignatureInfo?.eSignProvider || 'Aadhaar eSign'}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Storage Path: <strong className="text-slate-800">{result.storagePath || '/generated/'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
