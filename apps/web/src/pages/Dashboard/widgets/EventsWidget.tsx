import { Gift, Award } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';

export default function EventsWidget() {
  const { activeRole, canAccessModule } = usePermissions();

  const isStaffingDepartment = canAccessModule('recruitment') || activeRole.name.includes('Staffing') || activeRole.name.includes('Recruiter');

  const standardEvents = [
    { id: 'ev-1', name: 'Vikram Sharma', type: 'Birthday', subtitle: 'Software Architect', date: 'Today' },
    { id: 'ev-2', name: 'Ananya Roy', type: 'Work Anniversary', subtitle: '3-Year Milestone • Talent Partner', date: 'Tomorrow' },
    { id: 'ev-3', name: 'Independence Day Holiday', type: 'Company Holiday', subtitle: 'Office Closed', date: 'Aug 15' },
  ];

  const bigDays = [
    { id: 'bd-1', personName: 'Acme Tech Solutions', eventType: 'Client Anniversary', subtitle: '2 Years Strategic Partnership', dateLabel: 'Aug 5' },
    { id: 'bd-2', personName: 'Global Talent Network', eventType: 'Partner Anniversary', subtitle: '1 Year Staffing Collaboration', dateLabel: 'Aug 8' },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-rose-600" />
          <span className="font-bold text-slate-900 text-xs">Events & Milestones</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">Company Wide</span>
      </div>

      <div className="space-y-2">
        {standardEvents.map((evt) => (
          <div key={evt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">{evt.name}</span>
              <span className="text-[11px] font-semibold text-rose-700 block mt-0.5">{evt.type} 🎉</span>
              <span className="text-[10px] text-slate-400 block">{evt.subtitle}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
              {evt.date}
            </span>
          </div>
        ))}
      </div>

      {/* Staffing Department Exclusive Big Day Milestone Notifications */}
      {isStaffingDepartment && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <Award size={15} />
            <span>Staffing Signature Big Day Milestones</span>
          </div>
          <div className="space-y-2">
            {bigDays.map((bd) => (
              <div key={bd.id} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">{bd.personName}</span>
                  <span className="text-[11px] font-bold text-amber-700 block">{bd.eventType} ⭐</span>
                  <span className="text-[10px] text-amber-800">{bd.subtitle}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {bd.dateLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
