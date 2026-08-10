import { useState } from 'react';
import { Search, UserCheck, X } from 'lucide-react';
import type { HierarchyNode } from '../../../../types/Admin';

interface ActiveEmployeePickerProps {
  activeEmployees: HierarchyNode[];
  selectedEmployeeIds: string[];
  onChange: (updatedIds: string[]) => void;
}

export default function ActiveEmployeePicker({
  activeEmployees,
  selectedEmployeeIds,
  onChange,
}: ActiveEmployeePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Strictly Active Employees Only (Status === 'Active' or undefined/Active)
  const strictlyActiveList = activeEmployees.filter(
    (emp) => !emp.status || emp.status === 'Active' || emp.status.toLowerCase() !== 'inactive'
  );

  const filtered = strictlyActiveList.filter(
    (emp) =>
      emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmployee = (empId: string) => {
    const exists = selectedEmployeeIds.includes(empId);
    const updated = exists ? selectedEmployeeIds.filter((id) => id !== empId) : [...selectedEmployeeIds, empId];
    onChange(updated);
  };

  const selectedEmployees = strictlyActiveList.filter((emp) => selectedEmployeeIds.includes(emp.employeeId));

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
        <span className="flex items-center gap-1.5 text-emerald-700">
          <UserCheck size={16} /> Active Employee Selection Picker
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {selectedEmployeeIds.length} Selected (Active Only)
        </span>
      </div>

      {/* Selected Employee Tags */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-emerald-50/50 rounded-xl border border-emerald-200/60 max-h-24 overflow-y-auto">
          {selectedEmployees.map((emp) => (
            <span
              key={emp.employeeId}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 font-bold rounded-lg text-[11px] shadow-2xs"
            >
              <span>{emp.employeeName} ({emp.employeeId})</span>
              <button
                type="button"
                onClick={() => toggleEmployee(emp.employeeId)}
                className="text-emerald-700 hover:text-emerald-950 ml-1"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search active employees by name, ID, department, or designation…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Active Employees List */}
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200/60 rounded-xl bg-slate-50">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-4 text-center text-slate-400 italic">No matching active employees found.</div>
        ) : (
          filtered.map((emp) => {
            const isChecked = selectedEmployeeIds.includes(emp.employeeId);
            return (
              <label
                key={emp.employeeId}
                className={`p-2 bg-white rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  isChecked ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <span>{emp.employeeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({emp.employeeId})</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {emp.designation} • <span className="text-emerald-700 font-semibold">{emp.departmentName}</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleEmployee(emp.employeeId)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
