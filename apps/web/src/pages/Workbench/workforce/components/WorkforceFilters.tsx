import { Search } from 'lucide-react';
import type { WorkforceFilterState, WorkforceItem } from '../types/workforce';

interface WorkforceFiltersProps {
  filters: WorkforceFilterState;
  onFilterChange: (updated: WorkforceFilterState) => void;
  allWorkforce: WorkforceItem[];
  staffingRecruiters: any[];
}

export default function WorkforceFilters({
  filters,
  onFilterChange,
  allWorkforce,
  staffingRecruiters,
}: WorkforceFiltersProps) {
  // Extract unique filter dropdown values dynamically from Single Source Workforce
  const clientOptions = Array.from(new Set(allWorkforce.map((w) => w.clientName))).filter(Boolean);
  const recruiterOptions = staffingRecruiters.map(r => r.fullName).filter(Boolean);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
      {/* Case Insensitive Search Bar */}
      <div className="relative w-full lg:w-72 shrink-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by candidate name or mobile..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Client Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Client:</label>
          <select
            value={filters.client}
            onChange={(e) => onFilterChange({ ...filters, client: e.target.value })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Clients</option>
            {clientOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Recruiter Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Recruiter:</label>
          <select
            value={filters.recruiter}
            onChange={(e) => onFilterChange({ ...filters, recruiter: e.target.value })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Recruiters</option>
            {recruiterOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Active Month Selector */}
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Active Month:</label>
          <input
            type="month"
            value={filters.activeMonth}
            onChange={(e) => onFilterChange({ ...filters, activeMonth: e.target.value })}
            className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
