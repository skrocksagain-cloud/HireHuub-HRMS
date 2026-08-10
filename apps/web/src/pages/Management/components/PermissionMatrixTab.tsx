import { useState } from 'react';
import { ShieldCheck, Save, CheckCircle2, AlertTriangle, Eye, ChevronDown, ChevronUp, Users, Building, Layers, Lock, AlertOctagon, Cpu } from 'lucide-react';
import { useAdminDepartments, useAdminHierarchy, useAdminRoles } from '../../../hooks/admin/useAdmin';
import { permissionService } from '../../../core/permissions/permissionService';
import type { ApprovalScopeType, ExportScopeType, ReportingScopeType, RoleItem, ViewScopeType } from '../../../types/Admin';

const ALL_ERP_MODULES = [
  { key: 'dashboard', label: 'Dashboard Workspace' },
  { key: 'employees', label: 'People / Employees' },
  { key: 'recruitment', label: 'Staffing Hub / Recruitment' },
  { key: 'finance', label: 'Finance & Billing' },
  { key: 'marketing', label: 'Marketing & Campaigns' },
  { key: 'documents', label: 'Document Center' },
  { key: 'management', label: 'Administration Settings' },
];

const FEATURE_FLAGS = [
  { key: 'ORBIT_AI', label: 'ORBIT AI Assistant' },
  { key: 'CRM', label: 'Client CRM Workspace' },
  { key: 'TRAINING', label: 'Training & Development' },
  { key: 'ASSETS', label: 'Asset Management' },
  { key: 'VISITOR', label: 'Visitor Management' },
  { key: 'FLEET', label: 'Fleet Management' },
  { key: 'PROJECTS', label: 'Project Workspaces' },
  { key: 'HELPDESK', label: 'Internal Helpdesk' },
];

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
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideActive, setOverrideActive] = useState<boolean>(false);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const [form, setForm] = useState<RoleItem>(
    activeRole || {
      id: 'role-custom',
      name: 'Custom Role',
      description: 'Custom access role',
      permissions: [],
      modules: ['dashboard', 'employees'],
      viewScope: 'Organization',
      approvalScope: 'Organization',
      exportScope: 'Organization',
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

  const toggleModuleAccess = (modKey: string) => {
    setForm((prev) => {
      const currentMods = prev.modules || ['dashboard'];
      const exists = currentMods.includes(modKey);
      const updated = exists ? currentMods.filter((m) => m !== modKey) : [...currentMods, modKey];
      return { ...prev, modules: updated };
    });
  };

  const toggleFeatureFlag = (flagKey: string) => {
    setForm((prev) => {
      const flags = { ...(prev.featureFlags || {}) };
      flags[flagKey] = !flags[flagKey];
      return { ...prev, featureFlags: flags };
    });
  };

  const toggleDepartmentScope = (deptId: string) => {
    setForm((prev) => {
      const currentDepts = prev.departmentScope || prev.departmentIds || [];
      const exists = currentDepts.includes(deptId);
      const updated = exists ? currentDepts.filter((d) => d !== deptId) : [...currentDepts, deptId];
      return { ...prev, departmentIds: updated, departmentScope: updated };
    });
  };

  const toggleEmployeeScope = (empId: string) => {
    setForm((prev) => {
      const currentEmps = prev.employeeScope || prev.employeeIds || [];
      const exists = currentEmps.includes(empId);
      const updated = exists ? currentEmps.filter((e) => e !== empId) : [...currentEmps, empId];
      return { ...prev, employeeIds: updated, employeeScope: updated };
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

  const handleToggleEmergencyOverride = () => {
    if (!overrideActive && !overrideReason.trim()) {
      setStatusMsg('Please specify a mandatory reason for Emergency Override!');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }

    const nextState = !overrideActive;
    setOverrideActive(nextState);

    const updatedRole: RoleItem = {
      ...form,
      emergencyOverride: {
        isEnabled: nextState,
        operator: 'Super Admin',
        reason: overrideReason || 'Emergency Administrative Access',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    };

    setForm(updatedRole);
    permissionService.setSimulatedRole(nextState ? updatedRole : null);
    setStatusMsg(nextState ? 'Emergency Super Admin Override Activated!' : 'Emergency Override Deactivated.');
    setTimeout(() => setStatusMsg(''), 3000);
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            Enterprise Permission & Data Access Control Engine
          </h3>
          <p className="text-slate-500">
            Configure Module Access, Action Permissions, Data Access Scopes, Feature Flags, and Role Simulation for Hire Huub One ERP.
          </p>
        </div>

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
                Stop Simulation
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => toggleSimulation(form)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              <Eye size={15} /> Simulate '{form.name}' Role
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {statusMsg}
        </div>
      )}

      <div className="bg-gradient-to-r from-slate-900 to-rose-950 text-white p-4 rounded-2xl border border-rose-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
            <AlertOctagon size={22} />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              Emergency Super Admin Override Mode
              {overrideActive && <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] uppercase">Active</span>}
            </div>
            <p className="text-slate-300 text-[11px]">
              Allows temporary unmitigated access for critical administrative tasks. Every action is logged to audit trail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!overrideActive && (
            <input
              type="text"
              placeholder="Mandatory Override Reason…"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
            />
          )}
          <button
            type="button"
            onClick={handleToggleEmergencyOverride}
            className={`px-4 py-2 font-bold rounded-xl text-xs transition ${
              overrideActive ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {overrideActive ? 'Deactivate Override' : 'Activate Override'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="font-bold text-slate-900">Select Role to Edit:</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 text-xs"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isPreset ? '(Preset)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium text-[11px]">Apply Preset Template:</span>
              {roles.filter((r) => r.isPreset).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-semibold mb-1">Role Title</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Role Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <div className="font-bold text-slate-900 border-b pb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5">
              <Lock size={16} className="text-emerald-600" /> Enterprise Module Access Authorization
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {(form.modules || []).length} / {ALL_ERP_MODULES.length} Modules Allowed
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {ALL_ERP_MODULES.map((mod) => {
              const isChecked = (form.modules || []).includes(mod.key) || (form.permissions || []).includes('*');
              return (
                <label key={mod.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleModuleAccess(mod.key)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold text-slate-800 text-xs">{mod.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <div className="font-bold text-slate-900 border-b pb-2 flex items-center justify-between text-xs">
            <span>Feature Permissions Matrix (WHAT Role Can Do)</span>
            {!validation.valid && (
              <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]">
                <AlertTriangle size={14} /> Dependency Warnings Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {categories.map((cat) => (
              <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-xs border-b pb-1 text-emerald-700">{cat} Permissions</div>
                <div className="space-y-1.5 pt-1">
                  {STANDARD_PERMISSIONS.filter((p) => p.category === cat).map((perm) => {
                    const isChecked = form.permissions.includes('*') || form.permissions.includes(perm.key);
                    return (
                      <label key={perm.key} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-100 cursor-pointer">
                        <span className="font-medium text-slate-800 text-xs">{perm.label}</span>
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

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowAdvancedScope(!showAdvancedScope)}
            className="w-full p-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between hover:bg-slate-800 transition"
          >
            <span className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-400" />
              Advanced Access Control (WHICH Records Role Can View, Edit & Approve)
            </span>
            {showAdvancedScope ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showAdvancedScope && (
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-4 gap-4">
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
                        <span>{sc === 'Organization' ? 'Entire Organization' : sc === 'Departments' ? 'Assigned Departments' : sc === 'Teams' ? 'Assigned Teams' : sc === 'Reporting' ? 'Reporting Tree' : sc === 'Assigned' ? 'Assigned Records' : 'Own Records'}</span>
                      </label>
                    ))}
                  </div>
                </div>

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
                        <span>{sc === 'Organization' ? 'Entire Organization' : sc === 'Departments' ? 'Assigned Departments' : sc === 'Teams' ? 'Assigned Teams' : sc === 'Reporting' ? 'Reporting Hierarchy' : 'Selected Employees'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b pb-2">
                    <Save size={16} className="text-emerald-600" /> Export Scope
                  </div>
                  <div className="space-y-2">
                    {(['Organization', 'Departments', 'Teams', 'Own', 'None'] as ExportScopeType[]).map((sc) => (
                      <label key={sc} className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 text-xs">
                        <input
                          type="radio"
                          name="exportScope"
                          value={sc}
                          checked={(form.exportScope || 'Organization') === sc}
                          onChange={() => setForm({ ...form, exportScope: sc })}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{sc}</span>
                      </label>
                    ))}
                  </div>
                </div>

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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs border-b pb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu size={16} className="text-emerald-600" /> Future Feature Flags Engine
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Module Toggle Control</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {FEATURE_FLAGS.map((flag) => {
                    const isEnabled = form.featureFlags?.[flag.key] ?? true;
                    return (
                      <label key={flag.key} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer">
                        <span className="font-semibold text-slate-800 text-xs">{flag.label}</span>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleFeatureFlag(flag.key)}
                          className="rounded text-emerald-600"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                  <span>Multi-Department Scope Selection</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(form.departmentScope || form.departmentIds || []).length} Departments Selected</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {departments.map((dept) => {
                    const isChecked = (form.departmentScope || form.departmentIds || []).includes(dept.id);
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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between font-bold text-slate-900 border-b pb-2">
                  <span>Individual Employee Scope Assignment</span>
                  <span className="text-[10px] text-slate-400 font-mono">{(form.employeeScope || form.employeeIds || []).length} Employees Selected</span>
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
                    const isChecked = (form.employeeScope || form.employeeIds || []).includes(emp.employeeId);
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
