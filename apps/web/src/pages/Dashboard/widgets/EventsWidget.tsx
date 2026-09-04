import { Gift, Award } from 'lucide-react';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAdminBigDay } from '../../../hooks/admin/useAdmin';

export default function EventsWidget() {
  const { canView, isSuperAdmin } = usePermissions();
  const { bigDays, isLoading } = useAdminBigDay();

  const isStaffingDepartment = isSuperAdmin || canView('crm') || canView('openings');

  // Process live Big Days from Firestore
  const activeBigDays = bigDays
    .filter((bd) => bd.status !== 'Completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        {isLoading ? (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">Loading events…</div>
        ) : activeBigDays.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">
            No upcoming events or milestones
          </div>
        ) : (
          activeBigDays.map((bd) => (
            <div key={bd.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {bd.clientNames && bd.clientNames.length > 0 ? bd.clientNames.join(', ') : 'Big Day Event'}
                </span>
                <span className="text-[11px] font-semibold text-rose-700 block mt-0.5">Big Day Milestone 🎉</span>
                <span className="text-[10px] text-slate-400 block">{bd.description}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                {bd.date}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Staffing Department & Super Admin Exclusive Big Day Milestone Notifications */}
      {isStaffingDepartment && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <Award size={15} />
            <span>Staffing Signature Big Day Milestones</span>
          </div>
          {isLoading ? (
            <div className="p-3 text-center text-[11px] text-amber-700 font-mono">Loading Big Days...</div>
          ) : activeBigDays.length === 0 ? (
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/40 text-center text-[11px] text-amber-800 italic">
              No upcoming Big Day milestones scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {activeBigDays.map((bd) => (
                <div key={bd.id} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      {bd.clientNames && bd.clientNames.length > 0 ? bd.clientNames.join(', ') : 'Big Day Event'}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                      Big Day Bonus (+{bd.bonus}x) ⭐
                    </span>
                    <span className="text-[10px] text-amber-800 block">{bd.description}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                    {bd.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
