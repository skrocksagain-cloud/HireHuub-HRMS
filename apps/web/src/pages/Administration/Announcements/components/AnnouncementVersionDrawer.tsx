import { History, X, FileText } from 'lucide-react';
import type { AnnouncementVersion } from '../../../../types/Announcement';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  announcementTitle: string;
  versions: AnnouncementVersion[];
  isLoading: boolean;
}

export default function AnnouncementVersionDrawer({
  isOpen,
  onClose,
  announcementTitle,
  versions,
  isLoading,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-xl">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Version History Timeline</h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                {announcementTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Versions Timeline List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">Loading version history…</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No previous version snapshots. This is Version 1.0.
            </div>
          ) : (
            versions.map((ver, idx) => (
              <div
                key={ver.id || idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-full font-mono text-[10px]">
                    Version {ver.versionNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ver.editedAt).toLocaleString()}
                  </span>
                </div>

                <div className="font-bold text-slate-900 dark:text-white pt-1">
                  {ver.title}
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                  {ver.summary}
                </p>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Edited by: <strong className="text-slate-700 dark:text-slate-200">{ver.editedByName}</strong></span>
                  {ver.previousAttachment && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <FileText size={12} /> {ver.previousAttachment.fileName}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
