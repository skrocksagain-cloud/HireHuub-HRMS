import { useState } from 'react';
import { Plus, Edit2, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { useAdminRoles } from '../../../hooks/admin/useAdmin';
import type { RoleItem } from '../../../types/Admin';

export default function RoleManagementTab() {
  const { roles, isLoading, saveRole, updateRole } = useAdminRoles();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingRole) {
      await updateRole(editingRole.id, {
        name,
        description,
      });
    } else {
      const newRole: RoleItem = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description,
        permissions: ['read_dashboard'],
        viewScope: 'Organization',
        approvalScope: 'Organization',
        reportingScope: 'DirectReports',
        departmentIds: [],
        teamIds: [],
        employeeIds: [],
        branchIds: [],
        companyIds: [],
        isActive: true,
      };
      await saveRole(newRole);
    }

    setShowModal(false);
  };

  const toggleStatus = async (role: RoleItem) => {
    await updateRole(role.id, { isActive: !role.isActive });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Role Master…</div>;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield size={18} className="text-emerald-600" />
            Role Management (Role Master)
          </h3>
          <p className="text-slate-500">
            Create and manage dynamic access roles across Hire Huub One. No hardcoded roles allowed.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
        >
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Role Name</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Assigned Permissions Count</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  No custom roles created yet. Click Create Role to add one.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{role.name}</td>
                  <td className="py-3 px-4 text-slate-500">{role.description || '—'}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                    {role.permissions ? role.permissions.length : 0} Perms
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        role.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {role.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {role.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(role)}
                      className="px-2.5 py-1 text-slate-700 hover:text-emerald-600 bg-slate-100 rounded-lg font-semibold"
                    >
                      <Edit2 size={14} className="inline mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(role)}
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        role.isActive
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {role.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">
              {editingRole ? 'Edit Role' : 'Create Role'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Role Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Recruiter"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities and permission context for this role..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingRole ? 'Update Role' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
