import { useState } from 'react';
import { ShieldCheck, Save, CheckCircle2, AlertTriangle, Eye, ChevronDown, ChevronUp, Users, Building, Layers } from 'lucide-react';
import { useAdminDepartments, useAdminHierarchy, useAdminRoles } from '../../../hooks/admin/useAdmin';
import { permissionService } from '../../../core/permissions/permissionService';
import type { ApprovalScopeType, ReportingScopeType, RoleItem, ViewScopeType } from '../../../types/Admin';

const STANDARD_PERMISSIONS = [
  { key: 'employees:view', label: 'View Employees', category: 'Employees' },
  { key: 'employees:create', label: 'Create Employee', category: 'Employees' },
  { key: 'employees:edit', label: 'Edit Employee', category: 'Employees' },
  { key: 'employees:delete', label: 'Delete Employee', category: 'Employees' },
  { key: 'employees:export', label: 'Export Employees', category: 'Employees' },

  { key: 'recruitment:view', label: 'View Recruitment & Candidates', category: 'Recruitment' },
  { key: 'recruitment:create', label: 'Create Candidate / Opening', category: 'Recruitment' },
  { key: 'recruitment:edit', label: 'Edit Candidate / Opening', category: 'Recruitment' },
  { key: 'recruitment:approve', label: 'Approve Recruitment / Offers', category: 'Recruitment' },
  { key: 'recruitment:export', label: 'Export Recruitment Data', category: 'Recruitment' },

  { key: 'finance:view', label: 'View Finance & Invoices', category: 'Finance' },
  { key: 'finance:create', label: 'Create Invoices / Credit Notes', category: 'Finance' },
  { key: 'finance:edit', label: 'Edit Finance Records', category: 'Finance' },
  { key: 'finance:approve', label: 'Approve Finance & Billing', category: 'Finance' },
  { key: 'finance:export', label: 'Export Financial Reports', category: 'Finance' },

  { key: 'payroll:view', label: 'View Payroll & Payslips', category: 'Payroll' },
  { key: 'payroll:generate', label: 'Generate Payslips / Salary', category: 'Payroll' },
  { key: 'payroll:approve', label: 'Approve Payroll', category: 'Payroll' },
  { key: 'payroll:export', label: 'Export Payroll Registers', category: 'Payroll' },

  { key: 'leave:view', label: 'View Leave Records', category: 'Leave' },
  { key: 'leave:apply', label: 'Apply Leave', category: 'Leave' },
  { key: 'leave:approve', label: 'Approve Leave Requests', category: 'Leave' },

  { key: 'attendance:view', label: 'View Attendance Records', category: 'Attendance' },
  { key: 'attendance:edit', label: 'Edit Attendance', category: 'Attendance' },
  { key: 'attendance:approve', label: 'Approve Attendance', category: 'Attendance' },

  { key: 'documents:view', label: 'View Documents', category: 'Documents' },
  { key: 'documents:upload', label: 'Upload Templates / Files', category: 'Documents' },
  { key: 'documents:generate', label: 'Generate Official Documents', category: 'Documents' },
  { key: 'documents:download', label: 'Download Documents', category: 'Documents' },
] as const;

