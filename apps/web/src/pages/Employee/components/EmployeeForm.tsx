import { useEffect, useState } from 'react';
import type { Employee, EmployeeFormData } from '../types/Employee';
import Button from '../../../ui/Button';
import Card from '../../../ui/Card';
import FormInput from '../../../components/forms/FormInput';
import { employeeService } from '../services/employeeService';
import { designationMasterService } from '../services/designationMasterService';

interface EmployeeFormProps {
  employee: Employee | null;
  isSaving: boolean;
  error: string | null;
  onSave: (formData: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_EMPLOYEE_FORM: EmployeeFormData = {
  employeeId: '', employeeCode: '', firstName: '', lastName: '', gender: 'Male', dateOfBirth: '', mobileNumber: '', email: '', department: 'Recruitment', departmentId: '', designation: 'Recruitment Executive', employmentType: 'Permanent', joiningDate: '', reportingManager: 'Founder / Leadership', reportingManagerId: '', workLocation: '', employmentStatus: 'Active', photoUrl: '', address: '', emergencyContact: '', notes: '',
};

const toFormData = (employee: Employee | null): EmployeeFormData => {
  if (!employee) {
    return EMPTY_EMPLOYEE_FORM;
  }

  const grossVal = employee.grossSalary ?? employee.monthlyGross ?? employee.salary;

  return {
    employeeId: employee.employeeId,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    gender: employee.gender,
    dateOfBirth: employee.dateOfBirth,
    mobileNumber: employee.mobileNumber,
    email: employee.email,
    departmentId: employee.departmentId,
    department: employee.department || 'Recruitment',
    designation: employee.designation || 'Recruitment Executive',
    employmentType: employee.employmentType,
    joiningDate: employee.joiningDate,
    reportingManagerId: employee.reportingManagerId,
    reportingManager: employee.reportingManager || 'Founder / Leadership',
    workLocation: employee.workLocation,
    employmentStatus: employee.employmentStatus,
    photoUrl: employee.photoUrl,
    address: employee.address,
    emergencyContact: employee.emergencyContact,
    notes: employee.notes,
    grossSalary: grossVal,
    pfApplicable: employee.pfApplicable ?? false,
    esicApplicable: employee.esicApplicable ?? false,
    ptApplicable: employee.ptApplicable ?? false,
    calculatedPf: employee.calculatedPf ?? 0,
    calculatedEsic: employee.calculatedEsic ?? 0,
    calculatedPt: employee.calculatedPt ?? 0,
    totalDeductions: employee.totalDeductions ?? 0,
    netTakeHome: employee.netTakeHome,
  };
};

export default function EmployeeForm({ employee, isSaving, error, onSave, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(() => toFormData(employee));

  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [eligibleManagers, setEligibleManagers] = useState<Array<{ id: string; label: string; value: string }>>([]);

  const [activeDepartments, setActiveDepartments] = useState<Array<{id: string, name: string}>>([]);

  // Live Statutory Calculation for Edit Form
  const grossVal = formData.grossSalary ?? 0;
  const hasGross = typeof formData.grossSalary === 'number' && formData.grossSalary > 0;
  const basicPay = Math.round(grossVal * 0.5);
  const pf = formData.pfApplicable ? Math.min(1800, Math.round(basicPay * 0.12)) : 0;
  const esi = formData.esicApplicable ? (grossVal <= 21000 ? Math.round(grossVal * 0.0075) : 0) : 0;
  let pt = 0;
  if (formData.ptApplicable) {
    if (grossVal > 25000) pt = 200;
    else if (grossVal > 15000) pt = 150;
  }
  const totalDeductions = pf + esi + pt;
  const netTakeHome = Math.max(0, grossVal - totalDeductions);

  useEffect(() => {
    designationMasterService.getDepartmentsFromAdmin().then((depts) => {
      setActiveDepartments(depts);
    });
  }, []);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      setFormData(toFormData(employee));
    });

    return () => window.clearTimeout(syncTimer);
  }, [employee]);

  useEffect(() => {
    designationMasterService
      .getDesignationsForDepartment(formData.department)
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
        formData.department,
        employee?.id || employee?.employeeId,
        formData.designation
      );

      const managerOptions = activeEligible.map((emp) => ({
        id: emp.employeeId,
        value: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        label: `${emp.employeeCode || emp.employeeId || ""} — ${emp.fullName || `${emp.firstName} ${emp.lastName}`}${emp.designation ? ` (${emp.designation})` : ""}`,
      }));

      setEligibleManagers(managerOptions);
    });
  }, [formData.department, formData.designation, employee]);

  const updateField = <TField extends keyof EmployeeFormData>(field: TField, value: EmployeeFormData[TField]): void => {
    setFormData((currentFormData) => ({ ...currentFormData, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void onSave({
      ...formData,
      calculatedPf: pf,
      calculatedEsic: esi,
      calculatedPt: pt,
      totalDeductions,
      netTakeHome,
    });
  };

  return (
    <Card>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {employee ? `Edit Employee HR Record: ${formData.firstName} ${formData.lastName}` : 'Create Employee'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {employee
                ? 'HR-Controlled Employee Record: Modify Department, Designation, Reporting Manager & Salary Configuration only.'
                : 'Maintain core employee information for future HR modules.'}
            </p>
          </div>
          <Button className="bg-slate-700 hover:bg-slate-800" onClick={onCancel}>Close</Button>
        </div>
        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}

        {/* Read-Only Employee Identity Badge (Preserved data display) */}
        {employee && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Employee Code / ID</span>
              <span className="font-bold text-slate-800 font-mono">{formData.employeeCode || formData.employeeId}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Employee Name</span>
              <span className="font-bold text-slate-800">{formData.firstName} {formData.lastName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Official Email</span>
              <span className="font-semibold text-slate-700">{formData.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Mobile Number</span>
              <span className="font-semibold text-slate-700">{formData.mobileNumber || '—'}</span>
            </div>
          </div>
        )}

        {/* HR Controlled Fields Only: Department, Designation, Reporting Manager */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
            1. Role & Manager Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Dropdown */}
            <label className="block text-sm font-medium">
              Department *
              <select
                value={formData.department}
                onChange={(event) => {
                  const selectedName = event.target.value;
                  const selectedDept = activeDepartments.find(d => d.name === selectedName);
                  setFormData(curr => ({
                    ...curr,
                    department: selectedName,
                    departmentId: selectedDept?.id || '',
                  }));
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                required
              >
                <option value="">Select Department...</option>
                {activeDepartments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Designation Dropdown */}
            <label className="block text-sm font-medium">
              Designation * (Active Master Data)
              <select
                value={formData.designation}
                onChange={(event) => updateField('designation', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none"
                required
              >
                {availableDesignations.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
            </label>

            {/* Reporting Manager Dropdown */}
            <label className="block text-sm font-medium">
              Reporting Manager (Active Employees)
              <select
                value={formData.reportingManager}
                onChange={(event) => {
                  const selectedName = event.target.value;
                  const selectedMgr = eligibleManagers.find(m => m.value === selectedName);
                  setFormData(curr => ({
                    ...curr,
                    reportingManager: selectedName,
                    reportingManagerId: selectedMgr?.id || '',
                  }));
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select Reporting Manager...</option>
                {eligibleManagers.map((mgr) => (
                  <option key={mgr.id} value={mgr.value}>
                    {mgr.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Joining Date Field */}
            <label className="block text-sm font-medium">
              Joining Date
              <input
                type="date"
                value={formData.joiningDate || ''}
                onChange={(event) => updateField('joiningDate', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {/* Salary & Statutory Configuration Block for HR Edit Form */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200/60 pb-2">
            2. Salary & Statutory Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="number"
              label="Gross Take Home Salary (₹)"
              value={formData.grossSalary ? String(formData.grossSalary) : ''}
              onChange={(e) => updateField('grossSalary', parseFloat(e.target.value) || undefined)}
            />
            <div className="grid grid-cols-3 gap-2 text-xs pt-6">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.pfApplicable)}
                  onChange={(e) => updateField('pfApplicable', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                PF Applicable
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.esicApplicable)}
                  onChange={(e) => updateField('esicApplicable', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                ESI Applicable
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.ptApplicable)}
                  onChange={(e) => updateField('ptApplicable', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Professional Tax
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 divide-y divide-slate-100 text-xs">
            <div className="flex justify-between py-1"><span className="text-slate-500 font-medium">Gross Salary</span><span className="font-bold text-slate-800 font-mono">{hasGross ? `₹ ${grossVal.toLocaleString('en-IN')}` : '₹ —'}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500 font-medium">PF Deduction</span><span className="font-semibold text-slate-700 font-mono">{hasGross ? `₹ ${pf.toLocaleString('en-IN')}` : '₹ —'}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500 font-medium">ESI Deduction</span><span className="font-semibold text-slate-700 font-mono">{hasGross ? `₹ ${esi.toLocaleString('en-IN')}` : '₹ —'}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500 font-medium">Professional Tax Deduction</span><span className="font-semibold text-slate-700 font-mono">{hasGross ? `₹ ${pt.toLocaleString('en-IN')}` : '₹ —'}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500 font-medium">Total Deductions</span><span className="font-semibold text-rose-600 font-mono">{hasGross ? `₹ ${totalDeductions.toLocaleString('en-IN')}` : '₹ —'}</span></div>
            <div className="flex justify-between py-2 font-bold text-emerald-800 bg-emerald-50/60 px-2 rounded-md mt-1"><span className="font-bold">Calculated Net Take Home Salary</span><span className="font-extrabold font-mono text-sm">{hasGross ? `₹ ${netTakeHome.toLocaleString('en-IN')}` : '₹ —'}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
          <Button className="bg-slate-200 hover:bg-slate-300 text-slate-700" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            {isSaving ? 'Updating HR Record...' : 'Update HR Record'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
