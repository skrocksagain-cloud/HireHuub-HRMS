import { useEffect, useState } from 'react';
import { Eye, CheckCircle2, Download, FileCheck, X, Building } from 'lucide-react';
import type { AnnouncementItem, AnnouncementReadRecord } from '../../../../types/Announcement';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementItem | null;
  onFetchReadRecords: (annId: string) => Promise<AnnouncementReadRecord[]>;
}

export default function AnnouncementReadTrackerModal({
  isOpen,
  onClose,
  announcement,
  onFetchReadRecords,
}: Props) {
  const [records, setRecords] = useState<AnnouncementReadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && announcement) {
      setIsLoading(true);
      onFetchReadRecords(announcement.id)
        .then((res) => {
          setRecords(res);
          setIsLoading(false);
        })
        .catch(() => {
          setRecords([]);
          setIsLoading(false);
        });
    }
  }, [isOpen, announcement, onFetchReadRecords]);

  if (!isOpen || !announcement) return null;

  const viewedCount = records.filter((r) => r.viewedAt).length;
  const downloadedCount = records.filter((r) => r.downloadedAt).length;
  const acknowledgedCount = records.filter((r) => r.acknowledgedAt).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 text-white rounded-xl">
              <Eye size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Read Analytics & Acknowledgement Tracker
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {announcement.title} (v{announcement.version || '1.0'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Analytics Counter Grid */}
        <div className="grid grid-cols-4 gap-3 p-5 bg-slate-100/60 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Delivered</span>
            <strong className="text-xl font-black text-slate-900 dark:text-white">{records.length}</strong>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Viewed</span>
            <strong className="text-xl font-black text-blue-600 dark:text-blue-400">{viewedCount}</strong>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Downloaded</span>
            <strong className="text-xl font-black text-purple-600 dark:text-purple-400">{downloadedCount}</strong>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-bold font-mono">Acknowledged</span>
            <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400">{acknowledgedCount}</strong>
          </div>
        </div>

        {/* Read Records Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">Loading read status logs…</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No delivery or view logs recorded yet for this announcement.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3">Viewed</th>
                  <th className="py-2.5 px-3">Downloaded</th>
                  <th className="py-2.5 px-3">Acknowledged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition font-medium">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {r.employeeName} ({r.employeeId})
                    </td>
                    <td className="py-3 px-3 text-slate-500 flex items-center gap-1">
                      <Building size={12} className="text-slate-400" />
                      {r.department || 'General'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(r.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      {r.viewedAt ? (
                        <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 size={12} /> {new Date(r.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {r.downloadedAt ? (
                        <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 text-[11px]">
                          <Download size={12} /> {new Date(r.downloadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {r.acknowledgedAt ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-full text-[10px] flex items-center gap-1 w-fit">
                          <FileCheck size={12} /> Acknowledged
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
