import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import type { WorkforceItem, WorkforceType } from '../types/workforce';

interface ClientTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WorkforceItem | null;
  onExecuteTransfer: (
    id: string,
    lastWorkingDate: string,
    newClientId: string,
    newClientName: string,
    newClientType: WorkforceType,
    newActiveDate: string,
    payrollEmployeeId?: string,
    dateOfBirth?: string,
    aadhaarNumber?: string,
    panNumber?: string,
    bankAccountNumber?: string,
    ifscCode?: string
  ) => Promise<void>;
}

export default function ClientTransferModal({
  isOpen,
  onClose,
  item,
  onExecuteTransfer,
}: ClientTransferModalProps) {
  const [lastWorkingDate, setLastWorkingDate] = useState<string>('');
  const [newClientId, setNewClientId] = useState<string>('client-002');
  const [newClientName, setNewClientName] = useState<string>('Acme Tech');
  const [newClientType, setNewClientType] = useState<WorkforceType>('Payroll');
  const [activeDate, setActiveDate] = useState<string>('');
  
  // Payroll fields
  const [payrollEmployeeId, setPayrollEmployeeId] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!lastWorkingDate) throw new Error('Last working date for the current placement is required.');
      if (new Date(lastWorkingDate) < new Date(item.activeDate)) {
        throw new Error('Last working date cannot be before current active date.');
      }
      if (!activeDate) throw new Error('New active date is required.');

      await onExecuteTransfer(
        item.id,
        lastWorkingDate,
        newClientId,
        newClientName,
        newClientType,
        activeDate,
        payrollEmployeeId,
        dateOfBirth,
        aadhaarNumber,
        panNumber,
        bankAccountNumber,
        ifscCode
      );
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Client transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPayroll = newClientType === 'Payroll';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-full flex flex-col overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="text-emerald-600" size={16} />
            <span>Execute Client Transfer</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
            <strong>Immutable Business Rule</strong>: Executing a Client Transfer will close the current placement and create a new Workforce record for the new client.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Candidate Name</label>
              <input
                type="text"
                disabled
                value={item.candidateName}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Client</label>
              <input
                type="text"
                disabled
                value={item.clientName}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Old Client Last Working Date *</label>
            <input
              type="date"
              value={lastWorkingDate}
              onChange={(e) => setLastWorkingDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
              required
            />
          </div>

          <hr className="border-slate-100" />

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Target Client *</label>
            <select
              value={newClientId}
              onChange={(e) => {
                setNewClientId(e.target.value);
                setNewClientName(e.target.value === 'client-002' ? 'Acme Tech' : 'DeliveryX Enterprise');
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
            >
              <option value="client-002">Acme Tech</option>
              <option value="client-003">DeliveryX Enterprise</option>
              <option value="client-001">Elastic Run</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Contract Type *</label>
              <select
                value={newClientType}
                onChange={(e) => setNewClientType(e.target.value as WorkforceType)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
              >
                <option value="Payroll">Payroll</option>
                <option value="OTS">OTS</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Active Date *</label>
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
                required
              />
            </div>
          </div>

          {isPayroll && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4 mt-2">
              <h5 className="font-bold text-[10px] text-indigo-900 uppercase tracking-wider">New Payroll KYC Details</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Payroll Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={payrollEmployeeId}
                    onChange={(e) => setPayrollEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-1234"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Aadhaar Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="12 digits"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="9-18 digits"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              {submitting ? 'Transferring…' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
