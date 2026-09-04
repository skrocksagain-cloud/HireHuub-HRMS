import { X, Building2, Award, ShieldCheck } from 'lucide-react';
import type { Client } from '../../../../types/Client';

interface ClientProfileModalProps {
  client: Client | null;
  onClose: () => void;
}

export default function ClientProfileModal({ client, onClose }: ClientProfileModalProps) {
  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm leading-none text-white">{client.name}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Client Type</span>
              <span className="font-bold text-emerald-800 text-sm mt-0.5 block">{client.type}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Recruiter Points</span>
              <span className="font-bold text-amber-700 text-sm mt-0.5 flex items-center gap-1.5">
                <Award size={14} /> {client.points} Points
              </span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-blue-600" /> Client Highlights
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {client.highlights && client.highlights.length > 0 ? (
                client.highlights.map((h, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                    {h}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">No highlights available</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            Close Client Profile
          </button>
        </div>
      </div>
    </div>
  );
}
