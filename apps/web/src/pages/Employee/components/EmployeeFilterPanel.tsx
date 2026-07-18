import type { EmployeeFilter, EmployeeStatus } from '../types/Employee';

interface EmployeeFilterPanelProps {
  filter: EmployeeFilter;
  departments: string[];
  designations: string[];
  onChange: (filter: EmployeeFilter) => void;
}

const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  'Active',
  'Inactive',
  'Notice Period',
  'Terminated',
];

export default function EmployeeFilterPanel({
  filter,
  departments,
  designations,
  onChange,
}: EmployeeFilterPanelProps) {
  const updateFilter = (field: keyof EmployeeFilter, value: string): void => {
    onChange({
      ...filter,
      [field]: value,
    } as EmployeeFilter);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <select
        value={filter.department}
        onChange={(event) => updateFilter('department', event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3"
      >
        <option value="">All departments</option>
        {departments.map((department) => <option key={department} value={department}>{department}</option>)}
      </select>
      <select
        value={filter.designation}
        onChange={(event) => updateFilter('designation', event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3"
      >
        <option value="">All designations</option>
        {designations.map((designation) => <option key={designation} value={designation}>{designation}</option>)}
      </select>
      <select
        value={filter.employmentStatus}
        onChange={(event) => updateFilter('employmentStatus', event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3"
      >
        <option value="">All statuses</option>
        {EMPLOYEE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
    </div>
  );
}
