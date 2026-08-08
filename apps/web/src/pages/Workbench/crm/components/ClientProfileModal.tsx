import { X, Building2, MapPin, Award, UserCheck, ShieldCheck } from 'lucide-react';
import type { Client } from '../../../../types/Client';

interface ClientProfileModalProps {
  client: Client | null;
  onClose: () => void;
}

export default function ClientProfileModal({ client, onClose }: ClientProfileModalProps) {
  if (!client) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm leading-none text-white">{client.name}</h3>
              <p className="text-[11px] text-slate-300 mt-1">{client.billingName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Client Type</span>
              <span className="font-bold text-emerald-800 text-xs">{client.type}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
              <span className="font-bold text-slate-800 text-xs">{client.status}</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Recruiter Points</span>
              <span className="font-bold text-amber-700 text-xs flex items-center gap-1">
                <Award size={12} /> {client.points} Points / Activation
              </span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">State</span>
              <span className="font-bold text-slate-800 text-xs">{client.state}</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
              <MapPin size={14} className="text-emerald-600" /> Billing Address
            </span>
            <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed text-[11px]">
              {client.billingAddress.line1}, {client.billingAddress.city}, {client.billingAddress.state} - {client.billingAddress.postalCode}
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
              <ShieldCheck size={14} className="text-blue-600" /> Commercial Highlights
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {client.highlights.map((h, i) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-medium text-slate-700">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {client.spocs && client.spocs.length > 0 && (
            <div>
              <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1">
                <UserCheck size={14} className="text-indigo-600" /> Primary Client SPOC
              </span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
                <p className="font-semibold text-slate-800">{client.spocs[0].name} ({client.spocs[0].designation})</p>
                <p className="text-slate-500 font-mono">{client.spocs[0].phone} • {client.spocs[0].email}</p>
              </div>
            </div>
          )}
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
