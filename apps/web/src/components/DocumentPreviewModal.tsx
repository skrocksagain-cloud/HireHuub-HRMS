import { useState } from 'react';
import { X, Download, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import type { DocumentResult } from '../core/engine/documentEngine';
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
        link.download = result.fileName;
        link.target = '_blank';
        link.click();
      } else if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore
    } finally {
      setDownloading(false);
    }
  };

  const placeholders = result.resolvedPlaceholders || {};

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
              {downloading ? 'Downloading…' : 'Download PDF'}
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
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="bg-white text-slate-900 w-[210mm] min-h-[297mm] p-10 shadow-xl border border-slate-300 rounded-lg flex flex-col justify-between transition-all"
          >
            {/* HR Letterhead Top Image (If HR Category or letterheadUrl present) */}
            {result.category === 'HR' || result.format === 'DOCX' || result.letterheadUrl ? (
              <div className="border-b border-slate-200 pb-3">
                {result.letterheadUrl ? (
                  <img src={result.letterheadUrl} alt="Company Letterhead Top" className="w-full max-h-28 object-contain" />
                ) : (
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      {result.logoUrl ? (
                        <img src={result.logoUrl} alt="Company Logo" className="h-12 object-contain" />
                      ) : (
                        <div className="font-black text-xl text-slate-900 tracking-wider">HIRE HUUB ONE</div>
                      )}
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-500">
                      Date: {placeholders.date || new Date().toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Finance / Payroll Direct Excel Header Banner */
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.logoUrl && <img src={result.logoUrl} alt="Logo" className="h-10 object-contain bg-white p-1 rounded-lg" />}
                  <div>
                    <div className="font-bold text-sm text-white">{placeholders.company_name || 'Hire Huub One'}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">FINANCIAL STATEMENT / EXCEL TEMPLATE</div>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono">
                  <div>Ref: {result.fileName.replace('.pdf', '')}</div>
                  <div className="text-slate-400">Date: {placeholders.date || new Date().toLocaleDateString()}</div>
                </div>
              </div>
            )}

            {/* Document Content / Body */}
            <div className="py-6 space-y-6 flex-1 text-xs text-slate-800 leading-relaxed">
              <div className="flex justify-between font-mono text-[11px] text-slate-500 border-b border-slate-100 pb-2">
                <span>Ref No: {result.fileName.replace('.pdf', '')}</span>
                <span>Template Version: {result.templateVersion || 'v1.0'}</span>
              </div>

              {result.category === 'HR' || result.format === 'DOCX' ? (
                /* HR Letter Document Layout */
                <div className="space-y-4 font-medium">
                  <p className="font-bold text-slate-900 text-sm">To Whom It May Concern,</p>
                  <p>
                    This official document is issued by <strong>{placeholders.company_name}</strong> for <strong>{placeholders.employee_name || placeholders.candidate_name || placeholders.client_name}</strong>.
                  </p>

                  <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-xs">Resolved Document Parameters</div>
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div><span className="text-slate-500">Party / Entity:</span> <strong className="text-slate-900">{placeholders.employee_name || placeholders.client_name}</strong></div>
                      <div><span className="text-slate-500">Designation / Role:</span> <strong className="text-slate-900">{placeholders.designation || 'Staff'}</strong></div>
                      <div><span className="text-slate-500">Department:</span> <strong className="text-slate-900">{placeholders.department || 'General'}</strong></div>
                      <div><span className="text-slate-500">Joining / Issue Date:</span> <strong className="text-slate-900">{placeholders.joining_date || placeholders.date}</strong></div>
                      <div><span className="text-slate-500">Company GSTIN:</span> <strong className="text-slate-900 font-mono">{placeholders.gstin}</strong></div>
                      <div><span className="text-slate-500">Company PAN:</span> <strong className="text-slate-900 font-mono">{placeholders.pan}</strong></div>
                    </div>
                  </div>

                  <p>
                    All terms, policies, and proprietary stipulations of <strong>{placeholders.company_name}</strong> remain applicable in full effect as configured under official ERP records.
                  </p>
                </div>
              ) : (
                /* Finance & Payroll Excel Template View Layout */
                <div className="space-y-4">
                  <div className="font-bold text-slate-900 text-sm border-b pb-1 flex items-center justify-between">
                    <span>{result.templateUsed || 'Financial Document'}</span>
                    <span className="text-emerald-700 font-mono text-xs">Direct Excel Spreadsheet Render</span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono text-[11px]">
                    <div className="font-bold text-slate-900 border-b pb-1 font-sans text-xs">Spreadsheet Data Grid Summary</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>Entity Name: <strong className="text-slate-900">{placeholders.client_name || placeholders.employee_name}</strong></div>
                      <div>Amount / Total: <strong className="text-emerald-700 font-bold">{placeholders.amount || placeholders.ctc || placeholders.net_pay || '₹0.00'}</strong></div>
                      <div>GSTIN: <strong className="text-slate-900">{placeholders.gstin}</strong></div>
                      <div>Invoice / Ref ID: <strong className="text-slate-900">{placeholders.invoice_number || result.fileName.replace('.pdf', '')}</strong></div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                    Excel template formatting, table structures, cell borders, and formulas are preserved directly from the uploaded spreadsheet template.
                  </div>
                </div>
              )}

              {/* Signatures & Stamp Section */}
              <div className="pt-8 grid grid-cols-2 gap-8 items-end border-t border-slate-200 mt-6">
                <div>
                  {result.stampUrl && result.stampUsed ? (
                    <div className="space-y-1">
                      <img src={result.stampUrl} alt="Stamp" className="h-20 object-contain" />
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Official Company Stamp</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">No stamp required</div>
                  )}
                </div>

                <div className="text-right space-y-1.5">
                  {result.signatureUrl ? (
                    <img src={result.signatureUrl} alt="Signature" className="h-14 object-contain ml-auto" />
                  ) : (
                    <div className="h-10 border-b border-slate-400 w-48 ml-auto"></div>
                  )}
                  <div className="font-bold text-slate-900 text-xs">{result.signatureUsed || 'Authorized Signatory'}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Type: <span className="text-emerald-700 font-bold">{result.signatureType || 'Image'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Letter Footer Image (If HR Category or letterFooterUrl present) */}
            {result.category === 'HR' || result.format === 'DOCX' || result.letterFooterUrl ? (
              <div className="border-t border-slate-200 pt-3">
                {result.letterFooterUrl ? (
                  <img src={result.letterFooterUrl} alt="Company Letter Footer Bottom" className="w-full max-h-24 object-contain" />
                ) : (
                  <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <div>{placeholders.company_name} | Enterprise HR & Document Management System</div>
                    <div className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 size={12} /> Registered in Document Center
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Finance Legal Footer */
              <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>This financial document is computer-generated from approved ERP templates.</div>
                <div className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle2 size={12} /> Registered in Document Center
                </div>
              </div>
            )}
          </div>
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
