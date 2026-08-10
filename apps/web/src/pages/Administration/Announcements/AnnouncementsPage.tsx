import { useState } from 'react';
import {
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  History,
  Megaphone,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import DashboardLayout from '../../../layouts/DashboardLayout';
import { useAnnouncements } from '../../../hooks/announcement/useAnnouncements';
import type { AnnouncementSubView } from '../../../hooks/announcement/useAnnouncements';
import type {
  AnnouncementItem,
  AnnouncementVersion,
  CircularFileMetadata,
} from '../../../types/Announcement';
import AnnouncementModal from './components/AnnouncementModal';
import AnnouncementReadTrackerModal from './components/AnnouncementReadTrackerModal';
import CircularPreviewModal from './components/CircularPreviewModal';
import AnnouncementVersionDrawer from './components/AnnouncementVersionDrawer';
import { usePermissions } from '../../../hooks/usePermissions';

export default function AnnouncementsPage() {
  const {
    announcements,
    activeSubView,
    setActiveSubView,
    isLoading,
    isUploading,
    statusMsg,
    uploadCircular,
    saveAnnouncement,
    approveAnnouncement,
    archiveAnnouncement,
    deleteAnnouncement,
    getVersionHistory,
    trackRead,
    trackDownload,
    trackAcknowledgement,
    getReadRecords,
  } = useAnnouncements();

  const { activeRole } = usePermissions();
  const isSuperAdmin = activeRole.name === 'Super Admin' || activeRole.name === 'admin';

  // Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);

  // Circular Previewer state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewCircular, setActivePreviewCircular] = useState<CircularFileMetadata | null>(null);
  const [activePreviewAnnId, setActivePreviewAnnId] = useState<string | null>(null);

  // Version Drawer state
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [versionDrawerTitle, setVersionDrawerTitle] = useState('');
  const [versionHistoryList, setVersionHistoryList] = useState<AnnouncementVersion[]>([]);
  const [isVersionLoading, setIsVersionLoading] = useState(false);

  // Read Tracker Analytics state
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerAnnouncement, setTrackerAnnouncement] = useState<AnnouncementItem | null>(null);

  // Filter items by active sub-view tab & category
  const filteredAnnouncements = announcements.filter((ann) => {
    // Status Filter
    if (activeSubView === 'published' && ann.status !== 'Published') return false;
    if (activeSubView === 'pending' && ann.status !== 'Submitted for Approval') return false;
    if (activeSubView === 'draft' && ann.status !== 'Draft') return false;
    if (activeSubView === 'scheduled' && ann.status !== 'Scheduled') return false;
    if (activeSubView === 'archived' && (ann.status !== 'Archived' && !ann.isArchived)) return false;
    if (activeSubView === 'expired' && ann.status !== 'Expired') return false;

    // Category Filter
    if (selectedCategory !== 'All' && ann.category !== selectedCategory) return false;

    return true;
  });

  const handleOpenPreview = (circular: CircularFileMetadata, annId: string) => {
    setActivePreviewCircular(circular);
    setActivePreviewAnnId(annId);
    setIsPreviewOpen(true);
    trackRead(annId);
  };

  const handleOpenVersionDrawer = async (ann: AnnouncementItem) => {
    setVersionDrawerTitle(ann.title);
    setIsVersionDrawerOpen(true);
    setIsVersionLoading(true);
    try {
      const versions = await getVersionHistory(ann.id);
      setVersionHistoryList(versions);
    } catch {
      setVersionHistoryList([]);
    } finally {
      setIsVersionLoading(false);
    }
  };

  const handleOpenTracker = (ann: AnnouncementItem) => {
    setTrackerAnnouncement(ann);
    setIsTrackerOpen(true);
  };

  const categoriesList = [
    'All',
    'HR Policy',
    'Finance',
    'Payroll',
    'Recruitment',
    'Staffing',
    'Marketing',
    'IT',
    'Operations',
    'Training',
    'Compliance',
    'Emergency',
    'General',
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-md">
              <Megaphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Enterprise Announcement Center
                </h1>
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase rounded-full font-mono">
                  Final v4.5.1
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Broadcast official circulars, policy updates, and executive announcements with dynamic audience scoping.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingAnnouncement(null);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={18} /> Create Announcement
          </button>
        </div>

        {/* Status Message Banner */}
        {statusMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles size={16} /> {statusMsg}
          </div>
        )}

        {/* Sub-View Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl text-xs font-bold">
          {[
            { id: 'published', label: 'Published' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'draft', label: 'Drafts' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'archived', label: 'Archived' },
            { id: 'expired', label: 'Expired' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubView(tab.id as AnnouncementSubView)}
              className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeSubView === tab.id
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-400 dark:text-slate-500 pr-2">
            <Filter size={14} /> Category:
          </div>
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Announcement Cards List Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 font-medium text-xs">
              Loading Announcement Center records…
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
              <Megaphone size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">
                No Announcements Found
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                No announcements match the selected sub-view tab ({activeSubView}) and category filter ({selectedCategory}).
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs space-y-4 transition ${
                  item.priority === 'Critical' || item.isPinned
                    ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isPinned && (
                        <span className="px-2.5 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                          Pinned Critical
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-full">
                        {item.category}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        item.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : item.priority === 'High'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        Priority: {item.priority}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-mono font-bold rounded">
                        v{item.version || '1.0'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold rounded border border-emerald-200 dark:border-emerald-800">
                        {item.visibility} Scope
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight pt-1">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenVersionDrawer(item)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition"
                      title="View Version History Timeline"
                    >
                      <History size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenTracker(item)}
                      className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl transition"
                      title="View Read Analytics & Acknowledgements"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => archiveAnnouncement(item.id)}
                      className="p-2 text-slate-400 hover:text-amber-600 rounded-xl transition"
                      title="Archive Announcement"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl transition"
                      title="Delete Announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Executive Summary Only */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {item.summary}
                </p>

                {/* Circular File Attachment Chip & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3">
                    {item.circularMetadata ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(item.circularMetadata!, item.id)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          <FileText size={14} /> Preview Circular ({item.circularMetadata.fileType})
                        </button>
                        <a
                          href={item.circularMetadata.downloadURL}
                          download={item.circularMetadata.originalFileName || item.circularMetadata.fileName}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => trackDownload(item.id)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition"
                          title="Download Circular"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono italic">No Circular File Attached</span>
                    )}

                    {item.requireAcknowledgement && (
                      <button
                        type="button"
                        onClick={() => trackAcknowledgement(item.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileCheck size={14} fill="currentColor" className="text-emerald-400" /> Acknowledge Announcement
                      </button>
                    )}
                  </div>

                  {/* Right Meta Info & Super Admin Approval Action */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Published by <strong className="text-slate-700 dark:text-slate-300">{item.publishedByName}</strong> on {item.publishDate}</span>

                    {item.status === 'Submitted for Approval' && isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => approveAnnouncement(item.id)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck size={14} /> Approve Announcement
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modals & Drawers */}
        {isCreateModalOpen && (
          <AnnouncementModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingAnnouncement(null);
            }}
            onSave={saveAnnouncement}
            onUploadCircular={uploadCircular}
            initialData={editingAnnouncement}
            isUploading={isUploading}
          />
        )}

        {isPreviewOpen && (
          <CircularPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => {
              setIsPreviewOpen(false);
              setActivePreviewCircular(null);
            }}
            circular={activePreviewCircular}
            onDownload={() => activePreviewAnnId && trackDownload(activePreviewAnnId)}
          />
        )}

        {isVersionDrawerOpen && (
          <AnnouncementVersionDrawer
            isOpen={isVersionDrawerOpen}
            onClose={() => setIsVersionDrawerOpen(false)}
            announcementTitle={versionDrawerTitle}
            versions={versionHistoryList}
            isLoading={isVersionLoading}
          />
        )}

        {isTrackerOpen && (
          <AnnouncementReadTrackerModal
            isOpen={isTrackerOpen}
            onClose={() => {
              setIsTrackerOpen(false);
              setTrackerAnnouncement(null);
            }}
            announcement={trackerAnnouncement}
            onFetchReadRecords={getReadRecords}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
