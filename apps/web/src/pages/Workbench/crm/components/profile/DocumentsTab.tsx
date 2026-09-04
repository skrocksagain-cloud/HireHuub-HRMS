import { useState } from 'react';
import { FileText, ShieldCheck, AlertCircle, Edit2, Check, X } from 'lucide-react';
import type { Candidate, CandidateDocument } from '../../types/crm';
import { crmRepository } from '../../repositories/crmRepository';
import { useAuth } from '../../../../../context/AuthContext';
import { useClients } from '../../../Network/clients/hooks/useClients';

interface DocumentsTabProps {
  candidate: Candidate;
}

type DocType = 'Resume' | 'Aadhaar Card' | 'PAN Card' | 'Driving Licence' | 'Bank Details';

export default function DocumentsTab({ candidate }: DocumentsTabProps) {
  const { user } = useAuth();
  const { clients } = useClients();
  const [editingType, setEditingType] = useState<DocType | null>(null);
  const [formData, setFormData] = useState<Partial<CandidateDocument>>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentClient = clients.find(c => c.id === candidate.currentClientId || c.name === candidate.currentClientName);
  const resolvedClientType = (currentClient as any)?.type || (currentClient as any)?.clientType || candidate.currentPlacement?.clientType;
  
  const isPayroll = resolvedClientType === 'Payroll';
  const isOts = resolvedClientType === 'OTS';
  const docs = candidate.documents || [];

  const requiredDocTypes: DocType[] = [
    'Aadhaar Card',
    'PAN Card',
    'Driving Licence',
    'Bank Details',
  ];

  const handleEdit = (docType: DocType) => {
    const existing = docs.find((d) => d.documentType === docType);
    if (existing) {
      setFormData(existing);
    } else {
      setFormData({
        documentType: docType,
        isVerified: false,
      });
    }
    setEditingType(docType);
  };

  const handleCancel = () => {
    setEditingType(null);
    setFormData({});
    setEditingProfileField(null);
    setProfileFormData({});
  };

  const [editingProfileField, setEditingProfileField] = useState<'dob' | 'empId' | 'activeDate' | 'joiningDate' | null>(null);
  const [profileFormData, setProfileFormData] = useState<{ dateOfBirth?: string; payrollEmployeeId?: string; activeDate?: string; joiningDate?: string }>({});
  
  const handleEditProfileField = (field: 'dob' | 'empId' | 'activeDate' | 'joiningDate') => {
    setProfileFormData({
      dateOfBirth: candidate.dateOfBirth,
      payrollEmployeeId: candidate.payrollEmployeeId,
      activeDate: candidate.activeDate,
      joiningDate: candidate.joiningDate
    });
    setEditingProfileField(field);
  };

  const handleSaveProfileField = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await crmRepository.updateCandidateProfile(candidate.id, {
        ...(editingProfileField === 'dob' ? { dateOfBirth: profileFormData.dateOfBirth } : {}),
        ...(editingProfileField === 'empId' ? { payrollEmployeeId: profileFormData.payrollEmployeeId } : {}),
        ...(editingProfileField === 'activeDate' ? { activeDate: profileFormData.activeDate } : {}),
        ...(editingProfileField === 'joiningDate' ? { joiningDate: profileFormData.joiningDate } : {})
      }, { name: user.name });
      setEditingProfileField(null);
      // We assume candidate object might not update instantly in props, so we could optimistically update if needed,
      // but typical React flow will re-render when parent state updates.
    } catch (err) {
      console.error('Failed to save profile field', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (docType: DocType) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const updatedDocs = [...docs];
      const existingIdx = updatedDocs.findIndex(d => d.documentType === docType);
      
      const newDoc: CandidateDocument = {
        id: formData.id || `doc-${Date.now()}`,
        documentType: docType,
        isVerified: true,
        uploadedAt: formData.uploadedAt || new Date().toISOString(),
        documentNumber: formData.documentNumber,
        documentDetails: formData.documentDetails,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        fileName: formData.fileName,
      };

      if (existingIdx >= 0) {
        updatedDocs[existingIdx] = newDoc;
      } else {
        updatedDocs.push(newDoc);
      }

      await crmRepository.updateCandidateProfile(candidate.id, { documents: updatedDocs }, { name: user.name });
      setEditingType(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to save document details', err);
    } finally {
      setIsSaving(false);
    }
  };

  const maskSensitive = (value?: string) => {
    if (!value) return '';
    if (value.length <= 4) return '*'.repeat(value.length);
    return '*'.repeat(value.length - 4) + value.slice(-4);
  };

  const renderEditForm = (docType: DocType) => {
    return (
      <div className="space-y-3 mt-3 border-t border-slate-200/60 pt-3">
        {docType === 'Bank Details' ? (
          <>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">Account Number</label>
              <input
                type="text"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                placeholder="Enter Account Number"
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">IFSC Code</label>
              <input
                type="text"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase"
                placeholder="Enter IFSC Code"
                value={formData.ifscCode || ''}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">{docType} Number</label>
            <input
              type="text"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase"
              placeholder={`Enter ${docType} Number`}
              value={formData.documentNumber || ''}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value.toUpperCase() })}
            />
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleSave(docType)}
            disabled={isSaving}
            className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Saving...' : <><Check size={14} /> Save Details</>}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-50 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={16} className="text-emerald-600" /> Lifetime Profile Documents ({docs.length})
        </h4>
        <span className="text-[11px] text-slate-400 font-medium">Belongs to Candidate Profile — Reusable across placements</span>
      </div>

      {!isPayroll && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            Payroll document requirements are typically required after candidate becomes <strong>Active</strong> on a <strong>Payroll</strong> client.
          </span>
        </div>
      )}

      {/* Grid of Document Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {requiredDocTypes.map((docType) => {
          const existing = docs.find((d) => d.documentType === docType);
          const isEntered = !!existing;
          const isEditing = editingType === docType;

          return (
            <div
              key={docType}
              className={`p-4 rounded-2xl border transition space-y-2 ${
                isEntered ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <FileText size={14} className={isEntered ? 'text-emerald-600' : 'text-slate-400'} /> {docType}
                </span>

                {isEntered ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                    <ShieldCheck size={10} /> Status: Entered
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[10px]">
                    Status: Not Entered
                  </span>
                )}
              </div>

              {isEditing ? (
                renderEditForm(docType)
              ) : (
                <>
                  {isEntered ? (
                    <div className="space-y-1.5 text-[11px] pt-1">
                      {existing.documentNumber && (
                        <p className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-emerald-100">
                          ID: <span className="tracking-wider">{maskSensitive(existing.documentNumber)}</span>
                        </p>
                      )}
                      {existing.accountNumber && (
                        <div className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-emerald-100 space-y-0.5">
                          <div>A/C: <span className="tracking-wider">{maskSensitive(existing.accountNumber)}</span></div>
                          <div>IFSC: <span className="tracking-wider">{existing.ifscCode}</span></div>
                        </div>
                      )}
                      {existing.documentDetails && (
                        <p className="font-medium text-slate-700 bg-white px-2 py-1 rounded border border-emerald-100 line-clamp-2">
                          {existing.documentDetails}
                        </p>
                      )}
                      
                      <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 mt-2">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Saved {existing.uploadedAt ? new Date(existing.uploadedAt).toLocaleDateString() : 'recently'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEdit(docType)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 size={10} /> Edit Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400">Manual Entry Required</span>
                      <button
                        type="button"
                        onClick={() => handleEdit(docType)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 size={10} /> Enter Details
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Date of Birth Card */}
        {(isPayroll || candidate.dateOfBirth) && (
          <div className={`p-4 rounded-2xl border transition space-y-2 ${candidate.dateOfBirth ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText size={14} className={candidate.dateOfBirth ? 'text-emerald-600' : 'text-slate-400'} /> Date of Birth
              </span>
              {candidate.dateOfBirth ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck size={10} /> Status: Entered
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[10px]">
                  Status: Not Entered
                </span>
              )}
            </div>

            {editingProfileField === 'dob' ? (
              <div className="space-y-3 mt-3 border-t border-slate-200/60 pt-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    value={profileFormData.dateOfBirth || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={handleSaveProfileField} disabled={isSaving} className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                    {isSaving ? 'Saving...' : <><Check size={14} /> Save</>}
                  </button>
                  <button type="button" onClick={handleCancel} disabled={isSaving} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-50 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {candidate.dateOfBirth ? (
                  <div className="space-y-1.5 text-[11px] pt-1">
                    <p className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-emerald-100">
                      DOB: <span className="tracking-wider">{candidate.dateOfBirth}</span>
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 mt-2">
                      <button type="button" onClick={() => handleEditProfileField('dob')} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                        <Edit2 size={10} /> Edit Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">Manual Entry Required</span>
                    <button type="button" onClick={() => handleEditProfileField('dob')} className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                      <Edit2 size={10} /> Enter Details
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Employee ID Card */}
        {(isPayroll || isOts || candidate.payrollEmployeeId) && (
          <div className={`p-4 rounded-2xl border transition space-y-2 ${candidate.payrollEmployeeId ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText size={14} className={candidate.payrollEmployeeId ? 'text-emerald-600' : 'text-slate-400'} /> Employee ID
              </span>
              {candidate.payrollEmployeeId ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck size={10} /> Status: Entered
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[10px]">
                  Status: Not Entered
                </span>
              )}
            </div>

            {editingProfileField === 'empId' ? (
              <div className="space-y-3 mt-3 border-t border-slate-200/60 pt-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Employee ID</label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    value={profileFormData.payrollEmployeeId || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, payrollEmployeeId: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={handleSaveProfileField} disabled={isSaving} className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                    {isSaving ? 'Saving...' : <><Check size={14} /> Save</>}
                  </button>
                  <button type="button" onClick={handleCancel} disabled={isSaving} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-50 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {candidate.payrollEmployeeId ? (
                  <div className="space-y-1.5 text-[11px] pt-1">
                    <p className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-emerald-100">
                      ID: <span className="tracking-wider">{candidate.payrollEmployeeId}</span>
                    </p>
                    {isPayroll && (
                      <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 mt-2">
                        <button type="button" onClick={() => handleEditProfileField('empId')} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                          <Edit2 size={10} /> Edit Details
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">{isPayroll ? 'Manual Entry Required' : 'Auto Generation upon OTS confirmation'}</span>
                    {isPayroll && (
                      <button type="button" onClick={() => handleEditProfileField('empId')} className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                        <Edit2 size={10} /> Enter Details
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Active Date Card */}
        <div className={`p-4 rounded-2xl border transition space-y-2 ${candidate.activeDate ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <FileText size={14} className={candidate.activeDate ? 'text-emerald-600' : 'text-slate-400'} /> Active Date
            </span>
            {candidate.activeDate ? (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                <ShieldCheck size={10} /> Status: Entered
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[10px]">
                Status: Not Entered
              </span>
            )}
          </div>

          {editingProfileField === 'activeDate' ? (
            <div className="space-y-3 mt-3 border-t border-slate-200/60 pt-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Active Date</label>
                <input
                  type="date"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  value={profileFormData.activeDate || ''}
                  onChange={(e) => setProfileFormData({ ...profileFormData, activeDate: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={handleSaveProfileField} disabled={isSaving} className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                  {isSaving ? 'Saving...' : <><Check size={14} /> Save</>}
                </button>
                <button type="button" onClick={handleCancel} disabled={isSaving} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-50 cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {candidate.activeDate ? (
                <div className="space-y-1.5 text-[11px] pt-1">
                  <p className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-emerald-100">
                    Date: <span className="tracking-wider">{candidate.activeDate}</span>
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 mt-2">
                    <button type="button" onClick={() => handleEditProfileField('activeDate')} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                      <Edit2 size={10} /> Edit Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Manual Entry Required</span>
                  <button type="button" onClick={() => handleEditProfileField('activeDate')} className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                    <Edit2 size={10} /> Enter Details
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Joining Date Card */}
        {isOts && (
          <div className={`p-4 rounded-2xl border transition space-y-2 ${candidate.joiningDate ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-90'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText size={14} className={candidate.joiningDate ? 'text-emerald-600' : 'text-slate-400'} /> Joining Date
              </span>
              {candidate.joiningDate ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <ShieldCheck size={10} /> Status: Entered
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[10px]">
                  Status: Not Entered
                </span>
              )}
            </div>

            {editingProfileField === 'joiningDate' ? (
              <div className="space-y-3 mt-3 border-t border-slate-200/60 pt-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Joining Date</label>
                  <input
                    type="date"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    value={profileFormData.joiningDate || ''}
                    onChange={(e) => setProfileFormData({ ...profileFormData, joiningDate: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button type="button" onClick={handleSaveProfileField} disabled={isSaving} className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer">
                    {isSaving ? 'Saving...' : <><Check size={14} /> Save</>}
                  </button>
                  <button type="button" onClick={handleCancel} disabled={isSaving} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition flex items-center justify-center disabled:opacity-50 cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {candidate.joiningDate ? (
                  <div className="space-y-1.5 text-[11px] pt-1">
                    <p className="font-mono text-slate-800 bg-white px-2 py-1 rounded border border-emerald-100">
                      Date: <span className="tracking-wider">{candidate.joiningDate}</span>
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 mt-2">
                      <button type="button" onClick={() => handleEditProfileField('joiningDate')} className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                        <Edit2 size={10} /> Edit Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400">Manual Entry Required</span>
                    <button type="button" onClick={() => handleEditProfileField('joiningDate')} className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                      <Edit2 size={10} /> Enter Details
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
