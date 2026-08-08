import { User, Phone, MapPin, Briefcase, Calendar, Building2, ShieldAlert } from 'lucide-react';
import type { Candidate } from '../../types/crm';

interface OverviewTabProps {
  candidate: Candidate;
  onQuickUpdate: () => void;
  onToggleBlacklist: () => void;
}

export default function OverviewTab({ candidate, onQuickUpdate, onToggleBlacklist }: OverviewTabProps) {
  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Blacklist Banner if Blacklisted */}
      {candidate.isBlacklisted && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-red-600" />
            <div>
              <p className="font-bold text-xs">Candidate Blacklisted / Do Not Contact</p>
              <p className="text-[11px] text-red-700">Reason: {candidate.blacklistReason}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleBlacklist}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
          >
            Remove Blacklist
          </button>
        </div>
      )}

      {/* Grid of Key Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Candidate Name</span>
          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
            <User size={12} className="text-emerald-600" /> {candidate.name}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
          <span className="font-mono font-bold text-slate-800 text-xs flex items-center gap-1">
            <Phone size={12} className="text-emerald-600" /> {candidate.phone}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Role (Smart Text)</span>
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
            <Briefcase size={12} className="text-emerald-600" /> {candidate.role}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Area & City</span>
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
            <MapPin size={12} className="text-emerald-600" /> {candidate.area}, {candidate.city}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Current Status</span>
          <span className="font-bold text-emerald-800 text-xs">{candidate.status}</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Recruiter</span>
          <span className="font-bold text-slate-800 text-xs">{candidate.assignedRecruiterName}</span>
        </div>
      </div>

      {/* Placement Details */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Building2 size={14} className="text-emerald-600" /> Current Placement & Client Info
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Current Client</span>
            <span className="font-bold text-slate-900 text-xs">{candidate.currentClientName || 'Not Placed'}</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Placement Type</span>
            <span className="font-bold text-emerald-800 text-xs">{candidate.currentPlacement?.clientType || 'OTS'}</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Date</span>
            <span className="font-mono text-slate-800 text-xs">{candidate.activeDate || '—'}</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Payroll Employee ID</span>
            <span className="font-mono font-bold text-indigo-700 text-xs">{candidate.payrollEmployeeId || '—'}</span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
            <span className="font-mono text-slate-800 text-xs">{candidate.dateOfBirth || '—'}</span>
          </div>
        </div>
      </div>

      {/* Timestamps & Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Follow Up Date</span>
          <span className="font-mono text-slate-800 text-xs flex items-center gap-1">
            <Calendar size={12} className="text-emerald-600" /> {candidate.followUpDate || '—'}
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Interview Date</span>
          <span className="font-mono text-slate-800 text-xs flex items-center gap-1">
            <Calendar size={12} className="text-emerald-600" /> {candidate.interviewDate || '—'}
          </span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Created Date</span>
          <span className="font-mono text-slate-500 text-[11px]">{new Date(candidate.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Last Updated</span>
          <span className="font-mono text-slate-500 text-[11px]">{new Date(candidate.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
        {!candidate.isBlacklisted && (
          <button
            type="button"
            onClick={onToggleBlacklist}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Blacklist Candidate
          </button>
        )}
        <button
          type="button"
          onClick={onQuickUpdate}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          Quick Update Profile
        </button>
      </div>
    </div>
  );
}
