import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import type { WorkforceItem, WorkforceType } from '../types/workforce';

interface ClientTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WorkforceItem | null;
  onExecuteTransfer: (
    id: string,
    newClientId: string,
    newClientName: string,
    newClientType: WorkforceType,
    activeDate: string
  ) => Promise<void>;
}

export default function ClientTransferModal({
  isOpen,
  onClose,
  item,
  onExecuteTransfer,
}: ClientTransferModalProps) {
  const [newClientId, setNewClientId] = useState<string>('client-002');
  const [newClientName, setNewClientName] = useState<string>('Acme Tech');
  const [newClientType, setNewClientType] = useState<WorkforceType>('Payroll');
  const [activeDate, setActiveDate] = useState<string>('2026-08-01');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await onExecuteTransfer(item.id, newClientId, newClientName, newClientType, activeDate);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Client transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
            <strong>Immutable Business Rule</strong>: Executing a Client Transfer will create a new
            Placement record and retain complete historic placement records forever.
          </div>

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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
