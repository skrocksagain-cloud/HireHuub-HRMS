import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, FileUp, Save, X } from 'lucide-react';
import ActiveEmployeePicker from '../../Announcements/components/ActiveEmployeePicker';
import type {
  CalendarAttachmentMetadata,
  CalendarEventItem,
  CalendarEventType,
  EventRecurrenceType,
  EventVisibilityScope,
} from '../../../../types/Calendar';
import type { AvailabilityWarning } from '../../../../services/calendar/calendarService';
import { usePermissions } from '../../../../hooks/usePermissions';
import { useAdminCompany, useAdminDepartments } from '../../../../hooks/admin/useAdmin';
import { employeeRepository } from '../../../Employee/repositories/employeeRepository';

interface MeetingModalProps {
  onClose: () => void;
  onSave: (event: Omit<CalendarEventItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<CalendarEventItem>;
  onUploadAttachment: (file: File, meetingId: string) => Promise<CalendarAttachmentMetadata>;
  onCheckAvailability: (invitedIds: string[], date: string, startTime: string, endTime: string) => Promise<AvailabilityWarning[]>;
}

export default function MeetingModal({
  onClose,
  onSave,
  onUploadAttachment,
  onCheckAvailability,
}: MeetingModalProps) {
  const { isSuperAdmin } = usePermissions();
  const { company } = useAdminCompany();
  const { departments: liveDepts, isLoading: isDeptsLoading } = useAdminDepartments();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<CalendarEventType>('Planning Meeting');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [location, setLocation] = useState('Conference Room 1 / Zoom');
  const [meetingLink, setMeetingLink] = useState('https://zoom.us/j/hirehuub-meeting');
  const [visibility, setVisibility] = useState<EventVisibilityScope>('Department');

  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [invitedEmployeeIds, setInvitedEmployeeIds] = useState<string[]>([]);

  // Live teams derived from employee department assignments
  const [liveTeams, setLiveTeams] = useState<{ id: string; name: string }[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    employeeRepository.getEmployees().then((list) => {
      if (!isMounted) return;
      const activeEmps = list.filter(
        (e) => (e.status === 'Active' || e.employmentStatus === 'Active') &&
               e.status !== 'Inactive' && e.employmentStatus !== 'Terminated' && e.employmentStatus !== 'Notice Period'
      );
      const uniqueDepts = Array.from(new Set(activeEmps.map((e) => e.department).filter(Boolean)));
      const derivedTeams = uniqueDepts.map((d) => ({
        id: d.toLowerCase().replace(/\s+/g, '-'),
        name: `${d} Team`,
      }));
      setLiveTeams(derivedTeams);
      setIsTeamsLoading(false);
    }).catch(() => {
      if (isMounted) setIsTeamsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeDepartments = liveDepts.filter((d) => d.isActive !== false);

  const [recurrence, setRecurrence] = useState<EventRecurrenceType>('None');
  const [attachmentMetadata, setAttachmentMetadata] = useState<CalendarAttachmentMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [warnings, setWarnings] = useState<AvailabilityWarning[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErrorMsg('');
      setIsUploading(true);
      const meta = await onUploadAttachment(file, `temp_${Date.now()}`);
      setAttachmentMetadata([...attachmentMetadata, meta]);
      setIsUploading(false);
    } catch {
      setIsUploading(false);
      setErrorMsg('Failed to upload attachment file to Firebase Storage.');
    }
  };

  const handleCheckAvailability = async () => {
    if (invitedEmployeeIds.length === 0) return;
    const warns = await onCheckAvailability(invitedEmployeeIds, date, startTime, endTime);
    setWarnings(warns);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isSuperAdmin && visibility === 'Organization') {
      setErrorMsg('Department Admins cannot schedule Organization-wide meetings.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        title,
        description,
        eventType,
        date,
        startTime,
        endTime,
        location,
        meetingLink,
        visibility,
        companyIds: [selectedOrgId === 'all' ? company?.companyId || 'company-main' : selectedOrgId],
        departmentIds,
        teamIds,
        invitedEmployeeIds,
        organizerId: 'HH0001',
        organizerName: 'Somnath',
        organizerDepartment: 'Engineering',
        organizerDesignation: 'Technical Architect',
        approvalStatus: 'Approved',
        recurrence,
        attachmentMetadata,
        attachmentUrls: attachmentMetadata.map((m) => m.downloadURL),
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to schedule meeting.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-xs max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Schedule Enterprise Meeting / Event</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-900 dark:text-white mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Strategic Planning & Resource Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEventType)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                {[
                  'Review Meeting',
                  'Planning Meeting',
                  'Discussion',
                  'Team Meeting',
                  'Client Meeting',
                  'Interview',
                  'Training',
                  'Reminder',
                  'Other',
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visibility Scope</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as EventVisibilityScope)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                {['Organization', 'Department', 'Team', 'Selected Employees', 'Private'].map((sc) => (
                  <option key={sc} value={sc}>
                    {sc} {!isSuperAdmin && sc === 'Organization' ? '(Super Admin Only)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Pickers based on Scope */}
          {visibility === 'Organization' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <label className="font-bold block text-slate-700 dark:text-slate-300">Target Organization</label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="all">All Organization ({company?.companyName || company?.brandName || 'HireHuub ERP'})</option>
                {company?.companyName && (
                  <option value={company.companyId || 'primary-org'}>{company.companyName}</option>
                )}
              </select>
            </div>
          )}

          {visibility === 'Department' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold block text-slate-700 dark:text-slate-300">Select Target Departments</span>
              {isDeptsLoading ? (
                <span className="text-slate-400 font-mono">Loading Departments from Firestore...</span>
              ) : activeDepartments.length === 0 ? (
                <span className="text-slate-400 italic">No active departments found in Department Control.</span>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {activeDepartments.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={departmentIds.includes(d.id)}
                        onChange={(e) => {
                          if (e.target.checked) setDepartmentIds([...departmentIds, d.id]);
                          else setDepartmentIds(departmentIds.filter((id) => id !== d.id));
                        }}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {visibility === 'Team' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <span className="font-bold block text-slate-700 dark:text-slate-300">Select Target Teams</span>
              {isTeamsLoading ? (
                <span className="text-slate-400 font-mono">Loading Active Teams...</span>
              ) : liveTeams.length === 0 ? (
                <span className="text-slate-400 italic">No active team assignments found.</span>
              ) : (
                <div className="space-y-1">
                  {liveTeams.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={teamIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setTeamIds([...teamIds, t.id]);
                          else setTeamIds(teamIds.filter((id) => id !== t.id));
                        }}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {visibility === 'Selected Employees' && (
            <ActiveEmployeePicker
              selectedEmployeeIds={invitedEmployeeIds}
              onChange={(ids) => {
                setInvitedEmployeeIds(ids);
                setWarnings([]);
              }}
            />
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Location / Room</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Virtual Meeting Link</label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Upload Attachment Section (Replaces Attachment URL) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <FileUp size={16} /> Upload Meeting Attachment (PDF / DOCX / XLSX / PPTX / Image)
              </span>
              <span className="text-[10px] text-slate-400">Optional</span>
            </div>

            {attachmentMetadata.length > 0 && (
              <div className="space-y-1.5">
                {attachmentMetadata.map((meta, idx) => (
                  <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold rounded text-[10px]">
                        {meta.fileType}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {meta.originalFileName || meta.fileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachmentMetadata(attachmentMetadata.filter((_, i) => i !== idx))}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Saved directly to Firebase Storage under calendar_attachments/{'{meetingId}'}/ filename.
              </span>
            </div>
          </div>

          {/* Availability Warnings */}
          {invitedEmployeeIds.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCheckAvailability}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Check Invited Employee Availability
              </button>

              {warnings.map((w, idx) => (
                <div key={idx} className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl font-medium flex items-center gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span><strong>{w.employeeName}:</strong> {w.reason}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Recurrence Rule</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as EventRecurrenceType)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:outline-none"
            >
              {['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Agenda & Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Save size={15} />
              {isSubmitting ? 'Scheduling…' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
