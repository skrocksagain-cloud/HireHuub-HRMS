import { useState } from 'react';
import { Plus, Edit2, CheckCircle2, XCircle, Briefcase } from 'lucide-react';
import { useAdminDepartments, useAdminDesignations } from '../../../hooks/admin/useAdmin';
import type { DesignationItem } from '../../../types/Admin';

export default function DesignationMasterTab() {
  const { departments } = useAdminDepartments();
  const { designations, isLoading, saveDesignation, updateDesignation } = useAdminDesignations();
  const [showModal, setShowModal] = useState(false);
  const [editingDesig, setEditingDesig] = useState<DesignationItem | null>(null);

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const openCreateModal = () => {
    setEditingDesig(null);
    setName('');
    setDepartmentId(departments[0]?.id || '');
    setShowModal(true);
  };

  const openEditModal = (desig: DesignationItem) => {
    setEditingDesig(desig);
    setName(desig.name);
    setDepartmentId(desig.departmentId);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dept = departments.find((d) => d.id === departmentId);
    const departmentName = dept ? dept.name : 'General';

    if (editingDesig) {
      await updateDesignation(editingDesig.id, {
        name,
        departmentId,
        departmentName,
      });
    } else {
      const newDesig: DesignationItem = {
        id: `${departmentId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        departmentId,
        departmentName,
        isActive: true,
      };
      await saveDesignation(newDesig);
    }

    setShowModal(false);
  };

  const toggleStatus = async (desig: DesignationItem) => {
    await updateDesignation(desig.id, { isActive: !desig.isActive });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Designation Master…</div>;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Briefcase size={18} className="text-emerald-600" />
            Designation Master
          </h3>
          <p className="text-slate-500">
            Designations belong strictly to Departments. All employee onboarding forms consume designations from this master.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
        >
          <Plus size={16} /> Create Designation
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Designation Name</th>
              <th className="py-3 px-4">Belongs to Department</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {designations.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                  No designations created yet. Click Create Designation to add one.
                </td>
              </tr>
            ) : (
              designations.map((desig) => (
                <tr key={desig.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{desig.name}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">{desig.departmentName}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        desig.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {desig.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {desig.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(desig)}
                      className="px-2.5 py-1 text-slate-700 hover:text-emerald-600 bg-slate-100 rounded-lg font-semibold"
                    >
                      <Edit2 size={14} className="inline mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(desig)}
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        desig.isActive
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {desig.isActive ? 'Deactivate' : 'Activate'}
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
              {editingDesig ? 'Edit Designation' : 'Create Designation'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Designation Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VP Staffing"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
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
                  {editingDesig ? 'Update Designation' : 'Save Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
