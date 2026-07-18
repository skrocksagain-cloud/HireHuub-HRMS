import type { Employee } from '../types/Employee';
import EmptyState from '../../../ui/EmptyState';
import Loader from '../../../ui/Loader';
import EmployeeCard from './EmployeeCard';

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onCreate: () => void;
}

export default function EmployeeList({
  employees,
  isLoading,
  error,
  onView,
  onEdit,
  onCreate,
}: EmployeeListProps) {
  if (isLoading) {
    return <Loader text="Loading employees..." />;
  }

  if (error) {
    return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>;
  }

  if (employees.length === 0) {
    return <EmptyState title="No employees found" description="Create an employee or adjust the filters to see results." action={<button type="button" onClick={onCreate} className="font-medium text-green-700">Create employee</button>} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id ?? employee.employeeId} employee={employee} onView={onView} onEdit={onEdit} />
      ))}
    </div>
  );
}
