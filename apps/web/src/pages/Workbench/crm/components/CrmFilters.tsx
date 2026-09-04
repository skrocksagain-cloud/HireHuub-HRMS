import { RotateCcw } from 'lucide-react';
import type { CrmFilterState } from '../services/crmService';
import type { Client } from '../../../../types/Client';
import type { CandidateStatus } from '../types/crm';
import type { Employee } from '../../../Employee/types/Employee';

interface CrmFiltersProps {
  filters: CrmFilterState;
  onFilterChange: (filters: CrmFilterState) => void;
  clients: Client[];
  userRole: string;
  userAssignedRole?: string;
  activeEmployees?: Employee[];
}

import { getAuthorizationScope } from '../../../../core/authorization/authorizationResolver';

const QUICK_FILTERS = [
  'All',
  'Assigned',
  'Not Contacted',
  "Today's Follow Up",
  "Today's Interview",
  'Interested',
  'Call Back Later',
  'Active',
  'Overdue',
] as const;

const STATUSES: CandidateStatus[] = [
  'Active',
  'OB',
  'Line Up',
  'Inactive',
  'Not Interested',
  'Wrong Number',
  'Not Eligible',
  'Doc / Vehicle / Vacancy Issue',
  'Call Back Later',
  'Number not in Service',
  'Ringing / Busy / Forward / Call Disconnected',
  'Interested',
];

export default function CrmFilters({ 
  filters, 
  onFilterChange, 
  clients, 
  userRole, 
  userAssignedRole,
  activeEmployees = [] 
}: CrmFiltersProps) {
  const scope = getAuthorizationScope(userAssignedRole || userRole);
  const isTLOrAbove = scope !== 'SELF';

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      quickFilter: 'All',
    });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      {/* Quick Filter Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
        {QUICK_FILTERS.map((qf) => {
          const isActive = filters.quickFilter === qf;
          return (
            <button
              key={qf}
              type="button"
              onClick={() => onFilterChange({ ...filters, quickFilter: qf })}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {qf}
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ ...filters, status: (e.target.value as CandidateStatus | 'Not Contacted') || undefined })}
            className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="Not Contacted">Not Contacted</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Client Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Client</label>
          <select
            value={filters.clientId || ''}
            onChange={(e) => onFilterChange({ ...filters, clientId: e.target.value || undefined })}
            className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Clients</option>
            {clients.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Recruiter Filter (TL/Admin only) */}
        {isTLOrAbove && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Recruiter / Assignee</label>
            <select
              value={filters.recruiterId || ''}
              onChange={(e) => onFilterChange({ ...filters, recruiterId: e.target.value || undefined })}
              className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Recruiters</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id || emp.employeeId} value={emp.employeeId || emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Follow Up Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Follow Up Date</label>
          <input
            type="month"
            value={filters.followUpMonth || ''}
            onChange={(e) => onFilterChange({ ...filters, followUpMonth: e.target.value || undefined })}
            className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Interview Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Interview Date</label>
          <input
            type="month"
            value={filters.interviewMonth || ''}
            onChange={(e) => onFilterChange({ ...filters, interviewMonth: e.target.value || undefined })}
            className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Reset Filter Button */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition cursor-pointer"
        >
          <RotateCcw size={12} /> Reset Filters
        </button>
      </div>
    </div>
  );
}
