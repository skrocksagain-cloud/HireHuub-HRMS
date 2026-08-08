import { X, History } from 'lucide-react';
import type { WorkforceItem, ClientPayoutImportRecord } from '../types/workforce';

interface PayoutHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WorkforceItem | null;
  payoutImports: ClientPayoutImportRecord[];
}

export default function PayoutHistoryModal({
  isOpen,
  onClose,
  item,
  payoutImports,
}: PayoutHistoryModalProps) {
  if (!isOpen || !item) return null;

  const candidateImports = payoutImports.filter((imp) =>
    imp.rows.some((r) => r.employeeId.trim().toLowerCase() === item.id.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <History className="text-emerald-600" size={16} />
            <span>Client Payout Import History — {item.candidateName}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-sm">{item.candidateName}</span>
              <span className="text-[11px] text-slate-500 block">ID: {item.id}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-100 text-emerald-800">
              Total Earnings: ₹{item.totalEarnings.toLocaleString('en-IN')}
            </span>
          </div>

          {candidateImports.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No historical payout import records found for candidate ID {item.id}.
            </div>
          ) : (
            <div className="space-y-3">
              {candidateImports.map((imp) => {
                const match = imp.rows.find(
                  (r) => r.employeeId.trim().toLowerCase() === item.id.trim().toLowerCase()
                );
                return (
                  <div
                    key={imp.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>
                        {imp.clientName} ({imp.month}) — {imp.importPeriod} Import V{imp.version}
                      </span>
                      <span className="text-emerald-700">₹{(match?.earnings || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 border-t border-slate-200/80 pt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Imported Date</span>
                        <span>{new Date(imp.importedAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Imported By</span>
                        <span>{imp.importedBy}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Trips / Orders</span>
                        <span>{match?.orders !== undefined ? match.orders : '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
