import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;

  onPageChange: (page: number) => void;
}

export default function TablePagination({
  page,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4 md:flex-row">

      <div className="text-sm text-slate-500">
        Page{" "}
        <span className="font-semibold text-slate-700">
          {page}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700">
          {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-2">

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight size={16} />
        </button>

      </div>

    </div>
  );
}