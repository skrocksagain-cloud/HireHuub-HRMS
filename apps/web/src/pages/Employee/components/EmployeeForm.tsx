import { useEffect, useState } from 'react';

import type { Employee, EmployeeFormData, EmployeeStatus, EmploymentType } from '../types/Employee';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';
import FormInput from '../../../components/forms/FormInput';

interface EmployeeFormProps {
  employee: Employee | null;
  isSaving: boolean;
  error: string | null;
  onSave: (formData: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_EMPLOYEE_FORM: EmployeeFormData = {
  employeeId: '', employeeCode: '', firstName: '', lastName: '', gender: 'Male', dateOfBirth: '', mobileNumber: '', email: '', department: '', designation: '', employmentType: 'Permanent', joiningDate: '', reportingManager: '', workLocation: '', employmentStatus: 'Active', photoUrl: '', address: '', emergencyContact: '', notes: '',
};

const EMPLOYMENT_TYPES: EmploymentType[] = ['Permanent', 'Contract', 'Intern', 'Consultant'];
const EMPLOYEE_STATUSES: EmployeeStatus[] = ['Active', 'Inactive', 'Notice Period', 'Terminated'];

const toFormData = (employee: Employee | null): EmployeeFormData => {
  if (!employee) {
    return EMPTY_EMPLOYEE_FORM;
  }

  return {
    employeeId: employee.employeeId,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    gender: employee.gender,
    dateOfBirth: employee.dateOfBirth,
    mobileNumber: employee.mobileNumber,
    email: employee.email,
    department: employee.department,
    designation: employee.designation,
    employmentType: employee.employmentType,
    joiningDate: employee.joiningDate,
    reportingManager: employee.reportingManager,
    workLocation: employee.workLocation,
    employmentStatus: employee.employmentStatus,
    photoUrl: employee.photoUrl,
    address: employee.address,
    emergencyContact: employee.emergencyContact,
    notes: employee.notes,
  };
};

export default function EmployeeForm({ employee, isSaving, error, onSave, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(() => toFormData(employee));

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setFormData(toFormData(employee));
    });

    return () => window.clearTimeout(syncTimer);
  }, [employee]);

  const updateField = <TField extends keyof EmployeeFormData>(field: TField, value: EmployeeFormData[TField]): void => {
    setFormData((currentFormData) => ({ ...currentFormData, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onSave(formData);
  };

  return (
    <Card>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-slate-800">{employee ? 'Edit Employee' : 'Create Employee'}</h2><p className="mt-1 text-sm text-slate-500">Maintain core employee information for future HR modules.</p></div>
          <Button className="bg-slate-700 hover:bg-slate-800" onClick={onCancel}>Close</Button>
        </div>
        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FormInput required label="Employee ID" value={formData.employeeId} onChange={(event) => updateField('employeeId', event.target.value)} />
          <FormInput required label="Employee Code" value={formData.employeeCode} onChange={(event) => updateField('employeeCode', event.target.value)} />
          <FormInput required label="First Name" value={formData.firstName} onChange={(event) => updateField('firstName', event.target.value)} />
          <FormInput required label="Last Name" value={formData.lastName} onChange={(event) => updateField('lastName', event.target.value)} />
          <FormInput required type="email" label="Email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} />
          <FormInput required label="Mobile Number" value={formData.mobileNumber} onChange={(event) => updateField('mobileNumber', event.target.value)} />
          <FormInput required label="Department" value={formData.department} onChange={(event) => updateField('department', event.target.value)} />
          <FormInput required label="Designation" value={formData.designation} onChange={(event) => updateField('designation', event.target.value)} />
          <FormInput required type="date" label="Joining Date" value={formData.joiningDate} onChange={(event) => updateField('joiningDate', event.target.value)} />
          <FormInput label="Reporting Manager" value={formData.reportingManager} onChange={(event) => updateField('reportingManager', event.target.value)} />
          <FormInput label="Work Location" value={formData.workLocation} onChange={(event) => updateField('workLocation', event.target.value)} />
          <FormInput type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} />
          <FormInput label="Photo URL" value={formData.photoUrl} onChange={(event) => updateField('photoUrl', event.target.value)} />
          <FormInput label="Emergency Contact" value={formData.emergencyContact} onChange={(event) => updateField('emergencyContact', event.target.value)} />
          <label className="block text-sm font-medium">Employment Type<select value={formData.employmentType} onChange={(event) => updateField('employmentType', event.target.value as EmploymentType)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3">{EMPLOYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="block text-sm font-medium">Employment Status<select value={formData.employmentStatus} onChange={(event) => updateField('employmentStatus', event.target.value as EmployeeStatus)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3">{EMPLOYEE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        </div>
        <label className="block text-sm font-medium">Address<textarea value={formData.address} onChange={(event) => updateField('address', event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        <label className="block text-sm font-medium">Notes<textarea value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3" /></label>
        <div className="flex justify-end gap-3"><Button className="bg-slate-700 hover:bg-slate-800" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Employee'}</Button></div>
      </form>
    </Card>
  );
}
