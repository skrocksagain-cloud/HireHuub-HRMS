import { useState, useMemo } from 'react';
import { useOpenings } from '../../openings/hooks/useOpenings';
import type { Opening } from '../../../../types/Opening';
import { Briefcase, MapPin, Users, IndianRupee } from 'lucide-react';

export default function CrmOpeningsView() {
  const { openings, loading, error } = useOpenings();
  const [search, setSearch] = useState('');

  // FILTER: Only OpeningStatus = Active.
  // Note: Outsourced details are simply not rendered in this view.
  const activeOpenings = useMemo(() => {
    return openings
      .filter((o: Opening) => o.status === 'Active')
      .filter((o: Opening) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return o.title.toLowerCase().includes(s) || o.clientName.toLowerCase().includes(s) || o.city.toLowerCase().includes(s);
      });
  }, [openings, search]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading Active Openings...</div>;
  }

  if (error) {
    return <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="text-emerald-600" size={20} /> Active Openings
          </h2>
          <p className="text-xs text-slate-500">Read-only view of active recruitment mandates.</p>
        </div>
        <input
          type="text"
          placeholder="Search openings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>

      {activeOpenings.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
          <Briefcase className="mx-auto text-slate-400 mb-3" size={32} />
          <h3 className="font-bold text-slate-700 text-sm">No Active Openings</h3>
          <p className="text-xs text-slate-500 mt-1">There are currently no active openings available matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeOpenings.map((opening: Opening) => (
            <div key={opening.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{opening.title}</h3>
                  <div className="text-emerald-700 font-semibold text-xs mt-0.5">{opening.clientName}</div>
                </div>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                  {opening.id}
                </span>
              </div>

              <div className="space-y-2 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{opening.city}, {opening.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>{opening.openPositions} Positions</span>
                </div>
                {(opening.minSalary || opening.maxSalary) && (
                  <div className="flex items-center gap-2">
                    <IndianRupee size={14} className="text-slate-400" />
                    <span>
                      {opening.minSalary ? `₹${opening.minSalary.toLocaleString()}` : '0'} 
                      {opening.maxSalary ? ` - ₹${opening.maxSalary.toLocaleString()}` : ''} 
                      {opening.salaryType ? ` / ${opening.salaryType}` : ''}
                    </span>
                  </div>
                )}
                
                {(opening.minExperience || opening.maxExperience) && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-400" />
                    <span>
                      {opening.minExperience ?? 0} {opening.maxExperience ? `- ${opening.maxExperience} yrs` : '+ yrs'}
                    </span>
                  </div>
                )}
              </div>

              {(opening.skills && opening.skills.length > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {opening.skills.slice(0, 3).map((skill: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                  {opening.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-medium">
                      +{opening.skills.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
