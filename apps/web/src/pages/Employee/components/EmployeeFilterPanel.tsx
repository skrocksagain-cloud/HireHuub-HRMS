import { Search, RefreshCw } from "lucide-react";
import type { EmployeeFilter, EmployeeSortOption, EmployeeStatus, EmploymentType } from "../types/Employee";

interface EmployeeFilterPanelProps {
  filter: EmployeeFilter;
  departments: string[];
  designations: string[];
  onChange: (filter: EmployeeFilter) => void;
}

const EMPLOYEE_STATUSES: EmployeeStatus[] = [
  "Active",
  "Inactive",
  "Notice Period",
  "Terminated",
];
const EMPLOYMENT_TYPES: EmploymentType[] = ["Permanent", "Contract", "Intern", "Consultant"];
const SORT_OPTIONS: Array<{ value: EmployeeSortOption; label: string }> = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name (A-Z)" },
  { value: "employeeCode", label: "Employee Code" },
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

  const handleReset = () => {
    onChange({
      search: "",
      department: "",
      designation: "",
      employmentStatus: "",
      employmentType: "",
      sortBy: "newest",
    });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      {/* Search Input & Reset Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search by name, ID, email, or mobile..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition shrink-0"
        >
          <RefreshCw size={13} />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Select Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Department
          </label>
          <select
            value={filter.department}
            onChange={(e) => updateFilter("department", e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Designation
          </label>
          <select
            value={filter.designation}
            onChange={(e) => updateFilter("designation", e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Designations</option>
            {designations.map((desig) => (
              <option key={desig} value={desig}>
                {desig}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Status
          </label>
          <select
            value={filter.employmentStatus}
            onChange={(e) => updateFilter("employmentStatus", e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Statuses</option>
            {EMPLOYEE_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Employment Type
          </label>
          <select
            value={filter.employmentType}
            onChange={(e) => updateFilter("employmentType", e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Employment Types</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Sort Order
          </label>
          <select
            value={filter.sortBy}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-emerald-500 transition"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
