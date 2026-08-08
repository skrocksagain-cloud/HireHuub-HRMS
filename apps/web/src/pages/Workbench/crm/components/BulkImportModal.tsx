import { useState } from 'react';
import { X, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, History, ArrowRight } from 'lucide-react';
import type { BulkImportRow, MainSourceCategory, JobPortalOption, SocialMediaOption, ImportHistoryItem } from '../types/crm';
import { crmRepository } from '../repositories/crmRepository';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCandidates: Array<{ name: string; phone: string; area: string; city: string; role: string }>) => void;
  userRole: string;
  importHistory: ImportHistoryItem[];
  userSession: { id: string; name: string };
}

const MOCK_PREVIEW_DATA: BulkImportRow[] = [
  {
    name: 'Vikas Deshmukh',
    phone: '9822114455',
    area: 'Chinchwad',
    city: 'Pune',
    role: 'Warehouse Executive',
    isValid: true,
    validationErrors: [],
    isDuplicate: false,
  },
  {
    name: 'Sneha Kulkarni',
    phone: '9876543210', // Duplicate phone from Ramesh Kumar
    area: 'Kothrud',
    city: 'Pune',
    role: 'Customer Care',
    isValid: false,
    validationErrors: ['Duplicate Mobile Number (Phone already registered)'],
    isDuplicate: true,
  },
  {
    name: 'Anil Jadhav',
    phone: '99112233', // Invalid phone
    area: 'Hadapsar',
    city: 'Pune',
    role: 'Delivery Boy',
    isValid: false,
    validationErrors: ['Invalid Mobile Number (Must be 10 digits)'],
    isDuplicate: false,
  },
  {
    name: 'Meena Bhosale',
    phone: '9733445566',
    area: 'Viman Nagar',
    city: 'Pune',
    role: 'Supervisor',
    isValid: true,
    validationErrors: [],
    isDuplicate: false,
  },
];

export default function BulkImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  userRole,
  importHistory,
  userSession,
}: BulkImportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');
  const [step, setStep] = useState<number>(1); // 1: Upload, 2: Preview & Source Assignment
  const [file, setFile] = useState<File | null>(null);
  const [rows] = useState<BulkImportRow[]>(MOCK_PREVIEW_DATA);

  // Source Assignment for file
  const [sourceCategory, setSourceCategory] = useState<MainSourceCategory>('Job Portal');
  const [jobPortalOption, setJobPortalOption] = useState<JobPortalOption>('Apna');
  const [socialOption, setSocialOption] = useState<SocialMediaOption>('Facebook');
  const [customDetailText, setCustomDetailText] = useState('');

  const isTLOrAbove = ['Team Leader', 'Manager', 'Admin', 'Staffing', 'Super Admin'].includes(userRole);

  if (!isOpen) return null;

  // Handle template download
  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Candidate Name,Mobile Number,Area,City,Role\nJohn Doe,9876543210,Warje,Pune,Warehouse Executive\nJane Smith,9812345678,Peenya,Bengaluru,Delivery Supervisor';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'HireHuub_Candidate_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep(2); // Move to Preview & Validation step
    }
  };

  const handleExecuteImport = async () => {
    const validRows = rows.filter((r) => r.isValid && !r.isDuplicate);
    for (const r of validRows) {
      await crmRepository.createCandidate(
        {
          name: r.name,
          phone: r.phone,
          area: r.area,
          city: r.city,
          role: r.role,
          source: {
            category: sourceCategory,
            detailOption: sourceCategory === 'Job Portal' ? jobPortalOption : sourceCategory === 'Social Media' ? socialOption : undefined,
            detailText: customDetailText || undefined,
          },
        },
        userSession
      );
    }

    // Record import history log
    await crmRepository.addImportHistory({
      fileName: file?.name || 'Import_Leads.xlsx',
      importedCount: validRows.length,
      failedCount: rows.length - validRows.length,
      importedBy: userSession.name,
      source: { category: sourceCategory },
    });

    onImportSuccess(validRows);
    onClose();
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
            {/* Download Template Bar */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900 text-xs">Download Standard Import Template</p>
                <p className="text-emerald-700 text-[11px]">
                  Columns required: Candidate Name, Mobile Number, Area, City, Role. (Source and Assignment are selected below).
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
                <p className="text-slate-500 text-xs mt-1">Drag and drop your file here, or click to browse</p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
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
                          placeholder="e.g. Pune Campaign"
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    )}
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

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Mobile</th>
                          <th className="p-2.5">Area</th>
                          <th className="p-2.5">City</th>
                          <th className="p-2.5">Role</th>
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
                            <td className="p-2.5">{row.area}</td>
                            <td className="p-2.5">{row.city}</td>
                            <td className="p-2.5">{row.role}</td>
                            <td className="p-2.5 text-[11px] text-red-600">
                              {row.validationErrors.join(', ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
              onClick={handleExecuteImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              Execute Bulk Import <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
