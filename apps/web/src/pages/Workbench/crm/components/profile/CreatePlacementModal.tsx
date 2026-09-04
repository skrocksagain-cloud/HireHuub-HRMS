import { useState, useEffect } from 'react';
import { X, Check, Building2, AlertCircle } from 'lucide-react';
import type { Candidate } from '../../types/crm';
import type { Client } from '../../../../../types/Client';
import type { CreatePlacementInput } from '../../../workforce/types/placement';
import { placementService } from '../../../workforce/services/placementService';

interface CreatePlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  clients: Client[];
}

export default function CreatePlacementModal({
  isOpen,
  onClose,
  candidate,
  clients,
}: CreatePlacementModalProps) {
  const [clientId, setClientId] = useState('');
  const [activeDate, setActiveDate] = useState('');
  
  // Payroll fields
  const [payrollEmployeeId, setPayrollEmployeeId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClientId('');
      setActiveDate(new Date().toISOString().split('T')[0]);
      setPayrollEmployeeId('');
      setDateOfBirth(candidate.dateOfBirth || '');
      setAadhaarNumber('');
      setPanNumber('');
      setBankAccountNumber('');
      setIfscCode('');
      setFormError(null);
    }
  }, [isOpen, candidate]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);
  const isPayroll = selectedClient?.type === 'Payroll';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedClient) {
      setFormError('Please select a client.');
      return;
    }

    const input: CreatePlacementInput = {
      candidateId: candidate.id,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientType: selectedClient.type as 'Payroll' | 'OTS',
      activeDate,
      ...(isPayroll && {
        payrollEmployeeId,
        dateOfBirth,
        aadhaarNumber,
        panNumber,
        bankAccountNumber,
        ifscCode,
      }),
    };

    try {
      setIsSubmitting(true);
      await placementService.placeCandidate(input);
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create placement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-full overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-800">Place Candidate</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
            >
              <option value="">Choose Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type || 'OTS'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Active / Joining Date *</label>
            <input
              type="date"
              required
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
            />
          </div>

          {isPayroll && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4 mt-2">
              <h5 className="font-bold text-xs text-indigo-900 uppercase tracking-wider">Payroll KYC Details</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payroll Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={payrollEmployeeId}
                    onChange={(e) => setPayrollEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-1234"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="12 digits"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9-18 digits"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Check size={16} /> {isSubmitting ? 'Placing...' : 'Place Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
