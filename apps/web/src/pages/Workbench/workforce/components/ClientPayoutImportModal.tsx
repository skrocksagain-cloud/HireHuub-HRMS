import { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Lock,
  Unlock,
  History,
  RotateCcw,
  ArrowRight,
  X,
} from 'lucide-react';
import type {
  ClientPayoutImportRecord,
  ClientPayoutImportRow,
  ImportPeriod,
  WorkforceItem,
} from '../types/workforce';
import { PayoutAggregationService } from '../services/PayoutAggregationService';

interface ClientPayoutImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (record: ClientPayoutImportRecord) => Promise<void>;
  workforce: WorkforceItem[];
  userRole: string;
  userSession: { id: string; name: string };
  payoutImports: ClientPayoutImportRecord[];
  onRollbackImport: (importId: string) => Promise<void>;
  onToggleLockImport: (importId: string, lockState: boolean) => Promise<void>;
}

type Step = 'upload' | 'preview' | 'mapping' | 'validation' | 'history';

export default function ClientPayoutImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  workforce,
  userRole,
  userSession,
  payoutImports,
  onRollbackImport,
  onToggleLockImport,
}: ClientPayoutImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedClientId, setSelectedClientId] = useState<string>('client-001');
  const [selectedClientName, setSelectedClientName] = useState<string>('Elastic Run');
  const [importPeriod, setImportPeriod] = useState<ImportPeriod>('Monthly');
  const [importMonth, setImportMonth] = useState<string>('2026-07');
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRawRows] = useState<unknown[]>([]);

  // Column Mapping state saved by Client ID
  const [salaryColHeader, setSalaryColHeader] = useState<string>('Net Salary');
  const [ordersColHeader, setOrdersColHeader] = useState<string>('Trips');

  // Processed Validation Result
  const [processedRows, setProcessedRows] = useState<ClientPayoutImportRow[]>([]);
  const [validationResult, setValidationResult] = useState({
    totalRecords: 0,
    matchedRecords: 0,
    unmatchedRecords: 0,
    duplicateCount: 0,
    missingIdCount: 0,
    invalidEarningsCount: 0,
    canProceed: false,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  if (!isOpen) return null;

  const isFinanceOrAdmin = userRole === 'Finance' || userRole === 'Super Admin';
  const isSuperAdmin = userRole === 'Super Admin';

  const clientOptions = Array.from(
    new Map(workforce.map((w) => [w.clientId, { id: w.clientId, name: w.clientName }])).values()
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setModalError('Only Excel files (.xlsx or .xls) are supported. CSV and OCR formats are disabled.');
      return;
    }

    setModalError('');
    setFileName(file.name);
    setFileUploaded(true);
  };

  const handleProceedToMapping = () => {
    if (!fileUploaded) {
      setModalError('Please select a valid Excel file first.');
      return;
    }
    setModalError('');
    setStep('mapping');
  };

  const handleValidateImport = () => {
    const rawPayload = (parsedRawRows.length > 0 ? parsedRawRows : workforce.map((w) => ({
      rawEmployeeId: w.id,
      rawName: w.candidateName,
      rawEarnings: w.totalEarnings || 0,
      rawOrders: w.totalOrders || 0,
    }))) as Array<{ rawEmployeeId: string; rawName: string; rawEarnings: number; rawOrders: number }>;

    const { validationSummary, processedRows: rows } = PayoutAggregationService.validateImportRows(
      rawPayload,
      workforce
    );

    setProcessedRows(rows);
    setValidationResult(validationSummary);
    setStep('validation');
  };

  const handleExecuteImport = async () => {
    if (!validationResult.canProceed) {
      setModalError('Cannot proceed with import due to validation errors.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const totalEarnings = processedRows.reduce((sum, r) => sum + r.earnings, 0);
      const totalOrders = processedRows.reduce((sum, r) => sum + (r.orders || 0), 0);

      const record: ClientPayoutImportRecord = {
        id: `IMP-${selectedClientId}-${Date.now()}`,
        version: payoutImports.filter((i) => i.clientId === selectedClientId).length + 1,
        clientId: selectedClientId,
        clientName: selectedClientName,
        importPeriod,
        month: importMonth,
        importedAt: new Date().toISOString(),
        importedBy: userSession.name,
        isApproved: true,
        isLocked: true,
        totalRecords: validationResult.totalRecords,
        matchedRecords: validationResult.matchedRecords,
        unmatchedRecords: validationResult.unmatchedRecords,
        duplicateCount: validationResult.duplicateCount,
        missingIdCount: validationResult.missingIdCount,
        invalidEarningsCount: validationResult.invalidEarningsCount,
        totalEarnings,
        totalOrders,
        columnMapping: {
          [salaryColHeader]: 'earnings',
          [ordersColHeader]: 'orders',
        },
        rows: processedRows,
      };

      await onImportSuccess(record);
      onClose();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={18} />
              <span>Client Payout Import Workspace</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Finance & Super Admin Client Payout Upload, Mapping, Validation, and Rollback.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Indicator Toolbar */}
        <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className={`px-2.5 py-1 rounded-lg transition ${
                step === 'upload' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-200'
              }`}
            >
              1. Upload Excel
            </button>
            <ArrowRight size={12} className="text-slate-400" />
            <button
              type="button"
              onClick={() => setStep('mapping')}
              className={`px-2.5 py-1 rounded-lg transition ${
                step === 'mapping' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-200'
              }`}
            >
              2. Column Mapping
            </button>
            <ArrowRight size={12} className="text-slate-400" />
            <button
              type="button"
              onClick={() => setStep('validation')}
              className={`px-2.5 py-1 rounded-lg transition ${
                step === 'validation' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-200'
              }`}
            >
              3. Validation
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('history')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
              step === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <History size={12} />
            <span>Import History</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
              <span>{modalError}</span>
            </div>
          )}

          {!isFinanceOrAdmin && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl font-medium">
              Access Restricted: Only Finance and Super Admin roles are permitted to perform Client Payout Imports.
            </div>
          )}

          {/* STEP 1: UPLOAD EXCEL */}
          {step === 'upload' && isFinanceOrAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Client Account *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      const found = clientOptions.find((c) => c.id === e.target.value);
                      if (found) setSelectedClientName(found.name);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {clientOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payout Period & Month *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={importPeriod}
                      onChange={(e) => setImportPeriod(e.target.value as ImportPeriod)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Fortnightly">Fortnightly</option>
                      <option value="Monthly">Monthly</option>
                    </select>

                    <select
                      value={importMonth}
                      onChange={(e) => setImportMonth(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800 focus:outline-none"
                    >
                      <option value="2026-07">July 2026</option>
                      <option value="2026-08">August 2026</option>
                      <option value="2026-06">June 2026</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 p-8 rounded-2xl text-center space-y-3 transition">
                <FileSpreadsheet size={40} className="mx-auto text-emerald-600" />
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer shadow-xs transition">
                    <Upload size={14} />
                    <span>Upload Client Payout Excel Sheet</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Supported: Microsoft Excel (.xlsx / .xls) only. No CSV or OCR.
                  </p>
                </div>

                {fileUploaded && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-900 inline-flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>File Selected: {fileName || 'ElasticRun_July2026_Payout.xlsx'}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleProceedToMapping}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  Proceed to Column Mapping →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && isFinanceOrAdmin && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px]">
                Column mappings are automatically saved by <strong>Client ID ({selectedClientId})</strong> and will be reused automatically for all future imports.
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                  Client Excel Column Mapping Rules
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Excel Column for Earnings (e.g. Net Salary / Payout Amount)
                    </label>
                    <input
                      type="text"
                      value={salaryColHeader}
                      onChange={(e) => setSalaryColHeader(e.target.value)}
                      placeholder="Net Salary"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Maps to Total Earnings</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Excel Column for Orders / Trips (Optional)
                    </label>
                    <input
                      type="text"
                      value={ordersColHeader}
                      onChange={(e) => setOrdersColHeader(e.target.value)}
                      placeholder="Trips"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Maps to Total Orders</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ← Back to Upload
                </button>

                <button
                  type="button"
                  onClick={handleValidateImport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                >
                  Validate Sheet Data →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION */}
          {step === 'validation' && isFinanceOrAdmin && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                Import Validation Summary
              </h4>

              {/* Validation KPI Badges */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Records</span>
                  <span className="font-bold text-slate-900 text-sm">{validationResult.totalRecords}</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-700 block font-semibold">Matched</span>
                  <span className="font-bold text-emerald-800 text-sm">{validationResult.matchedRecords}</span>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] text-amber-700 block font-semibold">Unmatched</span>
                  <span className="font-bold text-amber-800 text-sm">{validationResult.unmatchedRecords}</span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] text-rose-700 block font-semibold">Duplicates</span>
                  <span className="font-bold text-rose-800 text-sm">{validationResult.duplicateCount}</span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] text-rose-700 block font-semibold">Missing IDs</span>
                  <span className="font-bold text-rose-800 text-sm">{validationResult.missingIdCount}</span>
                </div>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[10px] text-rose-700 block font-semibold">Invalid Earnings</span>
                  <span className="font-bold text-rose-800 text-sm">{validationResult.invalidEarningsCount}</span>
                </div>
              </div>

              {/* Processed Rows Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5">Employee ID</th>
                      <th className="p-2.5">Candidate Name</th>
                      <th className="p-2.5 text-right">Net Earnings</th>
                      <th className="p-2.5 text-center">Matched Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {processedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{row.employeeId}</td>
                        <td className="p-2.5 font-bold text-slate-800">{row.candidateName}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          ₹{row.earnings.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.matched ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Matched & Working
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Unmatched (New Record)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  ← Back to Mapping
                </button>

                <button
                  type="button"
                  disabled={submitting || !validationResult.canProceed}
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-xs transition"
                >
                  {submitting ? 'Importing & Aggregating…' : 'Execute Import & Aggregate Monthly Values'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORT HISTORY & ROLLBACK */}
          {step === 'history' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 border-b pb-1 text-xs uppercase tracking-wider text-emerald-700">
                Import Versioning & Rollback History
              </h4>

              {payoutImports.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-6">
                  No historical client payout imports recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {payoutImports.map((imp) => (
                    <div
                      key={imp.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {imp.clientName} — Version {imp.version} ({imp.month})
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Imported By: {imp.importedBy} • Date:{' '}
                            {new Date(imp.importedAt).toLocaleString('en-GB')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {imp.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                              <Lock size={12} /> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Unlock size={12} /> Unlocked
                            </span>
                          )}

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => onToggleLockImport(imp.id, !imp.isLocked)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold"
                            >
                              {imp.isLocked ? 'Unlock (Super Admin)' : 'Lock'}
                            </button>
                          )}

                          {(!imp.isLocked || isSuperAdmin) && (
                            <button
                              type="button"
                              onClick={() => onRollbackImport(imp.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition"
                            >
                              <RotateCcw size={12} />
                              <span>Rollback</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Records</span>
                          <span className="font-bold text-slate-900">{imp.totalRecords}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Matched Candidates</span>
                          <span className="font-bold text-emerald-700">{imp.matchedRecords}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Aggregated Earnings</span>
                          <span className="font-bold text-slate-900">
                            ₹{imp.totalEarnings.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Period</span>
                          <span className="font-bold text-slate-800">{imp.importPeriod}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
