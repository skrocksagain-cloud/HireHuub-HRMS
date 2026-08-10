import { useEffect, useState } from 'react';
import { FileText, Download, Eye, ShieldAlert } from 'lucide-react';
import type { DashboardAnnouncement } from '../../../services/dashboard/repositories/dashboardRepository';
import CircularPreviewModal from '../../Administration/Announcements/components/CircularPreviewModal';
import type { CircularFileMetadata } from '../../../types/Announcement';
import { announcementRepository } from '../../../services/announcement/repositories/announcementRepository';

interface AnnouncementsWidgetProps {
  announcements?: DashboardAnnouncement[];
}

export default function AnnouncementsWidget({ announcements = [] }: AnnouncementsWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewCircular, setPreviewCircular] = useState<CircularFileMetadata | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [realAnnouncements, setRealAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (announcements.length > 0) {
      setRealAnnouncements(announcements);
      setIsLoading(false);
    } else {
      announcementRepository.getAnnouncements().then((list) => {
        const published = list
          .filter((a) => a.status === 'Published' && !a.isArchived)
          .map((a) => ({
            id: a.id,
            title: a.title,
            summary: a.summary,
            category: a.category,
            pdfUrl: a.circularMetadata?.downloadURL,
            pdfFileName: a.circularMetadata?.originalFileName || a.circularMetadata?.fileName,
            targetScope: a.visibility as 'Organization' | 'Department' | 'Team' | 'Employee',
            publishedAt: a.publishDate || a.createdAt.slice(0, 10),
            isImportant: a.priority === 'Critical' || a.isPinned,
          }));
        setRealAnnouncements(published);
        setIsLoading(false);
      }).catch(() => {
        setRealAnnouncements([]);
        setIsLoading(false);
      });
    }
  }, [announcements]);

  const filtered = selectedCategory === 'ALL' ? realAnnouncements : realAnnouncements.filter((a) => a.category === selectedCategory);

  const handleOpenPreview = (item: DashboardAnnouncement) => {
    if (!item.pdfUrl) return;
    setPreviewCircular({
      fileName: item.pdfFileName || 'circular.pdf',
      originalFileName: item.pdfFileName || 'circular.pdf',
      storagePath: 'announcements/circular.pdf',
      downloadURL: item.pdfUrl,
      uploadedBy: 'admin',
      uploadedAt: new Date().toISOString(),
      fileSize: 1024 * 350,
      fileType: item.pdfFileName?.endsWith('.docx') ? 'DOCX' : 'PDF',
    });
    setIsPreviewOpen(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-purple-600 dark:text-purple-400" />
          <span className="font-bold text-slate-900 dark:text-white text-xs">
            Official Announcements & Circulars
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Live Sync Active" />
          <span className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
            {realAnnouncements.length} Circulars
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold py-0.5">
        {['ALL', 'HR Policy', 'Finance', 'IT', 'Emergency', 'General'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-4 text-center text-slate-400 text-xs">Loading published announcements…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">No published announcements found.</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" title="Unread Announcement" />
                  {item.isImportant && <ShieldAlert size={15} className="text-rose-600" />}
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-mono font-bold">
                    {item.category}
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-extrabold uppercase rounded">
                    New
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {item.summary}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px] text-slate-400 font-mono">
                <span>Published: {item.publishedAt} ({item.targetScope})</span>
                <div className="flex items-center gap-2">
                  {item.pdfUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 font-bold cursor-pointer"
                      >
                        <Eye size={12} /> Preview Circular
                      </button>
                      <a
                        href={item.pdfUrl}
                        download={item.pdfFileName || 'announcement.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:hover:text-white font-bold"
                      >
                        <Download size={12} /> Download
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isPreviewOpen && (
        <CircularPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          circular={previewCircular}
        />
      )}
    </div>
  );
}
