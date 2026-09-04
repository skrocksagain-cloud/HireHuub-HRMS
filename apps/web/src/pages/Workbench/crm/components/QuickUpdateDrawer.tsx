import { useState, useEffect } from 'react';
import { X, Check, PhoneCall, AlertCircle, AlertTriangle } from 'lucide-react';
import type { Candidate, CandidateStatus, QuickUpdateInput } from '../types/crm';
import type { Client } from '../../../../types/Client';
import type { Opening } from '../../../../types/Opening';
import { statusRuleEngine } from '../services/statusRuleEngine';

interface QuickUpdateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  clients: Client[];
  openings: Opening[];
  onSubmitUpdate: (input: QuickUpdateInput) => Promise<void>;
}

const ALL_STATUSES: CandidateStatus[] = [
  'Active',
  'OB',
  'Line Up',
  'Inactive',
  'Not Interested',
  'Wrong Number',
  'Not Eligible',
  'Doc / Vehicle / Vacancy Issue',
  'Call Back Later',
  'Number not in Service',
  'Ringing / Busy / Forward / Call Disconnected',
  'Interested',
];

export default function QuickUpdateDrawer({
  isOpen,
  onClose,
  candidate,
  clients,
  openings,
  onSubmitUpdate,
}: QuickUpdateDrawerProps) {
  const [status, setStatus] = useState<CandidateStatus>('Interested');
  const [clientId, setClientId] = useState<string>('');
  const [openingId, setOpeningId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [payrollEmployeeId, setPayrollEmployeeId] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');

  // Confirmation dialog state (for Wrong Number or Closed Openings)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [interactionId, setInteractionId] = useState<string>('');

  useEffect(() => {
    if (isOpen && candidate) {
      setStatus(candidate.currentCrmStatus ?? 'Interested');
      setClientId(candidate.currentClientId ?? '');
      setNotes('');
      setIssueDescription(candidate.issueDescription || '');
      setFollowUpDate(candidate.followUpDate || '');
      setInterviewDate(candidate.interviewDate || '');
      setPayrollEmployeeId(candidate.payrollEmployeeId || '');
      setDateOfBirth(candidate.dateOfBirth || '');
      setFormError(null);
      setShowConfirmation(false);
      setInteractionId(crypto.randomUUID());
    }
  }, [candidate, isOpen]);

  if (!isOpen || !candidate) return null;

  // Selected client & opening info
  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedOpening = openings.find((op) => op.id === openingId);

  // Dynamic Rule Analysis from Centralized Status Rule Engine
  const rules = statusRuleEngine.getRulesForStatus(status);
  const isPayroll = status === 'Active' && selectedClient?.commercial?.type === 'Payroll';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    setFormError(null);

    // Rule validation check
    const validation = statusRuleEngine.validateUpdateInput(
      {
        interactionId,
        candidateId: candidate.id,
        status,
        clientId,
        openingId,
        notes,
        issueDescription,
        followUpDate,
        interviewDate,
        payrollEmployeeId,
        dateOfBirth,
      },
      selectedClient?.commercial?.type === 'Payroll' ? 'Payroll' : 'OTS'
    );

    if (!validation.isValid) {
      setFormError(validation.errors.join(' '));
      return;
    }

    // Wrong Number confirmation
    if (validation.requiresConfirmation && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    const input: QuickUpdateInput = {
      interactionId,
      candidateId: candidate.id,
      status,
      clientId: clientId || undefined,
      clientName: selectedClient?.name,
      openingId: openingId || undefined,
      notes: notes.trim(),
      issueDescription: issueDescription.trim() || undefined,
      followUpDate: followUpDate || undefined,
      interviewDate: interviewDate || undefined,
      payrollEmployeeId: payrollEmployeeId || undefined,
      dateOfBirth: dateOfBirth || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSubmitUpdate(input);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error applying update';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall size={20} className="text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Quick Update — {candidate.name}</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {candidate.id} • {candidate.phone}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form id="quick-update-form" onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" /> {formError}
            </div>
          )}

          {/* Closed Opening Warning (Does NOT block activation) */}
          {selectedOpening && selectedOpening.status === 'Closed' && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                <strong>Warning:</strong> Selected opening <em>{selectedOpening.title}</em> is currently Closed. Activation will proceed as approved by Product Owner rules.
              </span>
            </div>
          )}

          {/* Status Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Update Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CandidateStatus)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-semibold bg-slate-50 focus:bg-white"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Client Selection (Required for Line Up & Active) */}
          {(rules.requiresClient || status === 'Active' || status === 'Line Up') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Client {rules.requiresClient ? '*' : '(Optional)'}
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
              >
                <option value="">Choose Client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type || 'OTS'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Opening Selection */}
          {(status === 'Line Up' || status === 'Active') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening / Position</label>
              <select
                value={openingId}
                onChange={(e) => setOpeningId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              >
                <option value="">Select Opening...</option>
                {openings.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.title} - {op.clientName} ({op.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Follow Up Date */}
          {rules.requiresFollowUpDate && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow Up Date *</label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>
          )}

          {/* Interview Date */}
          {rules.requiresInterviewDate && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Date *</label>
              <input
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>
          )}

          {/* Issue Description */}
          {rules.requiresIssueDescription && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Description *</label>
              <textarea
                required
                rows={2}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe document, vehicle, or vacancy issue..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>
          )}

          {/* Payroll Candidate Additional Fields */}
          {isPayroll && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <h5 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">Payroll Candidate Details</h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payroll Employee ID</label>
                  <input
                    type="text"
                    value={payrollEmployeeId}
                    onChange={(e) => setPayrollEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-1092"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recruiter Notes *</label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details of conversation, feedback, or next step..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Confirmation Box for Wrong Number */}
          {showConfirmation && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs space-y-2">
              <p className="font-bold text-red-900">Confirm Status Change: Wrong Number</p>
              <p className="text-red-700 text-[11px]">
                Are you sure you want to mark this candidate as Wrong Number? This will update candidate reachability status.
              </p>
            </div>
          )}
        </form>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button
            type="submit"
            form="quick-update-form"
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={16} /> {isSubmitting ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
