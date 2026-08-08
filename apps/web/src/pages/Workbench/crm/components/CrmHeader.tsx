import { Search, UserPlus, FileSpreadsheet, FileText } from 'lucide-react';

interface CrmHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddCandidate: () => void;
  onOpenImport: () => void;
}

export default function CrmHeader({
  searchQuery,
  onSearchChange,
  onOpenAddCandidate,
  onOpenImport,
}: CrmHeaderProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Global Search Bar */}
      <div className="relative w-full md:w-96">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Candidate Name or Mobile Number..."
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition bg-slate-50/50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={onOpenAddCandidate}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <UserPlus size={16} /> Add Candidate
        </button>

        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
        >
          <FileSpreadsheet size={16} className="text-emerald-600" /> Import Excel
        </button>

        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
        >
          <FileText size={16} className="text-blue-600" /> Import CSV
        </button>
      </div>
    </div>
  );
}
