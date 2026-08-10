import React, { useState } from 'react';
import { Gift, Save, X, ShieldAlert } from 'lucide-react';
import type { HolidayItem } from '../../../../types/Calendar';
import { usePermissions } from '../../../../hooks/usePermissions';

interface HolidayModalProps {
  onClose: () => void;
  onSave: (holiday: Omit<HolidayItem, 'id' | 'createdAt'>) => Promise<HolidayItem>;
}

export default function HolidayModal({ onClose, onSave }: HolidayModalProps) {
  const { activeRole } = usePermissions();
  const isSuperAdmin = activeRole.name === 'Super Admin' || activeRole.name === 'admin';

  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isSuperAdmin) {
      setErrorMsg('Only Super Admins can declare Organization Holidays.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Holiday Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        date,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to save holiday.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Gift size={20} className="text-rose-600 dark:text-rose-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Declare Organization Holiday</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {!isSuperAdmin && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl font-bold flex items-center gap-2">
            <ShieldAlert size={16} /> Department Admins cannot create Organization Holidays.
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-900 dark:text-white mb-1">Holiday Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day / Republic Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Holiday Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Official Gazetted Organization Public Holiday"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isSuperAdmin}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              {isSubmitting ? 'Saving…' : 'Declare Holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
