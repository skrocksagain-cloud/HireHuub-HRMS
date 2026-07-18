import type { Employee } from '../types/Employee';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';

interface EmployeeDetailsProps {
  employee: Employee;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

const Detail = ({ label, value }: { label: string; value: string }) => <div><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-800">{value || '—'}</dd></div>;

export default function EmployeeDetails({ employee, onClose, onEdit }: EmployeeDetailsProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-800">{employee.fullName}</h2><p className="mt-1 text-sm text-slate-500">{employee.employeeCode}</p></div><div className="flex gap-3"><Button className="bg-slate-700 hover:bg-slate-800" onClick={onClose}>Close</Button><Button onClick={() => onEdit(employee)}>Edit</Button></div></div>
      <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Email" value={employee.email} /><Detail label="Mobile" value={employee.mobileNumber} /><Detail label="Department" value={employee.department} /><Detail label="Designation" value={employee.designation} /><Detail label="Employment Type" value={employee.employmentType} /><Detail label="Status" value={employee.employmentStatus} /><Detail label="Joining Date" value={employee.joiningDate} /><Detail label="Reporting Manager" value={employee.reportingManager} /><Detail label="Work Location" value={employee.workLocation} /><Detail label="Address" value={employee.address} /><Detail label="Emergency Contact" value={employee.emergencyContact} /><Detail label="Notes" value={employee.notes} /></dl>
    </Card>
  );
}
