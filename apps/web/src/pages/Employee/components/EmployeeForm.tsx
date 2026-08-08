import { useEffect, useState } from 'react';

import type { Employee, EmployeeFormData, EmployeeStatus, EmploymentType } from '../types/Employee';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';
import FormInput from '../../../components/forms/FormInput';
import { employeeService } from '../services/employeeService';
import { designationMasterService, APPROVED_DEPARTMENTS } from '../services/designationMasterService';

interface EmployeeFormProps {
  employee: Employee | null;
  isSaving: boolean;
  error: string | null;
  onSave: (formData: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_EMPLOYEE_FORM: EmployeeFormData = {
  employeeId: '', employeeCode: '', firstName: '', lastName: '', gender: 'Male', dateOfBirth: '', mobileNumber: '', email: '', department: 'Recruitment', designation: 'Recruitment Executive', employmentType: 'Permanent', joiningDate: '', reportingManager: 'Founder / Leadership', workLocation: '', employmentStatus: 'Active', photoUrl: '', address: '', emergencyContact: '', notes: '',
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
    department: employee.department || 'Recruitment',
    designation: employee.designation || 'Recruitment Executive',
    employmentType: employee.employmentType,
    joiningDate: employee.joiningDate,
    reportingManager: employee.reportingManager || 'Founder / Leadership',
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

  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [eligibleManagers, setEligibleManagers] = useState<Array<{ id: string; label: string; value: string }>>([]);

  const approvedDepartments = APPROVED_DEPARTMENTS.filter((d) => d !== 'Executive');

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setFormData(toFormData(employee));
    });

    return () => window.clearTimeout(syncTimer);
  }, [employee]);

  useEffect(() => {
    designationMasterService
      .getDesignationsForDepartment(formData.department || 'Recruitment')
      .then((desigs) => {
        setAvailableDesignations(desigs);
        if (desigs.length > 0 && !desigs.includes(formData.designation)) {
          setFormData((current) => ({ ...current, designation: desigs[0] }));
        }
      });
  }, [formData.department]);

  useEffect(() => {
    employeeService.getEmployees().then((employees) => {
      const activeEligible = designationMasterService.getEligibleReportingManagers(
        employees,
        formData.department || 'Recruitment',
        employee?.id || employee?.employeeId,
        formData.designation
      );

      const managerOptions = [
        { id: 'leadership', value: 'Founder / Leadership', label: 'HH0000 — Leadership / Director (Executive)' },
        ...activeEligible.map((emp, index) => ({
          id: emp.id || emp.employeeId || emp.employeeCode || `mgr-${index}`,
          value: emp.fullName || `${emp.firstName} ${emp.lastName}`,
          label: `${emp.employeeCode || emp.employeeId || 'HH0000'} — ${emp.fullName || `${emp.firstName} ${emp.lastName}`} (${emp.designation})`,
        })),
      ];

      setEligibleManagers(managerOptions);
      if (managerOptions.length > 0 && !managerOptions.some((m) => m.value === formData.reportingManager)) {
        setFormData((current) => ({ ...current, reportingManager: managerOptions[0].value }));
      }
    });
  }, [formData.department, formData.designation, employee]);

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
          <FormInput required label="Employee ID" value={formData.employeeId} readOnly />
          <FormInput required label="Employee Code" value={formData.employeeCode} readOnly />
          <FormInput required label="First Name" value={formData.firstName} onChange={(event) => updateField('firstName', event.target.value)} />
          <FormInput required label="Last Name" value={formData.lastName} onChange={(event) => updateField('lastName', event.target.value)} />
          <FormInput required type="email" label="Email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} />
          <FormInput required label="Mobile Number" value={formData.mobileNumber} onChange={(event) => updateField('mobileNumber', event.target.value)} />
          
          {/* Department Dropdown */}
          <label className="block text-sm font-medium">
            Department *
            <select
              value={formData.department}
              onChange={(event) => updateField('department', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium"
            >
              {approvedDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>

          {/* Designation Dropdown */}
          <label className="block text-sm font-medium">
            Designation * (Designation Master)
            <select
              value={formData.designation}
              onChange={(event) => updateField('designation', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium"
            >
              {availableDesignations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </label>

          <FormInput required type="date" label="Joining Date" value={formData.joiningDate} onChange={(event) => updateField('joiningDate', event.target.value)} />
          
          {/* Reporting Manager Dropdown */}
          <label className="block text-sm font-medium">
            Reporting Manager * (Active Employees)
            <select
              value={formData.reportingManager}
              onChange={(event) => updateField('reportingManager', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium"
            >
              {eligibleManagers.map((mgr) => (
                <option key={mgr.id} value={mgr.value}>
                  {mgr.label}
                </option>
              ))}
            </select>
          </label>
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
