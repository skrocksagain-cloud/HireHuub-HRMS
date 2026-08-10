import { useEffect, useState } from 'react';
import { Search, UserCheck, X } from 'lucide-react';
import { employeeRepository } from '../../../Employee/repositories/employeeRepository';
import type { Employee } from '../../../Employee/types/Employee';

interface Props {
  selectedEmployeeIds: string[];
  onChange: (updatedIds: string[]) => void;
}

export default function ActiveEmployeePicker({ selectedEmployeeIds, onChange }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    employeeRepository.getEmployees().then((list) => {
      if (isMounted) {
        // STRICT RULE: ONLY Active Employees (status === 'Active')
        // Exclude Inactive, Resigned, Terminated, Hold
        const activeOnly = list.filter(
          (e) => (e.status === 'Active' || e.employmentStatus === 'Active') &&
                 e.status !== 'Inactive' && e.employmentStatus !== 'Terminated' && e.employmentStatus !== 'Notice Period'
        );
        setEmployees(activeOnly);
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = employees.filter((e) => {
    const term = searchTerm.toLowerCase();
    const name = (e.fullName || `${e.firstName} ${e.lastName}`).toLowerCase();
    const empId = (e.employeeId || e.employeeCode || '').toLowerCase();
    const mobile = (e.mobileNumber || e.mobile || '').toLowerCase();
    const dept = (e.department || '').toLowerCase();
    return name.includes(term) || empId.includes(term) || mobile.includes(term) || dept.includes(term);
  });

  const toggleEmployee = (empId: string) => {
    const exists = selectedEmployeeIds.includes(empId);
    const updated = exists ? selectedEmployeeIds.filter((id) => id !== empId) : [...selectedEmployeeIds, empId];
    onChange(updated);
  };

  const selectedEmployees = employees.filter((e) => selectedEmployeeIds.includes(e.employeeId || e.id || ''));

  return (
    <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
      <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <UserCheck size={16} /> Active Employee Selection Picker
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {selectedEmployeeIds.length} Selected (Active Only)
        </span>
      </div>

      {/* Selected Tags */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 max-h-24 overflow-y-auto">
          {selectedEmployees.map((emp) => {
            const empId = emp.employeeId || emp.id || '';
            return (
              <span
                key={empId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold rounded-lg text-[11px] border border-emerald-200 dark:border-emerald-800"
              >
                <span>{emp.fullName || `${emp.firstName} ${emp.lastName}`} ({empId})</span>
                <button
                  type="button"
                  onClick={() => toggleEmployee(empId)}
                  className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search active employees by name, ID, mobile, or department…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Employee List Grid */}
      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
        {isLoading ? (
          <div className="p-4 text-center text-slate-400">Loading active employees…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-slate-400">No active employees found matching query.</div>
        ) : (
          filtered.map((emp) => {
            const empId = emp.employeeId || emp.id || '';
            const isSelected = selectedEmployeeIds.includes(empId);
            return (
              <label
                key={empId}
                className={`flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition ${
                  isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleEmployee(empId)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="h-7 w-7 rounded-full bg-slate-900 text-emerald-400 font-bold text-[11px] flex items-center justify-center border border-slate-700">
                    {(emp.firstName || emp.fullName || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      ID: <strong className="font-mono">{empId}</strong> • {emp.designation || 'Staff'} ({emp.department || 'General'})
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full uppercase">
                  Active
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
