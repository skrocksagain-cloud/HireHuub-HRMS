import { ReactNode } from "react";
import {
  RefreshCw,
  Download,
  Filter,
} from "lucide-react";

import SearchInput from "../SearchInput";

interface TableToolbarProps {
  search: string;
  onSearch: (value: string) => void;

  onRefresh?: () => void;
  onExport?: () => void;
  onFilter?: () => void;

  searchPlaceholder?: string;

  children?: ReactNode;
}

export default function TableToolbar({
  search,
  onSearch,

  onRefresh,
  onExport,
  onFilter,

  searchPlaceholder = "Search...",

  children,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">

      {/* Left Section */}

      <div className="w-full lg:max-w-md">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder={searchPlaceholder}
        />
      </div>

      {/* Right Section */}

      <div className="flex flex-wrap items-center justify-end gap-2">

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}

        {onFilter && (
          <button
            type="button"
            onClick={onFilter}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
          >
            <Filter size={16} />
            Filter
          </button>
        )}

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
          >
            <Download size={16} />
            Export
          </button>
        )}

        {children}

      </div>

    </div>
  );
}