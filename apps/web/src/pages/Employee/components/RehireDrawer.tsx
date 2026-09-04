import { useState, useEffect } from 'react';
import { X, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import Drawer from '../../../ui/Drawer';
import type { Employee } from '../types/Employee';
import { employeeService } from '../services/employeeService';
import { adminService } from '../../../services/admin/adminService';
import { useAuth } from '../../../context/AuthContext';
import type { DesignationItem } from '../../../types/Admin';

interface RehireDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess: () => void;
}

export default function RehireDrawer({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: RehireDrawerProps) {
  const { user } = useAuth();

  const [salary, setSalary] = useState<number>(employee.monthlyGross || employee.salary || 0);
  const [department, setDepartment] = useState<string>(employee.department || '');
  const [designation, setDesignation] = useState<string>(employee.designation || '');
  const [reportingManager, setReportingManager] = useState<string>(employee.reportingManager || '');
  const [rehireDate, setRehireDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [activeDepartments, setActiveDepartments] = useState<string[]>([]);
  const [activeDesignationsList, setActiveDesignationsList] = useState<DesignationItem[]>([]);
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [eligibleManagers, setEligibleManagers] = useState<Array<{ id: string; name: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSalary(employee.monthlyGross || employee.salary || 0);
      setDepartment(employee.department || '');
      setDesignation(employee.designation || '');
      setReportingManager(employee.reportingManager || '');
      setRehireDate(new Date().toISOString().split('T')[0]);
      setErrorMsg(null);

      // Load Active Departments from Company Settings
      adminService
        .getDepartments()
        .then((depts) => {
          const active = depts.filter((d) => d.isActive !== false).map((d) => d.name);
          setActiveDepartments(active);
          if (active.length > 0 && !active.includes(employee.department)) {
            setDepartment(active[0]);
          }
        })
        .catch(() => setActiveDepartments([]));

      // Load Active Designations from Company Settings
      adminService
        .getDesignations()
        .then((desigs) => {
          setActiveDesignationsList(desigs.filter((d) => d.isActive !== false));
        })
        .catch(() => setActiveDesignationsList([]));

      // Load Active Employees for Reporting Manager options
      employeeService
        .getEmployees()
        .then((emps) => {
          const activeMgs = emps
            .filter((e) => e.employmentStatus === 'Active' && e.id !== employee.id)
            .map((e) => ({
              id: e.id || e.employeeId,
              name: e.fullName || `${e.firstName} ${e.lastName}`,
            }));
          setEligibleManagers(activeMgs);
        })
        .catch(() => setEligibleManagers([]));
    }
  }, [isOpen, employee]);

  useEffect(() => {
    if (!department) {
      setAvailableDesignations([]);
      setDesignation('');
      return;
    }

    const matching = activeDesignationsList
      .filter((r) => r.departmentName === department || !r.departmentId || !r.departmentName)
      .map((r) => r.name);
    const uniqueDesigs = [...new Set(matching)];
    setAvailableDesignations(uniqueDesigs);

    if (designation && !uniqueDesigs.includes(designation)) {
      setDesignation(uniqueDesigs[0] || '');
    }
  }, [department, activeDesignationsList]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (employee.employmentStatus === 'Active') {
      setErrorMsg('Employee is already Active.');
      return;
    }

    if (!department.trim()) {
      setErrorMsg('Please select a valid active Department.');
      return;
    }

    if (!designation.trim()) {
      setErrorMsg('Please select a valid active Designation.');
      return;
    }

    if (!reportingManager.trim()) {
      setErrorMsg('Please select an active Reporting Manager.');
      return;
    }

    if (!salary || Number(salary) <= 0) {
      setErrorMsg('Please enter a valid salary amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userActor = {
        name: user?.name || 'HR Admin',
        role: user?.role || 'HR',
      };

      await employeeService.rehireEmployee(
        employee.id || '',
        {
          salary: Number(salary),
          department,
          designation,
          reportingManager,
          rehireDate,
        },
        userActor
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to rehire employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={`Rehire Employee: ${employee.fullName || employee.employeeCode}`}>
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle size={14} className="shrink-0" />
              {errorMsg}
            </span>
            <button type="button" onClick={() => setErrorMsg(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* System & Identity Preservation Banner */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <UserCheck size={16} className="text-emerald-600" />
            <span>Preserved Identity & Historical Record</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Rehiring reactivates Employee ID <strong className="font-mono">{employee.employeeId || employee.employeeCode}</strong>. Historical exit records, documents, attendance, leave, performance, and audit logs are preserved intact.
          </p>
        </div>

        {/* Section 1: Rehire Employment Details */}
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rehire Date *</label>
            <input
              type="date"
              value={rehireDate}
              onChange={(e) => setRehireDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Monthly Gross Salary (₹) *</label>
            <input
              type="number"
              value={salary || ''}
              onChange={(e) => setSalary(Number(e.target.value))}
              placeholder="e.g. 50000"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-slate-900"
              required
              min={1}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department * (Active Master)</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
              required
            >
              <option value="" disabled>
                {activeDepartments.length === 0 ? 'No active departments found' : 'Select Department...'}
              </option>
              {activeDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Designation * (Active Master)</label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              disabled={!department || availableDesignations.length === 0}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            >
              <option value="" disabled>
                {!department
                  ? 'Select Department First'
                  : availableDesignations.length === 0
                  ? 'No designations for this department'
                  : 'Select Designation...'}
              </option>
              {availableDesignations.map((desig) => (
                <option key={desig} value={desig}>
                  {desig}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reporting Manager * (Active Employees)</label>
            <select
              value={reportingManager}
              onChange={(e) => setReportingManager(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
              required
            >
              <option value="" disabled>
                {eligibleManagers.length === 0 ? 'No active managers available' : 'Select Reporting Manager...'}
              </option>
              {eligibleManagers.map((mgr) => (
                <option key={mgr.id} value={mgr.name}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit & Cancel Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>{isSubmitting ? 'Rehiring...' : 'Confirm Rehire'}</span>
          </button>
        </div>
      </form>
    </Drawer>
  );
}
