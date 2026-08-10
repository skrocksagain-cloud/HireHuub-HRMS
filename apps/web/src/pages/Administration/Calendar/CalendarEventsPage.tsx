import { useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useCalendar } from '../../../hooks/calendar/useCalendar';
import { Calendar, Plus, Gift, CheckCircle2, Clock, Filter, FileText, Check, HelpCircle, XCircle, Trash2, MapPin, Video } from 'lucide-react';
import MeetingModal from './components/MeetingModal';
import HolidayModal from './components/HolidayModal';
import CircularPreviewModal from '../Announcements/components/CircularPreviewModal';
import type { CircularFileMetadata } from '../../../types/Announcement';

type CalendarViewMode = 'Month' | 'Week' | 'Day' | 'Agenda';

export default function CalendarEventsPage() {
  const {
    events,
    holidays,
    isLoading,
    statusMsg,
    uploadAttachment,
    saveEvent,
    deleteEvent,
    checkAvailability,
    respondToInvite,
    saveHoliday,
  } = useCalendar();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('Month');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');

  // Preview Modal for Attachment PDF
  const [previewCircular, setPreviewCircular] = useState<CircularFileMetadata | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const filteredEvents = selectedEventType === 'ALL'
    ? events
    : events.filter((e) => e.eventType === selectedEventType);

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'Review Meeting': return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      case 'Planning Meeting': return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'Discussion': return 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300';
      case 'Training': return 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300';
      case 'Client Meeting': return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
      case 'Interview': return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
      case 'Holiday': return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 p-6">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Calendar size={14} />
              <span>Administration Module</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Enterprise Calendar & Events Workspace</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Realtime single source of truth for Enterprise Meetings, Reviews, Client Engagements, and Company Holidays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHolidayModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <Gift size={15} className="text-rose-400" /> Declare Holiday
            </button>
            <button
              type="button"
              onClick={() => setShowMeetingModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition cursor-pointer"
            >
              <Plus size={16} /> Schedule Meeting
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> {statusMsg}
          </div>
        )}

        {/* Calendar View Switcher & Event Filter Pills */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          {/* View Modes */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['Month', 'Week', 'Day', 'Agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  viewMode === mode ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Event Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-slate-400 flex items-center gap-1 font-bold"><Filter size={14} /> Filter:</span>
            {[
              'ALL',
              'Review Meeting',
              'Planning Meeting',
              'Discussion',
              'Team Meeting',
              'Client Meeting',
              'Interview',
              'Training',
              'Holiday',
            ].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedEventType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedEventType === type
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Holidays Banner Section */}
        {holidays.length > 0 && (
          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
              <Gift size={16} /> Official Organization Holidays ({holidays.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {holidays.map((hol) => (
                <div key={hol.id} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{hol.name}</span>
                  <span className="text-[10px] text-rose-600 font-mono font-bold">{hol.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Events Workspace */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium text-xs">
              Loading Realtime Calendar Events & Holidays…
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <Calendar size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                No Calendar Events Scheduled
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                No events match the selected event type ({selectedEventType}). Schedule a new meeting or declare a holiday above.
              </p>
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getEventBadgeColor(evt.eventType)}`}>
                        {evt.eventType}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-bold rounded-full">
                        {evt.visibility} Scope
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight pt-1">
                      {evt.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteEvent(evt.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Cancel Meeting"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {evt.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {evt.description}
                  </p>
                )}

                {/* Event Details Row */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                    <Clock size={13} className="text-emerald-600" /> {evt.date} • {evt.startTime} - {evt.endTime}
                  </span>
                  {evt.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" /> {evt.location}
                    </span>
                  )}
                  {evt.meetingLink && (
                    <a
                      href={evt.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      <Video size={13} /> Join Virtual Meeting
                    </a>
                  )}
                </div>

                {/* Organizer & Attendees Row */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="text-[11px] text-slate-500">
                    Organizer: <strong className="text-slate-900 dark:text-white">{evt.organizerName}</strong> ({evt.organizerDepartment || 'Engineering'})
                  </div>

                  {/* Attendance Response Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Your Response:</span>
                    <button
                      type="button"
                      onClick={() => respondToInvite(evt.id, 'Accepted')}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg hover:bg-emerald-100 flex items-center gap-1 text-[11px] transition cursor-pointer"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToInvite(evt.id, 'Maybe')}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold rounded-lg hover:bg-amber-100 flex items-center gap-1 text-[11px] transition cursor-pointer"
                    >
                      <HelpCircle size={12} /> Maybe
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToInvite(evt.id, 'Declined')}
                      className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold rounded-lg hover:bg-rose-100 flex items-center gap-1 text-[11px] transition cursor-pointer"
                    >
                      <XCircle size={12} /> Decline
                    </button>
                  </div>
                </div>

                {/* Meeting Attachments Chip */}
                {evt.attachmentMetadata && evt.attachmentMetadata.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 flex-wrap">
                    {evt.attachmentMetadata.map((meta, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPreviewCircular({
                            fileName: meta.fileName,
                            originalFileName: meta.originalFileName,
                            storagePath: meta.storagePath,
                            downloadURL: meta.downloadURL,
                            uploadedBy: meta.uploadedBy,
                            uploadedAt: meta.uploadedAt,
                            fileSize: meta.fileSize,
                            fileType: meta.fileType,
                          });
                          setIsPreviewOpen(true);
                        }}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <FileText size={12} className="text-emerald-600" />
                        {meta.originalFileName || meta.fileName} ({meta.fileType})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modals */}
        {showMeetingModal && (
          <MeetingModal
            onClose={() => setShowMeetingModal(false)}
            onSave={saveEvent}
            onUploadAttachment={uploadAttachment}
            onCheckAvailability={checkAvailability}
          />
        )}

        {showHolidayModal && (
          <HolidayModal
            onClose={() => setShowHolidayModal(false)}
            onSave={saveHoliday}
          />
        )}

        {isPreviewOpen && (
          <CircularPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            circular={previewCircular}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
