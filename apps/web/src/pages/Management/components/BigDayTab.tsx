import { useState } from 'react';
import { Sparkles, Plus, CheckCircle2, Calendar } from 'lucide-react';
import { useAdminBigDay } from '../../../hooks/admin/useAdmin';
import type { BigDayConfig } from '../../../types/Admin';

export default function BigDayTab() {
  const { bigDays, isLoading, saveBigDay, updateBigDay } = useAdminBigDay();
  const [showModal, setShowModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [date, setDate] = useState('');
  const [clientsText, setClientsText] = useState('Big Basket, Taco Bell, Sasta Sundar');
  const [bonus, setBonus] = useState(0.5);
  const [description, setDescription] = useState('Big Day bonus campaign for key staffing clients.');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const clientNames = clientsText.split(',').map((c) => c.trim()).filter(Boolean);
    const clientIds = clientNames.map((c) => c.toLowerCase().replace(/\s+/g, '-'));

    const newBigDay: BigDayConfig = {
      id: `bigday-${Date.now()}`,
      date,
      clientIds,
      clientNames,
      bonus: Number(bonus) || 0.5,
      status: 'Active',
      description,
    };

    await saveBigDay(newBigDay);
    setShowModal(false);
    setStatusMsg('Big Day configuration added successfully!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const toggleStatus = async (bd: BigDayConfig) => {
    const nextStatus = bd.status === 'Active' ? 'Completed' : 'Active';
    await updateBigDay(bd.id, { status: nextStatus });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Big Day Rules…</div>;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            Big Day Configuration & Recruiter Bonus
          </h3>
          <p className="text-slate-500">
            Configure Big Day dates and client lists. Candidate activations on Big Days grant Recruiter Point + 0.5 Bonus multiplier (e.g. 1.0 + 0.5 = 1.5 Points).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
        >
          <Plus size={16} /> Configure Big Day
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Big Day Date</th>
              <th className="py-3 px-4">Selected Active Clients</th>
              <th className="py-3 px-4">Bonus Points</th>
              <th className="py-3 px-4">Formula Preview</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bigDays.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  No Big Days configured yet. Click Configure Big Day to set one up.
                </td>
              </tr>
            ) : (
              bigDays.map((bd) => (
                <tr key={bd.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Calendar size={14} className="text-amber-500" />
                    {bd.date}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {bd.clientNames.map((c) => (
                      <span key={c} className="inline-block bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700 mr-1.5 mb-1">
                        {c}
                      </span>
                    ))}
                  </td>
                  <td className="py-3 px-4 font-bold text-amber-600">+{bd.bonus} Pt</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    1.0 Point + {bd.bonus} Bonus = <span className="font-bold text-emerald-700">{1.0 + bd.bonus} Points</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        bd.status === 'Active' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {bd.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleStatus(bd)}
                      className={`px-3 py-1 rounded-lg font-semibold ${
                        bd.status === 'Active' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {bd.status === 'Active' ? 'Mark Completed' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">Configure Big Day Event</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Big Day Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Active Clients (Comma separated) *</label>
                <input
                  type="text"
                  value={clientsText}
                  onChange={(e) => setClientsText(e.target.value)}
                  placeholder="Big Basket, Taco Bell, Sasta Sundar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Big Day Bonus Points</label>
                <input
                  type="number"
                  step="0.1"
                  value={bonus}
                  onChange={(e) => setBonus(parseFloat(e.target.value) || 0.5)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-600 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Big Day Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
