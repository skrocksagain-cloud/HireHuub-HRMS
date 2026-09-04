import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { WorkforceItem } from '../types/workforce';

interface CompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WorkforceItem | null;
  onExecuteComplete: (id: string, lastWorkingDate: string) => Promise<void>;
}

export default function CompleteModal({
  isOpen,
  onClose,
  item,
  onExecuteComplete,
}: CompleteModalProps) {
  const [lastWorkingDate, setLastWorkingDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!lastWorkingDate) throw new Error('Last working date is required.');
      if (new Date(lastWorkingDate) < new Date(item.activeDate)) {
        throw new Error('Last working date cannot be before active date.');
      }

      await onExecuteComplete(item.id, lastWorkingDate);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Completion failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" size={16} />
            <span>Complete Placement</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-200"
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

          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
            <strong>Success Action</strong>: Completing a placement signifies the candidate successfully finished the contract or mandate.
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
            <label className="block font-semibold text-slate-700 mb-1">Last Working Date *</label>
            <input
              type="date"
              value={lastWorkingDate}
              onChange={(e) => setLastWorkingDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none"
              required
            />
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
              {submitting ? 'Completing…' : 'Complete Placement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
