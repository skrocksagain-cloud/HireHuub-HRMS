import { useState, useEffect } from 'react';
import { X, FileSpreadsheet, FileImage, CheckCircle2, Edit2, ArrowRight, ShieldCheck } from 'lucide-react';
import { clientService } from '../../Network/clients/services/clientService';
import type { Client } from '../../../../types/Client';
import type { Opening } from '../../../../types/Opening';
import { openingService } from '../services/openingService';
import NewOpeningDrawer from './NewOpeningDrawer';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: 'Excel' | 'Image';
  onImportSuccess: () => void;
}

interface ImportRow {
  tempId: string;
  title: string;
  city: string;
  state: string;
  openPositions: number;
  minSalary: number;
  maxSalary: number;
  isValid: boolean;
  validationError?: string;
  fullData: Partial<Opening>;
}

export default function ImportPreviewModal({
  isOpen,
  onClose,
  importType,
  onImportSuccess,
}: ImportPreviewModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedRows, setImportedRows] = useState<ImportRow[]>([]);
  const [validationError, setValidationError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [editingRow, setEditingRow] = useState<ImportRow | null>(null);

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await clientService.getClients();
        setClients(data);
      } catch {
        setClients([]);
      }
    }
    if (isOpen) {
      void loadClients();
      setStep(1);
      setSelectedClientId('');
      setSelectedClientName('');
      setSelectedFile(null);
      setImportedRows([]);
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    const found = clients.find((c) => c.id === cId);
    setSelectedClientName(found ? found.name : '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedClientId || !selectedFile) return;

    setValidationError('');
    try {
      if (importType !== 'Excel') throw new Error('Image import is unavailable until an OCR parser is configured.');
      const parsedRows = await openingService.excelImport.parseExcelFile(selectedFile);
      const rows = parsedRows.map((raw, index) => {
        const fullData = openingService.importMapping.mapToOpeningModel(raw);
        const error = fullData.title ? undefined : 'Title or Position is required.';
        return { tempId: `row-${index + 1}`, title: fullData.title ?? '', city: fullData.city ?? '', state: fullData.state ?? '', openPositions: fullData.openPositions ?? 0, minSalary: fullData.minSalary ?? 0, maxSalary: fullData.maxSalary ?? 0, isValid: !error, validationError: error, fullData };
      });
      setImportedRows(rows);
      setStep(2);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Unable to parse the selected file.');
    }
  };

  const handleSaveEditedRow = async (updatedData: Partial<Opening>) => {
    if (!editingRow) return;
    setImportedRows((prev) =>
      prev.map((r) =>
        r.tempId === editingRow.tempId
          ? {
              ...r,
              title: updatedData.title || r.title,
              city: updatedData.city || r.city,
              state: updatedData.state || r.state,
              openPositions: updatedData.openPositions || r.openPositions,
              minSalary: updatedData.minSalary || r.minSalary,
              maxSalary: updatedData.maxSalary || r.maxSalary,
              fullData: { ...r.fullData, ...updatedData },
            }
          : r
      )
    );
    setEditingRow(null);
  };

  const handleValidateAll = async () => {
    const result = await openingService.importValidation.validateImportData(importedRows.map((row) => ({ source: 'Excel', rawFields: { Title: row.fullData.title ?? '' } })));
    if (!result.isValid || importedRows.some((row) => !row.isValid)) { setValidationError(result.errors.join(' ') || 'Resolve invalid rows before importing.'); return; }
    setValidationError(''); setStep(3);
  };

  const handleConfirmImport = async () => {
    try {
      setIsImporting(true);
      for (const row of importedRows) {
        const mapped = row.fullData;
        await openingService.createOpening({
          clientId: mapped.clientId || selectedClientId,
          clientName: mapped.clientName || selectedClientName,
          title: mapped.title!, description: mapped.description!, location: mapped.location!, city: mapped.city!, state: mapped.state!, openPositions: mapped.openPositions!, status: mapped.status!, priority: mapped.priority!,
          isOutsourced: Boolean(mapped.isOutsourced),
          outsourcedVendor: mapped.outsourcedVendor,
          minSalary: mapped.minSalary,
          maxSalary: mapped.maxSalary,
          salaryType: mapped.salaryType,
          assignedRecruiterIds: [],
          attachments: [],
        });
      }
      onImportSuccess();
      onClose();
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl overflow-hidden text-xs">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                {importType === 'Excel' ? <FileSpreadsheet size={20} /> : <FileImage size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {importType === 'Excel' ? 'Import Openings from Excel' : 'Import Openings from Image (OCR)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Step {step} of 3: {step === 1 ? 'Select Client & File' : step === 2 ? 'Preview & Edit Records' : 'Validate & Confirm Import'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Body Step 1: Select Client & Upload File */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              {validationError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">{validationError}</div>}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Client (Client Master) *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.billingName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload {importType === 'Excel' ? 'Excel File (.xlsx, .xls, .csv)' : 'Document Image (.jpg, .png)'} *
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 p-8 rounded-2xl text-center bg-slate-50 transition cursor-pointer">
                  <input
                    type="file"
                    accept={importType === 'Excel' ? '.xlsx,.xls,.csv' : 'image/*'}
                    onChange={handleFileChange}
                    className="w-full"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedClientId || !selectedFile}
                  onClick={handleProcessFile}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl inline-flex items-center gap-2"
                >
                  <span>Process File</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Body Step 2: Preview & Edit */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Extracted {importedRows.length} Opening Records for <strong className="text-slate-900">{selectedClientName}</strong>
                </span>
                <span className="text-[11px] text-slate-500">Click edit icon to adjust row details in drawer</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Position Title</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Positions</th>
                      <th className="p-3">Salary Range</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importedRows.map((row) => (
                      <tr key={row.tempId} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{row.title}</td>
                        <td className="p-3 text-slate-600">{row.city}, {row.state}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.openPositions}</td>
                        <td className="p-3 text-slate-700">₹{row.minSalary} - ₹{row.maxSalary}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingRow(row)}
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-semibold"
                            title="Edit row using New Opening Drawer"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleValidateAll}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl inline-flex items-center gap-2"
                >
                  <span>Validate & Proceed</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Body Step 3: Validate & Import */}
          {step === 3 && (
            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Validation Successful</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    All {importedRows.length} extracted openings have passed structure validation and are ready to be imported into Client Master ({selectedClientName}).
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(2)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl">
                  Back to Preview
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleConfirmImport}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {isImporting ? 'Importing Openings…' : `Confirm & Import ${importedRows.length} Openings`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingRow && (
        <NewOpeningDrawer
          isOpen={Boolean(editingRow)}
          onClose={() => setEditingRow(null)}
          onSubmit={handleSaveEditedRow}
          initialData={editingRow.fullData}
          mode="edit"
        />
      )}
    </>
  );
}
