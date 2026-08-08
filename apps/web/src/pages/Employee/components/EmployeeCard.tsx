import { Eye, Edit3, Building2, Calendar, User, MoreVertical } from "lucide-react";
import StatusBadge from "../../../ui/StatusBadge";
import type { Employee } from "../types/Employee";

interface EmployeeCardProps {
  employee: Employee;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDeactivate?: (employee: Employee) => void;
}

export default function EmployeeCard({
  employee,
  onView,
  onEdit,
  onDeactivate,
}: EmployeeCardProps) {
  const initials =
    (employee.firstName?.charAt(0) || "") + (employee.lastName?.charAt(0) || "");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 group">
      
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {employee.photoUrl ? (
            <img
              src={employee.photoUrl}
              alt={employee.fullName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
              {initials.toUpperCase() || "EE"}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-600 transition">
              {employee.fullName}
            </h3>
            <p className="text-[11px] font-mono text-slate-500 truncate">
              {employee.employeeCode || employee.employeeId}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={employee.employmentStatus} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100/80">
        <div>
          <span className="text-[10px] text-slate-500 font-medium block">Department</span>
          <span className="font-semibold text-slate-800 truncate block flex items-center gap-1 mt-0.5">
            <Building2 size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{employee.department}</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 font-medium block">Designation</span>
          <span className="font-semibold text-slate-800 truncate block mt-0.5">
            {employee.designation}
          </span>
        </div>

        <div className="pt-1">
          <span className="text-[10px] text-slate-500 font-medium block">Reporting Manager</span>
          <span className="font-medium text-slate-700 truncate block flex items-center gap-1 mt-0.5">
            <User size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">{employee.reportingManager || "Unassigned"}</span>
          </span>
        </div>

        <div className="pt-1">
          <span className="text-[10px] text-slate-500 font-medium block">Joining Date</span>
          <span className="font-medium text-slate-700 truncate block flex items-center gap-1 mt-0.5">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span>{employee.joiningDate}</span>
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onView(employee)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl transition"
        >
          <Eye size={14} />
          <span>View</span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(employee)}
          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          title="Edit Details"
        >
          <Edit3 size={14} />
        </button>

        {onDeactivate && (
          <button
            type="button"
            onClick={() => onDeactivate(employee)}
            className="py-2 px-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            title="More Options"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
