import { useState } from 'react';
import { X, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, History, ArrowRight } from 'lucide-react';
import ExcelJS from 'exceljs';
import type { BulkImportRow, MainSourceCategory, JobPortalOption, SocialMediaOption, ImportHistoryItem } from '../types/crm';
import { crmRepository } from '../repositories/crmRepository';
import { crmService } from '../services/crmService';
import type { Employee } from '../../../Employee/types/Employee';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCandidates: Array<{ name: string; phone: string; area: string; city: string; role: string }>) => void;
  userRole: string;
  importHistory: ImportHistoryItem[];
  userSession: { id: string; name: string; role: string };
  userAssignedRole?: string;
  assignableEmployees?: Employee[];
}

import { getAuthorizationScope } from '../../../../core/authorization/authorizationResolver';

export default function BulkImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  userRole,
  userAssignedRole,
  importHistory,
  userSession,
  assignableEmployees = [],
}: BulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [step, setStep] = useState<number>(1); // 1: Upload, 2: Preview & Source Assignment
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Source Assignment for file
  const [sourceCategory, setSourceCategory] = useState<MainSourceCategory>('Job Portal');
  const [jobPortalOption, setJobPortalOption] = useState<JobPortalOption | ''>('');
  const [socialOption, setSocialOption] = useState<SocialMediaOption | ''>('');
  const [customDetailText, setCustomDetailText] = useState('');

  // Manual Role & Assignment for the entire batch
  const [manualRoleInput, setManualRoleInput] = useState('');
  const [manualRoleSuggestion, setManualRoleSuggestion] = useState<string | undefined>();
  const [assignedRecruiterId, setAssignedRecruiterId] = useState<string>('');
  const [assignedRecruiterName, setAssignedRecruiterName] = useState<string>('');
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('');

  const scope = getAuthorizationScope(userAssignedRole || userRole);
  const isTLOrAbove = scope !== 'OWN';

  if (!isOpen) return null;

  const handleRoleChange = (val: string) => {
    setManualRoleInput(val);
    const { suggestedRole } = crmService.normalizeRoleInput(val);
    setManualRoleSuggestion(suggestedRole);
  };

  const acceptRoleSuggestion = () => {
    if (manualRoleSuggestion) {
      setManualRoleInput(manualRoleSuggestion);
      setManualRoleSuggestion(undefined);
    }
  };

  // Handle template download
  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Candidate Name,Mobile Number,City,Area\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Candidate_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVText = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((line) => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    });
  };

  const parseFileContent = async (uploadedFile: File): Promise<BulkImportRow[]> => {
    const fileNameLower = uploadedFile.name.toLowerCase();
    const parsedRawRows: any[] = [];

    if (fileNameLower.endsWith('.csv')) {
      const text = await uploadedFile.text();
      const csvRows = parseCSVText(text);
      if (csvRows.length < 2) throw new Error('File appears to be empty or missing data rows.');
      const headers = csvRows[0].map((h) => h.toLowerCase());
      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const phoneIdx = headers.findIndex((h) => h.includes('mobile') || h.includes('phone') || h.includes('number'));
      const areaIdx = headers.findIndex((h) => h.includes('area') || h.includes('locality'));
      const cityIdx = headers.findIndex((h) => h.includes('city'));

      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i];
        const name = (nameIdx !== -1 ? row[nameIdx] : row[0]) || '';
        const phone = (phoneIdx !== -1 ? row[phoneIdx] : row[1]) || '';
        const city = (cityIdx !== -1 ? row[cityIdx] : row[2]) || '';
        const area = (areaIdx !== -1 ? row[areaIdx] : row[3]) || '';
        if (name || phone || area || city) {
          parsedRawRows.push({ name, phone, area, city, role: '', assignedRecruiterName: '' });
        }
      }
    } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await uploadedFile.arrayBuffer());
      const worksheet = workbook.worksheets[0];
      if (!worksheet || worksheet.rowCount < 2) {
        throw new Error('Unable to parse uploaded file.');
      }
      const headers: string[] = [];
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
        headers[columnNumber - 1] = cell.text.trim().toLowerCase();
      });

      const nameIdx = headers.findIndex((h) => h.includes('name'));
      const phoneIdx = headers.findIndex((h) => h.includes('mobile') || h.includes('phone') || h.includes('number'));
      const areaIdx = headers.findIndex((h) => h.includes('area') || h.includes('locality'));
      const cityIdx = headers.findIndex((h) => h.includes('city'));

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const getCellVal = (idx: number, defaultIdx: number) => {
          const colNumber = idx !== -1 ? idx + 1 : defaultIdx + 1;
          return row.getCell(colNumber).text.trim();
        };
        const name = getCellVal(nameIdx, 0);
        const phone = getCellVal(phoneIdx, 1);
        const city = getCellVal(cityIdx, 2);
        const area = getCellVal(areaIdx, 3);

        if (name || phone || area || city) {
          parsedRawRows.push({ name, phone, area, city, role: '', assignedRecruiterName: '' });
        }
      });
    } else {
      throw new Error('Unable to parse uploaded file.');
    }

    const validatedRows: BulkImportRow[] = [];
    const seenPhones = new Set<string>();

    for (const r of parsedRawRows) {
      const validationErrors: string[] = [];
      if (!r.name.trim()) validationErrors.push('Name is required');
      const cleanPhone = r.phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10) validationErrors.push('Valid 10-digit phone number is required');
      if (!r.area.trim()) validationErrors.push('Area is required');
      if (!r.city.trim()) validationErrors.push('City is required');

      let isDuplicate = false;
      if (cleanPhone.length >= 10) {
        if (seenPhones.has(cleanPhone)) {
          isDuplicate = true;
          validationErrors.push('Duplicate inside this file');
        } else {
          seenPhones.add(cleanPhone);
          const dupCheck = await crmService.checkDuplicatePhone(cleanPhone, userSession);
          isDuplicate = dupCheck.isDuplicate;
          if (isDuplicate) {
            if (dupCheck.isRestrictedView) {
              validationErrors.push(`Candidate with this mobile is already assigned to a different team mate`);
            } else {
              validationErrors.push(`Candidate ${dupCheck.existingCandidate?.name} is already assigned to ${dupCheck.existingCandidate?.assignedRecruiterName}`);
            }
          }
        }
      }

      validatedRows.push({
        name: r.name.trim(),
        phone: cleanPhone || r.phone.trim(),
        area: r.area.trim(),
        city: r.city.trim(),
        role: '',
        assignedRecruiterName: undefined,
        isValid: validationErrors.length === 0,
        validationErrors,
        isDuplicate,
      });
    }

    return validatedRows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsParsing(true);
      try {
        const parsed = await parseFileContent(selectedFile);
        setRows(parsed);
        setStep(2);
      } catch (err: unknown) {
        const msg = err instanceof Error && err.message ? err.message : 'Unable to parse uploaded file.';
        setParseError(msg.includes('Unable to parse') ? 'Unable to parse uploaded file.' : msg);
        setRows([]);
        setStep(1);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleExecuteImport = async () => {
    if (!manualRoleInput.trim()) {
      setParseError('Please specify a role for this batch.');
      return;
    }
    const { normalizedRole } = crmService.normalizeRoleInput(manualRoleInput);

    setIsExecuting(true);
    try {
      const validRows = rows.filter((r) => r.isValid && !r.isDuplicate);
      for (const r of validRows) {
        await crmRepository.createCandidate(
          {
            name: r.name,
            phone: r.phone,
            area: r.area,
            city: r.city,
            role: normalizedRole,
            source: {
              category: sourceCategory,
              detailOption: sourceCategory === 'Job Portal' ? (jobPortalOption || undefined) : sourceCategory === 'Social Media' ? (socialOption || undefined) : undefined,
              detailText: customDetailText || undefined,
            },
            assignedRecruiterId: assignedRecruiterId || null,
            assignedRecruiterName: assignedRecruiterName || null,
            targetTeamId: targetTeamId || null,
            targetDepartmentId: targetDepartmentId || null,
          },
          userSession
        );
      }

      await crmRepository.addImportHistory({
        fileName: file?.name || 'Import_Leads.csv',
        importedCount: validRows.length,
        failedCount: rows.length - validRows.length,
        importedBy: userSession.name,
        source: { category: sourceCategory },
      });

      onImportSuccess(validRows);
      onClose();
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={22} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Bulk Candidate Import</h3>
              <p className="text-[11px] text-slate-500">Import Excel (.xlsx) or CSV files directly into CRM Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isTLOrAbove && (
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  className={`px-3 py-1 font-semibold rounded-md transition cursor-pointer ${
                    activeTab === 'import' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Import File
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1 font-semibold rounded-md transition cursor-pointer ${
                    activeTab === 'history' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Import History
                </button>
              </div>
            )}
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {activeTab === 'import' ? (
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {parseError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" /> {parseError}
              </div>
            )}

            {/* Download Template Bar */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900 text-xs">Download Standard Import Template</p>
                <p className="text-emerald-700 text-[11px]">
                  Columns required: Candidate Name, Mobile Number, City, Area, Role.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download size={14} /> Download Template
              </button>
            </div>

            {step === 1 && (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-emerald-500 transition bg-slate-50/50">
                <FileSpreadsheet size={40} className="mx-auto text-slate-400 mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Upload Excel or CSV File</h4>
                <p className="text-slate-500 text-xs mt-1">
                  {isParsing ? 'Parsing uploaded file...' : 'Drag and drop your file here, or click to browse'}
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  disabled={isParsing}
                  onChange={handleFileChange}
                  className="mt-4 text-xs mx-auto block cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Source Selection for Uploaded File */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Select Candidate Source for File Leads
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Source Category *</label>
                      <select
                        value={sourceCategory}
                        onChange={(e) => setSourceCategory(e.target.value as MainSourceCategory)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="Job Portal">Job Portal</option>
                        <option value="Reference">Reference</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Advertisement">Advertisement</option>
                        <option value="Enquiry">Enquiry</option>
                        <option value="Marketing Activity">Marketing Activity</option>
                      </select>
                    </div>

                    {sourceCategory === 'Job Portal' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Details</label>
                        <select
                          value={jobPortalOption}
                          onChange={(e) => setJobPortalOption(e.target.value as JobPortalOption)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                        >
                          <option value="" disabled>Select Portal</option>
                          <option value="Apna">Apna</option>
                          <option value="WorkIndia">WorkIndia</option>
                          <option value="Indeed">Indeed</option>
                          <option value="Naukri">Naukri</option>
                          <option value="Foundit">Foundit</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    )}

                    {sourceCategory === 'Social Media' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Social Details</label>
                        <select
                          value={socialOption}
                          onChange={(e) => setSocialOption(e.target.value as SocialMediaOption)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                        >
                          <option value="" disabled>Select Channel</option>
                          <option value="Facebook">Facebook</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Telegram">Telegram</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    )}

                    {(sourceCategory === 'Reference' || sourceCategory === 'Advertisement') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Source Name / Campaign</label>
                        <input
                          type="text"
                          value={customDetailText}
                          onChange={(e) => setCustomDetailText(e.target.value)}
                          placeholder="Source or Campaign Name"
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-4">
                  <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-2">
                    2. Role & Assignment
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Smart Free Text Role */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Position *</label>
                      <input
                        type="text"
                        required
                        value={manualRoleInput}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        placeholder="e.g. Delivery Executive"
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      {manualRoleSuggestion && (
                        <div className="absolute left-0 mt-1 z-10 w-full bg-white border border-slate-200 shadow-lg rounded-xl p-2 text-xs flex items-center justify-between">
                          <span className="text-slate-600 truncate">Did you mean <strong className="text-emerald-700">{manualRoleSuggestion}</strong>?</span>
                          <button
                            type="button"
                            onClick={acceptRoleSuggestion}
                            className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-semibold hover:bg-emerald-100 whitespace-nowrap ml-2"
                          >
                            Accept
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Assigned Recruiter <span className="text-slate-400 font-normal ml-1">(Optional &mdash; if left blank, assigned to you)</span>
                      </label>
                      {!isTLOrAbove ? (
                        <input
                          type="text"
                          disabled
                          value={`${userSession.name} (Auto-assigned to self)`}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-600 font-medium"
                        />
                      ) : assignableEmployees.length === 0 ? (
                        <div className="text-xs text-slate-500 italic p-2.5 bg-white border border-slate-200 rounded-xl">
                          No records available.
                        </div>
                      ) : (
                        <select
                          value={assignedRecruiterId || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setAssignedRecruiterId('');
                              setAssignedRecruiterName('');
                              setTargetTeamId('');
                              setTargetDepartmentId('');
                              return;
                            }
                            const emp = assignableEmployees.find((e) => (e.employeeId || e.id) === val);
                            if (emp) {
                              setAssignedRecruiterId(val);
                              setAssignedRecruiterName(emp.fullName || '');
                              setTargetTeamId((emp as any).teamId || '');
                              setTargetDepartmentId((emp.departmentId || emp.department) || '');
                            }
                          }}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Leave blank (assign to me)</option>
                          {assignableEmployees.map((emp) => (
                            <option key={emp.id || emp.employeeId} value={emp.employeeId || emp.id}>
                              {emp.fullName} ({emp.designation || emp.department || 'Staffing'})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview & Validation Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 text-xs">File Data Preview & Validation</h4>
                    <span className="text-xs text-slate-500">
                      Valid: <strong className="text-emerald-700">{rows.filter((r) => r.isValid && !r.isDuplicate).length}</strong> / Error: <strong className="text-red-600">{rows.filter((r) => !r.isValid || r.isDuplicate).length}</strong>
                    </span>
                  </div>

                  {rows.length === 0 ? (
                    <div className="p-8 text-center border border-slate-200 rounded-xl text-xs text-slate-500 font-medium bg-slate-50">
                      No records found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Mobile</th>
                            <th className="p-2.5">City</th>
                            <th className="p-2.5">Area</th>
                            <th className="p-2.5">Validation Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rows.map((row, idx) => (
                            <tr key={idx} className={row.isValid && !row.isDuplicate ? 'bg-white' : 'bg-red-50/40'}>
                              <td className="p-2.5">
                                {row.isValid && !row.isDuplicate ? (
                                  <CheckCircle2 size={16} className="text-emerald-600" />
                                ) : (
                                  <AlertTriangle size={16} className="text-red-600" />
                                )}
                              </td>
                              <td className="p-2.5 font-semibold">{row.name}</td>
                              <td className="p-2.5 font-mono">{row.phone}</td>
                              <td className="p-2.5">{row.city}</td>
                              <td className="p-2.5">{row.area}</td>
                              <td className="p-2.5 text-[11px] text-red-600">
                                {row.validationErrors.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Import History Tab */
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <History size={16} className="text-emerald-600" /> System Import History Log
            </h4>

            {importHistory.length === 0 ? (
              <div className="p-8 text-center border border-slate-200 rounded-xl text-xs text-slate-500 font-medium bg-slate-50">
                No records found.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-3">File Name</th>
                      <th className="p-3">Imported By</th>
                      <th className="p-3">Imported Count</th>
                      <th className="p-3">Failed Count</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-semibold text-slate-800">{item.fileName}</td>
                        <td className="p-3">{item.importedBy}</td>
                        <td className="p-3 font-bold text-emerald-700">{item.importedCount}</td>
                        <td className="p-3 font-bold text-red-600">{item.failedCount}</td>
                        <td className="p-3 text-slate-400 font-mono">{new Date(item.importedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          {activeTab === 'import' && step === 2 && (
            <button
              type="button"
              disabled={isExecuting || rows.filter((r) => r.isValid && !r.isDuplicate).length === 0}
              onClick={handleExecuteImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isExecuting ? 'Importing...' : 'Execute Bulk Import'} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

