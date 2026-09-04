
import { Building2, MapPin, Briefcase, GraduationCap, Banknote, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import Drawer from '../../../ui/Drawer';
import type { ExternalVacancy } from '../../../types/ExternalVacancy';

interface GuestVacancyDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: ExternalVacancy | null;
}

export default function GuestVacancyDetailsDrawer({
  isOpen,
  onClose,
  vacancy,
}: GuestVacancyDetailsDrawerProps) {
  if (!vacancy) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Vacancy Details — ${vacancy.openingId}`}>
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded-lg border border-emerald-500/30">
              {vacancy.openingId}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700">
              {vacancy.openPositions} Open Positions
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{vacancy.title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
              <Building2 size={14} className="text-emerald-400" />
              <span className="font-medium">{vacancy.clientName}</span>
              <span>•</span>
              <MapPin size={14} className="text-emerald-400" />
              <span>{vacancy.city}, {vacancy.state}</span>
            </div>
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Briefcase size={14} className="text-slate-700" />
              <span>Experience</span>
            </div>
            <div className="font-bold text-slate-900">{vacancy.experienceRange}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <GraduationCap size={14} className="text-slate-700" />
              <span>Qualification</span>
            </div>
            <div className="font-bold text-slate-900">{vacancy.qualification || 'Not Specified'}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Banknote size={14} className="text-slate-700" />
              <span>Salary Offered</span>
            </div>
            <div className="font-bold text-slate-900">{vacancy.salaryRange || 'As per norms'} ({vacancy.salaryPeriod})</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <Clock size={14} className="text-slate-700" />
              <span>Shift / Work Type</span>
            </div>
            <div className="font-bold text-slate-900">{vacancy.shift}</div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Job Description</h4>
          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {vacancy.jobDescription || 'No description provided.'}
          </div>
        </div>

        {/* Skills Required */}
        {vacancy.skillsRequired && vacancy.skillsRequired.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Key Skills & Requirements</h4>
            <div className="flex flex-wrap gap-1.5">
              {vacancy.skillsRequired.map((skill, idx) => (
                <span
                  key={typeof skill === 'string' ? skill : `skill-${idx}`}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium rounded-lg flex items-center gap-1"
                >
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>{typeof skill === 'string' ? skill : String(skill)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated Timestamp */}
        <div className="pt-4 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Calendar size={13} /> Last Updated: {vacancy.lastUpdated}
          </span>
          <span className="font-semibold text-slate-600">Employment Type: {vacancy.employmentType}</span>
        </div>

        {/* Close Button Only */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
          >
            Close View
          </button>
        </div>
      </div>
    </Drawer>
  );
}
