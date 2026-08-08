import { useState } from 'react';
import { Plus, Edit2, CheckCircle2, XCircle, Building } from 'lucide-react';
import { useAdminDepartments } from '../../../hooks/admin/useAdmin';
import type { DepartmentItem } from '../../../types/Admin';

export default function DepartmentManagementTab() {
  const { departments, isLoading, saveDepartment, updateDepartment } = useAdminDepartments();
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingDept) {
      await updateDepartment(editingDept.id, {
        name,
        code: code || name.substring(0, 3).toUpperCase(),
        description,
      });
    } else {
      const newDept: DepartmentItem = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        code: code || name.substring(0, 3).toUpperCase(),
        description,
        isActive: true,
      };
      await saveDepartment(newDept);
    }

    setShowModal(false);
  };

  const toggleStatus = async (dept: DepartmentItem) => {
    await updateDepartment(dept.id, { isActive: !dept.isActive });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Department Master…</div>;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Building size={18} className="text-emerald-600" />
            Department Management
          </h3>
          <p className="text-slate-500">Super Admin managed dynamic departments. Enter department names manually.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
        >
          <Plus size={16} /> Create Department
        </button>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Department Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  No departments created yet. Click Create Department to add one.
                </td>
              </tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">{dept.code}</td>
                  <td className="py-3 px-4 text-slate-500">{dept.description || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {dept.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(dept)}
                      className="px-2.5 py-1 text-slate-700 hover:text-emerald-600 bg-slate-100 rounded-lg font-semibold"
                    >
                      <Edit2 size={14} className="inline mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(dept)}
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        dept.isActive
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {dept.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Department Name * (Manual Entry)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Talent Acquisition"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Department Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. TA"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of department scope..."
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
                  {editingDept ? 'Update Department' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
