
import { X, ShieldAlert } from 'lucide-react';
import type { Candidate, QuickUpdateInput } from '../../types/crm';
import type { Client } from '../../../../../types/Client';
import type { Opening } from '../../../../../types/Opening';
import TimelineTab from './TimelineTab';
import AssignmentHistoryTab from './AssignmentHistoryTab';
import QuickUpdateForm from './QuickUpdateForm';

interface CandidateProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  clients: Client[];
  openings: Opening[];
  onSubmitUpdate: (input: QuickUpdateInput) => Promise<any>;
}

export default function CandidateProfileDrawer({
  isOpen,
  onClose,
  candidate,
  clients,
  openings,
  onSubmitUpdate,
}: CandidateProfileDrawerProps) {

  if (!isOpen || !candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Profile Drawer Top Bar */}
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {candidate.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-white leading-none">{candidate.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    {candidate.currentCrmStatus ?? 'Not Contacted'}
                  </span>
                  {candidate.isBlacklisted && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold flex items-center gap-1">
                      <ShieldAlert size={10} /> Blacklisted
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono">
                  {candidate.phone} • {candidate.area}, {candidate.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
          
          {/* Left Column: Quick Update Form */}
          <div className="w-full md:w-1/2 p-6 border-r border-slate-200 overflow-y-auto bg-white">
            <h3 className="font-bold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-100">Update Status</h3>
            <QuickUpdateForm 
               candidate={candidate}
               clients={clients}
               openings={openings}
               onSubmitUpdate={onSubmitUpdate}
            />
          </div>

          {/* Right Column: History */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-8">
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4">Interaction History</h3>
              <TimelineTab candidate={candidate} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4">Assignment History</h3>
              <AssignmentHistoryTab candidate={candidate} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
