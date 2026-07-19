import type { EmployeeFilter, EmployeeSortOption, EmployeeStatus, EmploymentType } from '../types/Employee';

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
const EMPLOYMENT_TYPES: EmploymentType[] = ['Permanent', 'Contract', 'Intern', 'Consultant'];
const SORT_OPTIONS: Array<{ value: EmployeeSortOption; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name', label: 'Employee Name' },
  { value: 'employeeCode', label: 'Employee Code' },
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
      <select
        value={filter.employmentType}
        onChange={(event) => updateFilter('employmentType', event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3"
      >
        <option value="">All employment types</option>
        {EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select
        value={filter.sortBy}
        onChange={(event) => updateFilter('sortBy', event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3"
      >
        {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}
