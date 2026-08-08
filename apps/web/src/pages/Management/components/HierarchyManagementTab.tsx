import { useState } from 'react';
import { GitFork, CheckCircle2 } from 'lucide-react';
import { useAdminHierarchy } from '../../../hooks/admin/useAdmin';
import type { HierarchyNode } from '../../../types/Admin';

export default function HierarchyManagementTab() {
  const { hierarchy, isLoading, saveHierarchyNode } = useAdminHierarchy();
  const [statusMsg, setStatusMsg] = useState('');

  // Sample static employees or dynamic from store
  const employeesSample = [
    { id: 'emp-101', name: 'Rahul Sharma', designation: 'VP Staffing', department: 'Staffing' },
    { id: 'emp-102', name: 'Priya Mehta', designation: 'VP Finance', department: 'Finance' },
    { id: 'emp-103', name: 'Anish Kumar', designation: 'Recruitment Executive', department: 'Staffing' },
    { id: 'emp-104', name: 'Sneha Roy', designation: 'HR Executive', department: 'Operations' },
  ];

  const handleReportingChange = async (empId: string, managerId: string) => {
    const emp = employeesSample.find((e) => e.id === empId);
    const mgr = employeesSample.find((m) => m.id === managerId);

    if (!emp) return;

    const node: HierarchyNode = {
      id: empId,
      employeeId: empId,
      employeeName: emp.name,
      designation: emp.designation,
      departmentId: emp.department.toLowerCase(),
      departmentName: emp.department,
      reportingToId: mgr ? mgr.id : null,
      reportingToName: mgr ? `${mgr.name} — ${mgr.designation}` : 'Founder / Leadership',
    };

    await saveHierarchyNode(node);
    setStatusMsg(`Updated reporting manager for ${emp.name}`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Central Hierarchy…</div>;
  }

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <GitFork size={18} className="text-emerald-600" />
            Central Hierarchy Management
          </h3>
          <p className="text-slate-500">
            Super Admin manual reporting hierarchy ("Who reports to whom"). Central source of truth for Leave, Attendance, Performance & Approvals.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Designation</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Direct Reporting Manager (Central Hierarchy)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employeesSample.map((emp) => {
              const node = hierarchy.find((h) => h.employeeId === emp.id);
              const currentMgrId = node ? node.reportingToId || '' : '';

              return (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">{emp.designation}</td>
                  <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                  <td className="py-3 px-4">
                    <select
                      value={currentMgrId}
                      onChange={(e) => handleReportingChange(emp.id, e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">HH0000 — Founder / Leadership (Executive)</option>
                      {employeesSample
                        .filter((m) => m.id !== emp.id)
                        .map((mgr) => (
                          <option key={mgr.id} value={mgr.id}>
                            {mgr.name} — {mgr.designation} ({mgr.department})
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