export default function PermissionMatrixTab() {
  const { roles, isLoading, saveRole, updateRole } = useAdminRoles();
  const { departments } = useAdminDepartments();
  const { hierarchy } = useAdminHierarchy();

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [showAdvancedScope, setShowAdvancedScope] = useState<boolean>(true);
  const [simulatedRoleName, setSimulatedRoleName] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('');

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const [form, setForm] = useState<RoleItem>(
    activeRole || {
      id: 'role-custom',
      name: 'Custom Role',
      description: 'Custom access role',
      permissions: [],
      viewScope: 'Organization',
      approvalScope: 'Organization',
      reportingScope: 'DirectReports',
      departmentIds: [],
      teamIds: [],
      employeeIds: [],
      branchIds: [],
      companyIds: [],
      isActive: true,
    }
  );

  if (activeRole && form.id !== activeRole.id) {
    setForm(activeRole);
  }

  const validation = permissionService.validatePermissionDependencies(form.permissions);

  const togglePermission = (permKey: string) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permKey);
      let updated: string[];
      if (exists) {
        updated = prev.permissions.filter((p) => p !== permKey);
      } else {
        updated = [...prev.permissions, permKey];
      }
      return { ...prev, permissions: updated };
    });
  };

  const toggleDepartmentScope = (deptId: string) => {
    setForm((prev) => {
      const exists = prev.departmentIds.includes(deptId);
      const updated = exists
        ? prev.departmentIds.filter((d) => d !== deptId)
        : [...prev.departmentIds, deptId];
      return { ...prev, departmentIds: updated };
    });
  };

  const toggleEmployeeScope = (empId: string) => {
    setForm((prev) => {
      const exists = prev.employeeIds.includes(empId);
      const updated = exists
        ? prev.employeeIds.filter((e) => e !== empId)
        : [...prev.employeeIds, empId];
      return { ...prev, employeeIds: updated };
    });
  };

  const applyPreset = (presetRole: RoleItem) => {
    setForm({
      ...presetRole,
      id: form.id,
      name: form.name,
    });
    setStatusMsg(`Applied '${presetRole.name}' preset template to ${form.name}!`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (roles.some((r) => r.id === form.id)) {
        await updateRole(form.id, form);
      } else {
        await saveRole(form);
      }
      setStatusMsg(`Permissions & Data Scopes for '${form.name}' saved successfully!`);
      setTimeout(() => setStatusMsg(''), 3000);
    } catch {
      setStatusMsg('Failed to save role permissions.');
    }
  };

  const toggleSimulation = (role: RoleItem | null) => {
    permissionService.setSimulatedRole(role);
    setSimulatedRoleName(role ? role.name : '');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Permission Engine…</div>;
  }

  const categories = Array.from(new Set(STANDARD_PERMISSIONS.map((p) => p.category)));
  const filteredEmployees = hierarchy.filter(
    (h) =>
      h.employeeName.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
      h.designation.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-xs text-slate-700">
      {/* Top Header & Simulation Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            Enterprise Permission & Data Access Control Engine
          </h3>
          <p className="text-slate-500">
            Configure feature permissions and Data Scopes (View, Approval, Departments, Reporting Tree) for every role in Hire Huub One ERP.
          </p>
        </div>

        {/* Role Simulation Mode Toggle ("Preview As Role") */}
        <div className="flex items-center gap-2">
          {simulatedRoleName ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 font-bold rounded-xl text-xs">
              <Eye size={14} className="text-amber-600" />
              <span>Simulating: {simulatedRoleName}</span>
              <button
                type="button"
                onClick={() => toggleSimulation(null)}
                className="ml-2 underline text-[10px] text-amber-700 hover:text-amber-900"
              >
                Exit Simulation
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => toggleSimulation(form)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
            >
              <Eye size={15} /> Simulate '{form.name}' Role
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {/* Permission Dependency Warnings Banner */}
      {!validation.valid && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" /> Permission Dependency Warnings
          </div>
          {validation.warnings.map((w, idx) => (
            <div key={idx} className="text-[11px] font-medium pl-6">
              • {w}
            </div>
          ))}
        </div>
      )}

      {/* Role Selection & Preset Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-900">Select Role to Edit:</label>
            <select
              value={form.id}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800 focus:border-emerald-500 focus:outline-none"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.isPreset ? '(Preset)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Role Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Load Preset:</span>
            {roles.filter((r) => r.isPreset).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Role Meta */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Role Title</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block font-semibold mb-1">Role Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Feature Permissions Matrix Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Feature Permissions Matrix (WHAT Role Can Do)
          </div>

          <div className="grid grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>{cat} Module</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {STANDARD_PERMISSIONS.filter((p) => p.category === cat && form.permissions.includes(p.key)).length} / {STANDARD_PERMISSIONS.filter((p) => p.category === cat).length} Granted
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {STANDARD_PERMISSIONS.filter((p) => p.category === cat).map((perm) => {
                    const isChecked = form.permissions.includes(perm.key) || form.permissions.includes('*');
                    return (
                      <label key={perm.key} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white cursor-pointer transition">
                        <span className="font-semibold text-slate-800 text-xs">{perm.label}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.key)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Advanced Data Access & Scope Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowAdvancedScope(!showAdvancedScope)}
            className="w-full p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between hover:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-400" />
              Advanced Access Control (WHICH Records Role Can View & Approve)
            </span>
            {showAdvancedScope ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showAdvancedScope && (
            <div className="p-5 space-y-6">
              {/* Scopes Toggles: View Scope & Approval Scope & Reporting Scope */}
              <div className="grid grid-cols-3 gap-6">
                {/* View Scope */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-2">
                    <Building size={16} className="text-emerald-600" /> View Access Scope
                  </div>
                  <div className="space-y-2">
                    {(['Organization', 'Departments', 'Teams', 'Reporting', 'Assigned', 'Own'] as ViewScopeType[]).map((sc) => (
                      <label key={sc} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 text-xs">
                        <input
                          type="radio"
                          name="viewScope"
                          value={sc}
                          checked={form.viewScope === sc}
                          onChange={() => setForm({ ...form, viewScope: sc })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{sc === 'Organization' ? 'Entire Organization' : sc === 'Departments' ? 'Assigned Departments Only' : sc === 'Teams' ? 'Assigned Teams Only' : sc === 'Reporting' ? 'Reporting Tree Only' : sc === 'Assigned' ? 'Assigned Records Only' : 'Own Records Only'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Approval Scope */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-2">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Approval Scope
                  </div>
                  <div className="space-y-2">
                    {(['Organization', 'Departments', 'Teams', 'Reporting', 'Selected'] as ApprovalScopeType[]).map((sc) => (
                      <label key={sc} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 text-xs">
                        <input
                          type="radio"
                          name="approvalScope"
                          value={sc}
                          checked={form.approvalScope === sc}
                          onChange={() => setForm({ ...form, approvalScope: sc })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{sc === 'Organization' ? 'Entire Organization' : sc === 'Departments' ? 'Assigned Departments' : sc === 'Teams' ? 'Assigned Teams' : sc === 'Reporting' ? 'Reporting Hierarchy' : 'Selected Employees Only'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reporting Scope */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-2">
                    <Users size={16} className="text-emerald-600" /> Reporting Tree Scope
                  </div>
                  <div className="space-y-2">
                    {(['DirectReports', 'ReportingTree', 'OwnTeam'] as ReportingScopeType[]).map((sc) => (
                      <label key={sc} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 text-xs">
                        <input
                          type="radio"
                          name="reportingScope"
                          value={sc}
                          checked={form.reportingScope === sc}
                          onChange={() => setForm({ ...form, reportingScope: sc })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{sc === 'DirectReports' ? 'Direct Reports Only' : sc === 'ReportingTree' ? 'Entire Reporting Tree' : 'Own Team'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-Department Assignment */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                  <span>Multi-Department Scope Selection</span>
                  <span className="text-[10px] text-slate-400 font-mono">{form.departmentIds.length} Departments Selected</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {departments.map((dept) => {
                    const isChecked = form.departmentIds.includes(dept.id);
                    return (
                      <label key={dept.id} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDepartmentScope(dept.id)}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-semibold text-slate-800 text-xs truncate">{dept.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Searchable Individual Employee Assignment */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                  <span>Individual Employee Assignment</span>
                  <span className="text-[10px] text-slate-400 font-mono">{form.employeeIds.length} Employees Selected</span>
                </div>

                <input
                  type="text"
                  placeholder="Search employees by name or designation…"
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none text-xs"
                />

                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {filteredEmployees.map((emp) => {
                    const isChecked = form.employeeIds.includes(emp.employeeId);
                    return (
                      <label key={emp.employeeId} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEmployeeScope(emp.employeeId)}
                          className="rounded text-emerald-600 shrink-0"
                        />
                        <div className="truncate">
                          <div className="font-bold text-slate-900">{emp.employeeName}</div>
                          <div className="text-[10px] text-slate-400">{emp.designation}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs transition"
          >
            <Save size={16} /> Save Permissions & Data Scopes
          </button>
        </div>
      </form>
    </div>
  );
}
