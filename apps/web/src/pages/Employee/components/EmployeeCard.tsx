import type { Employee } from '../types/Employee';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';

interface EmployeeCardProps {
  employee: Employee;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
}

const STATUS_CLASS_NAMES: Record<Employee['employmentStatus'], string> = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-slate-100 text-slate-700',
  'Notice Period': 'bg-amber-100 text-amber-700',
  Terminated: 'bg-red-100 text-red-700',
};

export default function EmployeeCard({ employee, onView, onEdit }: EmployeeCardProps) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {employee.photoUrl ? (
            <img className="h-12 w-12 rounded-full object-cover" src={employee.photoUrl} alt="" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 font-semibold text-green-700">
              {employee.firstName.slice(0, 1)}{employee.lastName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-800">{employee.fullName}</h3>
            <p className="truncate text-sm text-slate-500">{employee.employeeCode}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASS_NAMES[employee.employmentStatus]}`}>
          {employee.employmentStatus}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div><dt className="text-slate-500">Department</dt><dd className="mt-1 font-medium text-slate-800">{employee.department}</dd></div>
        <div><dt className="text-slate-500">Designation</dt><dd className="mt-1 font-medium text-slate-800">{employee.designation}</dd></div>
        <div><dt className="text-slate-500">Location</dt><dd className="mt-1 font-medium text-slate-800">{employee.workLocation}</dd></div>
        <div><dt className="text-slate-500">Joining Date</dt><dd className="mt-1 font-medium text-slate-800">{employee.joiningDate}</dd></div>
      </dl>

      <div className="flex gap-3 border-t border-slate-100 pt-4">
        <Button className="flex-1" onClick={() => onView(employee)}>View</Button>
        <Button className="flex-1 bg-slate-700 hover:bg-slate-800" onClick={() => onEdit(employee)}>Edit</Button>
      </div>
    </Card>
  );
}
