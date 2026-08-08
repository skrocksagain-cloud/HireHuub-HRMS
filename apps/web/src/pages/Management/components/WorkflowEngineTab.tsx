import { useState } from 'react';
import { Network, Plus, Trash2, GitFork, ShieldCheck } from 'lucide-react';
import { useAdminRoles, useAdminWorkflows } from '../../../hooks/admin/useAdmin';
import type { WorkflowRule, WorkflowStep } from '../../../types/Admin';

export default function WorkflowEngineTab() {
  const { workflows, isLoading, saveWorkflow, updateWorkflow } = useAdminWorkflows();
  const { roles } = useAdminRoles();

  const [selectedModule, setSelectedModule] = useState<WorkflowRule['module']>('Leave');
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { stepOrder: 1, name: 'Reporting Manager Approval', approverRole: 'Reporting Manager' },
    { stepOrder: 2, name: 'Department Admin Approval', approverRole: 'Department Admin' },
  ]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepOrder: prev.length + 1,
        name: `Step ${prev.length + 1} Approval`,
        approverRole: 'Super Admin',
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepOrder: idx + 1 }))
    );
  };

  const updateStepField = (index: number, field: keyof WorkflowStep, value: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWf: WorkflowRule = {
      id: `wf-${Date.now()}`,
      module: selectedModule,
      name,
      triggerEvent: triggerEvent || `${selectedModule} Action Initiated`,
      steps,
      isActive: true,
    };

    await saveWorkflow(newWf);
    setShowModal(false);
  };

  const toggleStatus = async (wf: WorkflowRule) => {
    await updateWorkflow(wf.id, { isActive: !wf.isActive });
  };

  const moduleWorkflows = workflows.filter((w) => w.module === selectedModule);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium text-xs">Loading Workflow Engine…</div>;
  }

  // Pre-configured approver roles based on module specifications
  const approverRoleOptions = [
    'Reporting Manager',
    'Department Admin',
    'Department Head',
    'HR Admin',
    'Staffing Admin',
    'Finance Manager',
    'Finance Admin',
    'Recruitment Admin',
    'Super Admin',
    ...roles.map((r) => r.name),
  ];

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Network size={18} className="text-emerald-600" />
            Central Workflow & Approver Engine
          </h3>
          <p className="text-slate-500">
            Define multi-tier approval chains ("WHO APPROVES WHAT") reading directly from Central Hierarchy. Permission Matrix ≠ Approval System.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['Leave', 'Recruitment', 'Finance', 'Documents', 'Performance'] as WorkflowRule['module'][]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedModule(m)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  selectedModule === m ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition"
          >
            <Plus size={16} /> New Workflow
          </button>
        </div>
      </div>

      {/* Module Approval Chains List */}
      <div className="space-y-4">
        {moduleWorkflows.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium space-y-2">
            <div>No approval workflows configured for <strong>{selectedModule}</strong> module yet.</div>
            <div className="text-[11px] text-slate-400">
              Click <strong>New Workflow</strong> above to configure approval tiers reading from Central Hierarchy.
            </div>
          </div>
        ) : (
          moduleWorkflows.map((wf) => (
            <div key={wf.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" /> {wf.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Trigger Event: <span className="text-slate-700">{wf.triggerEvent}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStatus(wf)}
                  className={`px-3 py-1 rounded-full font-bold text-[10px] ${
                    wf.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {wf.isActive ? 'Active Workflow' : 'Disabled'}
                </button>
              </div>

              {/* Tiers visualization */}
              <div className="grid grid-cols-4 gap-3 pt-1">
                {wf.steps.map((step) => (
                  <div key={step.stepOrder} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Tier {step.stepOrder}
                      </span>
                      <GitFork size={14} className="text-slate-400" />
                    </div>
                    <div className="font-bold text-slate-900 text-xs">{step.name}</div>
                    <div className="text-[11px] font-semibold text-slate-600">
                      Approver: <span className="text-emerald-800 font-bold">{step.approverRole}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Creating Custom Workflow Rule */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base border-b pb-2">
              Configure Approver Workflow for {selectedModule}
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Workflow Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. Standard ${selectedModule} Approval Chain`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Trigger Event</label>
                <input
                  type="text"
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  placeholder={`e.g. ${selectedModule} Submission`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Steps List */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Approval Tiers (Reads Hierarchy Management)</span>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Tier
                  </button>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-1 font-bold text-slate-400 text-center">#{idx + 1}</span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStepField(idx, 'name', e.target.value)}
                      placeholder="Step Title"
                      className="col-span-5 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <select
                      value={step.approverRole}
                      onChange={(e) => updateStepField(idx, 'approverRole', e.target.value)}
                      className="col-span-5 p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      {Array.from(new Set(approverRoleOptions)).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="col-span-1 text-slate-400 hover:text-rose-600 text-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
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
                  Save Approval Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
