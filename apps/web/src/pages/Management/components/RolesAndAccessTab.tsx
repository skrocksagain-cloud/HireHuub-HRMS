import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { employeeRepository } from '../../Employee/repositories/employeeRepository';
import type { Employee } from '../../Employee/types/Employee';
import { adminService } from '../../../services/admin/adminService';

import { useAuth } from '../../../context/AuthContext';

export default function RolesAndAccessTab() {
  const { user } = useAuth();
  const isSuperAdmin = (user as any)?.assignedRole === 'Super Admin';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rolesMaster, setRolesMaster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, rolesData] = await Promise.all([
        employeeRepository.getEmployees(),
        adminService.getRoles()
      ]);
      setEmployees(empData || []);
      setRolesMaster(rolesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (employeeId: string, newRole: string) => {
    if (!isSuperAdmin) return;
    try {
      setUpdatingId(employeeId);
      await employeeRepository.updateEmployeeFields(employeeId, {
        assignedRole: newRole || null
      });
      setEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId || emp.employeeId === employeeId) {
          return { ...emp, assignedRole: newRole as any };
        }
        return emp;
      }));
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = employees.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      return e.firstName?.toLowerCase().includes(q) ||
             e.lastName?.toLowerCase().includes(q) ||
             e.employeeCode?.toLowerCase().includes(q) ||
             e.department?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-800">Roles & Access</h2>
          <p className="text-sm text-slate-500">
            Assign core system roles to employees. Access is automatically derived from Department + Role.
          </p>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm font-medium border border-amber-200">
          Only Super Admins can assign or modify system roles.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search employee or department..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Derived Approval Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading employees...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const role = emp.assignedRole || '';
                  
                  // Calculate scope based on matched role in master data
                  const matchedRole = rolesMaster.find(r => r.name === role);
                  let scope = matchedRole?.approvalScope || 'None';
                  
                  // Fallback to existing logic if it's a built-in role not in master data
                  if (!matchedRole) {
                    if (role === 'Super Admin') scope = 'Organization';
                    else if (role === 'Master Admin') scope = 'Departments';
                    else if (role === 'Admin') scope = 'Teams';
                    else scope = 'None';
                  }
                  
                  const isUpdating = updatingId === (emp.id || emp.employeeId);

                  return (
                    <tr key={emp.id || emp.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.firstName?.charAt(0) || ''}{emp.lastName?.charAt(0) || ''}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-slate-500">{emp.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{emp.department || '-'}</td>
                      <td className="px-4 py-3">
                        <select
                          disabled={!isSuperAdmin || isUpdating || ((emp.id || emp.employeeId) === user?.employeeId)}
                          value={role}
                          onChange={(e) => handleRoleChange(emp.id || emp.employeeId, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors disabled:bg-slate-50 disabled:text-slate-500"
                        >
                          <option value="">-- Unassigned --</option>
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                          <option value="Master Admin">Master Admin</option>
                          <option value="Super Admin">Super Admin</option>
                          {rolesMaster.filter(r => !['User', 'Admin', 'Master Admin', 'Super Admin'].includes(r.name)).map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          scope === 'Organization' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          scope === 'Departments' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          scope === 'Teams' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {scope}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
